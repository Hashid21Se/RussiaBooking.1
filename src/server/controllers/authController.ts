/**
 * Auth Controller
 * Endpoints for Email/Password, Gulf Phone OTP, Google/Apple Social Auth, JWT, and Passport KYC
 */

import { Router, Response } from 'express';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// 1. Email Register
router.post('/register', rateLimit({ maxRequests: 5, windowSeconds: 60, keyPrefix: 'auth_reg' }), async (req, res) => {
  try {
    const { name, email, password, phone, country, role, hotelId } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      return;
    }

    const session = await authService.register({ name, email, password, phone, country, role, hotelId });

    // Set secure HttpOnly cookie for web clients
    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.status(201).json({ success: true, ...session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. Email Login
router.post('/login', rateLimit({ maxRequests: 10, windowSeconds: 60, keyPrefix: 'auth_login' }), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const session = await authService.loginWithPassword(email, password);

    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 3. Request Phone OTP
router.post('/otp/send', rateLimit({ maxRequests: 5, windowSeconds: 300, keyPrefix: 'auth_otp_send' }), async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }

    const result = await authService.requestPhoneOtp(phone);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Verify Phone OTP
router.post('/otp/verify', rateLimit({ maxRequests: 5, windowSeconds: 60, keyPrefix: 'auth_otp_verify' }), async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, error: 'Phone number and verification code are required.' });
      return;
    }

    const session = await authService.verifyPhoneOtp(phone, code);

    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Social Login - Google
router.post('/social/google', async (req, res) => {
  try {
    const { token, profile } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Google authentication token is required.' });
      return;
    }

    const session = await authService.loginWithGoogle(token, profile);

    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Social Login - Apple (Required for iOS App Store)
router.post('/social/apple', async (req, res) => {
  try {
    const { identityToken, profile } = req.body;
    if (!identityToken) {
      res.status(400).json({ success: false, error: 'Apple identity token is required.' });
      return;
    }

    const session = await authService.loginWithApple(identityToken, profile);

    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Refresh Token Rotation
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required.' });
      return;
    }

    const session = await authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ success: true, ...session });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 8. Logout
router.post('/logout', async (req: AuthenticatedRequest, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.accessToken;
  const refreshToken = req.body.refreshToken;

  if (token) {
    await authService.logout(token, refreshToken);
  }

  res.clearCookie('accessToken');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 9. Current User Profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    res.json({ success: true, user: authService.cleanUserObject(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Passport KYC Submission (Russian Tourist Registration)
router.post('/kyc/passport', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { passportNumber, fullNameLatin, fullNameArabic, nationality, dateOfBirth, expiryDate, gender } = req.body;
    if (!passportNumber || !fullNameLatin || !nationality || !dateOfBirth || !expiryDate) {
      res.status(400).json({ success: false, error: 'Missing required passport details for tourist registration.' });
      return;
    }

    const updatedUser = await authService.submitPassportKYC(req.user!.userId, {
      passportNumber,
      fullNameLatin,
      fullNameArabic,
      nationality,
      dateOfBirth,
      expiryDate,
      gender: gender || 'MALE'
    });

    res.json({ success: true, user: updatedUser, message: 'Passport verified for official Russian tourist booking voucher.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
