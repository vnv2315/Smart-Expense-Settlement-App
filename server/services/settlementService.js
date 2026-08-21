const addToBalance = (balances, userId, amountInPaise) => {
  const id = userId.toString();
  const updatedBalance = (balances.get(id) || 0) + amountInPaise;

  if (!Number.isSafeInteger(updatedBalance)) {
    throw new Error('Balance exceeds the supported integer range');
  }

  balances.set(id, updatedBalance);
};

const calculateNetBalances = (
  expenses,
  groupMemberIds = [],
  settledPayments = [],
) => {
  const balances = new Map();

  for (const memberId of groupMemberIds) {
    balances.set(memberId.toString(), 0);
  }

  for (const expense of expenses) {
    addToBalance(balances, expense.paidBy, expense.amountInPaise);

    for (const split of expense.splits) {
      addToBalance(balances, split.user, -split.amountInPaise);
    }
  }

  for (const payment of settledPayments) {
    addToBalance(balances, payment.fromUser, payment.amountInPaise);
    addToBalance(balances, payment.toUser, -payment.amountInPaise);
  }

  return [...balances.entries()].map(([user, balanceInPaise]) => ({
    user,
    balanceInPaise,
  }));
};

const validateBalances = (netBalances) => {
  const total = netBalances.reduce(
    (sum, { balanceInPaise }) => sum + BigInt(balanceInPaise),
    0n,
  );

  if (total !== 0n) {
    throw new Error('Net balances must add up to zero');
  }
};

const getSubsetTotal = (accounts, subsetMask) => {
  let total = 0n;

  for (let index = 0; index < accounts.length; index += 1) {
    const bit = 1n << BigInt(index);

    if ((subsetMask & bit) !== 0n) {
      total += BigInt(accounts[index].balanceInPaise);
    }
  }

  return total;
};

const findFirstIncludedIndex = (accounts, mask) => {
  for (let index = 0; index < accounts.length; index += 1) {
    if ((mask & (1n << BigInt(index))) !== 0n) {
      return index;
    }
  }

  return -1;
};

const findMaximumZeroSumPartition = (accounts, remainingMask, memo) => {
  if (remainingMask === 0n) {
    return [];
  }

  const memoKey = remainingMask.toString();

  if (memo.has(memoKey)) {
    return memo.get(memoKey);
  }

  const firstIndex = findFirstIncludedIndex(accounts, remainingMask);
  const firstBit = 1n << BigInt(firstIndex);
  const otherBits = remainingMask ^ firstBit;
  let candidateBits = otherBits;
  let bestPartition = null;

  while (candidateBits > 0n) {
    const groupMask = candidateBits | firstBit;

    if (getSubsetTotal(accounts, groupMask) === 0n) {
      const remainingPartition = findMaximumZeroSumPartition(
        accounts,
        remainingMask ^ groupMask,
        memo,
      );

      if (remainingPartition) {
        const candidatePartition = [groupMask, ...remainingPartition];

        if (
          !bestPartition ||
          candidatePartition.length > bestPartition.length
        ) {
          bestPartition = candidatePartition;
        }
      }
    }

    candidateBits = (candidateBits - 1n) & otherBits;
  }

  memo.set(memoKey, bestPartition);
  return bestPartition;
};

const getAccountsInGroup = (accounts, groupMask) =>
  accounts.filter((account, index) => {
    const bit = 1n << BigInt(index);
    return (groupMask & bit) !== 0n;
  });

const buildDirectTransactions = (accounts) => {
  const creditors = accounts
    .filter(({ balanceInPaise }) => balanceInPaise > 0)
    .map((account) => ({ ...account }));
  const debtors = accounts
    .filter(({ balanceInPaise }) => balanceInPaise < 0)
    .map(({ user, balanceInPaise }) => ({
      user,
      amountInPaise: -balanceInPaise,
    }));
  const transactions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const creditorAmount = creditor.balanceInPaise;
    const amountInPaise = Math.min(creditorAmount, debtor.amountInPaise);

    transactions.push({
      fromUser: debtor.user,
      toUser: creditor.user,
      amountInPaise,
    });

    creditor.balanceInPaise -= amountInPaise;
    debtor.amountInPaise -= amountInPaise;

    if (creditor.balanceInPaise === 0) {
      creditorIndex += 1;
    }

    if (debtor.amountInPaise === 0) {
      debtorIndex += 1;
    }
  }

  return transactions;
};

const buildMinimumSettlementPlan = (netBalances) => {
  validateBalances(netBalances);

  const accounts = netBalances
    .filter(({ balanceInPaise }) => balanceInPaise !== 0)
    .map(({ user, balanceInPaise }) => ({
      user: user.toString(),
      balanceInPaise,
    }))
    .sort((first, second) => first.user.localeCompare(second.user));

  if (accounts.length === 0) {
    return [];
  }

  const allAccountsMask = (1n << BigInt(accounts.length)) - 1n;
  // Maximizing independent zero-sum groups minimizes transfers. Once no
  // group can split further, a group of k accounts needs k - 1 payments.
  const partition = findMaximumZeroSumPartition(
    accounts,
    allAccountsMask,
    new Map(),
  );

  return partition.flatMap((groupMask) =>
    buildDirectTransactions(getAccountsInGroup(accounts, groupMask)),
  );
};

export { buildMinimumSettlementPlan, calculateNetBalances };
