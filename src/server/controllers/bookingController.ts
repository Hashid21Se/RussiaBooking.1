/**
 * Booking Controller
 * Creates and manages bookings with distributed lock safeguards and policy cancellations
 */

import { Router, Response } from 'express';
import { bookingService } from '../services/bookingService';
import { bookingRepository } from '../repositories/bookingRepository';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Create Booking
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      hotelId,
      roomId,
      rateId,
      checkInDate,
      checkOutDate,
      guestsCount,
      guests,
      currencyPaid,
      paymentMethod,
      userEmail,
      userPhone,
      specialRequests,
      visaInvitationRequested
    } = req.body;

    if (!hotelId || !roomId || !rateId || !checkInDate || !checkOutDate || !userEmail || !userPhone) {
      res.status(400).json({ success: false, error: 'Missing required booking fields.' });
      return;
    }

    const booking = await bookingService.createBooking({
      userId: req.user?.userId || 'guest-user',
      userEmail,
      userPhone,
      hotelId,
      roomId,
      rateId,
      checkInDate,
      checkOutDate,
      guestsCount: guestsCount || 1,
      guests: guests || [{ fullName: 'Guest Traveler', isPrimary: true }],
      currencyPaid: currencyPaid || 'SAR',
      paymentMethod: paymentMethod || 'MADA',
      specialRequests,
      visaInvitationRequested: !!visaInvitationRequested
    });

    res.status(201).json({ success: true, booking });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// My Bookings
router.get('/my', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || (req.query.userId as string) || 'user-traveler-1';
    const email = (req.query.email as string)?.trim().toLowerCase();

    let bookings = await bookingRepository.findByUserId(userId);
    if (bookings.length === 0 && email) {
      const all = await bookingRepository.findAll();
      bookings = all.filter(b => b.userEmail.toLowerCase() === email);
    }

    res.json({ success: true, bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Booking by ID or Reference Code
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    let booking = await bookingRepository.findById(param);
    if (!booking) {
      booking = await bookingRepository.findByCode(param);
    }

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found.' });
      return;
    }
    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel Booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const reason = req.body.reason || 'Travel plans changed';
    const booking = await bookingService.cancelBooking(req.params.id, reason);
    res.json({ success: true, booking, message: 'Booking cancelled successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
