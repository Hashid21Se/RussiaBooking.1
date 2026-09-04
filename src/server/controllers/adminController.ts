/**
 * Admin & Support Controller
 * Restricted to PLATFORM_ADMIN, SUPPORT_AGENT, and SUPER_ADMIN
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { bookingRepository } from '../repositories/bookingRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { auditRepository } from '../repositories/auditRepository';
import { userRepository } from '../repositories/userRepository';
import { hotelRepository } from '../repositories/hotelRepository';
import { taskQueue } from '../queue/taskQueue';
import { redisClient } from '../redis/redisClient';

const router = Router();

// Admin Guard
router.use(authenticateToken);
router.use(requireRole(['PLATFORM_ADMIN', 'SUPPORT_AGENT', 'ADMIN', 'SUPER_ADMIN']));

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
        pendingSettlementsCount: settlements.filter(s => s.status === 'PENDING').length
      }
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

// 5. Asynchronous Task Queue Monitor
router.get('/task-queue', async (_req, res) => {
  try {
    const jobs = taskQueue.getRecentJobs(30);
    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Registered Platform Users (RBAC overview)
router.get('/users', async (_req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        kycStatus: u.kyc?.status || 'NOT_SUBMITTED',
        createdAt: u.createdAt
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
