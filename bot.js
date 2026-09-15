const { Bot, InlineKeyboard } = require("grammy");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);

// The API calls used by /api/user can happen on every Mini App launch.
// Cache Telegram profile-photo lookups briefly to avoid repeated network calls.
const PHOTO_CACHE_TTL_MS = 60 * 60 * 1000;
const photoCache = new Map();
const originalGetUserProfilePhotos = bot.api.getUserProfilePhotos.bind(bot.api);
const originalGetFile = bot.api.getFile.bind(bot.api);

bot.api.getUserProfilePhotos = async (userId, ...args) => {
  const key = String(userId);
  const cached = photoCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await originalGetUserProfilePhotos(userId, ...args);
  photoCache.set(key, { value, expiresAt: Date.now() + PHOTO_CACHE_TTL_MS });
  return value;
};

const fileCache = new Map();
bot.api.getFile = async (fileId, ...args) => {
  const key = String(fileId);
  const cached = fileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await originalGetFile(fileId, ...args);
  fileCache.set(key, { value, expiresAt: Date.now() + PHOTO_CACHE_TTL_MS });
  return value;
};

bot.command("start", (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "Open Dating App ❤️",
    process.env.FRONTEND_URL || "http://localhost:5173" // in production this will be the actual URL
  );

  return ctx.reply("Welcome to the Dating Bot! Click below to find your match. \n\nPlease note: you need to use this on a device that supports Telegram Web Apps.", {
    reply_markup: keyboard,
  });
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  console.error(e);
});

module.exports = bot;