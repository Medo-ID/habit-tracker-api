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

interface TestUser {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

interface TestHabit {
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  targetCount: number
}

export async function createTestUser(userData: Partial<TestUser> = {}) {
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

export async function createTestHabit(
  userId: string,
  habitData: Partial<TestHabit> = {}
) {
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

export async function cleanupTestDatabase() {
  await db.delete(entries)
  await db.delete(habitTags)
  await db.delete(habits)
  await db.delete(tags)
  await db.delete(refreshTokens)
  await db.delete(users)
}
