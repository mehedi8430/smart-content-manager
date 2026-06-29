import { Router as createRouter, type Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import postRoutes from './post.routes';

const router: Router = createRouter();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/campaigns', postRoutes);

export default router;
