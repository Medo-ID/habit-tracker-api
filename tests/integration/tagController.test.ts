import { db } from '../../src/db/connection.ts'
import { habitTags, tags } from '../../src/db/schema.ts'
import {
  cleanupTestDatabase,
  createTestAuth,
  createTestHabit,
  createTestTag,
} from '../helpers.ts'
import { eq } from 'drizzle-orm'

describe('tagController', () => {
  const demoTag = {
    name: 'Sport',
    color: '#d89a25',
  }
  afterEach(async () => cleanupTestDatabase())

  describe('POST /api/tags/, createTag', () => {
    it('should create and return a tag', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.post('/api/tags/').send(demoTag)
      const existingTags = await db.select().from(tags)

      expect(existingTags.length).toBe(1)
      expect(res.status).toBe(201)
      expect(res.body.tag.id).toBe(existingTags[0].id)
    })

    it('should return 409 when tag already exists', async () => {
      const { auth } = await createTestAuth()
      await createTestTag(demoTag)
      const res = await auth.post('/api/tags/').send(demoTag)
      const existingTags = await db.select().from(tags)

      expect(existingTags.length).toBe(1)
      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Tag with this name already exists')
    })

    it('should return 400 when invalid body', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.post('/api/tags/').send({ color: '#d89a25' })
      const existingTags = await db.select().from(tags)

      expect(res.status).toBe(400)
      expect(existingTags.length).toBe(0)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/tags/, getTags', () => {
    it('should get all existing tags', async () => {
      const { auth } = await createTestAuth()
      await createTestTag()
      await createTestTag({ name: 'Sport', color: '#ad34ad' })
      const res = await auth.get('/api/tags/')

      expect(res.status).toBe(200)
      expect(res.body.tags.length).toBe(2)
    })

    it('should inform user to create new tags when empty result', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/tags/')

      expect(res.status).toBe(200)
      expect(res.body.message).toBe(
        'Tags collection is empty, try to create one'
      )
    })
  })

  describe('GET /api/tags/:id, getTagById', () => {
    it("should return one tag with it's assoctiated habits for current user", async () => {
      const { auth, user } = await createTestAuth()
      const tag = await createTestTag()
      const habit = await createTestHabit(user.id)
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      const res = await auth.get(`/api/tags/${tag.id}`)

      expect(res.status).toBe(200)
      expect(res.body.tag.id).toBe(tag.id)
      expect(res.body.tag.name).toBe(tag.name)
      expect(res.body.tag.habitTags[0].habit.id).toBe(habit.id)
      expect(res.body.tag.habitTags[0].habit.name).toBe(habit.name)
    })

    it('should return 404 when tag not exists', async () => {
      const { auth } = await createTestAuth()
      await createTestTag()
      const uuid = crypto.randomUUID()
      const res = await auth.get(`/api/tags/${uuid}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation failed', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/tags/bad-uuid')

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('PUT /api/tags/:id, updateTag', () => {
    const updateData = {
      name: 'Health Care',
      color: '#23ac24',
    }

    it('should update existing tag and return it', async () => {
      const { auth } = await createTestAuth()
      const tag = await createTestTag()
      const res = await auth.put(`/api/tags/${tag.id}`).send(updateData)
      const [updatedTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tag.id))

      expect(res.status).toBe(201)
      expect(res.body.tag.id).toBe(tag.id)
      expect(res.body.tag.name).not.toBe(tag.name)
      expect(res.body.tag.id).toBe(updatedTag.id)
      expect(res.body.tag.name).toBe(updatedTag.name)
    })

    it('should return 404 when tag not exists - name is present in body', async () => {
      const { auth } = await createTestAuth()
      const uuid = crypto.randomUUID()
      const res = await auth.put(`/api/tags/${uuid}`).send(updateData)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Tag name does not exist')
    })

    it('should return 404 when tag not exists name is not present in body', async () => {
      const { auth } = await createTestAuth()
      const uuid = crypto.randomUUID()
      const res = await auth.put(`/api/tags/${uuid}`).send({ color: '#23ac24' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation fails', async () => {
      const { auth } = await createTestAuth()
      const res = await auth
        .put('/api/tags/bad-uuid')
        .send({ color: '#23ac24' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })

    it('should return 400 when body validation fails', async () => {
      const { auth } = await createTestAuth()
      const tag = await createTestTag()
      const res = await auth
        .put(`/api/tags/${tag.id}`)
        .send({ notExpected: '' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('DELETE /api/tags/:id, deleteTag', () => {
    it('should delete existing tag and habitTags', async () => {
      const { auth, user } = await createTestAuth()
      const habit = await createTestHabit(user.id)
      const tag = await createTestTag()
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      const res = await auth.delete(`/api/tags/${tag.id}`)
      const getHbitTags = await db
        .select()
        .from(habitTags)
        .where(eq(habitTags.tagId, tag.id))

      expect(res.status).toBe(201)
      expect(res.body.tag.id).toBe(tag.id)
      expect(getHbitTags.length).toBe(0)
    })

    it('should return 404 when tag does not exists', async () => {
      const { auth } = await createTestAuth()
      await createTestTag()
      const uuid = crypto.randomUUID()
      const res = await auth.delete(`/api/tags/${uuid}`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation fails', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.delete(`/api/tags/bad-uuif`)

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/tags/popular', () => {
    it('should return popular tags', async () => {
      const { auth, user } = await createTestAuth()
      const habit1 = await createTestHabit(user.id)
      const habit2 = await createTestHabit(user.id, {
        name: `Test Habit ${Date.now()}`,
        frequency: 'weekly',
      })
      await createTestTag({ name: 'tag1' })
      const tag2 = await createTestTag({ name: 'tag2' })
      const tag3 = await createTestTag({ name: 'tag3' })
      await db.insert(habitTags).values([
        { habitId: habit1.id, tagId: tag3.id },
        { habitId: habit2.id, tagId: tag3.id },
        { habitId: habit1.id, tagId: tag2.id },
      ])
      const res = await auth.get('/api/tags/popular')

      expect(res.status).toBe(200)
      expect(res.body.tags[0].id).toBe(tag3.id)
      expect(res.body.tags[1].id).toBe(tag2.id)
    })

    it('should return undefined when user has no tags', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.get('/api/tags/popular')

      expect(res.status).toBe(200)
      expect(res.body.tag).toBeUndefined()
    })
  })

  describe('GET /api/tags/:id/habits, getTagHabits', () => {
    it('should return tag and its associated habits', async () => {
      const { auth, user } = await createTestAuth()
      const tag = await createTestTag()
      const habit1 = await createTestHabit(user.id)
      const habit2 = await createTestHabit(user.id, {
        name: `Test Habit ${Date.now()}`,
        frequency: 'weekly',
      })
      await db.insert(habitTags).values([
        { habitId: habit1.id, tagId: tag.id },
        { habitId: habit2.id, tagId: tag.id },
      ])
      const res = await auth.get(`/api/tags/${tag.id}/habits`)

      expect(res.status).toBe(200)
      expect(res.body.tag).toBe(tag.name)
      expect(res.body.habits.length).toBe(2)
    })

    it('should inform user when tag is not associated yet', async () => {
      const { auth, user } = await createTestAuth()
      const tag = await createTestTag()
      await createTestHabit(user.id)
      await createTestHabit(user.id, {
        name: `Test Habit ${Date.now()}`,
        frequency: 'weekly',
      })
      const res = await auth.get(`/api/tags/${tag.id}/habits`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('No habits created with this tag yet')
    })

    it('should return 404 when tag does not exists', async () => {
      const { auth } = await createTestAuth()
      await createTestTag()
      const uuid = crypto.randomUUID()
      const res = await auth.get(`/api/tags/${uuid}/habits`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Tag not found')
    })
  })
})
