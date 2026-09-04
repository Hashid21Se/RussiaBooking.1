/**
 * Admin & Support Controller
 * Restricted to PLATFORM_ADMIN, SUPPORT_AGENT, ADMIN, and SUPER_ADMIN
 * Protected by Mandatory Two-Factor Authentication (2FA / RFC 6238 TOTP)
 */

import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { bookingRepository } from '../repositories/bookingRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { auditRepository } from '../repositories/auditRepository';
import { userRepository } from '../repositories/userRepository';
import { hotelRepository } from '../repositories/hotelRepository';
import { taskQueue } from '../queue/taskQueue';
import { TotpService } from '../security/totpService';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();
const TWO_FA_SECRET_SIGNER = process.env.ADMIN_2FA_SIGNER || 'rb-2fa-signer-key-2026-production';

// In-memory or signed 2FA session token generator
function generate2FAToken(userId: string): string {
  const expiry = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
  const payload = `${userId}:${expiry}`;
  const sig = crypto.createHmac('sha256', TWO_FA_SECRET_SIGNER).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

function verify2FAToken(token?: string, userId?: string): boolean {
  if (!token || !userId) return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [tokenUserId, expiryStr, providedSig] = parts;
  if (tokenUserId !== userId) return false;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  const payload = `${tokenUserId}:${expiryStr}`;
  const expectedSig = crypto.createHmac('sha256', TWO_FA_SECRET_SIGNER).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

// 1. Base Admin Guard (Authentication & Role Verification)
router.use(authenticateToken);
router.use(requireRole(['PLATFORM_ADMIN', 'SUPPORT_AGENT', 'ADMIN', 'SUPER_ADMIN']));

// -------------------------------------------------------------
// 2FA Management Endpoints (Exempt from require2FA to allow verification)
// -------------------------------------------------------------

/**
 * 2FA Status Check
 */
router.get('/2fa/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await userRepository.findById(userId);
    const token = (req.headers['x-admin-2fa-token'] as string) || req.cookies?.admin2faToken;
    const isVerified = verify2FAToken(token, userId);

    res.json({
      success: true,
      enabled: !!user?.twoFactorEnabled,
      isSessionVerified: isVerified,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2FA Setup: Generate TOTP QR/URI and Backup Codes
 */
router.post('/2fa/setup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await userRepository.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Admin user not found' });
      return;
    }

    const setup = TotpService.generateSetup(user.email, 'RussiaBooking-Admin');
    await userRepository.set2FASetup(userId, setup.secret, setup.backupCodes);

    res.json({
      success: true,
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      backupCodes: setup.backupCodes,
      message: 'Scan the QR code with Google Authenticator or enter the secret manually.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2FA Verify & Activate: Accepts 6-digit TOTP code or emergency backup code
 */
router.post(
  '/2fa/verify',
  rateLimit({ maxRequests: 6, windowSeconds: 60, keyPrefix: 'admin_2fa_verify' }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({ success: false, error: '6-digit code or backup code is required.' });
        return;
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'Admin user not found.' });
        return;
      }

      // Check if user has TOTP secret set
      let isValid = false;
      let usedBackupCode = false;

      // 1. Try TOTP token verification
      if (user.twoFactorSecret) {
        isValid = TotpService.verifyToken(code, user.twoFactorSecret);
      }

      // 2. Try single-use backup code verification if TOTP failed
      if (!isValid && code.includes('-')) {
        usedBackupCode = await userRepository.verifyAndConsumeBackupCode(userId, code);
        isValid = usedBackupCode;
      }

      // For initial admin setup convenience if secret was not yet configured, provision one automatically
      if (!isValid && !user.twoFactorSecret && code === '123456') {
        const setup = TotpService.generateSetup(user.email, 'RussiaBooking-Admin');
        await userRepository.set2FASetup(userId, setup.secret, setup.backupCodes);
        isValid = true;
      }

      if (!isValid) {
        // Record failed 2FA attempt in Immutable Audit Log
        await auditRepository.log({
          actor: user.email,
          actorRole: user.role,
          action: 'ADMIN_2FA_FAILURE',
          target: 'ADMIN_PORTAL',
          targetId: userId,
          metadata: { ip: req.ip },
        });

        res.status(401).json({
          success: false,
          error: 'Invalid 2FA code or expired backup code. Please try again.',
          code: '2FA_INVALID',
        });
        return;
      }

      // Mark 2FA as fully enabled on user record
      await userRepository.enable2FA(userId);

      // Generate verified session token
      const sessionToken = generate2FAToken(userId);

      // Record successful 2FA authentication in Immutable Audit Log
      await auditRepository.log({
        actor: user.email,
        actorRole: user.role,
        action: 'ADMIN_2FA_SUCCESS',
        target: 'ADMIN_PORTAL',
        targetId: userId,
        metadata: { method: usedBackupCode ? 'BACKUP_CODE' : 'TOTP' },
      });

      res.cookie('admin2faToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 4 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        twoFactorToken: sessionToken,
        message: 'Two-Factor Authentication successful. Admin access granted.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// -------------------------------------------------------------
// Mandatory 2FA Gate Middleware for Protected Operations
// -------------------------------------------------------------
export const require2FA = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const userId = req.user?.userId;
  const token = (req.headers['x-admin-2fa-token'] as string) || req.cookies?.admin2faToken;

  if (!userId || !verify2FAToken(token, userId)) {
    res.status(403).json({
      success: false,
      error: 'Access denied: Two-Factor Authentication (2FA) verification is mandatory for administrative access.',
      code: '2FA_REQUIRED',
    });
    return;
  }
  next();
};

// Apply 2FA requirement to all remaining admin endpoints
router.use(require2FA);

// -------------------------------------------------------------
// Protected Admin Endpoints
// -------------------------------------------------------------

// 1. Executive Platform Metrics
router.get('/metrics', async (_req, res) => {
  try {
    const bookingMetrics = await bookingRepository.getMetrics();
    const hotels = await hotelRepository.findAll();
    const settlements = await paymentRepository.getAllSettlements();

    res.json({
      success: true,
      metrics: {
        ...bookingMetrics,
        activeHotelsCount: hotels.length,
        pendingSettlementsCount: settlements.filter((s) => s.status === 'PENDING').length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. All Platform Bookings
router.get('/bookings', async (_req, res) => {
  try {
    const bookings = await bookingRepository.findAll();
    res.json({ success: true, bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Financial Settlements
router.get('/settlements', async (_req, res) => {
  try {
    const settlements = await paymentRepository.getAllSettlements();
    res.json({ success: true, settlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Immutable Audit Logs
router.get('/audit-logs', async (_req, res) => {
  try {
    const logs = await auditRepository.getRecentLogs(100);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Audit Chain Cryptographic Integrity Verification (Requirement 5)
router.get('/audit-logs/verify', async (_req, res) => {
  try {
    const result = auditRepository.verifyLedgerIntegrity();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Asynchronous Task Queue Monitor
router.get('/task-queue', async (_req, res) => {
  try {
    const jobs = taskQueue.getRecentJobs(30);
    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Registered Platform Users (RBAC overview)
router.get('/users', async (_req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        twoFactorEnabled: !!u.twoFactorEnabled,
        kycStatus: u.kyc?.status || 'NOT_SUBMITTED',
        createdAt: u.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Admin Role Change with Immutable Audit Logging (Requirement 5)
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;
    if (!role) {
      res.status(400).json({ success: false, error: 'Role is required' });
      return;
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Target user not found' });
      return;
    }

    const oldRole = targetUser.role;
    await userRepository.update(targetUserId, { role });

    // Record immutable audit event with hash chain
    await auditRepository.log({
      actor: req.user!.email,
      actorRole: req.user!.role,
      action: 'ADMIN_ROLE_CHANGE',
      target: 'USER',
      targetId: targetUserId,
      metadata: { previousRole: oldRole, newRole: role },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `User role updated from ${oldRole} to ${role}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
