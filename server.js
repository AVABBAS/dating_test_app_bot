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

// ==================== API Endpoints ====================

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
        const fileId = photoSizes[photoSizes.length - 1].file_id; // Get highest resolution
        const file = await bot.api.getFile(fileId);
        tgPhotoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
      }
    } catch (photoErr) {
      console.error("Error fetching Telegram photo:", photoErr);
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramId.toString(),
          username,
          firstName,
          lastName,
          photoUrl: tgPhotoUrl
        },
      });
    } else if (!user.photoUrl && tgPhotoUrl) {
      // If user exists but has no photo, update it
      user = await prisma.user.update({
        where: { id: user.id },
        data: { photoUrl: tgPhotoUrl }
      });
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Update Profile
app.put("/api/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { age, gender, lookingFor, bio, photoUrl, interests, photos } = req.body;

  try {
    const data = {};
    if (age) data.age = parseInt(age);
    if (gender) data.gender = gender;
    if (lookingFor) data.lookingFor = lookingFor;
    if (bio) data.bio = bio;
    if (photoUrl) data.photoUrl = photoUrl;
    if (interests) data.interests = interests;
    if (photos) data.photos = photos;

    const user = await prisma.user.update({
      where: { telegramId: telegramId.toString() },
      data
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Get Discovery Profiles (increased limit to 50)
app.get("/api/discover/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const currentUser = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const interactedUserIds = await prisma.like.findMany({
      where: { fromUserId: currentUser.id },
      select: { toUserId: true }
    }).then(likes => likes.map(l => l.toUserId));

    let genderQuery = {};
    if (currentUser.lookingFor && currentUser.lookingFor !== 'both') {
      genderQuery = { gender: currentUser.lookingFor };
    }

    // Prioritize boosted profiles
    const profiles = await prisma.user.findMany({
      where: {
        id: { notIn: [...interactedUserIds, currentUser.id] },
        age: { not: null },
        photoUrl: { not: null },
        ...genderQuery
      },
      orderBy: [
        { isBoosted: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Like / Pass / Super Like a Profile
app.post("/api/action", async (req, res) => {
  const { fromTelegramId, toUserId, action } = req.body; // action: 'like' | 'pass' | 'superlike'

  try {
    const fromUser = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
    if (!fromUser) return res.status(404).json({ error: "User not found" });

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

    // Check for match (both like and superlike count)
    if (action === 'like' || action === 'superlike') {
      const mutualLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: parseInt(toUserId),
            toUserId: fromUser.id
          }
        }
      });

      if (mutualLike && (mutualLike.action === 'like' || mutualLike.action === 'superlike')) {
        // It's a match!
        // Check if match already exists
        const existingMatch = await prisma.match.findFirst({
          where: {
            OR: [
              { user1Id: fromUser.id, user2Id: parseInt(toUserId) },
              { user1Id: parseInt(toUserId), user2Id: fromUser.id }
            ]
          }
        });

        if (!existingMatch) {
          await prisma.match.create({
            data: {
              user1Id: fromUser.id,
              user2Id: parseInt(toUserId)
            }
          });
        }

        const toUser = await prisma.user.findUnique({ where: { id: parseInt(toUserId) }});

        // Notify via Telegram
        const matchEmoji = action === 'superlike' ? '⭐🎉' : '🎉';
        bot.api.sendMessage(fromUser.telegramId, `${matchEmoji} You matched with ${toUser.firstName || toUser.username}!`).catch(console.error);
        bot.api.sendMessage(toUser.telegramId, `${matchEmoji} You matched with ${fromUser.firstName || fromUser.username}!`).catch(console.error);

        return res.json({ 
          match: true, 
          matchedUser: {
            id: toUser.id,
            firstName: toUser.firstName,
            photoUrl: toUser.photoUrl
          }
        });
      }
    }

    // If it was a superlike, notify the other person
    if (action === 'superlike') {
      const toUser = await prisma.user.findUnique({ where: { id: parseInt(toUserId) }});
      if (toUser) {
        bot.api.sendMessage(toUser.telegramId, `⭐ Someone sent you a Super Like! Open the app to see who.`).catch(console.error);
      }
    }

    res.json({ match: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Get Matches (with last message)
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
        user2: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedMatches = matches.map(m => {
      const otherUser = m.user1Id === user.id ? m.user2 : m.user1;
      const lastMessage = m.messages[0] || null;
      return {
        matchId: m.id,
        user: otherUser,
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          createdAt: lastMessage.createdAt,
          isMine: lastMessage.senderId === user.id
        } : null
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 6. Send Message
app.post("/api/messages", async (req, res) => {
  const { matchId, fromTelegramId, text } = req.body;
  
  try {
    const sender = await prisma.user.findUnique({ where: { telegramId: fromTelegramId.toString() } });
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId) },
      include: { user1: true, user2: true }
    });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const receiver = match.user1Id === sender.id ? match.user2 : match.user1;

    const message = await prisma.message.create({
      data: {
        matchId: match.id,
        senderId: sender.id,
        receiverId: receiver.id,
        text
      }
    });

    // Notify receiver via Telegram
    bot.api.sendMessage(receiver.telegramId, `💬 ${sender.firstName || sender.username}: ${text}`).catch(console.error);

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 7. Get Messages for a Match
app.get("/api/messages/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { telegramId } = req.query;
  
  try {
    const user = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const messages = await prisma.message.findMany({
      where: { matchId: parseInt(matchId) },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, firstName: true, photoUrl: true } }
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        matchId: parseInt(matchId),
        receiverId: user.id,
        read: false
      },
      data: { read: true }
    });

    const formattedMessages = messages.map(m => ({
      id: m.id,
      text: m.text,
      isMine: m.senderId === user.id,
      sender: m.sender,
      createdAt: m.createdAt
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 8. Boost Profile
app.post("/api/boost/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  
  try {
    const boostExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const user = await prisma.user.update({
      where: { telegramId: telegramId.toString() },
      data: { isBoosted: true, boostExpiry }
    });

    // Schedule boost expiry (simple approach)
    setTimeout(async () => {
      try {
        await prisma.user.update({
          where: { telegramId: telegramId.toString() },
          data: { isBoosted: false, boostExpiry: null }
        });
      } catch (e) { console.error('Boost expiry error:', e); }
    }, 30 * 60 * 1000);

    res.json({ boosted: true, expiresAt: boostExpiry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 9. Explore Profiles (grid view, all profiles)
app.get("/api/explore/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const { category } = req.query; // 'all', 'online', 'new', 'popular'

  try {
    const currentUser = await prisma.user.findUnique({ where: { telegramId: telegramId.toString() } });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    let where = {
      id: { not: currentUser.id },
      age: { not: null },
      photoUrl: { not: null }
    };

    let orderBy = { createdAt: 'desc' };

    if (category === 'online') {
      where.isOnline = true;
    } else if (category === 'new') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: oneWeekAgo };
    }

    const profiles = await prisma.user.findMany({
      where,
      orderBy,
      take: 40,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true,
        gender: true,
        photoUrl: true,
        bio: true,
        interests: true,
        isOnline: true,
        isBoosted: true
      }
    });

    res.json(profiles);
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
      where: { toUserId: user.id, action: { in: ['like', 'superlike'] } }
    });

    const superLikesCount = await prisma.like.count({
      where: { toUserId: user.id, action: 'superlike' }
    });

    res.json({ likes: likesCount, superLikes: superLikesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve React App for any unknown routes
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
        }
      });
    } catch (error) {
      console.error("Bot start failed (likely due to zero-downtime deployment conflict). Retrying in 5s...");
      setTimeout(startBot, 5000);
    }
  };
  
  startBot();
});
