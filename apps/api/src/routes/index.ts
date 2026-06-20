import { Router as createRouter, type Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';

const router: Router = createRouter();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);

export default router;
