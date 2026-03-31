import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { body } from 'express-validator';

const router = Router();

router.post('/login', [
    body('documentNumber').notEmpty().withMessage('El número de documento es obligatorio'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], AuthController.login);

router.post('/forgot-password', [
    body('documentNumber').notEmpty().withMessage('El documento es obligatorio')
], AuthController.forgotPassword);

router.post('/reset-password', [
    body('token').notEmpty().withMessage('El token es obligatorio'),
    body('newPassword').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
], AuthController.resetPassword);

export default router;