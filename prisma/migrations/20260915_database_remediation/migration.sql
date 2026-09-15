-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_currency_idx" ON "LedgerEntry"("userId", "currency");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "User_isBoosted_createdAt_idx" ON "User"("isBoosted", "createdAt");

-- CreateIndex
CREATE INDEX "User_incognito_age_gender_idx" ON "User"("incognito", "age", "gender");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business Integrity: Prevent Self-Likes
ALTER TABLE "Like" ADD CONSTRAINT "Like_prevent_self_like" CHECK ("fromUserId" <> "toUserId");

-- Business Integrity: Enforce Canonical Match Ordering (u1 < u2)
ALTER TABLE "Match" ADD CONSTRAINT "Match_canonical_ordering" CHECK ("user1Id" < "user2Id");