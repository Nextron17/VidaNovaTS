import { Router } from 'express';
// Importación desde el CORE (Corazón del sistema)
import { authenticateJWT, requireRoles } from '../../../core/middlewares/authMiddleware';
import { upload } from '../../../core/middlewares/uploadMiddleware';

import { PatientController } from '../controllers/PatientController';
import { FollowUpController } from '../controllers/FollowUpController';
import { AlertsController } from '../controllers/AlertsController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { AuditController } from '../controllers/AuditController';
import { BackupController } from '../controllers/BackupController';
import { CupsController } from '../controllers/CupsController';

const router = Router();

// Middleware de autenticación global para este módulo
router.use(authenticateJWT);


// ==========================================
// 1. GESTIÓN DE PACIENTES
// ==========================================

router.get('/patients', PatientController.getPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.createPatient);
router.put('/patients/:id', PatientController.updatePatient);

// Eliminar paciente
router.delete(
    '/patients/:id', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    PatientController.deletePatient
);

// Importación masiva (En segundo plano)
router.post(
    '/patients/import', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'ATENCION', 'NAVIGATOR']), 
    upload.single('file'), 
    PatientController.importPatients
);

// 🚀 FIX: Actualización masiva de pacientes conectada correctamente al frontend
router.put('/patients/bulk-update', PatientController.bulkUpdate);


// ==========================================
// 2. SEGUIMIENTOS (HISTORIA CLÍNICA)
// ==========================================

router.post('/followups', FollowUpController.createFollowUp);
router.get('/followups/:id', FollowUpController.getFollowUpById);
router.put('/followups/:id', FollowUpController.updateFollowUp);


// ==========================================
// 3. ALERTAS Y ANALÍTICA
// ==========================================

router.get('/alerts', AlertsController.getAlerts);
router.get('/alerts/count', AlertsController.getAlertCount);
router.get('/analytics/dashboard', AnalyticsController.getDashboardData);


// ==========================================
// 4. AUDITORÍA Y REPARACIÓN TÉCNICA
// ==========================================

console.log("🚀 ¡ATENCIÓN! Leyendo las rutas nuevas de auditoría..."); 

router.get(
    '/audit/logs', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    AuditController.getGlobalLogs
);

// 🚀 FIX: Conectado a la super función de estadísticas que armamos en PatientController
router.get(
    '/audit/stats', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    PatientController.getAuditStats
);

router.post(
    '/audit/fix-dates', 
    requireRoles(['SUPER_ADMIN']), 
    AuditController.fixIncoherentDates
);

router.post(
    '/audit/merge-duplicates', 
    requireRoles(['SUPER_ADMIN']), 
    AuditController.mergeDuplicates
);

// 🚀 FIX: Conectado a la función de limpieza blindada de PatientController
router.post(
    '/audit/clean-duplicates', 
    requireRoles(['SUPER_ADMIN']), 
    PatientController.cleanDuplicates
);


// ==========================================
// 5. BACKUPS (EXPORTACIÓN EXCEL)
// ==========================================

router.get(
    '/backup/download', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    BackupController.downloadFullDatabase
);


// ==========================================
// 6. MOTOR DE CUPS (CATALOGACIÓN)
// ==========================================

router.get('/cups', CupsController.getCups);

router.post(
    '/cups/bulk-update', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    CupsController.bulkUpdate
);

// 🚀 FIX: Sincronización automática de categorías (Ahora en SEGUNDO PLANO)
router.post(
    '/cups/sync', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'ATENCION']), 
    CupsController.syncCups 
); 

router.post(
    '/cups/fix-legacy', 
    requireRoles(['SUPER_ADMIN']), 
    CupsController.fixLegacyCategories
);

// Importación masiva de CUPS (Segundo Plano)
router.post(
    '/cups/importar', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'ATENCION', 'NAVIGATOR']), 
    upload.single('file'), 
    CupsController.importCupsFile
);  

// Normalizar la base de datos de pacientes con las 9 categorías oficiales
router.post('/patients/fix-categories', CupsController.fixLegacyCategories);

export default router;