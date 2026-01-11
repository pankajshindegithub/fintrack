import Goal from '../models/goalModel.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const createGoal = asyncHandler(async (req, res, next) => {
  const { name, target, deadline, icon } = req.body;

  if (!name || typeof target === 'undefined' || target === null || !deadline) {
    return next(new ErrorResponse('Please provide name, target and deadline', 400));
  }

  const parsedTarget = Number(target);
  if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
    return next(new ErrorResponse('Target must be a valid number', 400));
  }

  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) {
    return next(new ErrorResponse('Deadline must be a valid date', 400));
  }

  const goal = await Goal.create({
    user: req.user.id,
    name,
    target: parsedTarget,
    deadline: parsedDeadline,
    icon: icon || '🎯',
    current: 0
  });

  res.status(201).json({
    success: true,
    data: goal
  });
});

export const getGoals = asyncHandler(async (req, res, next) => {
  const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: goals
  });
});

export const updateGoal = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, target, deadline, icon } = req.body;

  const update = {};

  if (typeof name !== 'undefined') {
    update.name = name;
  }

  if (typeof target !== 'undefined') {
    const parsedTarget = Number(target);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
      return next(new ErrorResponse('Target must be a valid number', 400));
    }
    update.target = parsedTarget;
  }

  if (typeof deadline !== 'undefined') {
    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return next(new ErrorResponse('Deadline must be a valid date', 400));
    }
    update.deadline = parsedDeadline;
  }

  if (typeof icon !== 'undefined') {
    update.icon = icon;
  }

  const goal = await Goal.findOneAndUpdate(
    { _id: id, user: req.user.id },
    update,
    { new: true, runValidators: true }
  );

  if (!goal) {
    return next(new ErrorResponse('Goal not found', 404));
  }

  res.status(200).json({
    success: true,
    data: goal
  });
});

export const deleteGoal = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const goal = await Goal.findOneAndDelete({ _id: id, user: req.user.id });

  if (!goal) {
    return next(new ErrorResponse('Goal not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

export const addGoalFunds = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return next(new ErrorResponse('Amount must be a valid number', 400));
  }

  const goal = await Goal.findOne({ _id: id, user: req.user.id });

  if (!goal) {
    return next(new ErrorResponse('Goal not found', 404));
  }

  goal.current = Number(goal.current) + parsedAmount;
  await goal.save();

  res.status(200).json({
    success: true,
    data: goal
  });
});
