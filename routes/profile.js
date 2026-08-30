// ═══════════════════════════════════════════════════════════
// Pack B — Profile & Discovery
// Stories, profile prompts, verification, gifts
// ═══════════════════════════════════════════════════════════
const express = require("express");
const prisma = require("../lib/prisma");
const { authorizeTelegramId } = require("../lib/telegramAuth");
const { withComputedOnline, publicUserSelect } = require("../lib/helpers");
const { notify } = require("../lib/notify");

const router = express.Router();

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // stories live 24h

// ── Prompt catalog (icebreaker questions users can answer) ──
const PROMPT_CATALOG = [
  "یک واقعیت جالب درباره‌ی من…",
  "بهترین راه رسیدن به قلب من…",
  "تعطیلات ایده‌آل من…",
  "چیزی که هیچ‌وقت از انجامش خسته نمی‌شوم…",
  "دنبال کسی هستم که…",
  "غیرمنتظره‌ترین سفرم…",
  "بزرگ‌ترین آرزوی من…",
  "ساده‌ترین چیزی که خوشحالم می‌کند…",
  "بهترین فیلمی که دیده‌ام…",
  "اگر یک ابرقدرت داشتم…",
];

// ────────────────────────────── Stories ──────────────────────────────

// GET /api/stories/:telegramId  → active stories grouped by author
router.get("/stories/:telegramId", async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { id: true },
    });
    if (!me) return res.status(404).json({ error: "User not found" });

    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: { select: publicUserSelect },
        storyViews: { where: { viewerId: me.id }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by author
    const byUser = new Map();
    for (const s of stories) {
      const key = s.userId;
      if (!byUser.has(key)) {
        byUser.set(key, {
          user: withComputedOnline(s.user),
          isMine: s.userId === me.id,
          items: [],
          hasUnseen: false,
        });
      }
      const seen = s.storyViews.length > 0;
      const g = byUser.get(key);
      g.items.push({ id: s.id, imageUrl: s.imageUrl, caption: s.caption, createdAt: s.createdAt, views: s.viewCount, seen });
      if (!seen && s.userId !== me.id) g.hasUnseen = true;
    }

    // Mine first, then rings with unseen, then the rest
    const groups = [...byUser.values()].sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return 0;
    });

    res.json({ stories: groups });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/stories  { telegramId, imageUrl, caption }
router.post(
  "/stories",
  authorizeTelegramId((req) => req.body.telegramId),
  async (req, res) => {
    const { telegramId, imageUrl, caption } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });
    try {
      const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() }, select: { id: true } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const story = await prisma.story.create({
        data: {
          userId: user.id,
          imageUrl,
          caption: caption || null,
          expiresAt: new Date(Date.now() + STORY_TTL_MS),
        },
      });
      res.json({ ok: true, story });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/stories/:storyId/view  { telegramId }
