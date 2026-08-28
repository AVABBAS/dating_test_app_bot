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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 Starting seed: Creating 200 Iranian profiles...\n');

  const profiles = [];

  // Create 100 female profiles
  for (let i = 0; i < 100; i++) {
    const firstName = femaleFirstNames[i];
    const lastName = randomElement(lastNames);
    const username = `user_f_${1000 + i}`;

    profiles.push({
      telegramId: `fake_female_${1000 + i}`,
      username,
      firstName,
      lastName,
      age: randomInt(18, 35),
      gender: 'female',
      lookingFor: randomElement(['male', 'both']),
      bio: randomElement(femaleBios),
      photoUrl: femalePhotos[i % femalePhotos.length],
    });
  }

  // Create 100 male profiles
  for (let i = 0; i < 100; i++) {
    const firstName = maleFirstNames[i];
    const lastName = randomElement(lastNames);
    const username = `user_m_${2000 + i}`;

    profiles.push({
      telegramId: `fake_male_${2000 + i}`,
      username,
      firstName,
      lastName,
      age: randomInt(18, 38),
      gender: 'male',
      lookingFor: randomElement(['female', 'both']),
      bio: randomElement(maleBios),
      photoUrl: malePhotos[i % malePhotos.length],
    });
  }

  // Insert all profiles
  let created = 0;
  for (const profile of profiles) {
    try {
      await prisma.user.create({ data: profile });
      created++;
      if (created % 20 === 0) {
        console.log(`  ✅ Created ${created}/200 profiles...`);
      }
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`  ⏭️  Skipped duplicate: ${profile.firstName} ${profile.lastName}`);
      } else {
        console.error(`  ❌ Error creating ${profile.firstName}:`, err.message);
      }
    }
  }

  console.log(`\n🎉 Done! Created ${created} profiles successfully.`);
  console.log('  👩 100 Female profiles');
  console.log('  👨 100 Male profiles');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
