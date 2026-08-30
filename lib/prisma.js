// Shared PrismaClient singleton — avoids exhausting the DB connection pool
// by instantiating a new client per module (a common Prisma pitfall).
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

module.exports = prisma;
