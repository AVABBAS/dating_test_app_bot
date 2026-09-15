const crypto = require("crypto");
const prisma = require("./prisma");

const AUTH_MAX_AGE_SECONDS = 86400;
const AUTH_MAX_FUTURE_SKEW_SECONDS = 60;

function validateInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false };
  let params;
  try { params = new URLSearchParams(initData); } catch { return { ok: false }; }
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false };
  params.delete("hash");
  const authDateRaw = params.get("auth_date");
  const authDate = Number(authDateRaw);
  if (!authDateRaw || !Number.isSafeInteger(authDate) || authDate <= 0) return { ok: false };
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + AUTH_MAX_FUTURE_SKEW_SECONDS) return { ok: false, future: true };
  if (now - authDate > AUTH_MAX_AGE_SECONDS) return { ok: false, expired: true };
  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };
  let user = null;
  try { user = JSON.parse(params.get("user")); } catch { return { ok: false }; }
  if (!user || !Number.isSafeInteger(Number(user.id)) || Number(user.id) <= 0) return { ok: false };
  return { ok: true, user, params };
}

function getRequestedTelegramIds(req) {
  return [req.body?.telegramId, req.body?.fromTelegramId, req.params?.telegramId, req.query?.telegramId]
    .filter((value) => value !== undefined && value !== null && String(value) !== "")
    .map((value) => String(value));
}

function isPrivateApiPath(req) {
  const path = req.path;
  if (path === "/api/user") return true;
  if (req.method === "GET" && path.startsWith("/api/messages/")) return true;
  if (path.startsWith("/api/premium/status/")) return true;
  if (path.startsWith("/api/store/")) return true;
  if (path.startsWith("/api/top-picks/")) return true;
  if (path.startsWith("/api/likes-you/")) return true;
  if (path.startsWith("/api/likes-count/")) return true;
  if (path.startsWith("/api/preferences/")) return true;
  if (path.startsWith("/api/settings/")) return true;
  if (path.startsWith("/api/prompts/")) return true;
  if (path.startsWith("/api/verification/")) return true;
  if (path.startsWith("/api/gifts/")) return true;
  if (path.startsWith("/api/passport/")) return true;
  if (path.startsWith("/api/notifications/")) return true;
  if (path.startsWith("/api/chat-info/")) return true;
  if (path.startsWith("/api/typing/")) return true;
  if (path.startsWith("/api/explore/")) return true;
  if ((path === "/api/events" || path.startsWith("/api/events/")) && req.query?.telegramId) return true;
  return false;
}

async function loadTelegramUser(req, telegramId, user, verified, isDev = false) {
  req.tg = { id: String(telegramId), user, verified, isDev };
  try {
    const dbUser = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
      select: { id: true, telegramId: true, isPremium: true, isVerified: true },
    });
    if (dbUser) req.user = { internalId: dbUser.id, id: dbUser.id, telegramId: dbUser.telegramId, ...dbUser };
  } catch (e) {
    console.error("telegram user lookup failed", e);
  }
}

async function attachTelegramUser(req, res, next) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  const initData = req.get("x-telegram-init-data") || req.body?.initData || null;
  const strict = process.env.NODE_ENV === "production" || process.env.REQUIRE_TELEGRAM_AUTH === "1";
  const mustAuthenticate = isPrivateApiPath(req);

  if (initData && botToken) {
    const result = validateInitData(initData, botToken);
    if (result.ok && result.user) await loadTelegramUser(req, result.user.id, result.user, true);
  }

  const requestedIds = getRequestedTelegramIds(req);
  if (req.tg?.verified && requestedIds.some((id) => id !== req.tg.id)) {
    return res.status(403).json({ error: "Forbidden: Telegram identity does not match signed initData" });
  }

  if (!req.tg && process.env.NODE_ENV !== "production" && process.env.REQUIRE_TELEGRAM_AUTH !== "1") {
    const devTgId = req.get("x-dev-telegram-id");
    if (devTgId) await loadTelegramUser(req, devTgId, { id: devTgId, first_name: "Dev" }, true, true);
  }

  if (mustAuthenticate && !req.tg?.verified) {
    return res.status(401).json({ error: "Unauthorized: Valid Telegram authentication required" });
  }

  if (strict && mustAuthenticate && !req.tg?.verified) {
    return res.status(401).json({ error: "Unauthorized: Telegram authentication required" });
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.tg?.verified) return res.status(401).json({ error: "Unauthorized: Valid Telegram authentication required" });
  next();
}

function authorizeTelegramId(getTargetId) {
  return (req, res, next) => {
    const target = String(getTargetId(req) ?? "");
    const strict = process.env.NODE_ENV === "production" || process.env.REQUIRE_TELEGRAM_AUTH === "1";
    if (!req.tg) {
      if (strict || target) return res.status(401).json({ error: "Unauthorized: Telegram authentication required" });
      return next();
    }
    if (!target || req.tg.id !== target) return res.status(403).json({ error: "Forbidden: You cannot access or modify another user's private resource" });
    next();
  };
}

module.exports = { validateInitData, attachTelegramUser, requireAuth, authorizeTelegramId };
