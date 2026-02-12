import { Router } from 'express';
import { FollowUpController } from '../controllers/FollowUpController';

const router = Router();

// GET /api/followups/:id
router.get('/:id', FollowUpController.getFollowUpById);
router.post('/', FollowUpController.createFollowUp);    
router.put('/:id', FollowUpController.updateFollowUp);

export default router;
