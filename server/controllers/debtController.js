import Debt from '../models/Debt.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isGroupMember = (group, userId) =>
  group.members.some((memberId) => memberId.equals(userId));

const createDebt = async (req, res) => {
  const { amountInPaise, from, to } = req.body;

  if (from === to) {
    throw createHttpError(400, 'Debt participants must be different users');
  }

  if (!isGroupMember(req.group, from) || !isGroupMember(req.group, to)) {
    throw createHttpError(400, 'Debt participants must be group members');
  }

  const debt = await Debt.create({
    group: req.group._id,
    from,
    to,
    amountInPaise,
  });

  res.status(201).json({ debt });
};

const settleDebt = async (req, res) => {
  const debtId = req.params.debtId;
  const debt = await Debt.findOneAndUpdate(
    {
      _id: debtId,
      group: req.group._id,
      status: 'PENDING',
      $or: [{ from: req.user._id }, { to: req.user._id }],
    },
    {
      $set: {
        status: 'SETTLED',
        settledAt: new Date(),
        settledBy: req.user._id,
      },
    },
    { new: true, runValidators: true },
  );

  if (debt) {
    return res.status(200).json({ debt });
  }

  const existingDebt = await Debt.findOne({
    _id: debtId,
    group: req.group._id,
  });

  if (!existingDebt) {
    throw createHttpError(404, 'Debt not found');
  }

  if (
    !existingDebt.from.equals(req.user._id) &&
    !existingDebt.to.equals(req.user._id)
  ) {
    throw createHttpError(403, 'Only debt participants can settle this debt');
  }

  throw createHttpError(409, 'Debt is already settled');
};

export { createDebt, settleDebt };
