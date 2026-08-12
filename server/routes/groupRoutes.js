import { Router } from 'express';

import {
  addMember,
  createGroup,
  listGroups,
  removeMember,
} from '../controllers/groupController.js';
import { addExpense } from '../controllers/expenseController.js';
import { createDebt, settleDebt } from '../controllers/debtController.js';
import { getSettlement } from '../controllers/settlementController.js';
import authenticate from '../middleware/authenticate.js';
import {
  createDebtValidation,
  debtIdValidation,
} from '../middleware/debtValidators.js';
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

router.get(
  '/:groupId/settlement',
  groupIdValidation,
  validateRequest,
  requireGroupMember,
  getSettlement,
);

router.post(
  '/:groupId/debts',
  groupIdValidation,
  createDebtValidation,
  validateRequest,
  requireGroupMember,
  createDebt,
);

router.patch(
  '/:groupId/debts/:debtId/settle',
  groupIdValidation,
  debtIdValidation,
  validateRequest,
  requireGroupMember,
  settleDebt,
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
