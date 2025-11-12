import request from 'supertest'
import { db } from '../../src/db/connection.ts'
import { habitTags, tags } from '../../src/db/schema.ts'
import {
  authenticatedRequest,
  cleanupTestDatabase,
  createTestHabit,
  createTestTag,
  createTestUser,
} from '../helpers.ts'
import { app } from '../../src/server.ts'
import { eq } from 'drizzle-orm'

describe('tagController', () => {
  const demoTag = {
    name: 'Sport',
    color: '#d89a25',
  }
  afterEach(async () => cleanupTestDatabase())

  describe('POST /api/tags/, createTag', () => {
    it('should create and return a tag', async () => {
      const response = await authenticatedRequest('post', '/api/tags/', demoTag)
      const existingTags = await db.select().from(tags)

      expect(existingTags.length).toBe(1)
      expect(response.status).toBe(201)
      expect(response.body.tag.id).toBe(existingTags[0].id)
    })

    it('should return 409 when tag already exists', async () => {
      await createTestTag(demoTag)
      const response = await authenticatedRequest('post', '/api/tags/', demoTag)
      const existingTags = await db.select().from(tags)

      expect(existingTags.length).toBe(1)
      expect(response.status).toBe(409)
      expect(response.body.error).toBe('Tag with this name already exists')
    })

    it('should return 400 when invalid body', async () => {
      const response = await authenticatedRequest('post', '/api/tags/', {
        color: '#d89a25',
      })
      const existingTags = await db.select().from(tags)

      expect(response.status).toBe(400)
      expect(existingTags.length).toBe(0)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/tags/, getTags', () => {
    it('should get all existing tags', async () => {
      await createTestTag()
      await createTestTag({ name: 'Sport', color: '#ad34ad' })
      const response = await authenticatedRequest('get', '/api/tags/')

      expect(response.status).toBe(200)
      expect(response.body.tags.length).toBe(2)
    })

    it('should inform user to create new tags when empty result', async () => {
      const response = await authenticatedRequest('get', '/api/tags/')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe(
        'Tags collection is empty, try to create one'
      )
    })
  })

  describe('GET /api/tags/:id, getTagById', () => {
    it("should return one tag with it's assoctiated habits for current user", async () => {
      const { user, accessToken } = await createTestUser()
      const tag = await createTestTag()
      const habit = await createTestHabit(user.id)
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      const response = await request(app)
        .get(`/api/tags/${tag.id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.tag.id).toBe(tag.id)
      expect(response.body.tag.name).toBe(tag.name)
      expect(response.body.tag.habitTags[0].habit.id).toBe(habit.id)
      expect(response.body.tag.habitTags[0].habit.name).toBe(habit.name)
    })

    it('should return 404 when tag not exists', async () => {
      const { accessToken } = await createTestUser()
      await createTestTag()
      const uuid = crypto.randomUUID()
      const response = await request(app)
        .get(`/api/tags/${uuid}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation failed', async () => {
      const response = await authenticatedRequest('get', '/api/tags/bad-uuid')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('PUT /api/tags/:id, updateTag', () => {
    const updateData = {
      name: 'Health Care',
      color: '#23ac24',
    }

    it('should update existing tag and return it', async () => {
      const { accessToken } = await createTestUser()
      const tag = await createTestTag()
      const response = await request(app)
        .put(`/api/tags/${tag.id}`)
        .send(updateData)
        .set('Authorization', `Bearer ${accessToken}`)
      const [updatedTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tag.id))

      expect(response.status).toBe(201)
      expect(response.body.tag.id).toBe(tag.id)
      expect(response.body.tag.name).not.toBe(tag.name)
      expect(response.body.tag.id).toBe(updatedTag.id)
      expect(response.body.tag.name).toBe(updatedTag.name)
    })

    it('should return 404 when tag not exists - name is present in body', async () => {
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest(
        'put',
        `/api/tags/${uuid}`,
        updateData
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tag name does not exists')
    })

    it('should return 404 when tag not exists name is not present in body', async () => {
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest('put', `/api/tags/${uuid}`, {
        color: '#23ac24',
      })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation fails', async () => {
      const response = await authenticatedRequest('put', '/api/tags/bad-uuid', {
        color: '#23ac24',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should return 400 when body validation fails', async () => {
      const tag = await createTestTag()
      const response = await authenticatedRequest(
        'put',
        `/api/tags/${tag.id}`,
        { notExpected: '' }
      )

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('DELETE /api/tags/:id, deleteTag', () => {
    it('should delete existing tag and habitTags', async () => {
      const { user, accessToken } = await createTestUser()
      const habit = await createTestHabit(user.id)
      const tag = await createTestTag()
      await db.insert(habitTags).values({ habitId: habit.id, tagId: tag.id })
      const response = await request(app)
        .delete(`/api/tags/${tag.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
      const getHbitTags = await db
        .select()
        .from(habitTags)
        .where(eq(habitTags.tagId, tag.id))

      expect(response.status).toBe(201)
      expect(response.body.tag.id).toBe(tag.id)
      expect(getHbitTags.length).toBe(0)
    })

    it('should return 404 when tag does not exists', async () => {
      await createTestTag()
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest('delete', `/api/tags/${uuid}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tag not found')
    })

    it('should return 400 when params validation fails', async () => {
      const response = await authenticatedRequest(
        'delete',
        `/api/tags/bad-uuif`
      )

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })
  })

  describe('GET /api/tags/popular', () => {
    it('should return popular tags', async () => {
      const { user, accessToken } = await createTestUser()
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
      const response = await request(app)
        .get('/api/tags/popular')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.tags[0].id).toBe(tag3.id)
      expect(response.body.tags[1].id).toBe(tag2.id)
    })

    it('should return undefined when user has no tags', async () => {
      const response = await authenticatedRequest('get', '/api/tags/popular')

      expect(response.status).toBe(200)
      expect(response.body.tag).toBeUndefined()
    })
  })

  describe('GET /api/tags/:id/habits, getTagHabits', () => {
    it('should return tag and its associated habits', async () => {
      const { user, accessToken } = await createTestUser()
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
      const response = await request(app)
        .get(`/api/tags/${tag.id}/habits`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.tag).toBe(tag.name)
      expect(response.body.habits.length).toBe(2)
    })

    it('should inform user when tag is not associated yet', async () => {
      const { user, accessToken } = await createTestUser()
      const tag = await createTestTag()
      await createTestHabit(user.id)
      await createTestHabit(user.id, {
        name: `Test Habit ${Date.now()}`,
        frequency: 'weekly',
      })
      const response = await request(app)
        .get(`/api/tags/${tag.id}/habits`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('No habits created with this tag yet')
    })

    it('should return 404 when tag does not exists', async () => {
      await createTestTag()
      const uuid = crypto.randomUUID()
      const response = await authenticatedRequest(
        'get',
        `/api/tags/${uuid}/habits`
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Tag not found')
    })
  })
})
