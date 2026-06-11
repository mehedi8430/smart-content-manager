import { Router as createRouter, type Router } from 'express';
import { login, logout, register } from '@/controllers/authController';
// import { protect } from '@/middleware/auth';
import { validate } from '@/middleware/validateRequest';
import { loginSchema, registerSchema } from '@/validators/authValidators';

const router: Router = createRouter();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', logout);

// router.get('/profile', protect, getProfile);

export default router;
