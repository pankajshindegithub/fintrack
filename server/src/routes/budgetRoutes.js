import express from 'express';
import { protect } from '../middleware/auth.js';
import { deleteBudget, getBudgets, upsertBudget } from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect);

router.route('/').post(upsertBudget).get(getBudgets);
router.route('/:id').delete(deleteBudget);

export default router;
