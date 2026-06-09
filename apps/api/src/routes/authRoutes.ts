import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, register, } from '@/controllers/authController';
// import { protect } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

const registerValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);

// router.get('/profile', protect, getProfile);

export default router;
