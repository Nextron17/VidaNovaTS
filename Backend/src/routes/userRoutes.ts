import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

//  ZONA COMÚN (Todos los logueados) 
router.use(authenticate);

// 1. RUTAS PERSONALES (Cualquiera puede editar su propio perfil)
router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.put('/me/password', UserController.changePassword);


//  ZONA ADMIN 

// Solo Jefes
const BOSS_ROLES = ['COORDINATOR_NAVIGATOR', 'SUPER_ADMIN'];

// Obtener lista de usuarios
router.get('/', 
    authorize(BOSS_ROLES), 
    UserController.getTeam
);

// Crear nuevo usuario
router.post('/', [
    authorize(BOSS_ROLES),
    body('documentNumber').notEmpty().withMessage('El documento es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Formato inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
], UserController.createUser);

// Eliminar usuario
router.delete('/:id', [
    authorize(BOSS_ROLES),
    param('id').isInt().withMessage('El ID debe ser numérico')
], UserController.deleteUser);

// Editar rol o datos de otro usuario
router.put('/:id', [
    authorize(BOSS_ROLES),
    param('id').isInt().withMessage('El ID debe ser numérico'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido')
], UserController.updateUser);

export default router;