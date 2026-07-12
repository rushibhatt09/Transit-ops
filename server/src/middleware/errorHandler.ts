import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message })
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return res.status(400).json({ message })
  }
  if (err instanceof Error) {
    const anyErr = err as any
    if (anyErr.code === 'P2002') {
      const field = anyErr.meta?.target?.[0] ?? 'field'
      return res.status(409).json({ message: `A record with this ${field} already exists.` })
    }
    console.error(err)
    return res.status(500).json({ message: err.message || 'Internal server error' })
  }
  console.error(err)
  return res.status(500).json({ message: 'Internal server error' })
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
