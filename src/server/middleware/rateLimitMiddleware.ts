/**
 * Sliding-Window Redis Rate Limiter Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../redis/redisClient';

export const rateLimit = (options: { maxRequests: number; windowSeconds: number; keyPrefix?: string }) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const identifier = `${options.keyPrefix || 'rl'}:${ip}`;

    const result = await redisClient.checkRateLimit(
      identifier,
      options.maxRequests,
      options.windowSeconds
    );

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetSeconds);

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: `Too many requests. Please try again in ${result.resetSeconds} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.resetSeconds
      });
      return;
    }

    next();
  };
};
