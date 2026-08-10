import { Router } from 'express';

import { login, signup } from '../controllers/authController.js';
import { loginValidation, signupValidation } from '../middleware/authValidators.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.post('/signup', signupValidation, validateRequest, signup);
router.post('/login', loginValidation, validateRequest, login);

export default router;
