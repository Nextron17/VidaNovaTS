import { Router } from 'express';
import { authenticateJWT, requireRoles } from '../../../core/middlewares/authMiddleware';
import { upload } from '../../../core/middlewares/uploadMiddleware';

// Importamos los Controladores del módulo
import { PatientController } from '../controllers/PatientController';
import { FollowUpController } from '../controllers/FollowUpController';
import { AlertsController } from '../controllers/AlertsController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { AuditController } from '../controllers/AuditController';
import { BackupController } from '../controllers/BackupController';
import { CupsController } from '../controllers/CupsController';

const router = Router();

// ==========================================
// 🛡️ TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ==========================================
router.use(authenticateJWT);

// --- 1. PACIENTES ---
router.get('/patients', PatientController.getPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.createPatient);
router.put('/patients/:id', PatientController.updatePatient);
// Solo Admin y Coordinador pueden borrar pacientes
router.delete('/patients/:id', requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), PatientController.deletePatient);

// Importación Masiva (Requiere el middleware 'upload')
router.post('/patients/import', requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), upload.single('file'), PatientController.importPatients);

// --- 2. SEGUIMIENTOS (Notas Clínicas) ---
router.post('/followups', FollowUpController.createFollowUp);
router.get('/followups/:id', FollowUpController.getFollowUpById);
router.put('/followups/:id', FollowUpController.updateFollowUp);

// --- 3. GESTIÓN MASIVA ---
router.post('/bulk-update', PatientController.bulkUpdate);

// --- 4. ALERTAS ---
router.get('/alerts', AlertsController.getAlerts);
router.get('/alerts/count', AlertsController.getAlertCount);

// --- 5. ANALÍTICA ---
router.get('/analytics/dashboard', AnalyticsController.getDashboardData);

// --- 6. AUDITORÍA Y LIMPIEZA (Exclusivo Administradores) ---
router.get('/audit/stats', requireRoles(['SUPER_ADMIN', 'AUDITOR']), AuditController.getGeneralStats);
router.post('/audit/fix-dates', requireRoles(['SUPER_ADMIN']), AuditController.fixIncoherentDates);
router.post('/audit/merge-duplicates', requireRoles(['SUPER_ADMIN']), AuditController.mergeDuplicates);
router.delete('/audit/clean-duplicates', requireRoles(['SUPER_ADMIN']), AuditController.cleanDuplicates);

// --- 7. BACKUPS (Descarga de Excel) ---
router.get('/backup/download', requireRoles(['SUPER_ADMIN', 'AUDITOR', 'COORDINATOR_NAVIGATOR']), BackupController.downloadFullDatabase);

// --- 8. MOTOR DE CUPS ---
router.get('/cups', CupsController.getCups);
router.post('/cups/bulk-update', requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), CupsController.bulkUpdate);

// ✅ CORRECCIÓN AQUÍ: Cambiamos syncCups por autoCategorize
router.post('/cups/sync', requireRoles(['SUPER_ADMIN']), CupsController.autoCategorize); 

router.post('/cups/fix-legacy', requireRoles(['SUPER_ADMIN']), CupsController.fixLegacyCategories);

export default router;