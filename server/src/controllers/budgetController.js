import Budget from '../models/budgetModel.js';
import Transaction from '../models/transactionModel.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

const isValidMonth = (m) => {
  if (!m || typeof m !== 'string') return false;
  return /^\d{4}-\d{2}$/.test(m);
};

export const upsertBudget = asyncHandler(async (req, res, next) => {
  const { category, month, limit } = req.body;

  if (!category || !month || typeof limit === 'undefined' || limit === null) {
    return next(new ErrorResponse('Please provide category, month and limit', 400));
  }

  if (!isValidMonth(month)) {
    return next(new ErrorResponse('Month must be in YYYY-MM format', 400));
  }

  const parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
    return next(new ErrorResponse('Limit must be a valid number', 400));
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user.id, category: String(category).trim(), month: String(month).trim() },
    { limit: parsedLimit },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    data: budget
  });
});

export const getBudgets = asyncHandler(async (req, res, next) => {
  const { month } = req.query;

  const filter = { user: req.user.id };
  if (month) {
    const m = String(month);
    if (!isValidMonth(m)) {
      return next(new ErrorResponse('Month must be in YYYY-MM format', 400));
    }
    filter.month = m;
  }

  const budgets = await Budget.find(filter).sort({ month: -1, createdAt: -1 });

  // ── Auto-calculate spent from real transactions ──────────────────────────
  const enriched = await Promise.all(
    budgets.map(async (budget) => {
      // Parse the budget month (YYYY-MM) into a date range
      const [year, mon] = budget.month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);          // first day of month
      const end   = new Date(year, mon, 1);               // first day of next month

      const agg = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            type: 'expense',
            category: budget.category,
            date: { $gte: start, $lt: end }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = agg.length ? Number(agg[0].total) : 0;

      return {
        ...budget.toObject(),
        spent,
        remaining: Math.max(0, budget.limit - spent),
        percentUsed: budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0
      };
    })
  );

  res.status(200).json({ success: true, data: enriched });
});

export const deleteBudget = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const budget = await Budget.findOneAndDelete({ _id: id, user: req.user.id });
  if (!budget) {
    return next(new ErrorResponse('Budget not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
