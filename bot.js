const { Bot, InlineKeyboard } = require("grammy");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);

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
