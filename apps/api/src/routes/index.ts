import { Router as createRouter, type Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import postRoutes from './post.routes';
import aiOutputRoutes from './aiOutput.routes';
import chatRoutes from './chat.routes';

const router: Router = createRouter();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/campaigns', postRoutes);
router.use('/campaigns', aiOutputRoutes);
router.use('/chat', chatRoutes);

export default router;
