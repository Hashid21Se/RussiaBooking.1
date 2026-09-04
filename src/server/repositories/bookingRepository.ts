/**
 * Booking Repository
 * Manages bookings, room allotments, 15-minute checkout holds, and state transitions
 */

import { Booking, BookingStatus, PaymentStatus } from '../../types';
import { redisClient } from '../redis/redisClient';

export class BookingRepository {
  private bookings = new Map<string, Booking>();

  public async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) || null;
  }

  public async findByCode(code: string): Promise<Booking | null> {
    const normalized = code.trim().toUpperCase();
    for (const b of this.bookings.values()) {
      if (b.bookingCode.toUpperCase() === normalized) {
        return b;
      }
    }
    return null;
  }

  public async findByUserId(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async findByHotelId(hotelId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.hotelId === hotelId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async findAll(): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async create(booking: Booking): Promise<Booking> {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  public async updateStatus(
    id: string, 
    status: BookingStatus, 
    paymentStatus?: PaymentStatus,
    metadata?: Partial<Booking>
  ): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    if (!booking) return null;

    booking.status = status;
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    if (metadata) {
      Object.assign(booking, metadata);
    }
    booking.updatedAt = new Date().toISOString();

    this.bookings.set(id, booking);
    return booking;
  }

  public async getMetrics(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    grossRevenueRub: number;
    platformCommissionRub: number;
    hotelEarningsRub: number;
    refundsTotalRub: number;
  }> {
    const all = Array.from(this.bookings.values());
    const confirmed = all.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');

    const grossRevenueRub = confirmed.reduce((acc, b) => acc + b.totalPriceRub, 0);
    const platformCommissionRub = Math.round(grossRevenueRub * 0.12);
    const hotelEarningsRub = grossRevenueRub - platformCommissionRub;
    const refundsTotalRub = all
      .filter(b => b.status === 'REFUNDED')
      .reduce((acc, b) => acc + (b.refundAmountRub || b.totalPriceRub), 0);

    return {
      totalBookings: all.length,
      confirmedBookings: confirmed.length,
      grossRevenueRub,
      platformCommissionRub,
      hotelEarningsRub,
      refundsTotalRub
    };
  }
}

export const bookingRepository = new BookingRepository();
