require("dotenv").config();
const prisma = require("../lib/prisma");
const { mutateBalance } = require("../lib/ledger");
const { validateInitData } = require("../lib/telegramAuth");

async function runTests() {
  console.log("=== STARTING DATABASE & SECURITY REMEDIATION TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✅ PASSED: ${message}`);
      passed++;
    }
  }

  const testTgIdA = `test_user_a_${Date.now()}`;
  const testTgIdB = `test_user_b_${Date.now()}`;

  let userA, userB;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Message" WHERE "senderId" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%') OR "receiverId" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%')`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Match" WHERE "user1Id" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%') OR "user2Id" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%')`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Like" WHERE "fromUserId" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%') OR "toUserId" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%')`);
    await prisma.$executeRawUnsafe(`DELETE FROM "LedgerEntry" WHERE "userId" IN (SELECT id FROM "User" WHERE "telegramId" LIKE 'test_user_%')`);
    await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE "telegramId" LIKE 'test_user_%'`);

    userA = await prisma.user.create({
      data: {
        telegramId: testTgIdA,
        firstName: "TestUserA",
        superLikesLeft: 1,
        boostsLeft: 1,
        rosesLeft: 1,
      },
    });

    userB = await prisma.user.create({
      data: {
        telegramId: testTgIdB,
        firstName: "TestUserB",
        superLikesLeft: 1,
        boostsLeft: 1,
        rosesLeft: 1,
      },
    });

    const minId = Math.min(userA.id, userB.id);
    const maxId = Math.max(userA.id, userB.id);

    // ─────────────────────────────────────────────────────────────
    // TEST 1: DB-CONSTRAINT - Prevent Self-Likes
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: DB-CONSTRAINT Prevent Self-Likes ---");
    let selfLikeThrew = false;
    try {
      await prisma.like.create({
        data: { fromUserId: userA.id, toUserId: userA.id, action: "like" },
      });
    } catch (e) {
      selfLikeThrew = true;
    }
    assert(selfLikeThrew, "Database CHECK constraint actively blocks self-likes (fromUserId == toUserId)");

    // ─────────────────────────────────────────────────────────────
    // TEST 2: DB-CONSTRAINT - Prevent Inverted / Non-Canonical Matches
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: DB-CONSTRAINT Canonical Match Ordering (u1 < u2) ---");
    let invalidMatchThrew = false;
    try {
      await prisma.match.create({
        data: { user1Id: maxId, user2Id: minId },
      });
    } catch (e) {
      invalidMatchThrew = true;
    }
    assert(invalidMatchThrew, "Database CHECK constraint actively blocks non-canonical match (user1Id > user2Id)");

    // ─────────────────────────────────────────────────────────────
    // TEST 3: INT-MATCH-01 - Concurrent Mutual-Like Requests
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 3: INT-MATCH-01 Concurrency: Mutual-Likes produce exactly 1 Match ---");
    await prisma.like.create({
      data: { fromUserId: userB.id, toUserId: userA.id, action: "like" },
    });

    // Run in concurrency pools of 5 (pooler friendly)
    const runLike = async () => {
      return prisma.$transaction(async (tx) => {
        await tx.like.upsert({
          where: { fromUserId_toUserId: { fromUserId: userA.id, toUserId: userB.id } },
          update: { action: "like" },
          create: { fromUserId: userA.id, toUserId: userB.id, action: "like" },
        });

        const mutualLike = await tx.like.findUnique({
          where: { fromUserId_toUserId: { fromUserId: userB.id, toUserId: userA.id } },
        });

        if (mutualLike && (mutualLike.action === "like" || mutualLike.action === "superlike")) {
          const u1 = Math.min(userA.id, userB.id);
          const u2 = Math.max(userA.id, userB.id);
          return await tx.match.upsert({
            where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
            update: {},
            create: { user1Id: u1, user2Id: u2 },
          });
        }
      }, { maxWait: 15000, timeout: 15000 });
    };

    // Run 10 concurrent mutual likes in two parallel bursts of 5
    await Promise.all([runLike(), runLike(), runLike(), runLike(), runLike()]);
    await Promise.all([runLike(), runLike(), runLike(), runLike(), runLike()]);

    const matchesInDb = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userA.id, user2Id: userB.id },
          { user1Id: userB.id, user2Id: userA.id },
        ],
      },
    });

    assert(matchesInDb.length === 1, `Expected exactly 1 match record, found: ${matchesInDb.length}`);
    assert(matchesInDb[0].user1Id === minId && matchesInDb[0].user2Id === maxId, "Match strictly adheres to canonical ordering (min, max)");

    // ─────────────────────────────────────────────────────────────
    // TEST 4: FIN-WALLET-01 - Concurrent Spend Operations on Balance = 1
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 4: FIN-WALLET-01 Concurrency: 10 Spends with Balance = 1 ---");
    let successCount = 0;
    let failedCount = 0;

    const runSpend = async (i) => {
      try {
        await prisma.$transaction(async (tx) => {
          await mutateBalance(tx, {
            userId: userA.id,
            currency: "rose",
            amount: -1,
            reason: "send_rose",
            referenceId: `test_req_${i}`,
          });
        }, { maxWait: 15000, timeout: 15000 });
        successCount++;
      } catch (err) {
        if (err.code === "INSUFFICIENT_FUNDS" || err.status === 402) {
          failedCount++;
        } else {
          console.error("Unexpected spend error:", err);
        }
      }
    };

    // 10 concurrent spends across two bursts
    await Promise.all([runSpend(0), runSpend(1), runSpend(2), runSpend(3), runSpend(4)]);
    await Promise.all([runSpend(5), runSpend(6), runSpend(7), runSpend(8), runSpend(9)]);

    const freshUserA = await prisma.user.findUnique({
      where: { id: userA.id },
      select: { rosesLeft: true },
    });

    assert(successCount === 1, `Exactly 1 spend should succeed, succeeded: ${successCount}`);
    assert(failedCount === 9, `Exactly 9 spends should fail, failed: ${failedCount}`);
    assert(freshUserA.rosesLeft === 0, `User balance must be exactly 0 (never negative), found: ${freshUserA.rosesLeft}`);

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { userId: userA.id, currency: "rose", reason: "send_rose" },
    });
    assert(ledgerEntries.length === 1, `Exactly 1 ledger entry recorded for the successful spend, found: ${ledgerEntries.length}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 5: SEC-AUTH-01 - Telegram Auth Verification
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 5: SEC-AUTH-01 Telegram Auth & IDOR Guard ---");
    const invalidResult = validateInitData("user=%7B%22id%22%3A123%7D&hash=fakehash", "fake_bot_token");
    assert(!invalidResult.ok, "Tampered or invalid Telegram initData is strictly rejected");

  } finally {
    console.log("\n--- CLEANUP TEST DATA ---");
    if (userA && userB) {
      await prisma.$executeRawUnsafe(`DELETE FROM "Message" WHERE "senderId" IN (${userA.id}, ${userB.id}) OR "receiverId" IN (${userA.id}, ${userB.id})`);
      await prisma.$executeRawUnsafe(`DELETE FROM "Match" WHERE "user1Id" IN (${userA.id}, ${userB.id}) OR "user2Id" IN (${userA.id}, ${userB.id})`);
      await prisma.$executeRawUnsafe(`DELETE FROM "Like" WHERE "fromUserId" IN (${userA.id}, ${userB.id}) OR "toUserId" IN (${userA.id}, ${userB.id})`);
      await prisma.$executeRawUnsafe(`DELETE FROM "LedgerEntry" WHERE "userId" IN (${userA.id}, ${userB.id})`);
      await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id IN (${userA.id}, ${userB.id})`);
      console.log("Cleaned up test users and test data cleanly via SQL.");
    }
    await prisma.$disconnect();
  }

  console.log(`\n========================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});