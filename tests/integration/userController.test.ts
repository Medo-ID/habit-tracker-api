import { eq } from 'drizzle-orm'
import { db } from '../../src/db/connection.ts'
import { users } from '../../src/db/schema.ts'
import { cleanupTestDatabase, createTestAuth } from '../helpers.ts'

describe('userController', () => {
  afterEach(async () => await cleanupTestDatabase())

  describe('GET /api/users/profile, getProfile', () => {
    it('should fetch profile for the correct user', async () => {
      const { auth, user } = await createTestAuth()
      const res = await auth.get('/api/users/profile')

      expect(res.status).toBe(200)
      expect(res.body.user.id).toBe(user.id)
      expect(res.body.user.email).toBe(user.email)
    })

    it('should return 404 when user does not exists', async () => {
      const { auth, user } = await createTestAuth()
      await db.delete(users).where(eq(users.id, user.id))
      const res = await auth.get('/api/users/profile')

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('User not found')
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
      const { auth } = await createTestAuth()
      const res = await auth.put('/api/users/profile').send(updateData)

      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe(updateData.email)
      expect(res.body.user.username).toBe(updateData.username)
    })

    it('should return 400 when body validation fails', async () => {
      const { auth } = await createTestAuth()
      const res = await auth.put('/api/users/profile').send({ badField: '' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
    })

    it('should return 404 when user does not exists', async () => {
      const { auth, user } = await createTestAuth()
      await db.delete(users).where(eq(users.id, user.id))
      const res = await auth.put('/api/users/profile').send(updateData)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('User not found')
    })
  })

  describe('POST /api/users/change-password, changePassword', () => {
    it("should update current authenticated user's password", async () => {
      const { auth, rawPassword } = await createTestAuth()
      const res = await auth
        .post('/api/users/change-password')
        .send({ oldPassword: rawPassword, newPassword: 'Demo1234@' })

      expect(res.status).toBe(201)
    })

    it('should throw error when old password is incorrect', async () => {
      const { auth } = await createTestAuth()
      const res = await auth
        .post('/api/users/change-password')
        .send({ oldPassword: 'badOldPassword', newPassword: 'Demo1234@' })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Old password is incorrect')
    })

    it('should return 404 when user does not exists', async () => {
      const { auth, user, rawPassword } = await createTestAuth()
      await db.delete(users).where(eq(users.id, user.id))
      const res = await auth
        .post('/api/users/change-password')
        .send({ oldPassword: rawPassword, newPassword: 'Demo1234@' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('User not found')
    })
  })
})
