import { Router as createRouter, type Router } from 'express';
import { login, logout, register } from '@/controllers/authController';
import { validate } from '@/middleware/validateRequest';
import { loginSchema, registerSchema } from '@/validators/authValidators';
import { protect } from '@/middleware/auth';

const router: Router = createRouter();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', protect, logout);

export default router;
