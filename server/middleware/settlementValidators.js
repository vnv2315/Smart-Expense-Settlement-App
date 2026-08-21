import { param } from 'express-validator';

const settlementIdValidation = [
  param('settlementId').isMongoId().withMessage('Invalid settlement ID'),
];

export { settlementIdValidation };
