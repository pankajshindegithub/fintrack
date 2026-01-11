import express from 'express';
import { protect } from '../middleware/auth.js';
import { addGoalFunds, createGoal, deleteGoal, getGoals, updateGoal } from '../controllers/goalController.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createGoal).get(getGoals);
router.route('/:id').put(updateGoal).delete(deleteGoal);
router.route('/:id/funds').post(addGoalFunds);

export default router;
