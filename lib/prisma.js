require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

let url = process.env.DATABASE_URL;
if (url && url.includes("-pooler") && !url.includes("pgbouncer=true")) {
  url += (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
  });

// lastSeen is touched by several read paths. Avoid turning every page refresh
// or polling request into a database write. A short in-process throttle is
// sufficient because online status is computed with a much larger time window.
const LAST_SEEN_THROTTLE_MS = 30 * 1000;
const lastSeenWrites = globalForPrisma.__lastSeenWrites || new Map();
if (process.env.NODE_ENV !== "production") globalForPrisma.__lastSeenWrites = lastSeenWrites;

if (!prisma.__lastSeenThrottleInstalled) {
  prisma.$use(async (params, next) => {
    if (params.model === "User" && params.action === "update" && params.args?.data) {
      const dataKeys = Object.keys(params.args.data);
      const isLastSeenOnly =
        dataKeys.length > 0 &&
        dataKeys.every((key) => key === "lastSeen" || key === "isOnline") &&
        Object.prototype.hasOwnProperty.call(params.args.data, "lastSeen");

      if (isLastSeenOnly && params.args.where?.id != null) {
        const userId = String(params.args.where.id);
        const now = Date.now();
        const previous = lastSeenWrites.get(userId) || 0;

        if (now - previous < LAST_SEEN_THROTTLE_MS) {
          // Return the current row without issuing another UPDATE.
          return prisma.user.findUnique({ where: params.args.where });
        }

        lastSeenWrites.set(userId, now);

        // Prevent unbounded growth in long-lived processes.
        if (lastSeenWrites.size > 10000) {
          for (const [id, timestamp] of lastSeenWrites) {
            if (now - timestamp >= LAST_SEEN_THROTTLE_MS) lastSeenWrites.delete(id);
          }
        }
      }
    }

    return next(params);
  });
  prisma.__lastSeenThrottleInstalled = true;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

module.exports = prisma;
