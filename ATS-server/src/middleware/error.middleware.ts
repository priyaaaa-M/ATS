import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { AppError } from '../types'

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: 'Application Error',
      message: err.message,
    })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    })
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    })
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: config.isDev ? err.message : 'Something went wrong',
    stack: config.isDev ? err.stack : undefined,
  })
}
