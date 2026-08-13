import { body } from 'express-validator';

const addExpenseValidation = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Expense description must be between 1 and 200 characters'),
  body('amountInPaise')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Amount must be a positive integer number of paise')
    .toInt(),
  body('paidBy').isMongoId().withMessage('Invalid payer ID'),
];

export { addExpenseValidation };
