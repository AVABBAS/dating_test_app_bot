// Central notification helper: persists an in-app Notification row and
// (respecting the recipient's preferences) pings them on Telegram.
const prisma = require("./prisma");
const bot = require("../bot");

const PREF_FOR_TYPE = {
  match: "notifyMatches",
  like: "notifyLikes",
  superlike: "notifyLikes",
  gift: "notifyLikes",
  message: "notifyMessages",
};

// toUser: a User object including id, telegramId and notify* flags.
async function notify(toUser, { type, title, body = null, data = null, telegramText = null }) {
  if (!toUser) return;

  const prefKey = PREF_FOR_TYPE[type];
  const wantsIt = prefKey ? toUser[prefKey] !== false : true;

  try {
    await prisma.notification.create({
      data: { userId: toUser.id, type, title, body, data: data || undefined },
    });
  } catch (e) {
    console.error("notify: failed to persist notification", e);
  }

  if (wantsIt && toUser.telegramId && telegramText) {
    bot.api.sendMessage(toUser.telegramId, telegramText).catch(() => {});
  }
}

module.exports = { notify };
