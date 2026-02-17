import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { CupsController } from '../controllers/CupsController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Todos deben estar logueados
router.use(authenticate);

//  DEFINICIÓN DE PERMISOS 

// A. Jefes 
const BOSS_ROLES = ['COORDINATOR_NAVIGATOR', 'SUPER_ADMIN'];

// B. Operativos y Jefes
const OPERATIVE_ROLES = ['NAVIGATOR', ...BOSS_ROLES];


//  RUTAS DE CUPS

// Ver listado lo hacen todos
router.get('/cups', authorize(OPERATIVE_ROLES), PatientController.getCups);
// Actualizar masivamente CUPS es delicado
router.put('/cups/bulk-update', authorize(BOSS_ROLES), PatientController.bulkUpdateCups);
// Sincronizar CUPS
router.post('/cups/sync', authorize(OPERATIVE_ROLES), PatientController.syncCups);
// Reparar categorías 
router.post('/fix-categories', authorize(BOSS_ROLES), CupsController.fixLegacyCategories);


//  RUTAS DE PACIENTES

// 1. Lectura y Listados
router.get('/', authorize(OPERATIVE_ROLES), PatientController.getPatients);

// 2. Importación y Creación 
router.post('/upload', [
    authorize(OPERATIVE_ROLES),
    upload.single('archivo')
], PatientController.importPatients);

router.post('/', authorize(OPERATIVE_ROLES), PatientController.createPatient);

// 3. Edición y Actualización Masiva 
router.put('/bulk-update', authorize(OPERATIVE_ROLES), PatientController.bulkUpdate);
router.put('/:id', authorize(OPERATIVE_ROLES), PatientController.updatePatient);


//  RUTAS ESTRATÉGICAS Y DESTRUCTIVAS

//  Auditoría y Estadísticas 
router.get('/audit', authorize(BOSS_ROLES), PatientController.getAuditStats);

//  Eliminar Paciente (
router.delete('/:id', authorize(BOSS_ROLES), PatientController.deletePatient);


//  DETALLE INDIVIDUAL
router.get('/:id', authorize(OPERATIVE_ROLES), PatientController.getPatientById);

export default router;