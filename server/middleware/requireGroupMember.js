import Group from '../models/Group.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requireGroupMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      throw createHttpError(404, 'Group not found');
    }

    const requesterIsMember = group.members.some((memberId) =>
      memberId.equals(req.user._id),
    );

    if (!requesterIsMember) {
      throw createHttpError(403, 'You are not a member of this group');
    }

    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireGroupMember;

