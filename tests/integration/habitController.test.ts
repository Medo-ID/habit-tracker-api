import {
  cleanupTestDatabase,
  createTestAuth,
  createTestHabit,
  createTestNonAuth,
  createTestTag,
  generateFakeToken,
  type TestHabit,
} from '../helpers.ts'
import { entries, habitTags } from '../../src/db/schema.ts'
import { db } from '../../src/db/connection.ts'
import { eq } from 'drizzle-orm'

describe('habitController', () => {
  const demoHabit: TestHabit = {
    name: 'Drink Water',
    description: 'Drink 8 glasses of water throughout the day.',
    frequency: 'daily',
    targetCount: 8,
  }
  afterEach(async () => await cleanupTestDatabase())

  describe('POST /api/habits/ createHabit', () => {
    it('should throw when user is not authenticated', async () => {
      const { nonAuth } = await createTestNonAuth()
      const res = await nonAuth.post('/api/habits/').send(demoHabit)

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Bad Request')
    })

    it('should throw when user has corrupted access token', async () => {
      const { nonAuth } = await createTestNonAuth()
      const corruptedToken = await generateFakeToken(
        { id: 'fake-id' },
        undefined,
        '5m'
      )
      const res = await nonAuth
        .post('/api/habits/')
        .set('Authorization', `Bearer ${corruptedToken}`)
        .send(demoHabit)

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Unauthorized')
    })

    it('should create a habit for existing user and return it', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.post('/api/habits/').send(demoHabit)

      expect(res.status).toBe(201)
      expect(res.body.habit).toHaveProperty('id')
    })

    it('should return 400 when body validation fails', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.post('/api/habits/').send({ name: '' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/habits/, getUserHabits', () => {
    it('should return habits for current authenticated user', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/habits/')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('habits')
    })

    it('should return empty array if user has no habits', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/habits/')

      expect(res.status).toBe(200)
      expect(res.body.habits).toEqual([])
    })

    it('should reject expired token', async () => {
      const { nonAuth } = await createTestNonAuth()
      const expiredToken = await generateFakeToken(
        { id: '123' },
        undefined,
        '-1s'
      )
      const res = await nonAuth
        .get('/api/habits/')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/habits/:id, getHabitById', () => {
    it('should return one habit', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id, demoHabit)
      const res = await auth.get(`/api/habits/${habit.id}`)

      expect(res.status).toBe(200)
      expect(res.body.habit.id).toBe(habit.id)
    })

    it('should return 400 when habit id is invalid uuid', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/habits/bad-id')

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('PUT /api/habits/:id, updateHabit', () => {
    it('should update habit and return it', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id, demoHabit)
      const res = await auth.put(`/api/habits/${habit.id}`).send({
        name: 'Drink Coffee',
        description: 'Drink 1 cup of coffee every morning after 9AM.',
        targetCount: 1,
      })
      const updatedHabit = await auth.get(`/api/habits/${habit.id}`)

      expect(res.status).toBe(200)
      expect(res.body.habit.id).toBe(updatedHabit.body.habit.id)
      expect(habit.name).not.toBe(updatedHabit.body.habit.name)
      expect(habit.targetCount).not.toBe(updatedHabit.body.habit.targetCount)
    })

    it('should return 404 when habit does not exist', async () => {
      const { auth } = await createTestAuth()
      const uuid = crypto.randomUUID()
      const res = await auth.put(`/api/habits/${uuid}`).send({
        name: 'Drink Coffee',
        description: 'Drink 1 cup of coffee every morning after 9AM.',
        targetCount: 1,
      })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Habit not found')
    })

    it('should return 400 when habit id is invalid uuid', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.put('/api/habits/not-a-uuid').send({ name: 'x' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('POST /api/habits/:id/complete, completeHabit', () => {
    it('should return entry when user complete a habit', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id, {
        ...demoHabit,
        isActive: true,
      })
      const res = await auth
        .post(`/api/habits/${habit.id}/complete`)
        .send({ note: "Let's go, I got this" })
      const [entry] = await db
        .select()
        .from(entries)
        .where(eq(entries.habitId, habit.id))

      expect(res.status).toBe(201)
      expect(res.body.entry.habitId).toBe(entry.habitId)
    })

    it('should return 404 when habit does not exist', async () => {
      const { auth } = await createTestAuth()
      const uuid = crypto.randomUUID()
      const res = await auth
        .post(`/api/habits/${uuid}/complete`)
        .send({ note: "Let's go, I got this" })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Habit not found')
    })

    it('should return 400 when habit is not active', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id, {
        ...demoHabit,
        isActive: false,
      })
      const res = await auth
        .post(`/api/habits/${habit.id}/complete`)
        .send({ note: "Let's go, I got this" })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Can not complete an inactive habit')
    })
  })

  describe('POST /api/habits/:id/tags, addTagsToHabit', () => {
    it('should add tags to specific habit', async () => {
      const { auth, user } = await createTestAuth()
      const tag1 = await createTestTag()
      const tag2 = await createTestTag({ name: 'Sport', color: '#fa5a45' })
      const habit = await createTestHabit(user.id)
      const res = await auth.post(`/api/habits/${habit.id}/tags`).send({
        tagIds: [tag1.id, tag2.id],
      })
      const addedHabitTags = await db
        .select()
        .from(habitTags)
        .where(eq(habitTags.habitId, habit.id))

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Tags added to habit')
      expect(addedHabitTags.length).toBe(2)
    })

    it('should not duplicate existing tags if already linked', async () => {
      const { auth, user } = await createTestAuth()
      const tag = await createTestTag()
      const habit = await createTestHabit(user.id)
      // add it early using db
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      // add it again using api endpoint
      const res = await auth.post(`/api/habits/${habit.id}/tags`).send({
        tagIds: [tag.id],
      })
      // query database
      const addedHabitTags = await db
        .select()
        .from(habitTags)
        .where(eq(habitTags.habitId, habit.id))

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Tags added to habit')
      // should be only one tag for this habit
      expect(addedHabitTags.length).toBe(1)
    })

    it('should return 404 when habit does not exist', async () => {
      const { auth } = await createTestAuth()
      const tag1 = await createTestTag()
      const tag2 = await createTestTag({ name: 'Sport', color: '#fa5a45' })
      const uuid = crypto.randomUUID()
      const res = await auth.post(`/api/habits/${uuid}/tags`).send({
        tagIds: [tag1.id, tag2.id],
      })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Habit not found')
    })

    it('should return 400 when tagIds is invalid', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id)
      const res = await auth
        .post(`/api/habits/${habit.id}/tags`)
        .send({ tagIds: ['bad-uuid'] })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })

    it('should return 400 when tag does not exist', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id)
      const uuid = crypto.randomUUID()
      const res = await auth
        .post(`/api/habits/${habit.id}/tags`)
        .send({ tagIds: [uuid] })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid reference')
    })
  })

  describe('DELETE /api/habits/:id/tags/:tagId, removeTagFromHabit', () => {
    it('should remove existing tag from existing habit', async () => {
      const { auth, user } = await createTestAuth()
      const tag = await createTestTag()
      const habit = await createTestHabit(user.id)
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      const res = await auth.delete(`/api/habits/${habit.id}/tags/${tag.id}`)
      const existsHabitTags = await db
        .select()
        .from(habitTags)
        .where(eq(habitTags.habitId, habit.id))

      expect(res.status).toBe(200)
      expect(existsHabitTags.length).toBe(0)
      expect(res.body.message).toBe('Tag removed from habit')
    })

    it('should return 404 when habit does not exist', async () => {
      const { auth } = await createTestAuth()
      const tag = await createTestTag()
      const uuid = crypto.randomUUID()
      const res = await auth.delete(`/api/habits/${uuid}/tags/${tag.id}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Habit not found')
    })
  })

  describe('DELETE /api/habits/:id, deleteHabit', () => {
    it('should return habit with specific od for current user', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id, demoHabit)
      const res = await auth.delete(`/api/habits/${habit.id}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Habit deleted successfully')
    })

    it('should return 404 when habit does not exist', async () => {
      const { auth } = await createTestAuth()
      const uuid = crypto.randomUUID()
      const res = await auth.delete(`/api/habits/${uuid}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Habit not found')
    })
  })
})
