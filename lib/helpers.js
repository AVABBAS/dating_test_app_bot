// Shared, pure backend helpers.

// Map the "lookingFor" preference (men/women/everyone or male/female/both)
// to the actual `gender` value stored on candidate profiles.
function lookingForToGender(lookingFor) {
  if (!lookingFor) return null;
  const v = lookingFor.toLowerCase();
  if (v === "men" || v === "male") return "male";
  if (v === "women" || v === "female") return "female";
  return null; // 'everyone' / 'both' => no gender filter
}

// ── Online status is derived from lastSeen, never a stale boolean ──
const ONLINE_MS = 5 * 60 * 1000; // "online" = active within 5 minutes
function isRecentlyOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_MS;
}

// Override the (possibly stale) isOnline column with a freshly computed value.
function withComputedOnline(user) {
  if (!user) return user;
  return { ...user, isOnline: isRecentlyOnline(user.lastSeen) };
}

// ── Premium / boost validity are checked against their expiry, so they
//    survive server restarts (unlike an in-memory timer). ──
function isPremiumActive(user) {
  if (!user) return false;
  if (!user.isPremium) return false;
  if (!user.premiumUntil) return true;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

function isBoostActive(user) {
  if (!user) return false;
  if (!user.isBoosted) return false;
  if (!user.boostExpiry) return false;
  return new Date(user.boostExpiry).getTime() > Date.now();
}

// Great-circle distance in km between two lat/lng points.
function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Fields safe to expose for other users' public profiles.
const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  age: true,
  gender: true,
  photoUrl: true,
  photos: true,
  bio: true,
  interests: true,
  city: true,
  isOnline: true,
  isBoosted: true,
  isVerified: true,
  isPremium: true,
  lastSeen: true,
  createdAt: true,
};

module.exports = {
  lookingForToGender,
  ONLINE_MS,
  isRecentlyOnline,
  withComputedOnline,
  isPremiumActive,
  isBoostActive,
  haversineKm,
  publicUserSelect,
};
