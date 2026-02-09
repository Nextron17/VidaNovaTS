import { Router } from 'express';
import { AlertsController } from '../controllers/AlertsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// GET /api/alerts
router.get('/', AlertsController.getAlerts);

export default router;