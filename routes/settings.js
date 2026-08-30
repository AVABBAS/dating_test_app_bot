// ═══════════════════════════════════════════════════════════
// Pack C — Settings, Safety & Filters
// Discovery preferences, notification/privacy settings, block & report
// ═══════════════════════════════════════════════════════════
const express = require("express");
const prisma = require("../lib/prisma");
const { authorizeTelegramId } = require("../lib/telegramAuth");

const router = express.Router();

const REPORT_REASONS = [
  { id: "fake",        label: "پروفایل جعلی یا کلاهبرداری" },
  { id: "harassment",  label: "آزار و اذیت یا توهین" },
  { id: "inappropriate", label: "محتوای نامناسب" },
  { id: "spam",        label: "اسپم یا تبلیغات" },
  { id: "underage",    label: "زیر سن قانونی" },
  { id: "other",       label: "موارد دیگر" },
];

// ─────────────────────────── Preferences (filters) ───────────────────────────

// GET /api/preferences/:telegramId
router.get("/preferences/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { lookingFor: true, prefAgeMin: true, prefAgeMax: true, maxDistance: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ preferences: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/preferences/:telegramId  { lookingFor, prefAgeMin, prefAgeMax, maxDistance }
router.put(
  "/preferences/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { lookingFor, prefAgeMin, prefAgeMax, maxDistance } = req.body;
    try {
      const data = {};
      if (lookingFor !== undefined) data.lookingFor = lookingFor;
      if (prefAgeMin !== undefined) data.prefAgeMin = Math.max(18, Math.min(99, Number(prefAgeMin)));
      if (prefAgeMax !== undefined) data.prefAgeMax = Math.max(18, Math.min(99, Number(prefAgeMax)));
      if (maxDistance !== undefined) data.maxDistance = Math.max(1, Math.min(500, Number(maxDistance)));

      // keep min <= max
      if (data.prefAgeMin !== undefined && data.prefAgeMax !== undefined && data.prefAgeMin > data.prefAgeMax) {
        [data.prefAgeMin, data.prefAgeMax] = [data.prefAgeMax, data.prefAgeMin];
      }

      const user = await prisma.user.update({
        where: { telegramId: req.params.telegramId.toString() },
        data,
        select: { lookingFor: true, prefAgeMin: true, prefAgeMax: true, maxDistance: true },
      });
      res.json({ ok: true, preferences: user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─────────────────────── Settings (privacy & notifications) ───────────────────────

// GET /api/settings/:telegramId
router.get("/settings/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: {
        incognito: true,
        notifyMatches: true,
        notifyLikes: true,
        notifyMessages: true,
        isVerified: true,
        isPremium: true,
        premiumTier: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ settings: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/settings/:telegramId  { incognito, notifyMatches, notifyLikes, notifyMessages }
router.put(
  "/settings/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { incognito, notifyMatches, notifyLikes, notifyMessages } = req.body;
    try {
      const data = {};
      for (const [k, v] of Object.entries({ incognito, notifyMatches, notifyLikes, notifyMessages })) {
        if (v !== undefined) data[k] = Boolean(v);
      }
      const user = await prisma.user.update({
        where: { telegramId: req.params.telegramId.toString() },
        data,
        select: { incognito: true, notifyMatches: true, notifyLikes: true, notifyMessages: true },
      });
      res.json({ ok: true, settings: user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─────────────────────────────── Safety ───────────────────────────────

// GET /api/report/reasons
router.get("/report/reasons", (req, res) => res.json({ reasons: REPORT_REASONS }));

// POST /api/report  { fromTelegramId, toUserId, reason }
router.post(
  "/report",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { fromTelegramId, reason } = req.body;
    const toUserId = Number(req.body.toUserId);
    if (!Number.isInteger(toUserId)) return res.status(400).json({ error: "toUserId is required" });
    if (!reason || !REPORT_REASONS.some((r) => r.id === reason)) {
      return res.status(400).json({ error: "Invalid reason" });
    }
    try {
      const from = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() }, select: { id: true } });
      if (!from) return res.status(404).json({ error: "User not found" });
      if (from.id === toUserId) return res.status(400).json({ error: "Cannot report yourself" });

      const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
      if (!target) return res.status(404).json({ error: "Target not found" });

      await prisma.report.create({ data: { fromUserId: from.id, toUserId, reason, status: "open" } });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/block  { fromTelegramId, toUserId }
// Blocking = record a report of type "block" + a "pass" so they never resurface,
// and tear down any existing match/messages between the two.
router.post(
  "/block",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { fromTelegramId } = req.body;
    const toUserId = Number(req.body.toUserId);
    if (!Number.isInteger(toUserId)) return res.status(400).json({ error: "toUserId is required" });
    try {
      const from = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() }, select: { id: true } });
      if (!from) return res.status(404).json({ error: "User not found" });

      await prisma.$transaction(async (tx) => {
        // Record the block as a report
        await tx.report.create({ data: { fromUserId: from.id, toUserId, reason: "blocked", status: "actioned" } });

        // Ensure a "pass" like exists so discover won't resurface them
        const existing = await tx.like.findUnique({
          where: { fromUserId_toUserId: { fromUserId: from.id, toUserId } },
        }).catch(() => null);
        if (existing) {
          await tx.like.update({ where: { id: existing.id }, data: { action: "pass" } });
        } else {
          await tx.like.create({ data: { fromUserId: from.id, toUserId, action: "pass" } });
        }

        // Remove any match + its messages between the two
        const matches = await tx.match.findMany({
          where: {
            OR: [
              { user1Id: from.id, user2Id: toUserId },
              { user1Id: toUserId, user2Id: from.id },
            ],
          },
          select: { id: true },
        });
        const matchIds = matches.map((m) => m.id);
        if (matchIds.length) {
          await tx.message.deleteMany({ where: { matchId: { in: matchIds } } });
          await tx.match.deleteMany({ where: { id: { in: matchIds } } });
        }
      });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
