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



router.use(authenticateJWT);



router.get('/patients', PatientController.getPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.createPatient);
router.put('/patients/:id', PatientController.updatePatient);

router.delete(
    '/patients/:id', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    PatientController.deletePatient
);

// 📥 IMPORTACIÓN MASIVA
// Nota: La URL es /import y el campo del archivo debe llamarse 'file'
router.post(
    '/patients/import', 
    // 🚀 AÑADIMOS 'ATENCION' Y 'NAVIGATOR' AL CANDADO
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'ATENCION', 'NAVIGATOR']), 
    upload.single('file'), 
    PatientController.importPatients
);


// 📝 2. SEGUIMIENTOS (HISTORIA CLÍNICA)

router.post('/followups', FollowUpController.createFollowUp);
router.get('/followups/:id', FollowUpController.getFollowUpById);
router.put('/followups/:id', FollowUpController.updateFollowUp);

// 🚀 GESTIÓN MASIVA (Actualizar varios estados a la vez)
router.post('/bulk-update', PatientController.bulkUpdate);


// 🚨 3. ALERTAS Y ANALÍTICA

router.get('/alerts', AlertsController.getAlerts);
router.get('/alerts/count', AlertsController.getAlertCount);
router.get('/analytics/dashboard', AnalyticsController.getDashboardData);


// 🕵️‍♂️ 4. AUDITORÍA Y REPARACIÓN TÉCNICA
console.log("🚀 ¡ATENCIÓN! Leyendo las rutas nuevas de auditoría..."); // AGREGAR ESTA LÍNEA
// 👉 NUEVA RUTA: Monitor de Auditoría (Solo para Admin y Coordinador)
router.get(
    '/audit/logs', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    AuditController.getGlobalLogs
);

router.get(
    '/audit/stats', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    AuditController.getGeneralStats
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

router.delete(
    '/audit/clean-duplicates', 
    requireRoles(['SUPER_ADMIN']), 
    AuditController.cleanDuplicates
);


// 💾 5. BACKUPS (EXPORTACIÓN EXCEL)

router.get(
    '/backup/download', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    BackupController.downloadFullDatabase
);


// 🏷️ 6. MOTOR DE CUPS (CATALOGACIÓN)

router.get('/cups', CupsController.getCups);

router.post(
    '/cups/bulk-update', 
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']), 
    CupsController.bulkUpdate
);

// Sincronización automática de categorías
router.post(
    '/cups/sync', 
    requireRoles(['SUPER_ADMIN']), 
    CupsController.autoCategorize
); 

router.post(
    '/cups/fix-legacy', 
    requireRoles(['SUPER_ADMIN']), 
    CupsController.fixLegacyCategories
);

router.post(
    '/cups/importar', 
    // 🚀 AÑADIMOS 'ATENCION' Y 'NAVIGATOR' AL CANDADO
    requireRoles(['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'ATENCION', 'NAVIGATOR']), 
    upload.single('file'), 
    CupsController.importCupsFile
);  
export default router;