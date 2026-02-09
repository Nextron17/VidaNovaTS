import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';

const router = Router();

// 1. Estadísticas (GET)
router.get('/stats', AuditController.getGeneralStats);

// 2. Acciones de Reparación (POST / DELETE)
router.post('/fix-dates', AuditController.fixIncoherentDates);
router.post('/merge-duplicates', AuditController.mergeDuplicates);
router.delete('/fix-duplicates', AuditController.cleanDuplicates);

export default router;