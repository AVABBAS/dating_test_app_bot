const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const prisma = require("./lib/prisma");
const bot = require("./bot");
const {
  lookingForToGender,
  withComputedOnline,
  isBoostActive,
  publicUserSelect,
} = require("./lib/helpers");
const { attachTelegramUser, authorizeTelegramId } = require("./lib/telegramAuth");
const { notify } = require("./lib/notify");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Attach the verified Telegram identity (from initData) to req.tg when present.
app.use(attachTelegramUser);

// Static assets for the built frontend (does NOT intercept /api/*).
app.use(express.static(path.join(__dirname, "frontend/dist")));

// Lazily clear boosts whose 30-minute window has elapsed. Self-healing, so we
// don't depend on an in-memory setTimeout that dies on restart/redeploy.
async function sweepExpiredBoosts() {
  try {
    await prisma.user.updateMany({
      where: { isBoosted: true, boostExpiry: { lt: new Date() } },
      data: { isBoosted: false, boostExpiry: null },
    });
  } catch (e) {
    console.error("sweepExpiredBoosts:", e);
  }
}

// Touch lastSeen so "online" (computed from lastSeen) stays fresh while active.
async function touchLastSeen(userId) {
  try {
    await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date(), isOnline: true } });
  } catch {
    /* non-fatal */
  }
}

// ==================== Core API Endpoints ====================

