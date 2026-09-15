const crypto = require("crypto");
const prisma = require("./prisma");

function validateInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false };

  let params;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false };
  }

  const hash = params.get("hash");
  if (!hash) return { ok: false };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false };
  }

  const authDate = Number(params.get("auth_date"));
  if (authDate && Date.now() / 1000 - authDate > 86400) {
    return { ok: false, expired: true };
  }

  let user = null;
  try {
    user = JSON.parse(params.get("user"));
  } catch {
    /* user may be absent */
  }

  return { ok: true, user, params };
}

// Global middleware: attaches verified Telegram user & internal user to req
async function attachTelegramUser(req, res, next) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  const initData =
    req.get("x-telegram-init-data") || req.body?.initData || null;

  if (initData && botToken) {
    const result = validateInitData(initData, botToken);
    if (result.ok && result.user) {
      req.tg = { id: String(result.user.id), user: result.user, verified: true };
      try {
        const dbUser = await prisma.user.findUnique({
          where: { telegramId: String(result.user.id) },
          select: { id: true, telegramId: true, isPremium: true, isVerified: true }
        });
        if (dbUser) {
          req.user = { internalId: dbUser.id, id: dbUser.id, telegramId: dbUser.telegramId, ...dbUser };
        }
      } catch (e) {
        // Non-fatal, req.tg is still set
      }
    }
  }

  // Development fallback: only if not in production and not strict
  if (!req.tg && process.env.NODE_ENV !== "production" && process.env.REQUIRE_TELEGRAM_AUTH !== "1") {
    // Check if telegramId passed in header for dev test convenience
    const devTgId = req.get("x-dev-telegram-id");
    if (devTgId) {
      req.tg = { id: devTgId, user: { id: devTgId, first_name: "Dev" }, verified: true, isDev: true };
      try {
        const dbUser = await prisma.user.findUnique({
          where: { telegramId: devTgId },
          select: { id: true, telegramId: true, isPremium: true, isVerified: true }
        });
        if (dbUser) {
          req.user = { internalId: dbUser.id, id: dbUser.id, telegramId: dbUser.telegramId, ...dbUser };
        }
      } catch {}
    }
  }

  next();
}

// Enforces that the request has a valid authenticated identity
function requireAuth(req, res, next) {
  if (!req.tg?.verified) {
    return res.status(401).json({ error: "Unauthorized: Valid Telegram authentication required" });
  }
  next();
}

// Enforces that the authenticated user owns the target resource
function authorizeTelegramId(getTargetId) {
  return (req, res, next) => {
    const target = String(getTargetId(req) ?? "");
    const strict = process.env.NODE_ENV === "production" || process.env.REQUIRE_TELEGRAM_AUTH === "1";

    if (!req.tg) {
      if (strict) return res.status(401).json({ error: "Unauthorized: Telegram authentication required" });
      return next(); // dev fallback
    }

    if (target && req.tg.id !== target) {
      return res.status(403).json({ error: "Forbidden: You cannot access or modify another user's private resource" });
    }
    next();
  };
}

module.exports = {
  validateInitData,
  attachTelegramUser,
  requireAuth,
  authorizeTelegramId,
};