import request from 'supertest'
import app from '../../src/index.ts'
import { cleanupTestDatabase } from '../helpers.ts'

describe('authController', () => {
  afterEach(async () => await cleanupTestDatabase())

  describe('register', () => {
    it('POST /api/auth/register, should return user and token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123456a@',
      })

      expect(res.status).toBe(201)
      expect(res.body.user.email).toBe('demo@user.com')
      expect(typeof res.body.accessToken).toBe('string')
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('POST /api/auth/register, should throw when field is missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        password: 'A123456a@',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
      expect(res.body.details.length).toBeGreaterThanOrEqual(1)
    })

    it('POST /api/auth/register, should throw when password is weak', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Validation failed')
      expect(res.body.details.length).toBeGreaterThanOrEqual(1)
    })

    it('POST /api/auth/register, should throw when registering existing user', async () => {
      const body = {
        email: 'demo@user.com',
        username: 'demoUser',
        password: 'A123456a@',
      }
      await request(app).post('/api/auth/register').send(body)
      const res = await request(app).post('/api/auth/register').send(body)

      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Resource already exists')
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
      const res = await request(app).post('/api/auth/login').send({
        email: body.email,
        password: body.password,
      })

      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe(body.email)
      expect(typeof res.body.accessToken).toBe('string')
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('POST /api/auth/login, should return error for unregistered user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'bad@user.com',
        password: 'badPassword',
      })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid credentials')
    })

    it('POST /api/auth/login, should return error for invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'demo@user.com',
        password: 'badPassword',
      })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid credentials')
    })
  })
})
