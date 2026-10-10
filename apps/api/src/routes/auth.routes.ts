import { Router as createRouter, type Router } from 'express';
import {
    getMe,
    login,
    logout,
    refreshAccessToken,
    register
} from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate.middleware';
import { loginSchema, registerSchema } from '@/validators/auth.validator';
import { protect } from '@/middleware/auth.middleware';
import { authLimiter, refreshLimiter } from '@/middleware/rateLimit.middleware';

const router: Router = createRouter();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshLimiter, refreshAccessToken);

export default router;
