import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate); // Protegido solo para usuarios logueados

// GET /api/backup/download
router.get('/download', BackupController.downloadFullDatabase);

export default router;