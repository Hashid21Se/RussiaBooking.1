/**
 * Channel Manager Domain Service
 * Handles direct hotel contracts, inventory calendar, stop-sell controls, and overbooking prevention
 */

import { hotelRepository } from '../repositories/hotelRepository';
import { redisClient } from '../redis/redisClient';
import { auditRepository } from '../repositories/auditRepository';
import { Hotel, HotelRoom, RoomRate } from '../../types';

export interface InventoryGridItem {
  hotelId: string;
  hotelNameEn: string;
  hotelNameAr: string;
  roomId: string;
  roomNameEn: string;
  roomNameAr: string;
  rateId: string;
  rateNameEn: string;
  rateNameAr: string;
  availableQuantity: number;
  pricePerNightRub: number;
  stopSell: boolean;
  refundable: boolean;
  activeHolds: number;
}

export class ChannelManagerService {
  /**
   * Get Real-Time Inventory Grid for a Hotel
   */
  public async getHotelInventoryGrid(hotelId: string): Promise<InventoryGridItem[]> {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) {
      throw new Error('Hotel not found.');
    }

    const items: InventoryGridItem[] = [];

    for (const room of hotel.rooms) {
      for (const rate of room.rates) {
        // Check active holds from Redis
        const holdKeyPattern = `hold:${hotelId}:${room.id}:${rate.id}:*`;
        const activeHoldKeys = await redisClient.keys(holdKeyPattern);

        items.push({
          hotelId: hotel.id,
          hotelNameEn: hotel.nameEn,
          hotelNameAr: hotel.nameAr,
          roomId: room.id,
          roomNameEn: room.nameEn,
          roomNameAr: room.nameAr,
          rateId: rate.id,
          rateNameEn: rate.nameEn,
          rateNameAr: rate.nameAr,
          availableQuantity: rate.availableQuantity,
          pricePerNightRub: rate.pricePerNightRub,
          stopSell: rate.availableQuantity <= 0,
          refundable: rate.refundable,
          activeHolds: activeHoldKeys.length
        });
      }
    }

    return items;
  }

  /**
   * Update Inventory Capacity & Rates (with instant cache invalidation)
   */
  public async updateInventory(params: {
    hotelId: string;
    roomId: string;
    rateId: string;
    availableQuantity?: number;
    pricePerNightRub?: number;
    stopSell?: boolean;
    refundable?: boolean;
    updatedBy: string;
  }): Promise<RoomRate> {
    const updates: Partial<RoomRate> = {};
    if (params.availableQuantity !== undefined) updates.availableQuantity = params.availableQuantity;
    if (params.pricePerNightRub !== undefined) updates.pricePerNightRub = params.pricePerNightRub;
    if (params.refundable !== undefined) updates.refundable = params.refundable;
    if (params.stopSell) updates.availableQuantity = 0;

    const updatedRate = await hotelRepository.updateRoomRate(params.hotelId, params.roomId, params.rateId, updates);
    if (!updatedRate) {
      throw new Error('Room or rate plan not found.');
    }

    await auditRepository.log({
      actor: params.updatedBy,
      actorRole: 'HOTEL_PARTNER',
      action: 'INVENTORY_RATE_UPDATED',
      target: 'INVENTORY',
      targetId: `${params.hotelId}:${params.roomId}:${params.rateId}`,
      metadata: updates
    });

    return updatedRate;
  }

  /**
   * Hold Allotment with Overbooking Lock (15-minute temporary hold during checkout)
   */
  public async holdAllotment(params: {
    hotelId: string;
    roomId: string;
    rateId: string;
    bookingCode: string;
    quantity?: number;
  }): Promise<{ success: boolean; holdKey: string; expiresAt: string }> {
    const quantity = params.quantity || 1;
    const lockKey = `lock:allotment:${params.hotelId}:${params.roomId}:${params.rateId}`;

    // Acquire lock to prevent race condition overbooking
    const lock = await redisClient.acquireLock(lockKey, 5000);
    if (!lock) {
      throw new Error('Room is currently being locked by another concurrent booking.');
    }

    try {
      const held = await hotelRepository.atomicHoldInventory(params.hotelId, params.roomId, params.rateId, quantity);
      if (!held) {
        throw new Error('No rooms available (Overbooking prevented).');
      }

      const holdKey = `hold:${params.hotelId}:${params.roomId}:${params.rateId}:${params.bookingCode}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await redisClient.set(holdKey, { bookingCode: params.bookingCode, quantity, expiresAt }, 900); // 15 mins

      return {
        success: true,
        holdKey,
        expiresAt
      };
    } finally {
      await redisClient.releaseLock(lock);
    }
  }

  /**
   * Release Temporary Hold if checkout is abandoned or expired
   */
  public async releaseHold(params: {
    hotelId: string;
    roomId: string;
    rateId: string;
    bookingCode: string;
    quantity?: number;
  }): Promise<void> {
    const holdKey = `hold:${params.hotelId}:${params.roomId}:${params.rateId}:${params.bookingCode}`;
    const exists = await redisClient.get(holdKey);
    if (exists) {
      await hotelRepository.replenishInventory(params.hotelId, params.roomId, params.rateId, params.quantity || 1);
      await redisClient.del(holdKey);
    }
  }
}

export const channelManagerService = new ChannelManagerService();
