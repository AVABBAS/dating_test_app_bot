const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Iranian female names
const femaleFirstNames = [
  'نازنین', 'مهسا', 'سارا', 'نیلوفر', 'پریسا', 'شیما', 'الناز', 'مریم', 'فاطمه', 'زهرا',
  'ستاره', 'آیدا', 'ترانه', 'گلناز', 'شقایق', 'بهاره', 'لاله', 'یاسمین', 'دریا', 'آتنا',
  'پرستو', 'مینا', 'سحر', 'شبنم', 'نگین', 'آزاده', 'رویا', 'هانیه', 'نسترن', 'پگاه',
  'مهتاب', 'سپیده', 'ندا', 'لیلا', 'شیرین', 'آناهیتا', 'کیمیا', 'درسا', 'تینا', 'النا',
  'سوگند', 'رها', 'ملیکا', 'دنیز', 'آوا', 'پانیذ', 'مائده', 'هلیا', 'یلدا', 'سودا',
  'آیلین', 'روژان', 'تارا', 'نیکا', 'مهرسا', 'رومینا', 'باران', 'سوفیا', 'دلارام', 'ثنا',
  'حدیث', 'هستی', 'مژده', 'فرشته', 'شادی', 'نوشین', 'آرزو', 'بنفشه', 'یاسمن', 'گلاره',
  'مهرناز', 'پارمیس', 'ریحانه', 'سمیرا', 'نازی', 'شکوفه', 'آنیتا', 'دیانا', 'مونا', 'سولماز',
  'فرناز', 'غزل', 'نیوشا', 'سوگل', 'آیسان', 'شیدا', 'مهلا', 'پریا', 'روشنک', 'کتایون',
  'نسیم', 'هاله', 'ویدا', 'ژاله', 'سروناز', 'تابان', 'افسون', 'بیتا', 'گیتی', 'سیما'
];

// Iranian male names
const maleFirstNames = [
  'علی', 'محمد', 'امیر', 'رضا', 'حسین', 'مهدی', 'سامان', 'آرش', 'پویا', 'بهنام',
  'کیان', 'سینا', 'آرمین', 'دانیال', 'پارسا', 'نیما', 'شایان', 'کامران', 'سروش', 'بهراد',
  'آریا', 'مانی', 'فرهاد', 'شهاب', 'سپهر', 'کوروش', 'داریوش', 'بهزاد', 'امید', 'پیمان',
  'ایمان', 'احسان', 'آرین', 'مازیار', 'سیاوش', 'کاوه', 'بابک', 'فرزاد', 'میلاد', 'رامین',
  'آراد', 'سام', 'ساسان', 'پدرام', 'مهران', 'شاهین', 'فربد', 'هومن', 'اشکان', 'تیرداد',
  'نوید', 'ماهان', 'کسری', 'آرتین', 'پرهام', 'سهیل', 'بردیا', 'رادمان', 'کامبیز', 'جمشید',
  'ارسلان', 'ابوالفضل', 'یاسین', 'عرفان', 'سعید', 'حامد', 'وحید', 'مصطفی', 'جواد', 'علیرضا',
  'محمدرضا', 'سالار', 'آیدین', 'رایان', 'هیراد', 'آبتین', 'مبین', 'ایلیا', 'متین', 'آرمان',
  'شروین', 'فریدون', 'هوشنگ', 'پژمان', 'کیارش', 'رستم', 'بهمن', 'اسفندیار', 'زال', 'طاها',
  'یوسف', 'ابراهیم', 'حسام', 'فرید', 'مهرداد', 'نادر', 'خسرو', 'بهروز', 'تورج', 'آرتا'
];

// Iranian last names
const lastNames = [
  'محمدی', 'حسینی', 'رضایی', 'کریمی', 'احمدی', 'موسوی', 'هاشمی', 'جعفری', 'علوی', 'نوری',
  'رحیمی', 'میرزایی', 'صادقی', 'تقوی', 'نجفی', 'اکبری', 'خانی', 'بهرامی', 'قاسمی', 'فرهادی',
  'امینی', 'شریفی', 'کاظمی', 'یزدانی', 'مرادی', 'عباسی', 'زارعی', 'رستمی', 'فتاحی', 'نیکزاد',
  'اسدی', 'باقری', 'طاهری', 'سلطانی', 'رنجبر', 'حیدری', 'پورمند', 'دهقانی', 'شاهبازی', 'افشار'
];

