import { Router as createRouter, type Router } from 'express';
import authRoutes from './auth.routes';

const router: Router = createRouter();

router.use('/auth', authRoutes);

export default router;
