import type { Request, Response } from 'express'
import { db } from '../db/connection.ts'
import { refreshTokens, users } from '../db/schema.ts'
import { hashPassword, verifyPassword } from '../utils/password.ts'
import { generateTokens } from '../utils/jwt.ts'
import { eq } from 'drizzle-orm'

export async function register(req: Request, res: Response) {
  try {
    const hashedPassword = await hashPassword(req.body.password)
    const [user] = await db
      .insert(users)
      .values({
        ...req.body,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
    const { accessToken, refreshToken } = await generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    await db.insert(refreshTokens).values({
      userId: user.id,
      refreshToken: refreshToken,
    })

    return res.status(201).json({
      message: 'User created',
      user,
      accessToken,
    })
  } catch (error) {
    console.error('Registration failed', error)
    res.status(500).json({ error: 'failed to create user' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    console.log(email, password)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ erroe: 'Invalid credentials' })
    }

    const { accessToken, refreshToken } = await generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    await db
      .update(refreshTokens)
      .set({ refreshToken })
      .where(eq(refreshTokens.userId, user.id))

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
    })
  } catch (error) {
    console.error('Login failed', error)
    res.status(500).json({ error: 'failed to login user' })
  }
}
