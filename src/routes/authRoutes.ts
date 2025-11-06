import { Router } from 'express'
import { validateBody } from '../middlewares/validation.ts'
import { insertUserSchema } from '../db/schema.ts'
import { login, register } from '../controllers/authController.ts'
import z from 'zod'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.email({ error: 'Invalid or missing email!' }),
  password: z.string({ error: 'Password required!' }),
})

authRouter.post('/register', validateBody(insertUserSchema), register)
authRouter.post('/login', validateBody(loginSchema), login)
