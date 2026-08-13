import { body, param } from 'express-validator';

const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
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
