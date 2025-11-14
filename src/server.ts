import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { env, isTest } from '../env.ts'
import { isAuthenticated } from './middlewares/auth.ts'

// Routers Imports
import { authRouter } from './routes/authRoutes.ts'
import { userRouter } from './routes/userRoutes.ts'
import { tagRouter } from './routes/tagRoutes.ts'
import { habitRouter } from './routes/habitRoutes.ts'
import { notFound } from './middlewares/notFound.ts'
import { globalError } from './middlewares/globalError.ts'
import { customRateLimiter } from './middlewares/rateLimiter.ts'

const app = express()

// Regular middleware
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev', { skip: () => isTest() }))

// Custom rate limiter
app.use(customRateLimiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
})

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
