import Debt from '../models/Debt.js';
import Expense from '../models/Expense.js';
import {
  buildSettlementPlan,
  calculateNetBalances,
} from '../services/settlementService.js';

const getSettlement = async (req, res) => {
  const expenses = await Expense.find({ group: req.group._id }).lean();
  const settledDebts = await Debt.find({
    group: req.group._id,
    status: 'SETTLED',
  }).lean();
  const balances = calculateNetBalances(
    expenses,
    req.group.members,
    settledDebts,
  );
  const transactions = buildSettlementPlan(balances);

  res.status(200).json({ balances, transactions });
};

export { getSettlement };
