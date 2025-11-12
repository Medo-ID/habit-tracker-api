import { Router } from 'express'
import z from 'zod'
import { validateBody } from '../middlewares/validation.ts'
import {
  getProfile,
  changePassword,
  updateProfile,
} from '../controllers/userController.ts'

export const userRouter = Router()

// Validation schemas
const updateProfileSchema = z
  .object({
    email: z.email('Invalid email format').optional(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
  })
  .strict()

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, {
      message: 'The password must be at least 8 characters long.',
    })
    .regex(/[A-Z]/, {
      message: 'The password must contain at least one uppercase letter.',
    })
    .regex(/[a-z]/, {
      message: 'The password must contain at least one lowercase letter.',
    })
    .regex(/\d/, {
      message: 'The password must contain at least one number.',
    })
    .regex(/[^A-Za-z0-9]/, {
      message: 'The password must contain at least one special character.',
    }),
})

// Routes
userRouter.get('/profile', getProfile)
userRouter.put('/profile', validateBody(updateProfileSchema), updateProfile)
userRouter.post(
  '/change-password',
  validateBody(changePasswordSchema),
  changePassword
)
