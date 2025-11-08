import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { isTest } from '../env.ts'
import { isAuthenticated } from './middlewares/auth.ts'

// Routers Imports
import { authRouter } from './routes/authRoutes.ts'
import { userRouter } from './routes/userRoutes.ts'
import { tagRouter } from './routes/tagRoutes.ts'
import { habitRouter } from './routes/habitRoutes.ts'
import { notFound } from './middlewares/notFound.ts'
import { globalError } from './middlewares/globalError.ts'

const app = express()

// Regular middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev', { skip: () => isTest() }))

// API Endpoints
app.use('/api/auth', authRouter)
app.use('/api/habits', isAuthenticated, habitRouter)
app.use('/api/users', isAuthenticated, userRouter)
app.use('/api/tags', isAuthenticated, tagRouter)

// 404 handler
app.use(notFound)

// Global error handler
app.use(globalError)

export { app }
