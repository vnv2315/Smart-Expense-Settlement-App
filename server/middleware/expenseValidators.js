import { body } from 'express-validator';

const addExpenseValidation = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Expense description is required'),
  body('amountInPaise')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('Amount must be a positive integer number of paise')
    .toInt(),
  body('paidBy').isMongoId().withMessage('Invalid payer ID'),
];

export { addExpenseValidation };
