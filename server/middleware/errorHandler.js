const errorHandler = (error, req, res, next) => {
  const duplicateKeyError = error.code === 11000;
  const malformedJson = error instanceof SyntaxError && 'body' in error;
  const invalidObjectId = error.name === 'CastError';
  let statusCode = error.statusCode || 500;
  let message = error.message;

  if (duplicateKeyError) {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (malformedJson) {
    statusCode = 400;
    message = 'Malformed JSON request body';
  } else if (invalidObjectId) {
    statusCode = 400;
    message = 'Invalid resource ID';
  } else if (statusCode >= 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    message,
    ...(error.details && { errors: error.details }),
  });
};

export default errorHandler;
