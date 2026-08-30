// ═══════════════════════════════════════════════════════════
// Pack D — Social & Events
// Events/meetups, leaderboard, passport (location), notifications center
// ═══════════════════════════════════════════════════════════
const express = require("express");
const prisma = require("../lib/prisma");
const { authorizeTelegramId } = require("../lib/telegramAuth");
const { withComputedOnline, publicUserSelect } = require("../lib/helpers");

const router = express.Router();

const EVENT_CATEGORIES = [
  { id: "party",   label: "مهمانی",   emoji: "🎉" },
  { id: "coffee",  label: "کافه",      emoji: "☕" },
  { id: "sport",   label: "ورزش",      emoji: "🏃" },
  { id: "culture", label: "فرهنگی",    emoji: "🎭" },
  { id: "travel",  label: "سفر",       emoji: "✈️" },
];

// ─────────────────────────────── Events ───────────────────────────────

// GET /api/events?category=&city=&telegramId=
router.get("/events", async (req, res) => {
  try {
    const { category, city, telegramId } = req.query;

    let meId = null;
    if (telegramId) {
      const me = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() }, select: { id: true } });
      meId = me?.id ?? null;
    }

    const events = await prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...(category && category !== "all" ? { category } : {}),
        ...(city ? { city } : {}),
      },
      include: {
        host: { select: publicUserSelect },
        attendees: meId ? { where: { userId: meId }, select: { id: true } } : false,
        _count: { select: { attendees: true } },
      },
      orderBy: { startsAt: "asc" },
    });

    res.json({
      categories: EVENT_CATEGORIES,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        coverUrl: e.coverUrl,
        category: e.category,
        city: e.city,
        location: e.location,
        startsAt: e.startsAt,
        host: e.host ? withComputedOnline(e.host) : null,
        attendeeCount: e._count.attendees,
        joined: meId ? (e.attendees?.length ?? 0) > 0 : false,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/events/:id?telegramId=
router.get("/events/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid event id" });
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: { select: publicUserSelect },
        attendees: { include: { user: { select: publicUserSelect } }, take: 30, orderBy: { createdAt: "asc" } },
        _count: { select: { attendees: true } },
      },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });

    let joined = false;
    if (req.query.telegramId) {
      const me = await prisma.user.findUnique({ where: { telegramId: req.query.telegramId.toString() }, select: { id: true } });
      if (me) joined = event.attendees.some((a) => a.userId === me.id);
    }

    res.json({
      event: {
        ...event,
        host: event.host ? withComputedOnline(event.host) : null,
        attendeeCount: event._count.attendees,
        attendees: event.attendees.map((a) => withComputedOnline(a.user)),
        joined,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/events/:id/join  { telegramId }
router.post(
  "/events/:id/join",
  authorizeTelegramId((req) => req.body.telegramId),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid event id" });
    try {
      const user = await prisma.user.findUnique({ where: { telegramId: req.body.telegramId.toString() }, select: { id: true } });
      if (!user) return res.status(404).json({ error: "User not found" });
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: id, userId: user.id } },
        update: {},
        create: { eventId: id, userId: user.id },
      });
      const count = await prisma.eventAttendee.count({ where: { eventId: id } });
      res.json({ ok: true, joined: true, attendeeCount: count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/events/:id/leave  { telegramId }
router.post(
  "/events/:id/leave",
  authorizeTelegramId((req) => req.body.telegramId),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid event id" });
    try {
      const user = await prisma.user.findUnique({ where: { telegramId: req.body.telegramId.toString() }, select: { id: true } });
      if (!user) return res.status(404).json({ error: "User not found" });
      await prisma.eventAttendee.deleteMany({ where: { eventId: id, userId: user.id } });
      const count = await prisma.eventAttendee.count({ where: { eventId: id } });
      res.json({ ok: true, joined: false, attendeeCount: count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ───────────────────────────── Leaderboard ─────────────────────────────

// GET /api/leaderboard  → most-liked profiles this week
router.get("/leaderboard", async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grouped = await prisma.like.groupBy({
      by: ["toUserId"],
      where: { action: { in: ["like", "superlike"] }, createdAt: { gte: since } },
      _count: { toUserId: true },
      orderBy: { _count: { toUserId: "desc" } },
      take: 20,
    });

    const ids = grouped.map((g) => g.toUserId);
    if (!ids.length) return res.json({ leaders: [] });

    const users = await prisma.user.findMany({
      where: { id: { in: ids }, incognito: false },
      select: publicUserSelect,
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const leaders = grouped
      .filter((g) => byId.has(g.toUserId))
      .map((g, i) => ({
        rank: i + 1,
        likes: g._count.toUserId,
        user: withComputedOnline(byId.get(g.toUserId)),
      }));

    res.json({ leaders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ────────────────────────────── Passport ──────────────────────────────

// PUT /api/passport/:telegramId  { city, latitude, longitude }  (empty city clears it)
router.put(
  "/passport/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { city, latitude, longitude } = req.body;
    try {
      const data = { passportCity: city && city.trim() ? city.trim() : null };
      if (latitude !== undefined) data.latitude = latitude === null ? null : Number(latitude);
      if (longitude !== undefined) data.longitude = longitude === null ? null : Number(longitude);

      const user = await prisma.user.update({
        where: { telegramId: req.params.telegramId.toString() },
        data,
        select: { city: true, passportCity: true, latitude: true, longitude: true },
      });
      res.json({ ok: true, passport: user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Popular Iranian cities for the passport picker
router.get("/passport/cities", (req, res) => {
  res.json({
    cities: ["تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم", "کرمانشاه", "رشت", "یزد", "کیش"],
  });
});

// ──────────────────────── Notifications center ────────────────────────

// GET /api/notifications/:telegramId
router.get(
  "/notifications/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: req.params.telegramId.toString() },
        select: { id: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const [items, unread] = await Promise.all([
        prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
        prisma.notification.count({ where: { userId: user.id, read: false } }),
      ]);
      res.json({ notifications: items, unread });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST /api/notifications/:telegramId/read  { id? }  (mark one, or all when id omitted)
router.post(
  "/notifications/:telegramId/read",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: req.params.telegramId.toString() },
        select: { id: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (req.body.id) {
        await prisma.notification.updateMany({ where: { id: Number(req.body.id), userId: user.id }, data: { read: true } });
      } else {
        await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
      }
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
