// ─────────────────────────────────────────────────────────────
// Telegram Mini App initData validation
//
// The frontend sends the raw `Telegram.WebApp.initData` string in the
// `x-telegram-init-data` header. We verify its HMAC signature using the
// bot token, per Telegram's spec:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// This is what proves a request really comes from the claimed Telegram
// user. Without it, anyone can impersonate any user by sending their id.
// ─────────────────────────────────────────────────────────────
const crypto = require("crypto");

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

  // Build the data-check-string: keys sorted alphabetically, `key=value`, "\n"-joined
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

  // constant-time compare
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false };
  }

  // Optional freshness check (24h)
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

// Best-effort middleware: if a valid initData header is present, attach the
// verified Telegram user to req.tg. Never blocks (keeps local dev working).
function attachTelegramUser(req, res, next) {
  const initData =
    req.get("x-telegram-init-data") || req.body?.initData || null;
  if (initData) {
    const result = validateInitData(initData, process.env.BOT_TOKEN);
    if (result.ok && result.user) {
      req.tg = { id: String(result.user.id), user: result.user, verified: true };
    }
  }
  next();
}

// Ensures the telegramId a request is acting on matches the verified user.
// - If REQUIRE_TELEGRAM_AUTH=1: a valid initData header is mandatory.
// - Otherwise (dev/local): allowed through, but still enforced when a
//   verified identity IS present (blocks impersonation in production where
//   the client always sends initData).
function authorizeTelegramId(getTargetId) {
  return (req, res, next) => {
    const target = String(getTargetId(req) ?? "");
    const strict = process.env.REQUIRE_TELEGRAM_AUTH === "1";

    if (!req.tg) {
      if (strict) return res.status(401).json({ error: "Telegram authentication required" });
      return next(); // dev fallback
    }
    if (target && req.tg.id !== target) {
      return res.status(403).json({ error: "You cannot act on behalf of another user" });
    }
    next();
  };
}

module.exports = { validateInitData, attachTelegramUser, authorizeTelegramId };