// Female bios in Farsi
const femaleBios = [
  'عاشق سفر و کشف جاهای جدید 🌍✈️',
  'دنبال یه رابطه جدی و عاشقانه هستم 💕',
  'کتابخوان، قهوه‌باز، عاشق طبیعت 📚☕🌿',
  'هنرمند و خلاق، نقاشی و موسیقی زندگیمه 🎨🎵',
  'ورزشکار و فعال، یوگا و شنا 🧘‍♀️🏊‍♀️',
  'آشپز حرفه‌ای، غذای خوب = عشق واقعی 👩‍🍳❤️',
  'عکاس آماتور، زیبایی رو همه جا می‌بینم 📸',
  'دانشجوی پزشکی، آینده‌ساز و مصمم 🩺💪',
  'عاشق فیلم و سریال، بیا با هم ببینیم 🎬🍿',
  'طراح لباس، مد و استایل زندگیمه 👗✨',
  'موسیقی‌دان، پیانو و گیتار میزنم 🎹🎸',
  'دنبال کسی که باهاش بخندم و زندگی کنم 😊',
  'عاشق حیوانات، دوتا گربه ملوس دارم 🐱🐱',
  'برنامه‌نویس و گیک، کد زدن عشقمه 💻',
  'روانشناس، شنونده خوبی هستم 🧠💬',
  'دوست‌دار طبیعت، کوهنوردی و کمپینگ ⛰️🏕️',
  'معلم زبان، انگلیسی و فرانسه 🇬🇧🇫🇷',
  'ماجراجو و ریسک‌پذیر، زندگی کوتاهه! 🎢',
  'شکلات‌خور حرفه‌ای و قهوه‌باز ☕🍫',
  'دنبال یه دوست خوب که شاید عشق بشه 🌹'
];

// Male bios in Farsi
const maleBios = [
  'مهندس نرم‌افزار، عاشق تکنولوژی و نوآوری 💻🚀',
  'ورزشکار، بدنساز و فوتبالیست ⚽💪',
  'عاشق سفر و ماجراجویی، ۲۰ کشور گشتم 🌎',
  'موزیسین، گیتاریست و آهنگساز 🎸🎶',
  'کارآفرین و خودساخته، رویاهام بزرگه 🎯',
  'عکاس حرفه‌ای طبیعت و مستند 📷🏔️',
  'دکتر، عاشق کمک به مردم 🩺❤️',
  'آشپز آماتور، غذای ایرانی تخصصمه 🍛',
  'دانشجوی دکترا، پژوهشگر و کنجکاو 🔬📖',
  'طراح گرافیک، خلاقیت توی خونمه 🎨',
  'کوهنورد و طبیعت‌گرد حرفه‌ای ⛰️🥾',
  'وکیل، عدالت‌خواه و اهل بحث و گفتگو ⚖️',
  'گیمر و تکنولوژی‌باز، PS5 و PC 🎮',
  'خلبان، آسمان خونه دوممه ✈️☁️',
  'شاعر و نویسنده، کلمات قدرت دارن ✍️',
  'معمار، طراحی فضاهای زیبا 🏗️',
  'عاشق سینما و تئاتر، هنر = زندگی 🎭',
  'دنبال یه رابطه واقعی و صادقانه هستم 💯',
  'بازیکن شطرنج، ذهنم همیشه فعاله ♟️🧠',
  'دوچرخه‌سوار و دونده ماراتن 🚴‍♂️🏃‍♂️'
];

// Photo URLs from Unsplash (free stock photos of diverse people)
const femalePhotos = [
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
  'https://images.unsplash.com/photo-1491349174775-aaafddd81942?w=400&q=80',
  'https://images.unsplash.com/photo-1524593689594-aae2f26b75ab?w=400&q=80',
  'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=400&q=80',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80',
  'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&q=80',
  'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=400&q=80',
  'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400&q=80',
  'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&q=80',
];

