import Expense from '../models/Expense.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const calculateEqualSplits = (amountInPaise, memberIds) => {
  const baseShare = Math.floor(amountInPaise / memberIds.length);
  const remainder = amountInPaise % memberIds.length;

  return memberIds.map((memberId, index) => ({
    user: memberId,
    amountInPaise: baseShare + (index < remainder ? 1 : 0),
  }));
};

const addExpense = async (req, res) => {
  const { group } = req;
  const { amountInPaise, description, paidBy } = req.body;

  const payerIsMember = group.members.some((memberId) =>
    memberId.equals(paidBy),
  );

  if (!payerIsMember) {
    throw createHttpError(400, 'Payer must be a group member');
  }

  const splits = calculateEqualSplits(amountInPaise, group.members);
  const expense = await Expense.create({
    description,
    amountInPaise,
    group: group._id,
    paidBy,
    splits,
  });

  res.status(201).json({ expense });
};

export { addExpense, calculateEqualSplits };
