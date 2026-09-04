/**
 * Hotel Controller
 * Search, detail views, and availability checks
 */

import { Router } from 'express';
import { hotelService } from '../services/hotelService';
import { SearchFilters } from '../../types';

const router = Router();

// Advanced Search
router.get('/search', async (req, res) => {
  try {
    const filters: SearchFilters = {
      city: req.query.city as string,
      checkIn: req.query.checkIn as string,
      checkOut: req.query.checkOut as string,
      guests: req.query.guests ? parseInt(req.query.guests as string) : undefined,
      rooms: req.query.rooms ? parseInt(req.query.rooms as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      stars: req.query.stars ? (req.query.stars as string).split(',').map(Number) : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      halalFriendlyOnly: req.query.halalFriendlyOnly === 'true',
      freeCancellationOnly: req.query.freeCancellationOnly === 'true',
      breakfastIncludedOnly: req.query.breakfastIncludedOnly === 'true',
      sortBy: (req.query.sortBy as any) || 'popularity',
    };

    const results = await hotelService.searchHotels(filters);
    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Hotel Details
router.get('/:id', async (req, res) => {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    if (!hotel) {
      res.status(404).json({ success: false, error: 'Hotel not found.' });
      return;
    }
    res.json({ success: true, hotel });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
