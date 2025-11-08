import { Router } from 'express'
import z from 'zod'
import { validateBody, validateParams } from '../middlewares/validation.ts'
import {
  createHabit,
  deleteHabit,
  getHabitById,
  getUserHabits,
  updateHabit,
} from '../controllers/habitController.ts'

export const habitRouter = Router()

// Validation schemas
const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    error: 'Frequency must be daily, weekly, or monthly',
  }),
  targetCount: z.number().int().positive().optional().default(1),
  tagIds: z.array(z.uuid()).optional(),
})

const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  targetCount: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  tagIds: z.array(z.uuid()).optional(),
})

const uuidSchema = z.object({
  id: z.uuid('Invalid habit ID format'),
})

const completeParamsSchema = z.object({
  id: z.string().max(3),
})

// Routes
habitRouter.get('/', getUserHabits)
habitRouter.get('/:id', validateParams(uuidSchema), getHabitById)
habitRouter.post('/', validateBody(createHabitSchema), createHabit)
habitRouter.put(
  '/:id',
  validateParams(uuidSchema),
  validateBody(updateHabitSchema),
  updateHabit
)
habitRouter.delete('/:id', validateParams(uuidSchema), deleteHabit)
habitRouter.post(
  '/:id/completed',
  validateParams(completeParamsSchema),
  validateBody(createHabitSchema),
  (req, res) => {
    res.json({ message: 'completed habit' }).status(201)
  }
)
