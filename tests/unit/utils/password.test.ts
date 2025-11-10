import { hashPassword, verifyPassword } from '../../../src/utils/password.ts'

describe('Password, hash and verify', () => {
  const demoPass = 'A123456a@'

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const result = await hashPassword(demoPass)

      expect(result).toBeDefined()
      expect(result).toBeTypeOf('string')
    })
  })

  describe('verifyPassword', () => {
    it('should return true when correct', async () => {
      const hashedPass = await hashPassword(demoPass)
      const result = await verifyPassword(demoPass, hashedPass)

      expect(result).toBeTypeOf('boolean')
      expect(result).toBeTruthy
    })

    it('should return false when incorrect', async () => {
      const hashedPass = await hashPassword(demoPass)
      const result = await verifyPassword('badPass', hashedPass)

      expect(result).toBeTypeOf('boolean')
      expect(result).toBeFalsy
    })
  })
})
