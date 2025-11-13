import request from 'supertest'
import { app } from '../src/server.ts'
import { db } from '../src/db/connection.ts'
import {
  entries,
  habits,
  habitTags,
  refreshTokens,
  tags,
  users,
} from '../src/db/schema.ts'
import { generateTokens } from '../src/utils/jwt.ts'
import { hashPassword } from '../src/utils/password.ts'
import { SignJWT } from 'jose'
import { createSecretKey } from 'node:crypto'

export interface TestUser {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

export interface TestHabit {
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  targetCount: number
  isActive?: boolean
}

export interface TestTag {
  name: string
  color: string
}

export const createTestUser = async (userData: Partial<TestUser> = {}) => {
  const defaultUser: TestUser = {
    email: `${Date.now()}@example.com`,
    username: `testUser-${Date.now()}`,
    password: 'A123456a@',
    firstName: 'test',
    lastName: 'user',
    ...userData,
  }

  const hashedPassword = await hashPassword(defaultUser.password)
  const [user] = await db
    .insert(users)
    .values({
      ...defaultUser,
      password: hashedPassword,
    })
    .returning()

  const { accessToken, refreshToken } = await generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
  })

  await db.insert(refreshTokens).values({ userId: user.id, refreshToken })

  return { user, accessToken, refreshToken, rawPassword: defaultUser.password }
}

export const createTestHabit = async (
  userId: string,
  habitData: Partial<TestHabit> = {}
) => {
  const defaultData: TestHabit = {
    name: `Test Habit ${Date.now()}`,
    description: 'A test habit',
    frequency: 'daily',
    targetCount: 1,
    ...habitData,
  }

  const [habit] = await db
    .insert(habits)
    .values({ userId, ...defaultData })
    .returning()

  return habit
}

export const createTestTag = async (tagData: Partial<TestTag> = {}) => {
  const defaultData = {
    name: 'Health',
    color: '#939ca1',
    ...tagData,
  }

  const [tag] = await db.insert(tags).values(defaultData).returning()
  return tag
}

export const createTestNonAuth = async () => {
  const nonAuth = {
    get: (url: string) => request(app).get(url),
    post: (url: string) => request(app).post(url),
    put: (url: string) => request(app).put(url),
    patch: (url: string) => request(app).patch(url),
    delete: (url: string) => request(app).delete(url),
  }

  return { nonAuth }
}

export const createTestAuth = async () => {
  const { user, accessToken, rawPassword } = await createTestUser()

  const auth = {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${accessToken}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${accessToken}`),
    put: (url: string) =>
      request(app).put(url).set('Authorization', `Bearer ${accessToken}`),
    patch: (url: string) =>
      request(app).patch(url).set('Authorization', `Bearer ${accessToken}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${accessToken}`),
  }

  return { auth, user, accessToken, rawPassword }
}

export const generateFakeToken = async (
  payload,
  secret = 'wrong_secret',
  experation: string
) => {
  const accessSecretKey = createSecretKey(secret, 'utf-8')
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(experation)
    .sign(accessSecretKey)
}

export const cleanupTestDatabase = async () => {
  await db.delete(entries)
  await db.delete(habitTags)
  await db.delete(habits)
  await db.delete(tags)
  await db.delete(refreshTokens)
  await db.delete(users)
}
