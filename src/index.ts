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
import { homePageHTML } from './views/homePage.ts'
import { renderDocsPage } from './views/docsPage.ts'

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

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(new URL('./public/favicon.ico', import.meta.url).pathname)
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
})

// Link to my portfolio 😊
app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html')
  res.send(homePageHTML)
})

// Docs
app.get('/docs', async (req, res) => {
  try {
    const html = await renderDocsPage()
    res.set('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to load docs')
  }
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

// Only listen locally (for development)
if (env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`Server running on: http://localhost:${env.PORT}`)
    console.log(`Environment: ${env.NODE_ENV}`)
  })
}

export default app
