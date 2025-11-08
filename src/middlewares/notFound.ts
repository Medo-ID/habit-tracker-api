import type { NextFunction, Request, Response } from 'express'
import type { CustomError } from './globalError.ts'

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new Error(`Not found - ${req.originalUrl}`) as CustomError
  error.status = 404
  next(error)
}
