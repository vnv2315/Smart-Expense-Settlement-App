import { body, validationResult } from 'express-validator';

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.details = result.array().map(({ path, msg }) => ({
    field: path,
    message: msg,
  }));

  return next(error);
};

export { handleValidationErrors, loginValidation, signupValidation };

