import request from 'supertest'
import { db } from '../../../src/db/connection.ts'
import { refreshTokens, users } from '../../../src/db/schema.ts'
import { app } from '../../../src/server.ts'
import { except } from 'drizzle-orm/gel-core'

describe('authController', () => {
  afterEach(async () => {
    await db.delete(refreshTokens)
    await db.delete(users)
  })

  describe('register', () => {
    it('POST /api/auth/register, should return user and token', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123456a@',
      })

      expect(response.status).toBe(201)
      expect(response.body.user.email).toBe('demo@user.com')
      expect(typeof response.body.accessToken).toBe('string')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('POST /api/auth/register, should throw when field is missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        password: 'A123456a@',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation fails')
      expect(response.body.details.length).toBeGreaterThanOrEqual(1)
    })

    it('POST /api/auth/register, should throw when password is weak', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation fails')
      expect(response.body.details.length).toBeGreaterThanOrEqual(1)
    })

    it('POST /api/auth/register, should throw when registering existing user', async () => {
      const body = {
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123456a@',
      }
      await request(app).post('/api/auth/register').send(body)
      const response = await request(app).post('/api/auth/register').send(body)

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('Resource already exists')
    })
  })

  describe('login', () => {
    const body = {
      email: 'demo@user.com',
      username: 'testDemo',
      password: 'A123456a@',
    }
    beforeAll(async () => {
      await request(app).post('/api/auth/register').send(body)
    })

    it('POST /api/auth/login, should return user and accessToken', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: body.email,
        password: body.password,
      })

      expect(response.status).toBe(200)
      expect(response.body.user.email).toBe(body.email)
      expect(typeof response.body.accessToken).toBe('string')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('POST /api/auth/login, should return error for unregistered user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'bad@user.com',
        password: 'badPassword',
      })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('POST /api/auth/login, should return error for invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'demo@user.com',
        password: 'badPassword',
      })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid credentials')
    })
  })
})
