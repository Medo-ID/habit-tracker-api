import type { Request, Response, NextFunction } from 'express'
import { env } from '../../env.ts'

export interface CustomError extends Error {
  status?: number
  code?: string
}

export function globalError(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log('error cause:', err.cause)

  let status = err.status || 500
  let message = err.message || 'Internal Server Error'

  // Prefer err.cause.code if available
  const errorCode = (err as any).code || (err.cause && (err.cause as any).code)

  if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation Error'
  }

  if (err.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized'
  }

  if (errorCode === '23505') {
    // PostgreSQL unique violation
    status = 409
    message = 'Resource already exists'
  }

  if (errorCode === '23503') {
    // PostgreSQL foreign key violation
    status = 400
    message = 'Invalid reference'
  }

  res.status(status).json({
    error: message,
    ...(env.APP_STAGE === 'dev' && {
      stack: err.stack,
      details: err.message,
    }),
  })
}
