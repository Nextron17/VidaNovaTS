import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { body } from 'express-validator';

const router = Router();

router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], AuthController.login);

router.post('/forgot-password', [
    body('email').isEmail().withMessage('Ingresa un email válido')
], AuthController.forgotPassword);

export default router;