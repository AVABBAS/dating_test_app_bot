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

// Prisma 6 no longer exposes the legacy `$use` middleware API on PrismaClient.
// Keep the client initialization deliberately simple and compatible with the
// generated Prisma client used in production. The application already limits
// online-status writes at its call sites, so no client-level middleware is
// required here.

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

module.exports = prisma;