const malePhotos = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
  'https://images.unsplash.com/photo-1488161628813-04466f0cc7d4?w=400&q=80',
  'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=400&q=80',
  'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80',
  'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&q=80',
  'https://images.unsplash.com/photo-1495603889488-42d1d66e5523?w=400&q=80',
  'https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=400&q=80',
  'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&q=80',
];

// Iranian cities with rough coordinates (for distance / passport features)
const cities = [
  { name: 'تهران', lat: 35.6892, lng: 51.389 },
  { name: 'مشهد', lat: 36.2605, lng: 59.6168 },
  { name: 'اصفهان', lat: 32.6539, lng: 51.666 },
  { name: 'شیراز', lat: 29.5918, lng: 52.5837 },
  { name: 'تبریز', lat: 38.08, lng: 46.2919 },
  { name: 'کرج', lat: 35.84, lng: 50.9391 },
  { name: 'اهواز', lat: 31.3183, lng: 48.6706 },
  { name: 'قم', lat: 34.6416, lng: 50.8746 },
  { name: 'رشت', lat: 37.2808, lng: 49.5832 },
  { name: 'یزد', lat: 31.8974, lng: 54.3569 },
];

// Interest tags (mirror the onboarding list)
const interestsPool = [
  '✈️ سفر', '📚 کتاب', '☕ قهوه', '🎵 موسیقی', '🎬 فیلم', '🏋️ ورزش', '🍳 آشپزی',
  '🎨 هنر', '📷 عکاسی', '🐱 حیوانات', '⛰️ طبیعت', '🎮 بازی', '💻 تکنولوژی', '🧘 یوگا',
  '🎭 تئاتر', '🚴 دوچرخه', '🍰 شیرینی‌پزی', '🌱 گیاهان', '♟️ شطرنج', '🏊 شنا',
];

// Story background images
const storyImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
];

const storyCaptions = [
  'یه روز عالی ☀️', 'قهوه‌ی صبحگاهی ☕', 'طبیعت‌گردی 🌿', 'غروب رویایی 🌅',
  'آخر هفته 🎉', 'لحظه‌های ناب ✨', null, null,
];

// Prompt Q/A pairs (question must match catalog in routes/profile.js)
const promptPairs = [
  { q: 'یک واقعیت جالب درباره‌ی من…', a: ['تا حالا ۱۵ کشور رفتم', 'می‌تونم با چشم بسته آشپزی کنم', 'عاشق باران‌ام'] },
  { q: 'بهترین راه رسیدن به قلب من…', a: ['یه فنجون قهوه‌ی خوب', 'شوخ‌طبعی', 'صداقت و مهربونی'] },
  { q: 'تعطیلات ایده‌آل من…', a: ['کنار دریا با یه کتاب', 'سفر جاده‌ای بدون برنامه', 'کوهنوردی و کمپینگ'] },
  { q: 'دنبال کسی هستم که…', a: ['بتونه منو بخندونه', 'اهل ماجراجویی باشه', 'با هم رشد کنیم'] },
  { q: 'ساده‌ترین چیزی که خوشحالم می‌کند…', a: ['بوی نون تازه', 'موسیقی زیر بارون', 'پیاده‌روی شبانه'] },
];

