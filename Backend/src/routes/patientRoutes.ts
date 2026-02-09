import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import { CupsController } from '../controllers/CupsController';

const router = Router();

// Configuración de subida de archivos (Memoria)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware de seguridad
router.use(authenticate);

// 1. RUTAS DE CUPS (Procedimientos)
router.get('/cups', PatientController.getCups);
router.put('/cups/bulk-update', PatientController.bulkUpdateCups);
router.post('/cups/sync', PatientController.syncCups);

// 2. RUTAS DE PACIENTES (Gestión General)
router.get('/', PatientController.getPatients); // Listado + Filtros
router.post('/upload', upload.single('archivo'), PatientController.importPatients); // Importar Excel
router.put('/bulk-update', PatientController.bulkUpdate); // Acción masiva
router.post('/', PatientController.createPatient); // Crear manual
router.post('/fix-categories', CupsController.fixLegacyCategories);

// 3. RUTAS ESPECÍFICAS (Audit debe ir ANTES de :id)
router.get('/audit', PatientController.getAuditStats); // <--- MOVIDO AQUÍ

// 4. RUTAS POR ID (Siempre al final)
router.get('/:id', PatientController.getPatientById); // Ver detalle
router.delete('/:id', PatientController.deletePatient); // Eliminar
router.put('/:id', PatientController.updatePatient); // Editar maual

export default router;