// 1. Get Profile or Create New User
app.post("/api/user", async (req, res) => {
  const { telegramId, username, firstName, lastName } = req.body;
  if (!telegramId) return res.status(400).json({ error: "Telegram ID required" });

  try {
    let user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });

    // Automatically fetch Telegram profile photo
    let tgPhotoUrl = null;
    try {
      const photos = await bot.api.getUserProfilePhotos(telegramId);
      if (photos.total_count > 0) {
        const photoSizes = photos.photos[0];
        const fileId = photoSizes[photoSizes.length - 1].file_id; // highest resolution
        const file = await bot.api.getFile(fileId);
        tgPhotoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
      }
    } catch (photoErr) {
      console.error("Error fetching Telegram photo:", photoErr);
    }

    if (!user) {
      user = await prisma.user.create({
        data: { telegramId: telegramId.toString(), username, firstName, lastName, photoUrl: tgPhotoUrl },
      });
    } else if (!user.photoUrl && tgPhotoUrl) {
      user = await prisma.user.update({ where: { id: user.id }, data: { photoUrl: tgPhotoUrl } });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Update Profile
app.put(
  "/api/user/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { telegramId } = req.params;
    const { age, gender, lookingFor, bio, photoUrl, interests, photos, firstName, city } = req.body;

    try {
      const data = {};
      if (firstName !== undefined && firstName !== null) data.firstName = firstName;
      if (age) data.age = parseInt(age);
      if (gender) data.gender = gender;
      if (lookingFor) data.lookingFor = lookingFor;
      if (bio !== undefined) data.bio = bio;
      if (photoUrl !== undefined && photoUrl !== null && photoUrl !== "") data.photoUrl = photoUrl;
      if (interests) data.interests = interests;
      if (photos) data.photos = photos;
      if (city !== undefined) data.city = city;

      const user = await prisma.user.update({ where: { telegramId: telegramId.toString() }, data });
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// 3. Get Discovery Profiles — respects gender + age + distance preferences,
//    hides incognito users, and reports a freshly-computed online status.
app.get("/api/discover/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    await sweepExpiredBoosts();
    const currentUser = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const interactedUserIds = await prisma.like
      .findMany({ where: { fromUserId: currentUser.id }, select: { toUserId: true } })
      .then((likes) => likes.map((l) => l.toUserId));

    const targetGender = lookingForToGender(currentUser.lookingFor);
    const ageMin = currentUser.prefAgeMin ?? 18;
    const ageMax = currentUser.prefAgeMax ?? 99;

    const profiles = await prisma.user.findMany({
      where: {
        id: { notIn: [...interactedUserIds, currentUser.id] },
        age: { gte: ageMin, lte: ageMax },
        photoUrl: { not: null },
        incognito: false,
        ...(targetGender ? { gender: targetGender } : {}),
      },
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: publicUserSelect,
    });

    res.json(profiles.map(withComputedOnline));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Like / Pass / Super Like a Profile
app.post(
  "/api/action",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { fromTelegramId, action } = req.body; // 'like' | 'pass' | 'superlike'
    const toUserId = parseInt(req.body.toUserId);
    if (!Number.isInteger(toUserId)) return res.status(400).json({ error: "Invalid toUserId" });

    try {
      const fromUser = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
      if (!fromUser) return res.status(404).json({ error: "User not found" });

      // Enforce super-like balance (only charge for a *new* super like)
      const existing = await prisma.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId: fromUser.id, toUserId } },
      });
      const chargeSuperlike = action === "superlike" && (!existing || existing.action !== "superlike");
      if (chargeSuperlike && (fromUser.superLikesLeft ?? 0) <= 0) {
        return res.status(402).json({ error: "No super likes left", needSuperlikes: true });
      }

      await prisma.like.upsert({
        where: { fromUserId_toUserId: { fromUserId: fromUser.id, toUserId } },
        update: { action },
        create: { fromUserId: fromUser.id, toUserId, action },
      });

      if (chargeSuperlike) {
        await prisma.user.update({ where: { id: fromUser.id }, data: { superLikesLeft: { decrement: 1 } } });
      }

      // Check for a match (like and superlike both count)
      if (action === "like" || action === "superlike") {
        const mutualLike = await prisma.like.findUnique({
          where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUser.id } },
        });

        if (mutualLike && (mutualLike.action === "like" || mutualLike.action === "superlike")) {
          let existingMatch = await prisma.match.findFirst({
            where: {
              OR: [
                { user1Id: fromUser.id, user2Id: toUserId },
                { user1Id: toUserId, user2Id: fromUser.id },
              ],
            },
          });
          if (!existingMatch) {
            existingMatch = await prisma.match.create({ data: { user1Id: fromUser.id, user2Id: toUserId } });
          }

          const toUser = await prisma.user.findUnique({ where: { id: toUserId } });

          // Notify both sides (persists + Telegram, honoring prefs)
          await notify(toUser, {
            type: "match",
            title: "یک مچ جدید! 🎉",
            body: `تو و ${fromUser.firstName || "کسی"} همدیگر را پسندیدید.`,
            data: { matchId: existingMatch.id, userId: fromUser.id },
            telegramText: `🎉 با ${fromUser.firstName || fromUser.username || "یک نفر"} مچ شدی! برای شروع گفتگو وارد اپ شو.`,
          });
          await notify(fromUser, {
            type: "match",
            title: "یک مچ جدید! 🎉",
            body: `تو و ${toUser.firstName || "کسی"} همدیگر را پسندیدید.`,
            data: { matchId: existingMatch.id, userId: toUser.id },
            telegramText: `🎉 با ${toUser.firstName || toUser.username || "یک نفر"} مچ شدی! برای شروع گفتگو وارد اپ شو.`,
          });

          return res.json({
            match: true,
            matchId: existingMatch.id,
            matchedUser: { id: toUser.id, firstName: toUser.firstName, photoUrl: toUser.photoUrl },
          });
        }
      }

      // No match yet: let the recipient know someone liked / super-liked them.
      if (action === "like" || action === "superlike") {
        const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
        if (toUser) {
          await notify(toUser, {
            type: action === "superlike" ? "superlike" : "like",
            title: action === "superlike" ? "یک سوپرلایک گرفتی! ⭐" : "یک نفر تو را پسندید 💗",
            body: action === "superlike" ? "یک نفر برایت سوپرلایک فرستاد." : "برای دیدن اینکه چه کسی، وارد اپ شو.",
            data: { userId: fromUser.id },
            telegramText:
              action === "superlike"
                ? "⭐ یک نفر به تو سوپرلایک داد! وارد اپ شو تا ببینی کیه."
                : "💗 یک نفر تو را پسندید! وارد اپ شو.",
          });
        }
      }

      res.json({ match: false });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// 5. Get Matches (with last message)
app.get("/api/matches/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });
    touchLastSeen(user.id);

    const matches = await prisma.match.findMany({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      include: {
        user1: true,
        user2: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedMatches = matches.map((m) => {
      const otherUser = m.user1Id === user.id ? m.user2 : m.user1;
      const lastMessage = m.messages[0] || null;
      return {
        matchId: m.id,
        user: withComputedOnline(otherUser),
        lastMessage: lastMessage
          ? { text: lastMessage.text, createdAt: lastMessage.createdAt, isMine: lastMessage.senderId === user.id }
          : null,
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 6. Send Message
app.post(
  "/api/messages",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { matchId, fromTelegramId, text } = req.body;

    try {
      const sender = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
      if (!sender) return res.status(404).json({ error: "Sender not found" });

      const match = await prisma.match.findUnique({
        where: { id: parseInt(matchId) },
        include: { user1: true, user2: true },
      });
      if (!match) return res.status(404).json({ error: "Match not found" });

      // Ensure the sender actually belongs to this match
      if (match.user1Id !== sender.id && match.user2Id !== sender.id) {
        return res.status(403).json({ error: "Not part of this match" });
      }

      const receiver = match.user1Id === sender.id ? match.user2 : match.user1;

      const message = await prisma.message.create({
        data: { matchId: match.id, senderId: sender.id, receiverId: receiver.id, text },
      });
      touchLastSeen(sender.id);

      await notify(receiver, {
        type: "message",
        title: `پیام جدید از ${sender.firstName || "یک نفر"}`,
        body: text.length > 80 ? text.slice(0, 80) + "…" : text,
        data: { matchId: match.id, senderId: sender.id },
        telegramText: `💬 ${sender.firstName || sender.username}: ${text}`,
      });

      res.json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// 7. Get Messages for a Match
app.get("/api/messages/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { telegramId } = req.query;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });
    touchLastSeen(user.id);

    const messages = await prisma.message.findMany({
      where: { matchId: parseInt(matchId) },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, firstName: true, photoUrl: true } } },
    });

    await prisma.message.updateMany({
      where: { matchId: parseInt(matchId), receiverId: user.id, read: false },
      data: { read: true },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      text: m.text,
      isMine: m.senderId === user.id,
      sender: m.sender,
      createdAt: m.createdAt,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 8. Boost Profile — consumes a boost, sets a 30-minute expiry.
app.post(
  "/api/boost/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { telegramId } = req.params;

    try {
      const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!isBoostActive(user) && (user.boostsLeft ?? 0) <= 0) {
        return res.status(402).json({ error: "No boosts left", needBoosts: true });
      }

      const boostExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const updated = await prisma.user.update({
        where: { telegramId: telegramId.toString() },
        data: {
          isBoosted: true,
          boostExpiry,
          ...(isBoostActive(user) ? {} : { boostsLeft: { decrement: 1 } }),
        },
      });

      res.json({ boosted: true, expiresAt: boostExpiry, boostsLeft: updated.boostsLeft });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// 9. Explore Profiles (grid directory). Adds 'verified' category + preference
//    filtering + computed online + incognito hiding.
app.get("/api/explore/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { category, search } = req.query; // 'all' | 'online' | 'new' | 'popular' | 'verified'

  try {
    await sweepExpiredBoosts();
    const currentUser = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const targetGender = lookingForToGender(currentUser.lookingFor);

    const where = {
      id: { not: currentUser.id },
      age: { not: null },
      photoUrl: { not: null },
      incognito: false,
      ...(targetGender ? { gender: targetGender } : {}),
    };

    if (category === "new") {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (category === "verified") {
      where.isVerified = true;
    } else if (category === "online") {
      // "online" is computed from lastSeen, so filter by recent activity here.
      where.lastSeen = { gte: new Date(Date.now() - 5 * 60 * 1000) };
    }

    if (search && search.trim()) {
      where.OR = [
        { firstName: { contains: search.trim(), mode: "insensitive" } },
        { bio: { contains: search.trim(), mode: "insensitive" } },
        { city: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    let profiles;

    if (category === "popular") {
      const likeCounts = await prisma.like.groupBy({
        by: ["toUserId"],
        where: { action: { in: ["like", "superlike"] } },
        _count: { toUserId: true },
      });
      const rankedIds = likeCounts
        .sort((a, b) => b._count.toUserId - a._count.toUserId)
        .map((l) => l.toUserId);

      const popularWhere = { ...where, id: { ...where.id, in: rankedIds.length ? rankedIds : [-1] } };
      const popularProfiles = rankedIds.length
        ? await prisma.user.findMany({ where: popularWhere, select: publicUserSelect })
        : [];
      const order = new Map(rankedIds.map((id, idx) => [id, idx]));
      profiles = popularProfiles.sort((a, b) => order.get(a.id) - order.get(b.id)).slice(0, 40);
    } else {
      profiles = await prisma.user.findMany({
        where,
        orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
        take: 40,
        select: publicUserSelect,
      });
    }

    res.json(profiles.map(withComputedOnline));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 10. Get likes received count
app.get("/api/likes-count/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const likesCount = await prisma.like.count({
      where: { toUserId: user.id, action: { in: ["like", "superlike"] } },
    });
    const superLikesCount = await prisma.like.count({ where: { toUserId: user.id, action: "superlike" } });

    res.json({ likes: likesCount, superLikes: superLikesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 11. Delete Account
app.delete(
  "/api/user/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
    const { telegramId } = req.params;
    try {
      const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Messages & matches have no cascade, so remove them explicitly first.
      await prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
      const userMatches = await prisma.match.findMany({
        where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
        select: { id: true },
      });
      if (userMatches.length > 0) {
        await prisma.match.deleteMany({ where: { id: { in: userMatches.map((m) => m.id) } } });
      }
      await prisma.like.deleteMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } });
      // Everything else (prompts, stories, gifts, events, purchases, reports,
      // notifications) cascades on user delete.
      await prisma.user.delete({ where: { id: user.id } });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// 12. Get chat info (other user details in a match)
app.get("/api/chat-info/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { telegramId } = req.query;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
      include: { user1: true, user2: true },
    });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const other = withComputedOnline(match.user1Id === user.id ? match.user2 : match.user1);
    res.json({
      matchId: match.id,
      otherUser: {
        id: other.id,
        firstName: other.firstName,
        photoUrl: other.photoUrl,
        isOnline: other.isOnline,
        isVerified: other.isVerified,
        lastSeen: other.lastSeen,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── In-memory typing status ──────────────────────────────
const typingMap = new Map(); // "matchId:telegramId" -> timestamp

// 13. Set typing status
app.post("/api/typing/:matchId", (req, res) => {
  const { matchId } = req.params;
  const { telegramId } = req.body;
  const key = `${matchId}:${telegramId}`;
  typingMap.set(key, Date.now());
  setTimeout(() => typingMap.delete(key), 5000);
  res.json({ ok: true });
});

// 14. Poll typing status
app.get("/api/typing/:matchId", (req, res) => {
  const { matchId } = req.params;
  const { telegramId } = req.query;
  const now = Date.now();
  const isTyping = [...typingMap.entries()].some(([key, ts]) => {
    const parts = key.split(":");
    const mid = parts[0];
    const uid = parts.slice(1).join(":");
    return mid === matchId && uid !== String(telegramId) && now - ts < 4000;
  });
  res.json({ isTyping });
});

// 15. Who liked me (unmatched) — lightweight list used by Discover.
app.get("/api/who-liked-me/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const myMatches = await prisma.match.findMany({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      select: { user1Id: true, user2Id: true },
    });
    const matchedIds = myMatches.flatMap((m) => [m.user1Id, m.user2Id]).filter((id) => id !== user.id);

    const likers = await prisma.like.findMany({
      where: {
        toUserId: user.id,
        action: { in: ["like", "superlike"] },
        fromUserId: matchedIds.length > 0 ? { notIn: matchedIds } : undefined,
      },
      include: { fromUser: { select: { id: true, firstName: true, photoUrl: true, age: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ count: likers.length, users: likers.map((l) => l.fromUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 16. Unread message count
app.get("/api/unread/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const count = await prisma.message.count({ where: { receiverId: user.id, read: false } });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 17. Report user — now persisted for moderation.
app.post(
  "/api/report",
  authorizeTelegramId((req) => req.body.fromTelegramId),
  async (req, res) => {
    const { fromTelegramId, reason } = req.body;
    const toUserId = parseInt(req.body.toUserId);
    if (!Number.isInteger(toUserId)) return res.status(400).json({ error: "Invalid toUserId" });
    try {
      const from = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() }, select: { id: true } });
      if (!from) return res.status(404).json({ error: "User not found" });
      await prisma.report.create({ data: { fromUserId: from.id, toUserId, reason: reason || "other" } });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ==================== New feature modules ====================
app.use("/api", require("./routes/monetization")); // Pack A
app.use("/api", require("./routes/profile"));       // Pack B
app.use("/api", require("./routes/settings"));      // Pack C
app.use("/api", require("./routes/social"));        // Pack D

// ── Serve the React app for any non-API route (MUST be last) ──
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// Start the server and bot
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const startBot = async () => {
    try {
      await bot.start({
        onStart: (botInfo) => {
          console.log(`Bot started as @${botInfo.username}`);
        },
      });
    } catch (error) {
      console.error("Bot start failed (likely due to zero-downtime deployment conflict). Retrying in 5s...");
      setTimeout(startBot, 5000);
    }
  };

  startBot();
});
