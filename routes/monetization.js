// ═══════════════════════════════════════════════════════════
// Pack A — Monetization & Engagement
// Premium subscription, consumable store, "Likes You", Top Picks
// ═══════════════════════════════════════════════════════════
const express = require("express");
const prisma = require("../lib/prisma");
const { authorizeTelegramId } = require("../lib/telegramAuth");
const {
  lookingForToGender,
  withComputedOnline,
  isPremiumActive,
  publicUserSelect,
} = require("../lib/helpers");

const router = express.Router();

// Static catalog ------------------------------------------------
const PREMIUM_PLANS = [
  {
    tier: "gold",
    name: "Lovely Gold",
    emoji: "✨",
    priceMonthly: 9.99,
    perks: [
      "دیدن همه‌ی کسانی که پسندیدنت",
      "لایک نامحدود",
      "۵ سوپرلایک در هفته",
      "۱ بوست رایگان در ماه",
      "بازگرداندن سوایپ (Rewind)",
    ],
  },
  {
    tier: "platinum",
    name: "Lovely Platinum",
    emoji: "👑",
    priceMonthly: 19.99,
    perks: [
      "همه‌ی مزایای Gold",
      "پیام قبل از مچ شدن",
      "اولویت نمایش پروفایل",
      "۵ سوپرلایک در هفته + ۵ رز",
      "دیدن اینکه چه کسی پیامت را خوانده",
    ],
  },
];

const STORE_ITEMS = [
  { item: "boost_pack",     label: "۵ بوست",      emoji: "⚡", price: 14.99, grants: { boostsLeft: 5 } },
  { item: "superlike_pack", label: "۲۵ سوپرلایک", emoji: "⭐", price: 9.99,  grants: { superLikesLeft: 25 } },
  { item: "rose_pack",      label: "۱۲ رز",        emoji: "🌹", price: 7.99,  grants: { rosesLeft: 12 } },
];

// GET /api/premium/plans
router.get("/premium/plans", (req, res) => {
  res.json({ plans: PREMIUM_PLANS });
});

// GET /api/premium/status/:telegramId
router.get("/premium/status/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      isPremium: isPremiumActive(user),
      tier: user.premiumTier,
      premiumUntil: user.premiumUntil,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/premium/subscribe  { telegramId, tier }
router.post(
  "/premium/subscribe",
  authorizeTelegramId((req) => req.body.telegramId),
  async (req, res) => {
    const { telegramId, tier } = req.body;
    const plan = PREMIUM_PLANS.find((p) => p.tier === tier);
    if (!plan) return res.status(400).json({ error: "Invalid tier" });

    try {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
      const bonus = tier === "platinum" ? { superLikesLeft: { increment: 5 }, rosesLeft: { increment: 5 } } : { superLikesLeft: { increment: 5 } };

      const user = await prisma.user.update({
        where: { telegramId: telegramId.toString() },
        data: { isPremium: true, premiumTier: tier, premiumUntil: until, ...bonus },
      });
      await prisma.purchase.create({
        data: { userId: user.id, item: `premium_${tier}`, amount: plan.priceMonthly },
      });
      res.json({ ok: true, isPremium: true, tier, premiumUntil: until });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/store/:telegramId  → balances + purchasable packs
router.get("/store/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
      select: { superLikesLeft: true, boostsLeft: true, rosesLeft: true, isPremium: true, premiumUntil: true, premiumTier: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ balances: { superLikesLeft: user.superLikesLeft, boostsLeft: user.boostsLeft, rosesLeft: user.rosesLeft }, items: STORE_ITEMS, isPremium: isPremiumActive(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/store/purchase  { telegramId, item }
router.post(
  "/store/purchase",
  authorizeTelegramId((req) => req.body.telegramId),
  async (req, res) => {
    const { telegramId, item } = req.body;
    const def = STORE_ITEMS.find((i) => i.item === item);
    if (!def) return res.status(400).json({ error: "Invalid item" });

    try {
      const data = {};
      for (const [k, v] of Object.entries(def.grants)) data[k] = { increment: v };
      const user = await prisma.user.update({
        where: { telegramId: telegramId.toString() },
        data,
      });
      await prisma.purchase.create({ data: { userId: user.id, item, amount: def.price } });
      res.json({ ok: true, balances: { superLikesLeft: user.superLikesLeft, boostsLeft: user.boostsLeft, rosesLeft: user.rosesLeft } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/likes-you/:telegramId  → people who liked me (premium-gated)
router.get(
  "/likes-you/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: req.params.telegramId.toString() },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Exclude people I already matched with
      const myMatches = await prisma.match.findMany({
        where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
        select: { user1Id: true, user2Id: true },
      });
      const matchedIds = myMatches.flatMap((m) => [m.user1Id, m.user2Id]).filter((id) => id !== user.id);

      const likers = await prisma.like.findMany({
        where: {
          toUserId: user.id,
          action: { in: ["like", "superlike"] },
          fromUserId: matchedIds.length ? { notIn: matchedIds } : undefined,
        },
        include: { fromUser: { select: publicUserSelect } },
        orderBy: { createdAt: "desc" },
        take: 40,
      });

      const premium = isPremiumActive(user);
      const users = likers.map((l) => ({
        ...withComputedOnline(l.fromUser),
        action: l.action,
        likedAt: l.createdAt,
        locked: !premium, // frontend blurs locked cards
      }));

      res.json({ count: users.length, premium, users });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/top-picks/:telegramId  → a curated daily selection
router.get("/top-picks/:telegramId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId.toString() },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const interacted = await prisma.like
      .findMany({ where: { fromUserId: user.id }, select: { toUserId: true } })
      .then((ls) => ls.map((l) => l.toUserId));

    const targetGender = lookingForToGender(user.lookingFor);
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [...interacted, user.id] },
        age: { not: null },
        photoUrl: { not: null },
        incognito: false,
        ...(targetGender ? { gender: targetGender } : {}),
      },
      select: { ...publicUserSelect, likesReceived: { where: { action: { in: ["like", "superlike"] } }, select: { id: true } } },
      take: 60,
    });

    // Score: verified + premium + popularity + freshness
    const scored = candidates
      .map((c) => {
        const likes = c.likesReceived.length;
        const score = likes * 3 + (c.isVerified ? 8 : 0) + (c.isPremium ? 4 : 0) + (c.isBoosted ? 5 : 0);
        const { likesReceived, ...rest } = c;
        return { ...withComputedOnline(rest), pickScore: score, likeCount: likes };
      })
      .sort((a, b) => b.pickScore - a.pickScore)
      .slice(0, 10);

    res.json({ picks: scored, refreshedAt: new Date() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
