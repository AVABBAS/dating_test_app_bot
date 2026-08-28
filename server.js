const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bot = require("./bot");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// API Endpoints

// 1. Get Profile or Create New User
app.post("/api/user", async (req, res) => {
  const { telegramId, username, firstName, lastName } = req.body;
  if (!telegramId) return res.status(400).json({ error: "Telegram ID required" });

  try {
    let user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramId.toString(),
          username,
          firstName,
          lastName,
        },
      });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Update Profile
app.put("/api/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { age, gender, lookingFor, bio, photoUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { telegramId: telegramId.toString() },
      data: {
        ...(age && { age: parseInt(age) }),
        ...(gender && { gender }),
        ...(lookingFor && { lookingFor }),
        ...(bio && { bio }),
        ...(photoUrl && { photoUrl })
      }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Get Discovery Profiles
app.get("/api/discover/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const currentUser = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    // Find users the current user hasn't liked/passed yet
    const interactedUserIds = await prisma.like.findMany({
      where: { fromUserId: currentUser.id },
      select: { toUserId: true }
    }).then(likes => likes.map(l => l.toUserId));

    // Construct looking for query
    let genderQuery = {};
    if (currentUser.lookingFor && currentUser.lookingFor !== 'both') {
      genderQuery = { gender: currentUser.lookingFor };
    }

    const profiles = await prisma.user.findMany({
      where: {
        id: { notIn: [...interactedUserIds, currentUser.id] },
        ...genderQuery
        // Can add more filters like age ranges here
      },
      take: 10
    });

    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Like / Pass a Profile
app.post("/api/action", async (req, res) => {
  const { fromTelegramId, toUserId, action } = req.body; // action: 'like' | 'pass'

  try {
    const fromUser = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
    if (!fromUser) return res.status(404).json({ error: "User not found" });

    // Record the action
    await prisma.like.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: fromUser.id,
          toUserId: parseInt(toUserId)
        }
      },
      update: { action },
      create: {
        fromUserId: fromUser.id,
        toUserId: parseInt(toUserId),
        action
      }
    });

    // Check for match
    if (action === 'like') {
      const mutualLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: parseInt(toUserId),
            toUserId: fromUser.id
          }
        }
      });

      if (mutualLike && mutualLike.action === 'like') {
        // It's a match!
        const match = await prisma.match.create({
          data: {
            user1Id: fromUser.id,
            user2Id: parseInt(toUserId)
          }
        });

        const toUser = await prisma.user.findUnique({ where: { id: parseInt(toUserId) }});

        // Notify both users via Telegram bot
        bot.api.sendMessage(fromUser.telegramId, `🎉 You matched with ${toUser.firstName || toUser.username}! Send them a message: @${toUser.username || "their profile"}`).catch(console.error);
        bot.api.sendMessage(toUser.telegramId, `🎉 You matched with ${fromUser.firstName || fromUser.username}! Send them a message: @${fromUser.username || "their profile"}`).catch(console.error);

        return res.json({ match: true });
      }
    }

    res.json({ match: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Get Matches
app.get("/api/matches/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    });

    const formattedMatches = matches.map(m => {
      return m.user1Id === user.id ? m.user2 : m.user1;
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server and bot
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot started as @${botInfo.username}`);
    }
  });
});
