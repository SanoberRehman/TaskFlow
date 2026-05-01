import { Router } from 'express';
import { signupSchema, loginSchema, refreshTokenSchema, updateProfileSchema, changePasswordSchema } from '@taskflow/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), authController.signup);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, validate({ body: updateProfileSchema }), authController.updateProfile);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);

export default router;
