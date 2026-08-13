import Debt from '../models/Debt.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const populateMembers = (group) => group.populate('members', 'name email');

const createGroup = async (req, res) => {
  const group = await Group.create({
    name: req.body.name,
    members: [req.user._id],
  });

  await populateMembers(group);
  res.status(201).json({ group });
};

const listGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).populate(
    'members',
    'name email',
  );

  res.status(200).json({ groups });
};

const addMember = async (req, res) => {
  const { group } = req;
  const member = await User.findById(req.body.userId);

  if (!member) {
    throw createHttpError(404, 'User not found');
  }

  const isAlreadyMember = group.members.some((memberId) =>
    memberId.equals(member._id),
  );

  if (isAlreadyMember) {
    throw createHttpError(409, 'User is already a group member');
  }

  group.members.push(member._id);
  await group.save();
  await populateMembers(group);

  res.status(200).json({ group });
};

const removeMember = async (req, res) => {
  const { group } = req;
  const memberExists = group.members.some((memberId) =>
    memberId.equals(req.params.userId),
  );

  if (!memberExists) {
    throw createHttpError(404, 'User is not a group member');
  }

  const hasUnsettledDebt = await Debt.exists({
    group: group._id,
    status: 'PENDING',
    $or: [{ from: req.params.userId }, { to: req.params.userId }],
  });

  if (hasUnsettledDebt) {
    throw createHttpError(409, 'Member has unsettled debts');
  }

  group.members = group.members.filter(
    (memberId) => !memberId.equals(req.params.userId),
  );
  await group.save();
  await populateMembers(group);

  res.status(200).json({ group });
};

export { addMember, createGroup, listGroups, removeMember };
