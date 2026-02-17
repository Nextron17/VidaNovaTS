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

export default router;