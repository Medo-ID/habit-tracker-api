import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'

import { authRouter } from './routes/authRoutes.ts'
import { userRouter } from './routes/userRoutes.ts'
import { habitRouter } from './routes/habitRoutes.ts'

import { isTest } from '../env.ts'
import { isAuthenticated } from './middlewares/auth.ts'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev', { skip: () => isTest() }))

app.get('/health', (req, res) => {
  res.send(`
    <a href="https://medo7id.com"><button>medo-id</button></a>
  `)
})

app.use('/api/auth', authRouter)
app.use('/api/users', isAuthenticated, userRouter)
app.use('/api/habits', isAuthenticated, habitRouter)

export { app }
