import { Router } from 'express'
import {
  createTag,
  deleteTag,
  getTagById,
  getTagHabits,
  getTags,
  popularTags,
  updateTag,
} from '../controllers/tagController.ts'
import z from 'zod'
import { validateBody, validateParams } from '../middlewares/validation.ts'

export const tagRouter = Router()

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
})

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
})

const uuidSchema = z.object({
  id: z.uuid('Invalid tag ID format'),
})

// Routes
tagRouter.post('/', validateBody(createTagSchema), createTag)
tagRouter.get('/', getTags)
tagRouter.get('/:id', validateParams(uuidSchema), getTagById)
tagRouter.put(
  '/:id',
  validateParams(uuidSchema),
  validateBody(updateTagSchema),
  updateTag
)
tagRouter.delete(':id', validateParams(uuidSchema), deleteTag)
tagRouter.get('/popular', popularTags)
tagRouter.get('/:id/habits', validateParams(uuidSchema), getTagHabits)
