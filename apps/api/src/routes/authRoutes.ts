import { Router as createRouter, type Router } from 'express';
import { login, logout, register } from '@/controllers/authController';
// import { protect } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validateRequest';
import {
  loginValidation,
  registerValidation,
} from '@/validators/authValidators';

const router: Router = createRouter();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', logout);

// router.get('/profile', protect, getProfile);

export default router;
