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
  settledDebts = [],
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

  for (const debt of settledDebts) {
    addToBalance(balances, debt.from, debt.amountInPaise);
    addToBalance(balances, debt.to, -debt.amountInPaise);
  }

  return [...balances.entries()]
    .map(([user, balanceInPaise]) => ({ user, balanceInPaise }));
};

const sortByAmountDescending = (first, second) =>
  second.amountInPaise - first.amountInPaise ||
  first.user.localeCompare(second.user);

const buildSettlementPlan = (netBalances) => {
  const totalBalance = netBalances.reduce(
    (total, { balanceInPaise }) => total + BigInt(balanceInPaise),
    0n,
  );

  if (totalBalance !== 0n) {
    throw new Error('Net balances must add up to zero');
  }

  const creditors = netBalances
    .filter(({ balanceInPaise }) => balanceInPaise > 0)
    .map(({ user, balanceInPaise }) => ({
      user: user.toString(),
      amountInPaise: balanceInPaise,
    }));
  const debtors = netBalances
    .filter(({ balanceInPaise }) => balanceInPaise < 0)
    .map(({ user, balanceInPaise }) => ({
      user: user.toString(),
      amountInPaise: -balanceInPaise,
    }));
  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(sortByAmountDescending);
    debtors.sort(sortByAmountDescending);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const amountInPaise = Math.min(
      creditor.amountInPaise,
      debtor.amountInPaise,
    );

    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amountInPaise,
    });

    creditor.amountInPaise -= amountInPaise;
    debtor.amountInPaise -= amountInPaise;

    if (creditor.amountInPaise === 0) {
      creditors.shift();
    }

    if (debtor.amountInPaise === 0) {
      debtors.shift();
    }
  }

  return transactions;
};

export { buildSettlementPlan, calculateNetBalances };