router.post("/stories/:storyId/view", async (req, res) => {
  const { telegramId } = req.body;
  const storyId = Number(req.params.storyId);
  if (!Number.isInteger(storyId)) return res.status(400).json({ error: "Invalid story id" });
  try {
    const viewer = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() }, select: { id: true } });
    if (!viewer) return res.status(404).json({ error: "User not found" });

    // Idempotent: unique(storyId, viewerId)
    const existing = await prisma.storyView.findUnique({
      where: { storyId_viewerId: { storyId, viewerId: viewer.id } },
    });
    if (!existing) {
      await prisma.storyView.create({ data: { storyId, viewerId: viewer.id } });
      await prisma.story.update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ────────────────────────────── Prompts ──────────────────────────────

// GET /api/prompts/catalog
router.get("/prompts/catalog", (req, res) => {
  res.json({ catalog: PROMPT_CATALOG });
});

// GET /api/prompts/:telegramId  → this user's answered prompts
router.get("/prompts/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { id: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const prompts = await prisma.profilePrompt.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });
    res.json({ prompts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/prompts/:telegramId  { prompts: [{ question, answer }] }
router.put(
  "/prompts/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const list = Array.isArray(req.body.prompts) ? req.body.prompts : [];
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: req.params.telegramId.toString() },
        select: { id: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Replace the set (max 3 prompts, non-empty answers)
      const clean = list
        .filter((p) => p && p.question && p.answer && p.answer.trim())
        .slice(0, 3)
        .map((p, i) => ({ userId: user.id, question: p.question, answer: p.answer.trim(), order: i }));

      await prisma.$transaction([
        prisma.profilePrompt.deleteMany({ where: { userId: user.id } }),
        ...(clean.length ? [prisma.profilePrompt.createMany({ data: clean })] : []),
      ]);

      const prompts = await prisma.profilePrompt.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } });
      res.json({ ok: true, prompts });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ──────────────────────────── Verification ────────────────────────────

// GET /api/verification/:telegramId  → current status
router.get("/verification/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { isVerified: true, verificationStatus: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ isVerified: user.isVerified, status: user.verificationStatus });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/verification/:telegramId  → submit a verification request
// (In a real app a moderator/AI would review a selfie; here we mark it pending
//  and auto-approve after a short delay to keep the demo flowing.)
router.post(
  "/verification/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    try {
      const user = await prisma.user.update({
        where: { telegramId: req.params.telegramId.toString() },
        data: { verificationStatus: "pending" },
      });
      // Demo auto-approval
      setTimeout(async () => {
        try {
          const fresh = await prisma.user.findUnique({ where: { id: user.id } });
          if (fresh && fresh.verificationStatus === "pending") {
            const updated = await prisma.user.update({
              where: { id: user.id },
              data: { verificationStatus: "approved", isVerified: true },
            });
            await notify(updated, {
              type: "system",
              title: "پروفایلت تأیید شد ✅",
              body: "حالا نشان تأیید آبی کنار نامت نمایش داده می‌شود.",
              telegramText: "🎉 پروفایل شما با موفقیت تأیید شد! نشان تأیید آبی اکنون فعال است.",
            });
          }
        } catch (err) {
          console.error("verification auto-approve failed", err);
        }
      }, 8000);

      res.json({ ok: true, status: "pending" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─────────────────────────────── Gifts ───────────────────────────────

// GET /api/gifts/:telegramId  → gifts I've received
router.get("/gifts/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { id: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const gifts = await prisma.gift.findMany({
      where: { toUserId: user.id },
      include: { fromUser: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ gifts: gifts.map((g) => ({ ...g, fromUser: withComputedOnline(g.fromUser) })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/gifts  { fromTelegramId, toUserId, type, message }
router.post(
  "/gifts",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { fromTelegramId, type, message } = req.body;
    const toUserId = Number(req.body.toUserId);
    if (!Number.isInteger(toUserId) || !type) return res.status(400).json({ error: "toUserId and type are required" });
    try {
      const from = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
      if (!from) return res.status(404).json({ error: "Sender not found" });
      if (from.id === toUserId) return res.status(400).json({ error: "Cannot gift yourself" });

      // A rose costs one from the balance; other gifts are free demo tokens
      if (type === "rose") {
        if (from.rosesLeft <= 0) return res.status(402).json({ error: "No roses left", needRoses: true });
        await prisma.user.update({ where: { id: from.id }, data: { rosesLeft: { decrement: 1 } } });
      }

      const gift = await prisma.gift.create({
        data: { fromUserId: from.id, toUserId, type, message: message || null },
      });

      const to = await prisma.user.findUnique({ where: { id: toUserId } });
      await notify(to, {
        type: "gift",
        title: `یک هدیه دریافت کردی ${type === "rose" ? "🌹" : "🎁"}`,
        body: `${from.firstName || "کسی"} برایت یک هدیه فرستاد.`,
        data: { giftId: gift.id, type },
        telegramText: `🎁 ${from.firstName || "کسی"} برایت یک ${type === "rose" ? "رز 🌹" : "هدیه"} فرستاد!`,
      });

      res.json({ ok: true, gift, rosesLeft: type === "rose" ? from.rosesLeft - 1 : from.rosesLeft });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
