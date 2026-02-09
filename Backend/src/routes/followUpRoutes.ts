import { Router } from 'express';
import { FollowUpController } from '../controllers/FollowUpController';

const router = Router();

// GET /api/followups/:id
router.get('/:id', FollowUpController.getFollowUpById);

export default router;