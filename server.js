const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const crypto = require("crypto");

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
const { mutateBalance } = require("./lib/ledger");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const MINI_APP_VERSION = "20260915-f10ad427";

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Never let the HTML shell or hashed assets become stale inside Telegram WebView.
// Telegram Android has its own WebView/cache layer, so we deliberately disable
// browser/proxy caching at the origin as well.
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  index: false,
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));
app.use(attachTelegramUser);

const sendFreshMiniApp = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};

// Root remains available for direct browser access.
app.get('/', sendFreshMiniApp);

// Telegram's Web App button uses a versioned path so every deploy gets a fresh
// document. Vite's build does not create /mini/<version> directories, so this
// route must explicitly serve the same HTML shell for every version token.
app.get('/mini/:version', sendFreshMiniApp);

// --- SECURITY: Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many actions, slow down' }
});

// --- SECURITY: Telegram Data Validation ---
function validateTelegramData(initData, botToken) {
  if (!initData || !botToken) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return computedHash === hash;
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
  const { telegramId, username, firstName, lastName, initData } = req.body;
  
  // CRITICAL SECURITY CHECK: Validate Telegram data
  if (!validateTelegramData(initData, BOT_TOKEN)) {
    return res.status(403).json({ error: "Invalid Telegram data. Authentication failed." });
  }
  
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
    } else {
      // Always update firstName/lastName from Telegram (they may have changed)
      // Always refresh photo if Telegram has one (even if user already has one)
      const updateData = { firstName, lastName };
      if (tgPhotoUrl) updateData.photoUrl = tgPhotoUrl;
      user = await prisma.user.update({ where: { id: user.id }, data: updateData });
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
app.get(
  "/api/discover/:telegramId",
  authorizeTelegramId((req) => req.params.telegramId),
  async (req, res) => {
  const { telegramId } = req.params;

  try {
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
