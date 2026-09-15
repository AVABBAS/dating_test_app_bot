const assert = require("assert");
const crypto = require("crypto");
const { validateInitData, authorizeTelegramId } = require("../lib/telegramAuth");

const BOT_TOKEN = "123456789:TEST_TOKEN";

function makeInitData({ authDate = Math.floor(Date.now() / 1000), userId = 123456 } = {}) {
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("query_id", "AAHtest");
  params.set("user", JSON.stringify({ id: userId, first_name: "Test" }));
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

assert.equal(validateInitData(makeInitData()).ok, true, "valid Telegram initData must be accepted");
assert.equal(validateInitData(makeInitData({ authDate: Math.floor(Date.now() / 1000) - 86401 })).ok, false, "expired initData must be rejected");
assert.equal(validateInitData(makeInitData({ authDate: Math.floor(Date.now() / 1000) + 61 })).ok, false, "future initData must be rejected");
assert.equal(validateInitData(makeInitData({ userId: 0 })).ok, false, "invalid Telegram user id must be rejected");
assert.equal(validateInitData(makeInitData().replace(/hash=[^&]+/, "hash=not-a-sha256-hash")).ok, false, "malformed hash must be rejected");

function runAuthorize(req) {
  let statusCode = null;
  let payload = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };
  authorizeTelegramId((r) => r.params.telegramId)(req, res, () => { nextCalled = true; });
  return { statusCode, payload, nextCalled };
}

assert.equal(runAuthorize({ params: { telegramId: "123" }, tg: undefined }).statusCode, 401, "missing Telegram auth must fail closed");
assert.equal(runAuthorize({ params: { telegramId: "123" }, tg: { id: "999", verified: true } }).statusCode, 403, "mismatched Telegram identity must be rejected");
assert.equal(runAuthorize({ params: { telegramId: "123" }, tg: { id: "123", verified: true } }).nextCalled, true, "matching verified Telegram identity must be accepted");
assert.equal(runAuthorize({ params: { telegramId: "123" }, tg: { id: "123", verified: false } }).statusCode, 401, "unverified Telegram identity must be rejected");

console.log("security regression tests passed");
