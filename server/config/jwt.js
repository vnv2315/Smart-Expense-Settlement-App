import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return secret;
};

const createToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const validateJwtConfig = () => {
  getJwtSecret();
};

export { createToken, validateJwtConfig, verifyToken };

