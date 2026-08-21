import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import {
  buildMinimumSettlementPlan,
  calculateNetBalances,
} from './settlementService.js';

const calculateGroupBalances = async (group) => {
  const [expenses, settledPayments] = await Promise.all([
    Expense.find({ group: group._id }).lean(),
    Settlement.find({ group: group._id, status: 'SETTLED' }).lean(),
  ]);

  return calculateNetBalances(expenses, group.members, settledPayments);
};

const findPendingSettlements = (groupId) =>
  Settlement.find({ group: groupId, status: 'PENDING' }).sort({ createdAt: 1 });

const clearPendingSettlements = (groupId) =>
  Settlement.deleteMany({ group: groupId, status: 'PENDING' });

const persistPlan = async (groupId, plan) => {
  if (plan.length === 0) {
    return [];
  }

  const settlements = plan.map((transaction) => ({
    ...transaction,
    group: groupId,
  }));

  try {
    return await Settlement.insertMany(settlements);
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    return findPendingSettlements(groupId);
  }
};

const getSettlementState = async (group) => {
  const balances = await calculateGroupBalances(group);
  let settlements = await findPendingSettlements(group._id);

  if (settlements.length === 0) {
    const plan = buildMinimumSettlementPlan(balances);
    settlements = await persistPlan(group._id, plan);
  }

  return { balances, settlements };
};

export {
  calculateGroupBalances,
  clearPendingSettlements,
  getSettlementState,
};