// Events
const eventDefs = [
  { title: 'شب موسیقی زنده', category: 'party', city: 'تهران', location: 'کافه رنسانس', desc: 'یه شب پر از موسیقی و آشنایی‌های تازه 🎶', cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80' },
  { title: 'قهوه و گفتگو', category: 'coffee', city: 'اصفهان', location: 'کافه‌کتاب نقش‌جهان', desc: 'دور هم جمع شیم و از هر دری صحبت کنیم ☕📚', cover: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80' },
  { title: 'صعود گروهی به توچال', category: 'sport', city: 'تهران', location: 'ایستگاه تله‌کابین توچال', desc: 'طبیعت، ورزش و انرژی مثبت ⛰️', cover: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80' },
  { title: 'بازدید از موزه هنرهای معاصر', category: 'culture', city: 'تهران', location: 'موزه هنرهای معاصر', desc: 'یه بعدازظهر هنری با آدم‌های باذوق 🎨', cover: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80' },
  { title: 'تور یک‌روزه کویر', category: 'travel', city: 'یزد', location: 'کویر مصر', desc: 'شب زیر ستاره‌ها توی دل کویر ✨🏜️', cover: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80' },
  { title: 'دورهمی بردگیم', category: 'party', city: 'شیراز', location: 'کافه بازی هفت', desc: 'شب بازی‌های رومیزی و خنده 🎲', cover: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80' },
  { title: 'صبحانه و پیاده‌روی', category: 'coffee', city: 'مشهد', location: 'پارک ملت', desc: 'صبح زود، هوای تازه و صبحانه‌ی دسته‌جمعی 🥐', cover: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80' },
  { title: 'کلاس سالسا', category: 'sport', city: 'تهران', location: 'استودیو ریتم', desc: 'رقص یاد بگیریم و آدم‌های جدید ببینیم 💃', cover: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&q=80' },
];

const giftTypes = ['rose', 'heart', 'diamond', 'crown', 'teddy'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}
function chance(p) {
  return Math.random() < p;
}

function buildProfile(i, gender) {
  const isFemale = gender === 'female';
  const firstName = isFemale ? femaleFirstNames[i] : maleFirstNames[i];
  const lastName = randomElement(lastNames);
  const base = isFemale ? 1000 : 2000;
  const city = randomElement(cities);
  // ~40% recently active (=> shown as online)
  const online = chance(0.4);
  const lastSeen = online
    ? new Date(Date.now() - randomInt(0, 4) * 60 * 1000)
    : new Date(Date.now() - randomInt(1, 240) * 60 * 60 * 1000);
  const photoUrl = (isFemale ? femalePhotos : malePhotos)[i % (isFemale ? femalePhotos : malePhotos).length];
  const extraPhotos = sample(isFemale ? femalePhotos : malePhotos, randomInt(1, 3)).filter((p) => p !== photoUrl);

  return {
    telegramId: `fake_${gender}_${base + i}`,
    username: `user_${isFemale ? 'f' : 'm'}_${base + i}`,
    firstName,
    lastName,
    age: randomInt(18, isFemale ? 35 : 38),
    gender,
    lookingFor: randomElement(isFemale ? ['male', 'both'] : ['female', 'both']),
    bio: randomElement(isFemale ? femaleBios : maleBios),
    photoUrl,
    photos: extraPhotos,
    interests: sample(interestsPool, randomInt(3, 6)),
    city: city.name,
    latitude: city.lat + (Math.random() - 0.5) * 0.1,
    longitude: city.lng + (Math.random() - 0.5) * 0.1,
    isOnline: online,
    lastSeen,
    isVerified: chance(0.35),
    verificationStatus: 'none', // adjusted below for verified users
    isPremium: chance(0.2),
    isBoosted: chance(0.12),
    prefAgeMin: 18,
    prefAgeMax: randomInt(30, 55),
    maxDistance: randomElement([25, 50, 100, 200]),
    superLikesLeft: randomInt(0, 5),
    rosesLeft: randomInt(0, 8),
    boostsLeft: randomInt(0, 3),
  };
}

async function seed() {
  console.log('🌱 Starting seed: 200 profiles + rich demo data...\n');

  // ── 1. Users ───────────────────────────────────────────────
  const profiles = [];
  for (let i = 0; i < 100; i++) profiles.push(buildProfile(i, 'female'));
  for (let i = 0; i < 100; i++) profiles.push(buildProfile(i, 'male'));

  // finalize derived fields
  for (const p of profiles) {
    if (p.isVerified) p.verificationStatus = 'verified';
    if (p.isPremium) p.premiumTier = randomElement(['gold', 'platinum']);
    if (p.isPremium) p.premiumUntil = new Date(Date.now() + randomInt(5, 30) * 24 * 60 * 60 * 1000);
    if (p.isBoosted) p.boostExpiry = new Date(Date.now() + randomInt(5, 30) * 60 * 1000);
  }

  let created = 0;
  for (const profile of profiles) {
    try {
      await prisma.user.create({ data: profile });
      created++;
      if (created % 40 === 0) console.log(`  ✅ Created ${created}/200 profiles...`);
    } catch (err) {
      if (err.code !== 'P2002') console.error(`  ❌ ${profile.firstName}:`, err.message);
    }
  }
  console.log(`  👥 ${created} profiles created.\n`);

  // Fetch back the seeded users (with ids)
  const users = await prisma.user.findMany({
    where: { telegramId: { startsWith: 'fake_' } },
    orderBy: { id: 'asc' },
  });
  const ids = users.map((u) => u.id);
  if (!ids.length) {
    console.log('No seeded users found, skipping relational data.');
    return;
  }

  // ── 2. Profile prompts (for ~70% of users, 2 each) ─────────
  const promptRows = [];
  for (const u of users) {
    if (!chance(0.7)) continue;
    const chosen = sample(promptPairs, 2);
    chosen.forEach((pp, idx) => promptRows.push({ userId: u.id, question: pp.q, answer: randomElement(pp.a), order: idx }));
  }
  await prisma.profilePrompt.createMany({ data: promptRows });
  console.log(`  💬 ${promptRows.length} profile prompts.`);

  // ── 3. Stories (active 24h) for ~35 users ──────────────────
  const storyRows = [];
  for (const u of sample(users, 35)) {
    const n = randomInt(1, 2);
    for (let k = 0; k < n; k++) {
      storyRows.push({
        userId: u.id,
        imageUrl: randomElement(storyImages),
        caption: randomElement(storyCaptions),
        viewCount: randomInt(0, 120),
        createdAt: new Date(Date.now() - randomInt(0, 20) * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + randomInt(2, 22) * 60 * 60 * 1000),
      });
    }
  }
  await prisma.story.createMany({ data: storyRows });
  console.log(`  📸 ${storyRows.length} stories.`);

  // ── 4. Events + attendees ──────────────────────────────────
  let eventCount = 0;
  for (const e of eventDefs) {
    const host = randomElement(users);
    const ev = await prisma.event.create({
      data: {
        title: e.title,
        description: e.desc,
        coverUrl: e.cover,
        category: e.category,
        city: e.city,
        location: e.location,
        startsAt: new Date(Date.now() + randomInt(1, 21) * 24 * 60 * 60 * 1000),
        hostId: host.id,
      },
    });
    const attendees = sample(ids, randomInt(4, 18)).map((uid) => ({ eventId: ev.id, userId: uid }));
    await prisma.eventAttendee.createMany({ data: attendees, skipDuplicates: true });
    eventCount++;
  }
  console.log(`  🎉 ${eventCount} events.`);

  // ── 5. Likes (build a web so who-liked-me / leaderboard work) ─
  const likeRows = [];
  for (const u of users) {
    const targets = sample(ids.filter((id) => id !== u.id), randomInt(3, 9));
    for (const t of targets) {
      likeRows.push({ fromUserId: u.id, toUserId: t, action: chance(0.12) ? 'superlike' : chance(0.8) ? 'like' : 'pass' });
    }
  }
  await prisma.like.createMany({ data: likeRows, skipDuplicates: true });
  console.log(`  ❤️  ${likeRows.length} likes.`);

  // ── 6. Matches (from mutual likes), normalized & deduped ────
  const likes = await prisma.like.findMany({ where: { action: { in: ['like', 'superlike'] } }, select: { fromUserId: true, toUserId: true } });
  const likeSet = new Set(likes.map((l) => `${l.fromUserId}:${l.toUserId}`));
  const matchPairs = new Set();
  for (const l of likes) {
    if (likeSet.has(`${l.toUserId}:${l.fromUserId}`)) {
      const [a, b] = l.fromUserId < l.toUserId ? [l.fromUserId, l.toUserId] : [l.toUserId, l.fromUserId];
      matchPairs.add(`${a}:${b}`);
    }
  }
  const matchData = [...matchPairs].map((p) => {
    const [u1, u2] = p.split(':').map(Number);
    return { user1Id: u1, user2Id: u2 };
  });
  await prisma.match.createMany({ data: matchData, skipDuplicates: true });
  console.log(`  🔗 ${matchData.length} matches.`);

  // ── 7. Messages for a subset of matches ────────────────────
  const matches = await prisma.match.findMany({ take: 40, orderBy: { id: 'asc' } });
  const sampleMessages = ['سلام! چطوری؟ 😊', 'عکسات خیلی قشنگن', 'اهل کدوم شهری؟', 'وقت داری یه قهوه بریم؟ ☕', 'چه سرگرمی‌هایی داری؟', 'خیلی خوشحالم که مچ شدیم 🎉'];
  let msgCount = 0;
  for (const mt of sample(matches, Math.min(30, matches.length))) {
    const n = randomInt(1, 4);
    for (let k = 0; k < n; k++) {
      const senderId = chance(0.5) ? mt.user1Id : mt.user2Id;
      const receiverId = senderId === mt.user1Id ? mt.user2Id : mt.user1Id;
      await prisma.message.create({
        data: {
          matchId: mt.id,
          senderId,
          receiverId,
          text: randomElement(sampleMessages),
          read: chance(0.5),
          createdAt: new Date(Date.now() - randomInt(0, 72) * 60 * 60 * 1000),
        },
      });
      msgCount++;
    }
  }
  console.log(`  ✉️  ${msgCount} messages.`);

  // ── 8. Gifts ───────────────────────────────────────────────
  const giftRows = [];
  for (let k = 0; k < 40; k++) {
    const [from, to] = sample(ids, 2);
    giftRows.push({ fromUserId: from, toUserId: to, type: randomElement(giftTypes), message: chance(0.4) ? 'برای تو 🌹' : null });
  }
  await prisma.gift.createMany({ data: giftRows });
  console.log(`  🎁 ${giftRows.length} gifts.`);

  // ── 9. Notifications ───────────────────────────────────────
  const notifRows = [];
  const notifTemplates = [
    { type: 'like', title: 'یک نفر تو را پسندید 💗', body: 'برای دیدن اینکه چه کسی، وارد اپ شو.' },
    { type: 'superlike', title: 'یک سوپرلایک گرفتی! ⭐', body: 'یک نفر برایت سوپرلایک فرستاد.' },
    { type: 'match', title: 'یک مچ جدید! 🎉', body: 'یک نفر جدید را پسندیدی و او هم تو را پسندید.' },
    { type: 'gift', title: 'یک هدیه دریافت کردی 🎁', body: 'یک نفر برایت هدیه فرستاد.' },
    { type: 'event', title: 'رویداد نزدیک توست 📅', body: 'یک رویداد جدید در شهرت اضافه شد.' },
  ];
  for (const u of sample(users, 60)) {
    const n = randomInt(1, 4);
    for (let k = 0; k < n; k++) {
      const t = randomElement(notifTemplates);
      notifRows.push({ userId: u.id, type: t.type, title: t.title, body: t.body, read: chance(0.5), createdAt: new Date(Date.now() - randomInt(0, 96) * 60 * 60 * 1000) });
    }
  }
  await prisma.notification.createMany({ data: notifRows });
  console.log(`  🔔 ${notifRows.length} notifications.`);

  // ── 10. Purchases (a few, for premium/store history) ───────
  const purchaseRows = [];
  for (const u of users.filter((u) => u.isPremium).slice(0, 20)) {
    purchaseRows.push({ userId: u.id, item: `premium_${u.premiumTier || 'gold'}`, amount: u.premiumTier === 'platinum' ? 19.99 : 9.99 });
  }
  if (purchaseRows.length) await prisma.purchase.createMany({ data: purchaseRows });
  console.log(`  💳 ${purchaseRows.length} purchases.`);

  console.log('\n🎉 Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
