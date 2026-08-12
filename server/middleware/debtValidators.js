import { body, param } from 'express-validator';

const createDebtValidation = [
  body('from').isMongoId().withMessage('Invalid debtor ID'),
  body('to').isMongoId().withMessage('Invalid creditor ID'),
  body('amountInPaise')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Amount must be a positive integer number of paise')
    .toInt(),
];

const debtIdValidation = [
  param('debtId').isMongoId().withMessage('Invalid debt ID'),
];

export { createDebtValidation, debtIdValidation };
