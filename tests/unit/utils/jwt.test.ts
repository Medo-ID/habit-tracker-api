import { generateTokens, verifyToken } from '../../../src/utils/jwt.ts'
import { SignJWT } from 'jose'
import { createSecretKey } from 'crypto'

describe('JWT utils', () => {
  const payload = {
    id: '123',
    email: 'demo@user.com',
    username: 'demoUser',
  }

  let tokens: Awaited<ReturnType<typeof generateTokens>>

  beforeAll(async () => {
    process.env.ACCESS_SECRET = 'access_secret_key_access_secret_key'
    process.env.REFRESH_SECRET = 'refresh_secret_key_refresh_secret_key'
    tokens = await generateTokens(payload)
  })

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })
  })

  describe('verifyToken', () => {
    it('should verify access token and return correct payload', async () => {
      const decoded = await verifyToken(tokens.accessToken, 'access')
      expect(decoded.id).toBe(payload.id)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.username).toBe(payload.username)
    })

    it('should verify refresh token and return correct payload', async () => {
      const decoded = await verifyToken(tokens.refreshToken, 'refresh')
      expect(decoded.id).toBe(payload.id)
    })

    it('should throw when access token is corrupted', async () => {
      const invalid = tokens.accessToken.slice(0, -5)
      await expect(verifyToken(invalid, 'access')).rejects.toThrow()
    })

    it('should throw when verified with wrong secret', async () => {
      await expect(verifyToken(tokens.accessToken, 'refresh')).rejects.toThrow()
    })

    it('should throw when access token is expired', async () => {
      const key = createSecretKey(process.env.ACCESS_SECRET!, 'utf-8')
      const expiredToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1s')
        .sign(key)

      await new Promise((r) => setTimeout(r, 1500))
      await expect(verifyToken(expiredToken, 'access')).rejects.toThrow()
    })
  })
})
