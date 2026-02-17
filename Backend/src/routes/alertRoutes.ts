import { Router } from 'express';
import { AlertsController } from '../controllers/AlertsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', AlertsController.getAlerts);
router.get('/count', AlertsController.getAlertCount);
export default router;