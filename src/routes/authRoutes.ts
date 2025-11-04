import { Router } from 'express'

export const authRouter = Router()

authRouter.post('/register', (req, res) => {
  res.json({ message: 'user register in!' })
})

authRouter.post('/login', (req, res) => {
  res.json({ message: 'user logged in!' })
})
