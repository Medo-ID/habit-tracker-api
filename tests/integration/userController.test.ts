import request from 'supertest'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/connection.ts'
import { users } from '../../src/db/schema.ts'
import {
  authenticatedRequest,
  cleanupTestDatabase,
  createTestUser,
} from '../helpers.ts'
import { app } from '../../src/server.ts'

describe('userController', () => {
  afterEach(async () => await cleanupTestDatabase())

  describe('GET /api/users/profile, getProfile', () => {
    it('should fetch profile for the correct user', async () => {
      const { user, accessToken } = await createTestUser()
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.user.id).toBe(user.id)
      expect(response.body.user.email).toBe(user.email)
    })

    it('should return 404 when user does not exists', async () => {
      const { user, accessToken } = await createTestUser()
      await db.delete(users).where(eq(users.id, user.id))
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('PUT /api/users/profile, updateProfile', () => {
    const updateData = {
      email: 'update@example.com',
      username: 'updateuser',
      firstName: 'updateFirst',
      lastName: 'updateLast',
    }

    it('should update and return user profile data', async () => {
      const response = await authenticatedRequest(
        'put',
        '/api/users/profile',
        updateData
      )

      expect(response.status).toBe(200)
      expect(response.body.user.email).toBe(updateData.email)
      expect(response.body.user.username).toBe(updateData.username)
    })

    it('should return 400 when body validation fails', async () => {
      const response = await authenticatedRequest('put', '/api/users/profile', {
        badField: '',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should return 404 when user does not exists', async () => {
      const { user, accessToken } = await createTestUser()
      await db.delete(users).where(eq(users.id, user.id))
      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('POST /api/users/change-password, changePassword', () => {
    it("should update current authenticated user's password", async () => {
      const { accessToken, rawPassword } = await createTestUser()
      const response = await request(app)
        .post('/api/users/change-password')
        .send({ oldPassword: rawPassword, newPassword: 'Demo1234@' })
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(201)
    })

    it('should throw error when old password is incorrect', async () => {
      const { accessToken } = await createTestUser()
      const response = await request(app)
        .post('/api/users/change-password')
        .send({ oldPassword: 'badOldPassword', newPassword: 'Demo1234@' })
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Old password is incorrect')
    })

    it('should return 404 when user does not exists', async () => {
      const { user, accessToken, rawPassword } = await createTestUser()
      await db.delete(users).where(eq(users.id, user.id))
      const response = await request(app)
        .post('/api/users/change-password')
        .send({ oldPassword: rawPassword, newPassword: 'Demo1234@' })
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })
  })
})
