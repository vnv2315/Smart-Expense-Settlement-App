import Settlement from '../models/Settlement.js';
import { getSettlementState } from '../services/settlementPlanService.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getSettlement = async (req, res) => {
  const settlementState = await getSettlementState(req.group);
  res.status(200).json(settlementState);
};

const settleTransaction = async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    {
      _id: req.params.settlementId,
      group: req.group._id,
      status: 'PENDING',
      $or: [
        { fromUser: req.user._id },
        { toUser: req.user._id },
      ],
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

  if (settlement) {
    return res.status(200).json({ settlement });
  }

  const existingSettlement = await Settlement.findOne({
    _id: req.params.settlementId,
    group: req.group._id,
  });

  if (!existingSettlement) {
    throw createHttpError(404, 'Settlement not found');
  }

  const requesterIsParticipant =
    existingSettlement.fromUser.equals(req.user._id) ||
    existingSettlement.toUser.equals(req.user._id);

  if (!requesterIsParticipant) {
    throw createHttpError(
      403,
      'Only settlement participants can mark it settled',
    );
  }

  throw createHttpError(409, 'Settlement is already settled');
};

export { getSettlement, settleTransaction };
