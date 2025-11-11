import { eq } from 'drizzle-orm'
import { db } from '../src/db/connection.ts'
import { habits, users } from '../src/db/schema.ts'
import { verifyPassword } from '../src/utils/password.ts'
import {
  cleanupTestDatabase,
  createTestHabit,
  createTestUser,
  type TestHabit,
} from './helpers.ts'

describe('Test Database Helpers', () => {
  beforeEach(async () => cleanupTestDatabase())

  describe('createTestUser', () => {
    it('creates a user with default values and return valid tokens', async () => {
      const { user, accessToken, refreshToken, rawPassword } =
        await createTestUser()

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      })
      expect(dbUser).not.toBeNull()
      expect(dbUser!.email).toBe(user.email)

      expect(user.email).toMatch(/@example\.com$/)
      expect(user.username).toContain('testUser-')
      expect(typeof accessToken).toBe('string')
      expect(typeof refreshToken).toBe('string')

      const isPasswordValid = await verifyPassword(rawPassword, user.password)
      expect(isPasswordValid).toBeTruthy()
    })

    it('creates a user with passed values and return valid tokens', async () => {
      const { user, accessToken, refreshToken, rawPassword } =
        await createTestUser({
          email: `${Date.now()}@example.com`,
          username: `testUser-${Date.now()}`,
          password: 'A123456a@',
          firstName: 'Brahim',
          lastName: 'Lblad',
        })

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      })
      expect(dbUser).not.toBeNull()
      expect(dbUser!.email).toBe(user.email)
      expect(dbUser!.firstName).toBe(user.firstName)

      expect(user.firstName).toBe('Brahim')
      expect(user.lastName).toBe('Lblad')
      expect(typeof accessToken).toBe('string')
      expect(typeof refreshToken).toBe('string')

      const isPasswordValid = await verifyPassword(rawPassword, user.password)
      expect(isPasswordValid).toBeTruthy()
    })
  })

  describe('createTestHabit', () => {
    it('creates and return a habit with default values', async () => {
      const { user } = await createTestUser()
      const habit = await createTestHabit(user.id)

      const dbHabit = await db.query.habits.findFirst({
        where: eq(habits.id, habit.id),
      })
      expect(dbHabit).not.toBeNull()
      expect(dbHabit!.id).toBe(habit.id)
      expect(dbHabit!.userId).toBe(user.id)

      expect(habit.name).toContain('Test Habit')
    })

    it('creates and return a habit with passed values', async () => {
      const habitData: Partial<TestHabit> = {
        name: `Test Habit ${Date.now()}`,
        description: 'A test habit',
        frequency: 'daily',
        targetCount: 1,
      }
      const { user } = await createTestUser()
      const habit = await createTestHabit(user.id, habitData)

      const dbHabit = await db.query.habits.findFirst({
        where: eq(habits.id, habit.id),
      })
      expect(dbHabit).not.toBeNull()
      expect(dbHabit!.id).toBe(habit.id)
      expect(dbHabit!.userId).toBe(user.id)

      expect(habit.name).toBe(habitData.name)
      expect(habit.frequency).toBe(habitData.frequency)
    })
  })

  describe('cleanupTestDatabase', () => {
    it('should remove all test data', async () => {
      const { user } = await createTestUser()
      await createTestHabit(user.id)
      await cleanupTestDatabase()

      const usersCount = await db.select().from(users)
      const habitsCount = await db.select().from(habits)
      expect(usersCount.length).toBe(0)
      expect(habitsCount.length).toBe(0)
    })
  })
})
