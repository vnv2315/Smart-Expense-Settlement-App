const errorHandler = (error, req, res, next) => {
  const duplicateEmail = error.code === 11000 && error.keyPattern?.email;
  const statusCode = duplicateEmail ? 409 : error.statusCode || 500;
  const message = duplicateEmail ? 'Email is already registered' : error.message;

  res.status(statusCode).json({
    message,
    ...(error.details && { errors: error.details }),
  });
};

export default errorHandler;
