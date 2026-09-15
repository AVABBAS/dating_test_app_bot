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

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

module.exports = prisma;
