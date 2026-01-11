import express from 'express';
import { protect } from '../middleware/auth.js';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from '../controllers/transactionController.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createTransaction).get(getTransactions);

router.route('/:id').put(updateTransaction).delete(deleteTransaction);

export default router;
