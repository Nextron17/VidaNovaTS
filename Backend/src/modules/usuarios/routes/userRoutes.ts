import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { body, param } from 'express-validator';
// ✅ AQUÍ CAMBIAMOS LOS NOMBRES A LOS NUEVOS
import { authenticateJWT, requireRoles } from '../../../core/middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

// 1. RUTAS PERSONALES 
router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.put('/me/password', UserController.changePassword);



// Solo Jefes
const BOSS_ROLES = ['COORDINATOR_NAVIGATOR', 'SUPER_ADMIN'];

// Obtener lista de usuarios
router.get('/', 
    requireRoles(BOSS_ROLES), 
    UserController.getTeam
);

// Crear nuevo usuario
router.post('/', [
    requireRoles(BOSS_ROLES), // ✅ Usamos el nuevo nombre
    body('documentNumber').notEmpty().withMessage('El documento es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Formato inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
], UserController.createUser);

// Eliminar usuario
router.delete('/:id', [
    requireRoles(BOSS_ROLES), 
    param('id').isInt().withMessage('El ID debe ser numérico')
], UserController.deleteUser);

// Editar rol o datos de otro usuario
router.put('/:id', [
    requireRoles(BOSS_ROLES), 
    param('id').isInt().withMessage('El ID debe ser numérico'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido')
], UserController.updateUser);

export default router;