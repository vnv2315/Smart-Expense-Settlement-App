import { body, param } from 'express-validator';

const createGroupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
];

const groupIdValidation = [
  param('groupId').isMongoId().withMessage('Invalid group ID'),
];

const addMemberValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
];

const removeMemberValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
];

export {
  addMemberValidation,
  createGroupValidation,
  groupIdValidation,
  removeMemberValidation,
};

