import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { body } from 'express-validator';

const router = Router();

// ✅ Login por Cédula (Documento)
router.post('/login', [
    body('documentNumber').notEmpty().withMessage('El número de documento es obligatorio'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], AuthController.login);

// Recuperación por Email (Estándar)
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Ingresa un email válido')
], AuthController.forgotPassword);

export default router;