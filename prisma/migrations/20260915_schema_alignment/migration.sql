-- Keep PostgreSQL in sync with prisma/schema.prisma for array fields and indexes.
-- Safe to run against already-remediated production databases.

UPDATE "User"
SET "interests" = ARRAY[]::text[]
WHERE "interests" IS NULL;

UPDATE "User"
SET "photos" = ARRAY[]::text[]
WHERE "photos" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "interests" SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN "interests" SET NOT NULL,
  ALTER COLUMN "photos" SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN "photos" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "LedgerEntry_referenceId_idx"
  ON "LedgerEntry" ("referenceId");

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification" ("userId", "createdAt");
