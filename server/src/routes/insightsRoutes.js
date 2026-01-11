import express from 'express';
import { protect } from '../middleware/auth.js';
import { chatInsights, getInsights } from '../controllers/insightsController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getInsights);
router.route('/chat').post(chatInsights);

export default router;
