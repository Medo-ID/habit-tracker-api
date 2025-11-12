import type { AuthenticatedRequest } from '../middlewares/auth.ts'
import type { Response } from 'express'
import { db } from '../db/connection.ts'
import { users } from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '../utils/password.ts'

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error('Error fetching user data', error)
    res.status(500).json({ error: "Failed to get user's profile" })
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const { email, username, firstName, lastName } = req.body

    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        username,
        firstName,
        lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        updatedAt: users.updatedAt,
      })
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'Profile updated', user: updatedUser })
  } catch (error) {
    console.error('Error updating user profile', error)
    res
      .status(500)
      .json({ error: 'Failed to update user profile, Please try later' })
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id
    const { oldPassword, newPassword } = req.body

    const [user] = await db.select().from(users).where(eq(users.id, userId))

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValidPassword = await verifyPassword(oldPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Old password is incorrect' })
    }

    const hashedPassword = await hashPassword(newPassword)
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))

    res.status(201).json({ message: 'password updated' })
  } catch (error) {
    console.error("Error updating user's password", error)
    res
      .status(500)
      .json({ error: 'Failed to update password. Please try later' })
  }
}
