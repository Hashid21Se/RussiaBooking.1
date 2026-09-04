/**
 * Authentication & RBAC Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../types';
import { JwtPayload } from '../services/authService';
import { redisClient } from '../redis/redisClient';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'production-access-secret-russiabooking-2026';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : cookieToken;

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Authentication required. Please provide a valid token.',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

    // Check Redis revocation blacklist
    const isRevoked = await redisClient.isTokenBlacklisted(decoded.jti);
    if (isRevoked) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked. Please sign in again.',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token.',
      code: 'TOKEN_EXPIRED'
    });
  }
};

/**
 * RBAC Guard: Restrict route access to specific roles
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden. Requires one of roles: [${allowedRoles.join(', ')}].`,
        code: 'FORBIDDEN_ROLE'
      });
      return;
    }

    next();
  };
};
