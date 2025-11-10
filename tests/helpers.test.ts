import { createTestUser } from './helpers.ts'

describe('Test Database Helpers', () => {
  describe('createTestUser', () => {
    it('should return user, tokens and raw password', async () => {
      const { user, accessToken, refreshToken, rawPassword } =
        await createTestUser()

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toContain('@example.com')
      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()
      expect(rawPassword).toBeDefined()
    })
  })
})
