import { Router } from 'express'

export const userRouter = Router()

userRouter.get('/', (req, res) => {
  res.json({ message: 'all users' })
})

userRouter.get('/:id', (req, res) => {
  res.json({ message: 'got one user' })
})

userRouter.put('/:id', (req, res) => {
  res.json({ message: 'update one user' })
})

userRouter.post('/:id', (req, res) => {
  res.json({ message: 'delete one user' })
})
