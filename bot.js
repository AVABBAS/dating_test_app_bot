const { Bot, InlineKeyboard } = require("grammy");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);

const PHOTO_CACHE_TTL_MS = 60 * 60 * 1000;
const PHOTO_CACHE_MAX_ENTRIES = 5000;
const photoCache = new Map();
const fileCache = new Map();

function pruneExpired(cache, now = Date.now()) {
  if (cache.size <= PHOTO_CACHE_MAX_ENTRIES) return;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
    if (cache.size <= PHOTO_CACHE_MAX_ENTRIES) break;
  }
}

function setCache(cache, key, value) {
  const now = Date.now();
  cache.set(key, { value, expiresAt: now + PHOTO_CACHE_TTL_MS });
  pruneExpired(cache, now);
}

const originalGetUserProfilePhotos = bot.api.getUserProfilePhotos.bind(bot.api);
const originalGetFile = bot.api.getFile.bind(bot.api);

bot.api.getUserProfilePhotos = async (userId, ...args) => {
  const key = String(userId);
  const cached = photoCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) photoCache.delete(key);
  const value = await originalGetUserProfilePhotos(userId, ...args);
  setCache(photoCache, key, value);
  return value;
};

bot.api.getFile = async (fileId, ...args) => {
  const key = String(fileId);
  const cached = fileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) fileCache.delete(key);
  const value = await originalGetFile(fileId, ...args);
  setCache(fileCache, key, value);
  return value;
};

// Use a fresh path so Telegram WebView cannot reuse an older Mini App document.
const MINI_APP_VERSION = "20260915-f10ad427";

bot.command("start", (ctx) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const miniAppUrl = `${baseUrl.replace(/\/$/, "")}/mini/${MINI_APP_VERSION}`;
  const keyboard = new InlineKeyboard().webApp(
    "Open Dating App ❤️",
    miniAppUrl
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
