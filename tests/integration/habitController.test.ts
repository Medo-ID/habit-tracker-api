import request from 'supertest'
import { app } from '../../src/server.ts'
import {
  authenticatedRequest,
  cleanupTestDatabase,
  createTestHabit,
  createTestUser,
  generateFakeToken,
  type TestHabit,
} from '../helpers.ts'
import { entries } from '../../src/db/schema.ts'
import { db } from '../../src/db/connection.ts'
import { eq } from 'drizzle-orm'

describe('habitController', () => {
  const demoHabit: TestHabit = {
    name: 'Drink Water',
    description: 'Drink 8 glasses of water throughout the day.',
    frequency: 'daily',
    targetCount: 8,
  }

  beforeEach(async () => await cleanupTestDatabase())

  describe('POST /api/habits/ createHabit', () => {
    it('should throw when user is not authenticated', async () => {
      const response = await request(app).post('/api/habits/').send(demoHabit)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Bad Request')
    })

    it('should throw when user has corrupted access token', async () => {
      const corruptedToken = await generateFakeToken(
        { id: 'fake-id' },
        undefined,
        '5m'
      )
      const response = await request(app)
        .post('/api/habits/')
        .set('Authorization', `Bearer ${corruptedToken}`)
        .send(demoHabit)

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Unauthorized')
    })

    it('should create a habit for existing user and return it', async () => {
      const response = await authenticatedRequest(
        'post',
        '/api/habits/',
        demoHabit
      )

      expect(response.status).toBe(201)
      expect(response.body.habit).toHaveProperty('id')
    })

    it('should return 400 when body validation fails', async () => {
      const res = await authenticatedRequest('post', '/api/habits/', {
        name: '',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/habits/, getUserHabits', () => {
    it('should return habits for current authenticated user', async () => {
      const response = await authenticatedRequest('get', '/api/habits/')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('habits')
    })

    it('should return empty array if user has no habits', async () => {
      const res = await authenticatedRequest('get', '/api/habits/')

      expect(res.status).toBe(200)
      expect(res.body.habits).toEqual([])
    })

    it('should reject expired token', async () => {
      const expiredToken = await generateFakeToken(
        { id: '123' },
        undefined,
        '-1s'
      )
      const res = await request(app)
        .get('/api/habits/')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/habits/:id, getHabitById', () => {
    it('should return habit with specific od for current user', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id, demoHabit)
      const response = await request(app)
        .get(`/api/habits/${habit.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.habit.id).toBe(habit.id)
    })

    it('should return 404 if habit not found', async () => {
      const res = await authenticatedRequest('get', '/api/habits/bad-id')

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('PUT /api/habits/:id, updateHabit', () => {
    it('should update habit and return updated data', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id, demoHabit)
      const response = await request(app)
        .put(`/api/habits/${habit.id}`)
        .send({
          name: 'Drink Coffee',
          description: 'Drink 1 cup of coffee every morning after 9AM.',
          targetCount: 1,
        })
        .set('Authorization', `Bearer ${accessToken}`)
      const updatedHabit = await request(app)
        .get(`/api/habits/${habit.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.habit.id).toBe(updatedHabit.body.habit.id)
      expect(habit.name).not.toBe(updatedHabit.body.habit.name)
      expect(habit.targetCount).not.toBe(updatedHabit.body.habit.targetCount)
    })

    it('should throw error when habit not found', async () => {
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest(
        'put',
        `/api/habits/${uuid}`,
        {
          name: 'Drink Coffee',
          description: 'Drink 1 cup of coffee every morning after 9AM.',
          targetCount: 1,
        }
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Habit not found')
    })

    it('should return 400 when habit id is invalid uuid', async () => {
      const res = await authenticatedRequest('put', '/api/habits/not-a-uuid', {
        name: 'x',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('POST /api/habits/:id/complete, completeHabit', () => {
    it('should return entry when user complete a habit', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id, {
        ...demoHabit,
        isActive: true,
      })
      const response = await request(app)
        .post(`/api/habits/${habit.id}/complete`)
        .send({ note: "Let's go, I got this" })
        .set('Authorization', `Bearer ${accessToken}`)
      const [entry] = await db
        .select()
        .from(entries)
        .where(eq(entries.habitId, habit.id))

      expect(response.status).toBe(200)
      expect(response.body.entry.habitId).toBe(entry.habitId)
    })

    it('should throw error when habit not found', async () => {
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest(
        'post',
        `/api/habits/${uuid}/complete`,
        { note: "Let's go, I got this" }
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Habit not found')
    })

    it('should return entry when user complete a habit', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id, {
        ...demoHabit,
        isActive: false,
      })
      const response = await request(app)
        .post(`/api/habits/${habit.id}/complete`)
        .send({ note: "Let's go, I got this" })
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Can not complete an inactive habit')
    })
  })

  describe('POST /api/habits/:id/tags, addTagsToHabit', () => {
    it('should return habit with specific od for current user', async () => {})
  })

  describe('DELETE /api/habits/:id/tags/:tagId, removeTagFromHabit', () => {
    it('should return habit with specific od for current user', async () => {})
  })

  describe('DELETE /api/habits/:id, deleteHabit', () => {
    it('should return habit with specific od for current user', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id, demoHabit)
      const response = await request(app)
        .delete(`/api/habits/${habit.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Habit deleted successfully')
    })

    it('should throw error when habit not found', async () => {
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest(
        'delete',
        `/api/habits/${uuid}`
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Habit not found')
    })
  })
})
