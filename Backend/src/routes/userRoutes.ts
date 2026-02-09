import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// --- ZONA COMÚN (Todos los logueados) ---
// El middleware 'authenticate' protege todas las rutas de abajo
router.use(authenticate);

// 1. RUTAS PERSONALES (Mi Perfil)
// Deben ir ANTES de las rutas con /:id para evitar conflictos
router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);          // <--- NUEVO: Editar mis datos
router.put('/me/password', UserController.changePassword); // <--- NUEVO: Cambiar mi clave


// --- ZONA ADMIN (Solo Coordinadores y SuperAdmin) ---

// 2. GESTIÓN DE EQUIPO
router.get('/', 
    authorize(['COORDINATOR', 'SUPER_ADMIN']), 
    UserController.getTeam
);

router.post('/', [
    authorize(['COORDINATOR', 'SUPER_ADMIN']),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
], UserController.createUser);

router.delete('/:id', [
    authorize(['COORDINATOR', 'SUPER_ADMIN']),
    param('id').isInt().withMessage('El ID debe ser numérico')
], UserController.deleteUser);

router.put('/:id', [
    authorize(['COORDINATOR', 'SUPER_ADMIN']),
    param('id').isInt().withMessage('El ID debe ser numérico')
], UserController.updateUser);

export default router;