import Transaction from '../models/transactionModel.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const createTransaction = asyncHandler(async (req, res, next) => {
  const { type, amount, category, description, date } = req.body;

  if (!type || typeof amount === 'undefined' || amount === null || !category) {
    return next(new ErrorResponse('Please provide type, amount and category', 400));
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return next(new ErrorResponse('Amount must be a valid number', 400));
  }

  const parsedDate = date ? new Date(date) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return next(new ErrorResponse('Date must be a valid date', 400));
  }

  const tx = await Transaction.create({
    user: req.user.id,
    type,
    amount: parsedAmount,
    category,
    description: description || '',
    date: parsedDate
  });

  res.status(201).json({
    success: true,
    data: tx
  });
});

export const getTransactions = asyncHandler(async (req, res, next) => {
  const { type, category } = req.query;

  const filter = { user: req.user.id };
  if (type && (type === 'income' || type === 'expense')) {
    filter.type = type;
  }
  if (category) {
    filter.category = category;
  }

  const transactions = await Transaction.find(filter)
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: transactions
  });
});

export const updateTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { type, amount, category, description, date } = req.body;

  const update = {};

  if (typeof type !== 'undefined') {
    update.type = type;
  }

  if (typeof amount !== 'undefined') {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return next(new ErrorResponse('Amount must be a valid number', 400));
    }
    update.amount = parsedAmount;
  }

  if (typeof category !== 'undefined') {
    update.category = category;
  }

  if (typeof description !== 'undefined') {
    update.description = description;
  }

  if (typeof date !== 'undefined') {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return next(new ErrorResponse('Date must be a valid date', 400));
    }
    update.date = parsedDate;
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, user: req.user.id },
    update,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return next(new ErrorResponse('Transaction not found', 404));
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

export const deleteTransaction = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user.id });

  if (!transaction) {
    return next(new ErrorResponse('Transaction not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
