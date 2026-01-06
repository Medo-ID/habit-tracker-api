import { createClient, type RedisClientType } from 'redis'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../../env.ts'

// Redis client
let client: RedisClientType | null = null
let connecting: Promise<RedisClientType> | null = null

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (env.NODE_ENV === 'test') return null

  if (client?.isOpen) {
    return client
  }

  if (!connecting) {
    connecting = (async () => {
      const c = createClient({
        url: env.REDIS_URL,
      })

      c.on('error', (err) => {
        console.error('Redis error:', err)
      })

      await c.connect()
      // @ts-ignore
      client = c
      return c
    })().catch((err) => {
      console.error('Redis connection failed:', err)
      connecting = null
      return null
    })
  }
  return connecting
}

// Configuration
const WINDOW_MS = env.RATE_LIMIT_WINDOW_MS
const MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS
const LOG_WINDOW_MS = 60 * 1000

// Custom types
interface RequestLog {
  requestTimestamp: number
  requestCount: number
}

export async function customRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      return next()
    }

    const ip = req.ip ?? 'unknown'
    const now = Date.now()

    const recordJSON = await redis.get(ip)
    if (!recordJSON) {
      const initialRecord: RequestLog[] = [
        { requestTimestamp: now, requestCount: 1 },
      ]
      await redis.set(ip, JSON.stringify(initialRecord))
      return next()
    }

    const records = JSON.parse(recordJSON?.toString() || '[]') as RequestLog[]

    // Filter logs within the active window
    const windowStart = now - WINDOW_MS
    const recentRequests = records.filter(
      (log) => log.requestTimestamp > windowStart
    )
    const totalRequestsInWindow = recentRequests.reduce(
      (sum, log) => sum + log.requestCount,
      0
    )

    // Enforce rate limit
    if (totalRequestsInWindow >= MAX_REQUESTS) {
      const oldestRequest = recentRequests[0]
      const timePassed = now - oldestRequest.requestTimestamp
      const timeRemaining = WINDOW_MS - timePassed

      const minutesRemaining = Math.ceil(timeRemaining / 1000 / 60)
      return res.status(429).json({
        error: `Rate limit exceeded. You can retry in ${minutesRemaining} minutes${
          minutesRemaining > 1 ? 's' : ''
        }.`,
      })
    }

    // Update or add request log
    const lastLog = records[records.length - 1]
    const lastLogWithinHour = lastLog.requestTimestamp > now - LOG_WINDOW_MS

    if (lastLogWithinHour) {
      // Increment last request count
      lastLog.requestCount += 1
      records[records.length - 1] = lastLog
    } else {
      // Start new hourly log
      records.push({ requestTimestamp: now, requestCount: 1 })
    }

    await redis.set(ip, JSON.stringify(records))

    return next()
  } catch (error) {
    console.error('Rate limiter error:', error)
    return next()
  }
}
