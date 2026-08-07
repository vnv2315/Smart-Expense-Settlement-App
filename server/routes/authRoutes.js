import { Router } from 'express';

import { login, signup } from '../controllers/authController.js';
import {
  handleValidationErrors,
  loginValidation,
  signupValidation,
} from '../middleware/authValidators.js';

const router = Router();

router.post('/signup', signupValidation, handleValidationErrors, signup);
router.post('/login', loginValidation, handleValidationErrors, login);

export default router;

