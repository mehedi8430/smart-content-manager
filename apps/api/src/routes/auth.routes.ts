import { Router as createRouter, type Router } from 'express';
import {
    getMe,
    login,
    logout,
    refreshAccessToken,
    register
} from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate.middleware';
import { loginSchema, registerSchema } from '@/validators/authValidators';
import { protect } from '@/middleware/auth.middleware';

const router: Router = createRouter();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshAccessToken);

export default router;
