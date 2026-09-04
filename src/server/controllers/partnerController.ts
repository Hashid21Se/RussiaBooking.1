/**
 * Partner Controller (Hotel Partner Extranet)
 * Restricted to HOTEL_PARTNER and PLATFORM_ADMIN
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { hotelRepository } from '../repositories/hotelRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { paymentRepository } from '../repositories/paymentRepository';

const router = Router();

// Partner Guard
router.use(authenticateToken);
router.use(requireRole(['HOTEL_PARTNER', 'PLATFORM_ADMIN', 'ADMIN']));

// Get Partner Hotel Details
router.get('/hotel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || (req.query.hotelId as string) || 'moscow-the-carlton';
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) {
      res.status(404).json({ success: false, error: 'Partner hotel not found.' });
      return;
    }
    res.json({ success: true, hotel });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Partner Hotel Info & Amenities
router.put('/hotel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || req.body.hotelId || 'moscow-the-carlton';
    const updated = await hotelRepository.update(hotelId, req.body);
    res.json({ success: true, hotel: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get Hotel Bookings
router.get('/bookings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || (req.query.hotelId as string) || 'moscow-the-carlton';
    const bookings = await bookingRepository.findByHotelId(hotelId);
    res.json({ success: true, bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Hotel Settlements & Payouts
router.get('/settlements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hotelId = req.user?.hotelId || (req.query.hotelId as string) || 'moscow-the-carlton';
    const settlements = await paymentRepository.getSettlementsByHotelId(hotelId);
    res.json({ success: true, settlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
