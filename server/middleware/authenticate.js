import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';

const createUnauthorizedError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const readBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    throw createUnauthorizedError('Authentication required');
  }

  const [scheme, token, extraPart] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token || extraPart) {
    throw createUnauthorizedError('Authentication required');
  }

  return token;
};

const authenticate = async (req, res, next) => {
  try {
    const token = readBearerToken(req.get('authorization'));

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      throw createUnauthorizedError('Invalid or expired token');
    }

    if (!payload.userId) {
      throw createUnauthorizedError('Invalid or expired token');
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      throw createUnauthorizedError('User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
