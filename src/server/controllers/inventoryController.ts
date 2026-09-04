/**
 * Inventory & Channel Manager Controller
 * Manages direct hotel inventory, room allotments, stop-sell controls,
 * atomic overbooking locks, and Bronevik Russian GDS integration.
 */

import { Router, Request, Response } from 'express';
import { channelManagerService } from '../services/channelManagerService';
import { bronevikClient } from '../integrations/bronevikClient';

const router = Router();

/**
 * 1. Get Inventory Grid for a Hotel
 */
router.get('/grid/:hotelId', async (req: Request, res: Response) => {
  try {
    const grid = await channelManagerService.getHotelInventoryGrid(req.params.hotelId);
    res.json({ success: true, data: grid });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. Update Inventory Capacity & Rates
 */
router.post('/rate', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, rateId, availableQuantity, pricePerNightRub, stopSell, refundable, updatedBy } = req.body;
    if (!hotelId || !roomId || !rateId) {
      res.status(400).json({ success: false, error: 'hotelId, roomId, and rateId are required.' });
      return;
    }

    const updated = await channelManagerService.updateInventory({
      hotelId,
      roomId,
      rateId,
      availableQuantity,
      pricePerNightRub,
      stopSell,
      refundable,
      updatedBy: updatedBy || 'Extranet Partner'
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 3. Toggle Stop-Sell
 */
router.post('/stop-sell', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, rateId, stopSell } = req.body;
    const updated = await channelManagerService.updateInventory({
      hotelId,
      roomId,
      rateId,
      stopSell: Boolean(stopSell),
      updatedBy: 'Extranet Channel Manager'
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 4. Acquire Atomic 15-Minute Hold (Overbooking Prevention)
 */
router.post('/hold', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, rateId, bookingCode, quantity } = req.body;
    if (!hotelId || !roomId || !rateId || !bookingCode) {
      res.status(400).json({ success: false, error: 'hotelId, roomId, rateId, and bookingCode are required.' });
      return;
    }

    const hold = await channelManagerService.holdAllotment({
      hotelId,
      roomId,
      rateId,
      bookingCode,
      quantity
    });

    res.json({ success: true, data: hold });
  } catch (err: any) {
    res.status(409).json({ success: false, error: err.message, code: 'OVERBOOKING_PREVENTED' });
  }
});

/**
 * 5. Release Allotment Hold
 */
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, rateId, bookingCode, quantity } = req.body;
    await channelManagerService.releaseHold({
      hotelId,
      roomId,
      rateId,
      bookingCode,
      quantity
    });

    res.json({ success: true, message: 'Hold released successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 6. Bronevik GDS Integration Status
 */
router.get('/bronevik/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: bronevikClient.getStatus() });
});

/**
 * 7. Search Russian Hotels via Bronevik API
 */
router.post('/bronevik/search', async (req: Request, res: Response) => {
  try {
    const { cityId, checkIn, checkOut, guestsCount } = req.body;
    const offers = await bronevikClient.searchHotelOffers({
      cityId: cityId || 'moscow',
      checkIn: checkIn || new Date().toISOString().split('T')[0],
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guestsCount: guestsCount || 2
    });

    res.json({ success: true, data: offers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
