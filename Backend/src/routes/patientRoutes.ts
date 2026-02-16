import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { CupsController } from '../controllers/CupsController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Todos deben estar logueados
router.use(authenticate);

// --- DEFINICIÓN DE PERMISOS ---

// A. Jefes (Acceso Total: Borrar, Auditar, Reparar)
const BOSS_ROLES = ['COORDINATOR_NAVIGATOR', 'SUPER_ADMIN'];

// B. Operativos (Acceso Diario: Crear, Editar, Importar)
// Incluye a los jefes porque ellos también pueden operar si quieren
const OPERATIVE_ROLES = ['NAVIGATOR', ...BOSS_ROLES];


// --- RUTAS DE CUPS (Configuración del sistema) ---

// Ver listado lo hacen todos
router.get('/cups', authorize(OPERATIVE_ROLES), PatientController.getCups);
// Actualizar masivamente CUPS es delicado -> Jefes
router.put('/cups/bulk-update', authorize(BOSS_ROLES), PatientController.bulkUpdateCups);
// Sincronizar CUPS -> Operativo (a veces necesario al importar)
router.post('/cups/sync', authorize(OPERATIVE_ROLES), PatientController.syncCups);
// Reparar categorías (Mantenimiento) -> Solo Jefes
router.post('/fix-categories', authorize(BOSS_ROLES), CupsController.fixLegacyCategories);


// --- RUTAS DE PACIENTES (Core) ---

// 1. Lectura y Listados (Todos)
router.get('/', authorize(OPERATIVE_ROLES), PatientController.getPatients);

// 2. Importación y Creación (El Navegador SÍ puede hacer esto)
router.post('/upload', [
    authorize(OPERATIVE_ROLES),
    upload.single('archivo')
], PatientController.importPatients);

router.post('/', authorize(OPERATIVE_ROLES), PatientController.createPatient);

// 3. Edición y Actualización Masiva (El Navegador SÍ puede hacer esto)
router.put('/bulk-update', authorize(OPERATIVE_ROLES), PatientController.bulkUpdate);
router.put('/:id', authorize(OPERATIVE_ROLES), PatientController.updatePatient);


// --- RUTAS ESTRATÉGICAS Y DESTRUCTIVAS (Aquí bloqueamos al Navegador) ---

// ⛔ Auditoría y Estadísticas (User dijo: "ni ver estadisticas")
router.get('/audit', authorize(BOSS_ROLES), PatientController.getAuditStats);

// ⛔ Eliminar Paciente (User dijo: "no eliminar")
router.delete('/:id', authorize(BOSS_ROLES), PatientController.deletePatient);


// --- DETALLE INDIVIDUAL (Al final) ---
router.get('/:id', authorize(OPERATIVE_ROLES), PatientController.getPatientById);

export default router;