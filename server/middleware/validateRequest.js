import { validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
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

export default validateRequest;

