/**
 * Hotel Repository
 * Advanced multi-criteria search, city queries, room rate retrieval, and partner hotel updates
 */

import { Hotel, HotelRoom, RoomRate, SearchFilters } from '../../types';
import { SEED_HOTELS } from '../seedData';
import { redisClient } from '../redis/redisClient';

export class HotelRepository {
  private hotels = new Map<string, Hotel>();

  constructor() {
    for (const h of SEED_HOTELS) {
      this.hotels.set(h.id, JSON.parse(JSON.stringify(h)));
    }
  }

  public async findById(id: string): Promise<Hotel | null> {
    const cacheKey = `hotel:detail:${id}`;
    const cached = await redisClient.get<Hotel>(cacheKey);
    if (cached) return cached;

    const hotel = this.hotels.get(id) || null;
    if (hotel) {
      await redisClient.set(cacheKey, hotel, 600); // 10 mins cache
    }
    return hotel;
  }

  public async findAll(): Promise<Hotel[]> {
    return Array.from(this.hotels.values()).filter(h => h.active);
  }

  public async search(filters: SearchFilters): Promise<{ hotels: Hotel[]; totalCount: number }> {
    // Generate cache key based on serialized filters
    const filterHash = JSON.stringify(filters);
    const cacheKey = `search:${Buffer.from(filterHash).toString('base64').substring(0, 32)}`;
    
    const cached = await redisClient.get<{ hotels: Hotel[]; totalCount: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    let results = Array.from(this.hotels.values()).filter(h => h.active);

    // 1. City / Destination Filter
    if (filters.city && filters.city.trim() !== '') {
      const cityTerm = filters.city.trim().toLowerCase();
      results = results.filter(h => 
        h.city.toLowerCase().includes(cityTerm) || 
        h.cityAr.includes(cityTerm) ||
        h.nameEn.toLowerCase().includes(cityTerm) ||
        h.nameAr.includes(cityTerm)
      );
    }

    // 2. Star Ratings Filter
    if (filters.stars && filters.stars.length > 0) {
      results = results.filter(h => filters.stars!.includes(h.stars));
    }

    // 3. Price Range Filter (RUB)
    if (filters.minPrice !== undefined) {
      results = results.filter(h => h.minPriceRub >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(h => h.minPriceRub <= filters.maxPrice!);
    }

    // 4. Minimum Guest Rating
    if (filters.minRating !== undefined && filters.minRating > 0) {
      results = results.filter(h => h.rating >= filters.minRating!);
    }

    // 5. Halal-Friendly Filter (Halal food or prayer rugs)
    if (filters.halalFriendlyOnly) {
      results = results.filter(h => 
        h.policies.halalCertifiedFood || 
        h.policies.prayerRugsAvailable || 
        h.amenities.includes('halalCertified') ||
        h.amenities.includes('prayerRugs')
      );
    }

    // 6. Free Cancellation Only
    if (filters.freeCancellationOnly) {
      results = results.filter(h => 
        h.policies.freeCancellationHours > 0 ||
        h.rooms.some(r => r.rates.some(rate => rate.refundable))
      );
    }

    // 7. Breakfast Included Only
    if (filters.breakfastIncludedOnly) {
      results = results.filter(h => 
        h.rooms.some(r => r.rates.some(rate => rate.breakfastIncluded))
      );
    }

    // 8. Specific Amenities
    if (filters.amenities && filters.amenities.length > 0) {
      results = results.filter(h => 
        filters.amenities!.every(reqAmenity => h.amenities.includes(reqAmenity))
      );
    }

    // 9. Sorting
    switch (filters.sortBy) {
      case 'price_low':
        results.sort((a, b) => a.minPriceRub - b.minPriceRub);
        break;
      case 'price_high':
        results.sort((a, b) => b.minPriceRub - a.minPriceRub);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'stars':
        results.sort((a, b) => b.stars - a.stars);
        break;
      case 'popularity':
      default:
        results.sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating));
        break;
    }

    const response = {
      hotels: results,
      totalCount: results.length
    };

    // Cache search results for 2 minutes
    await redisClient.set(cacheKey, response, 120);

    return response;
  }

  public async update(id: string, updates: Partial<Hotel>): Promise<Hotel | null> {
    const hotel = this.hotels.get(id);
    if (!hotel) return null;

    const updated = {
      ...hotel,
      ...updates
    };
    this.hotels.set(id, updated);
    await redisClient.del(`hotel:detail:${id}`);
    await redisClient.delPattern('search:');
    return updated;
  }

  public async getRoomRate(hotelId: string, roomId: string, rateId: string): Promise<{ room: HotelRoom; rate: RoomRate } | null> {
    const hotel = await this.findById(hotelId);
    if (!hotel) return null;

    const room = hotel.rooms.find(r => r.id === roomId);
    if (!room) return null;

    const rate = room.rates.find(r => r.id === rateId);
    if (!rate) return null;

    return { room, rate };
  }

  /**
   * Atomic Inventory Lock & Allotment Decrement (Prevents Overbooking)
   */
  public async atomicHoldInventory(hotelId: string, roomId: string, rateId: string, quantity: number = 1): Promise<boolean> {
    const hotel = this.hotels.get(hotelId);
    if (!hotel) return false;

    const room = hotel.rooms.find(r => r.id === roomId);
    if (!room) return false;

    const rate = room.rates.find(r => r.id === rateId);
    if (!rate) return false;

    // Strict check: Is inventory available?
    if (rate.availableQuantity < quantity) {
      return false; // Overbooking prevented!
    }

    // Atomic decrement
    rate.availableQuantity -= quantity;
    await redisClient.del(`hotel:detail:${hotelId}`);
    return true;
  }

  /**
   * Replenish / Release Allotment back to inventory upon cancellation or hold expiration
   */
  public async replenishInventory(hotelId: string, roomId: string, rateId: string, quantity: number = 1): Promise<boolean> {
    const hotel = this.hotels.get(hotelId);
    if (!hotel) return false;

    const room = hotel.rooms.find(r => r.id === roomId);
    if (!room) return false;

    const rate = room.rates.find(r => r.id === rateId);
    if (!rate) return false;

    rate.availableQuantity += quantity;
    await redisClient.del(`hotel:detail:${hotelId}`);
    return true;
  }

  /**
   * Channel Manager: Update Room Inventory & Rates
   */
  public async updateRoomRate(hotelId: string, roomId: string, rateId: string, updates: Partial<RoomRate>): Promise<RoomRate | null> {
    const hotel = this.hotels.get(hotelId);
    if (!hotel) return null;

    const room = hotel.rooms.find(r => r.id === roomId);
    if (!room) return null;

    const rateIndex = room.rates.findIndex(r => r.id === rateId);
    if (rateIndex === -1) return null;

    room.rates[rateIndex] = { ...room.rates[rateIndex], ...updates };
    await redisClient.del(`hotel:detail:${hotelId}`);
    await redisClient.delPattern('search:');
    return room.rates[rateIndex];
  }

  /**
   * Channel Manager: Toggle Stop-Sell
   */
  public async toggleStopSell(hotelId: string, roomId: string, rateId: string, stopSell: boolean): Promise<boolean> {
    const hotel = this.hotels.get(hotelId);
    if (!hotel) return false;

    const room = hotel.rooms.find(r => r.id === roomId);
    if (!room) return false;

    const rate = room.rates.find(r => r.id === rateId);
    if (!rate) return false;

    rate.availableQuantity = stopSell ? 0 : Math.max(1, rate.availableQuantity);
    await redisClient.del(`hotel:detail:${hotelId}`);
    return true;
  }
}

export const hotelRepository = new HotelRepository();
