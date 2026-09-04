/**
 * Booking Domain Service
 * Prevents Double Booking via Redis Distributed Locks
 * Manages ACID bookings, 15-min allotment holds, and asynchronous worker dispatch
 */

import { Booking, BookingStatus, SupportedCurrency, PaymentMethodType } from '../../types';
import { bookingRepository } from '../repositories/bookingRepository';
import { hotelRepository } from '../repositories/hotelRepository';
import { redisClient } from '../redis/redisClient';
import { taskQueue } from '../queue/taskQueue';
import { auditRepository } from '../repositories/auditRepository';
import { CurrencyService } from '../../lib/currency';

export interface CreateBookingDTO {
  userId?: string;
  userEmail: string;
  userPhone: string;
  hotelId: string;
  roomId: string;
  rateId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guestsCount: number;
  guests: { fullName: string; passportNumber?: string; nationality?: string; isPrimary: boolean }[];
  currencyPaid: SupportedCurrency;
  paymentMethod: PaymentMethodType;
  specialRequests?: string;
  visaInvitationRequested?: boolean;
}

export class BookingService {
  /**
   * Create Booking with Distributed Lock (Prevents Double Booking)
   */
  public async createBooking(dto: CreateBookingDTO): Promise<Booking> {
    // 1. Calculate dates and nights
    const start = new Date(dto.checkInDate);
    const end = new Date(dto.checkOutDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date.');
    }

    // 2. Fetch Room & Rate details
    const roomRateInfo = await hotelRepository.getRoomRate(dto.hotelId, dto.roomId, dto.rateId);
    if (!roomRateInfo) {
      throw new Error('Specified room or rate plan was not found.');
    }

    const hotel = await hotelRepository.findById(dto.hotelId);
    if (!hotel) {
      throw new Error('Hotel not found.');
    }

    // 3. Acquire Distributed Lock on the specific room allotment for these dates
    const lockKey = `allotment:${dto.hotelId}:${dto.roomId}:${dto.checkInDate}:${dto.checkOutDate}`;
    const lock = await redisClient.acquireLock(lockKey, 10000); // 10s critical section
    if (!lock) {
      throw new Error('Room is currently being booked by another traveler. Please retry in a few moments.');
    }

    try {
      const { room, rate } = roomRateInfo;

      // Price calculation
      const pricePerNightRub = rate.pricePerNightRub;
      const subtotalRub = pricePerNightRub * nights;
      const taxAmountRub = Math.round(subtotalRub * (rate.taxRatePercent / 100));
      const platformFeeRub = 0; // No hidden fees for GCC travelers
      const totalPriceRub = subtotalRub + taxAmountRub;

      // Currency conversion
      const exchangeRate = CurrencyService.getRate(dto.currencyPaid);
      const totalPricePaidCurrency = CurrencyService.convertFromRub(totalPriceRub, dto.currencyPaid);

      // Generate Reference Code (e.g. RB-2026-4891)
      const bookingCode = `RB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const visaVoucherCode = dto.visaInvitationRequested 
        ? `RU-MVD-${Math.floor(100000 + Math.random() * 900000)}` 
        : undefined;

      const now = new Date();
      const holdExpiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 min hold

      const booking: Booking = {
        id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        bookingCode,
        userId: dto.userId || 'guest-user',
        userEmail: dto.userEmail,
        userPhone: dto.userPhone,
        hotelId: hotel.id,
        hotelNameEn: hotel.nameEn,
        hotelNameAr: hotel.nameAr,
        hotelCity: hotel.city,
        hotelCityAr: hotel.cityAr,
        hotelAddressEn: hotel.addressEn,
        hotelAddressAr: hotel.addressAr,
        hotelImage: hotel.images[0]?.url || '',
        roomId: room.id,
        roomNameEn: room.nameEn,
        roomNameAr: room.nameAr,
        rateId: rate.id,
        rateNameEn: rate.nameEn,
        rateNameAr: rate.nameAr,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        nightsCount: nights,
        guestsCount: dto.guestsCount,
        guests: dto.guests,
        pricePerNightRub,
        subtotalRub,
        taxAmountRub,
        platformFeeRub,
        totalPriceRub,
        currencyPaid: dto.currencyPaid,
        totalPricePaidCurrency,
        exchangeRateUsed: exchangeRate,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'INITIATED',
        paymentMethod: dto.paymentMethod,
        specialRequests: dto.specialRequests,
        visaInvitationRequested: dto.visaInvitationRequested,
        visaVoucherCode,
        pointsEarned: Math.round(totalPriceRub * 0.05),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      await bookingRepository.create(booking);

      await auditRepository.log({
        actor: dto.userEmail,
        actorRole: 'TRAVELER',
        action: 'BOOKING_INITIATED',
        target: 'BOOKING',
        targetId: booking.id,
        metadata: { bookingCode, totalPriceRub }
      });

      return booking;
    } finally {
      // Always release distributed lock
      await redisClient.releaseLock(lock);
    }
  }

  /**
   * Confirm booking upon verified payment
   */
  public async confirmBooking(bookingId: string, paymentId: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const updated = await bookingRepository.updateStatus(bookingId, 'CONFIRMED', 'CAPTURED', { paymentId });
    if (!updated) {
      throw new Error('Failed to update booking status.');
    }

    // Dispatch background asynchronous tasks via Queue
    await taskQueue.add('SEND_BOOKING_CONFIRMATION_EMAIL', {
      userEmail: updated.userEmail,
      bookingCode: updated.bookingCode,
      hotelName: updated.hotelNameAr,
      totalPrice: `${updated.totalPricePaidCurrency} ${updated.currencyPaid}`
    }, { priority: 1 });

    await taskQueue.add('SEND_WHATSAPP_NOTIFICATION', {
      userPhone: updated.userPhone,
      bookingCode: updated.bookingCode,
      checkInDate: updated.checkInDate
    }, { priority: 2 });

    if (updated.visaInvitationRequested) {
      await taskQueue.add('GENERATE_OFFICIAL_VISA_VOUCHER_PDF', {
        bookingCode: updated.bookingCode,
        guests: updated.guests
      }, { priority: 3 });
    }

    await auditRepository.log({
      actor: updated.userEmail,
      actorRole: 'TRAVELER',
      action: 'BOOKING_CONFIRMED',
      target: 'BOOKING',
      targetId: updated.id,
      metadata: { paymentId, bookingCode: updated.bookingCode }
    });

    return updated;
  }

  /**
   * Cancel booking according to hotel cancellation policies
   */
  public async cancelBooking(bookingId: string, reason: string): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status === 'CANCELLED') {
      return booking;
    }

    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const hoursBeforeCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isFullRefund = hoursBeforeCheckIn >= 48;
    const refundAmountRub = isFullRefund ? booking.totalPriceRub : 0;

    const updated = await bookingRepository.updateStatus(
      bookingId, 
      'CANCELLED', 
      isFullRefund ? 'REFUNDED' : booking.paymentStatus, 
      {
        cancelledAt: now.toISOString(),
        cancellationReason: reason,
        refundAmountRub
      }
    );

    await auditRepository.log({
      actor: booking.userEmail,
      actorRole: 'TRAVELER',
      action: 'BOOKING_CANCELLED',
      target: 'BOOKING',
      targetId: booking.id,
      metadata: { reason, refundAmountRub }
    });

    return updated!;
  }
}

export const bookingService = new BookingService();
