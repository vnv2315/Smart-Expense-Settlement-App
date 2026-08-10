import { Router } from 'express';

import {
  addMember,
  createGroup,
  listGroups,
  removeMember,
} from '../controllers/groupController.js';
import { addExpense } from '../controllers/expenseController.js';
import authenticate from '../middleware/authenticate.js';
import { addExpenseValidation } from '../middleware/expenseValidators.js';
import {
  addMemberValidation,
  createGroupValidation,
  groupIdValidation,
  removeMemberValidation,
} from '../middleware/groupValidators.js';
import requireGroupMember from '../middleware/requireGroupMember.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(createGroupValidation, validateRequest, createGroup)
  .get(listGroups);

router.post(
  '/:groupId/members',
  groupIdValidation,
  addMemberValidation,
  validateRequest,
  requireGroupMember,
  addMember,
);

router.post(
  '/:groupId/expenses',
  groupIdValidation,
  addExpenseValidation,
  validateRequest,
  requireGroupMember,
  addExpense,
);

router.delete(
  '/:groupId/members/:userId',
  groupIdValidation,
  removeMemberValidation,
  validateRequest,
  requireGroupMember,
  removeMember,
);

export default router;
