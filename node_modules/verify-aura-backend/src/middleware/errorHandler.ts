//backend/src/middleware/errorHandler.ts

import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  const status = (err as any)?.status || 500;
  res.status(status).json({ success: false, message });
}

export function rateLimitErrorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  // If it's a rate limit error, send JSON, else pass on
  if (err && err.status === 429) {
    return res.status(429).json(err.message || {
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
    });
  }
  return next(err);
}


