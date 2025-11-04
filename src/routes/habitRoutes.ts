import { Router } from 'express'
import z from 'zod'
import { validateBody, validateParams } from '../middlewares/validation.ts'

export const habitRouter = Router()

const createHabitSchema = z.object({
  name: z.string(),
})

const completeParamsSchema = z.object({
  id: z.string().max(3),
})

habitRouter.get('/', (req, res) => {
  res.json({ message: 'all habits' })
})

habitRouter.get('/:id', (req, res) => {
  res.json({ message: 'got one habit' })
})

habitRouter.post('/', validateBody(createHabitSchema), (req, res) => {
  res.json({ message: 'create habit!' }).status(201)
})

habitRouter.delete('/:id', (req, res) => {
  res.json({ message: 'delete habit!' })
})

habitRouter.post(
  '/:id/completed',
  validateParams(completeParamsSchema),
  validateBody(createHabitSchema),
  (req, res) => {
    res.json({ message: 'completed habit' }).status(201)
  }
)
