/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * Implements double-submit cookie / cryptographically signed token pattern
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'rb-csrf-secret-token-key-2026';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export class CsrfProtection {
  /**
   * Generates a signed CSRF token
   */
  public static generateToken(sessionId?: string): string {
    const salt = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now().toString();
    const data = `${sessionId || 'anon'}:${timestamp}:${salt}`;
    const hmac = crypto.createHmac('sha256', CSRF_SECRET).update(data).digest('hex');
    return `${data}:${hmac}`;
  }

  /**
   * Validates a signed CSRF token
   */
  public static validateToken(token: string, expectedSessionId?: string, maxAgeMs = 3600000): boolean {
    if (!token) return false;
    const parts = token.split(':');
    if (parts.length !== 4) return false;

    const [sessionId, timestampStr, salt, providedHmac] = parts;
    if (expectedSessionId && sessionId !== expectedSessionId) {
      return false; // Mismatched session
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return false; // Expired
    }

    const data = `${sessionId}:${timestampStr}:${salt}`;
    const expectedHmac = crypto.createHmac('sha256', CSRF_SECRET).update(data).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
    } catch {
      return false;
    }
  }
}

/**
 * Express Middleware to enforce CSRF token on mutating requests
 */
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Safe read-only HTTP methods are exempt
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Webhooks with HMAC signature headers are exempt (machine-to-machine)
  if (req.headers['x-signature-sha256'] || req.headers['x-tap-signature']) {
    return next();
  }

  const token =
    (req.headers['x-csrf-token'] as string) ||
    (req.headers['csrf-token'] as string) ||
    req.body?._csrf;

  // In test / dev mode, allow simulated CSRF or bypass if explicitly marked
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-csrf']) {
    return next();
  }

  // If token is provided, validate its cryptographic signature
  if (token) {
    if (CsrfProtection.validateToken(token)) {
      return next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired CSRF token.',
        code: 'CSRF_INVALID'
      });
      return;
    }
  }

  // In production, require token on mutating requests; in dev allow with warning or session cookie
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: 'Missing mandatory CSRF token in X-CSRF-Token header.',
      code: 'CSRF_REQUIRED'
    });
    return;
  }

  next();
};
