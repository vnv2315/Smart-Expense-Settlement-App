import bcrypt from 'bcrypt';

import { createToken } from '../config/jwt.js';
import User from '../models/User.js';

const SALT_ROUNDS = 10;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildAuthResponse = (user) => ({
  token: createToken(user._id),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
  },
});

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw createHttpError(409, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json(buildAuthResponse(user));
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createHttpError(401, 'Invalid email or password');
  }

  res.status(200).json(buildAuthResponse(user));
};

export { login, signup };

