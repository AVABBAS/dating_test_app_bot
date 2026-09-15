const prisma = require("./prisma");

const CURRENCY_TO_FIELD = {
  superlike: "superLikesLeft",
  boost: "boostsLeft",
  rose: "rosesLeft",
  star: "stars",
};

/**
 * Atomically mutates a user balance and records a ledger entry.
 * Guarantees balance never drops below zero (FIN-WALLET-01, FIN-LEDGER-01).
 *
 * @param {any} tx - Prisma transaction client
 * @param {object} params
 * @param {number} params.userId
 * @param {'superlike' | 'boost' | 'rose' | 'star'} params.currency
 * @param {number} params.amount - Positive to add, negative to deduct
 * @param {string} params.reason - e.g. 'purchase', 'swipe_superlike', 'profile_boost', 'send_rose'
 * @param {string} [params.referenceId]
 * @returns {Promise<{ ok: boolean, balanceAfter: number, ledgerId: number }>}
 */
async function mutateBalance(tx, { userId, currency, amount, reason, referenceId = null }) {
  const field = CURRENCY_TO_FIELD[currency];
  if (!field) {
    throw new Error(`Invalid currency: ${currency}`);
  }

  // If deducting (amount < 0), use atomic SQL guard to prevent race conditions and negative balance
  if (amount < 0) {
    const required = Math.abs(amount);
    const updatedUsers = await tx.$queryRawUnsafe(
      `UPDATE "User"
       SET "${field}" = "${field}" + $1
       WHERE id = $2 AND "${field}" >= $3
       RETURNING "${field}" as "newBalance"`,
      amount,
      userId,
      required
    );

    if (!updatedUsers || updatedUsers.length === 0) {
      const err = new Error(`Insufficient ${currency} balance`);
      err.code = "INSUFFICIENT_FUNDS";
      err.status = 402;
      throw err;
    }

    const balanceAfter = updatedUsers[0].newBalance;

    const ledger = await tx.ledgerEntry.create({
      data: {
        userId,
        currency,
        amount,
        balanceAfter,
        reason,
        referenceId: referenceId ? String(referenceId) : null,
      },
    });

    return { ok: true, balanceAfter, ledgerId: ledger.id };
  } else {
    // Credit / grant
    const updatedUsers = await tx.$queryRawUnsafe(
      `UPDATE "User"
       SET "${field}" = "${field}" + $1
       WHERE id = $2
       RETURNING "${field}" as "newBalance"`,
      amount,
      userId
    );

    if (!updatedUsers || updatedUsers.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const balanceAfter = updatedUsers[0].newBalance;

    const ledger = await tx.ledgerEntry.create({
      data: {
        userId,
        currency,
        amount,
        balanceAfter,
        reason,
        referenceId: referenceId ? String(referenceId) : null,
      },
    });

    return { ok: true, balanceAfter, ledgerId: ledger.id };
  }
}

module.exports = { mutateBalance, CURRENCY_TO_FIELD };