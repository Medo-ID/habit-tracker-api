import { createClient } from 'redis'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../../env.ts'

// Redis client
export const redisClient = env.NODE_ENV === 'test' ? null : createClient()

if (redisClient) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err))
  await redisClient.connect()
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
    if (!redisClient) {
      return next()
    }

    if (!redisClient.isOpen) {
      throw new Error('Redis client is not connected.')
    }

    const ip = req.ip
    const now = Date.now()

    const recordJSON = await redisClient.get(ip)
    if (!recordJSON) {
      const initialRecord: RequestLog[] = [
        { requestTimestamp: now, requestCount: 1 },
      ]
      await redisClient.set(ip, JSON.stringify(initialRecord))
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

    await redisClient.set(ip, JSON.stringify(records))

    return next()
  } catch (error) {
    console.error('Rate limiter error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
