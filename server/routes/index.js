import { Router } from 'express';

import authRoutes from './authRoutes.js';
import groupRoutes from './groupRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);

export default router;
