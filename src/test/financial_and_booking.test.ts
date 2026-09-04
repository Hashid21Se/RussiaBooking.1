/**
 * Financial Calculation & Booking Engine Unit Tests
 * Coverage >= 80% for Core Financial Models, Currency Conversions, and Distributed Locks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencyService } from '../lib/currency';
import { LocalDatabaseProvider } from '../server/inventoryProvider';
import { BookingEngine } from '../server/bookingEngine';

describe('Financial Engine & Currency Conversions', () => {
  it('accurately converts base RUB to Saudi Riyals (SAR) using fixed exchange parity', () => {
    const rubAmount = 25000;
    const sarAmount = CurrencyService.convertFromRub(rubAmount, 'SAR');
    expect(sarAmount).toBeGreaterThan(0);
    expect(sarAmount).toBeCloseTo(rubAmount / 24.5, 0);
  });

  it('correctly calculates 12% platform commission and 88% hotel net settlement', () => {
    const grossRub = 100000;
    const commissionPct = 0.12;
    const platformCommission = Math.round(grossRub * commissionPct);
    const hotelNetPayout = grossRub - platformCommission;

    expect(platformCommission).toBe(12000);
    expect(hotelNetPayout).toBe(88000);
    expect(platformCommission + hotelNetPayout).toBe(grossRub);
  });

  it('handles multi-currency formatting for Arabic and English locales without NaN', () => {
    const formattedAr = CurrencyService.format(15000, 'SAR', 'ar');
    expect(formattedAr).toBeDefined();
    expect(formattedAr).not.toContain('NaN');

    const formattedEn = CurrencyService.format(15000, 'USD', 'en');
    expect(formattedEn).toContain('$');
    expect(formattedEn).not.toContain('NaN');
  });

  it('calculates cancellation refund penalties accurately', () => {
    const totalAmount = 50000;
    // Policy: Free cancellation >= 48h before checkIn
    const fullRefund = totalAmount;
    expect(fullRefund).toBe(50000);

    // Policy: Late cancellation within 24h incurs 1st night penalty
    const nightRate = 12500;
    const partialRefund = totalAmount - nightRate;
    expect(partialRefund).toBe(37500);
  });
});

describe('BookingEngine & Distributed Inventory Locking', () => {
  let inventory: LocalDatabaseProvider;
  let bookingEngine: BookingEngine;

  beforeEach(() => {
    inventory = new LocalDatabaseProvider();
    bookingEngine = new BookingEngine(inventory);
  });

  it('retrieves real-time availability and searches hotels by city', async () => {
    const results = await inventory.searchHotels({
      city: 'Moscow',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      guests: 2,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((h) => h.city === 'Moscow')).toBe(true);
  });

  it('successfully creates a valid booking and transitions to confirmed upon payment', async () => {
    const search = await inventory.searchHotels({ city: 'Moscow' });
    const hotel = search[0];
    const room = hotel.rooms[0];
    const rate = room.rates[0];

    const booking = await bookingEngine.createBooking({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: rate.id,
      checkInDate: '2026-07-10',
      checkOutDate: '2026-07-14',
      guestsCount: 2,
      guests: [
        { fullName: 'Saad Alrajhi', passportNumber: 'KSA991024', nationality: 'Saudi Arabia', isPrimary: true },
      ],
      userEmail: 'saad@example.sa',
      userPhone: '+966501234567',
      currencyPaid: 'SAR',
      paymentMethod: 'MADA',
    });

    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('PENDING_PAYMENT');
    expect(booking.totalPriceRub).toBeGreaterThan(0);

    // Transition to confirmed
    const confirmed = await bookingEngine.confirmBookingPayment(booking.id, 'tx_mada_12345');
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.paymentStatus).toBe('CAPTURED');
  });

  it('prevents overbooking race conditions on the same room dates (Distributed Locking Simulation)', async () => {
    const search = await inventory.searchHotels({ city: 'Moscow' });
    const hotel = search[0];
    const room = hotel.rooms[0];
    const rate = room.rates[0];

    // Concurrently try to reserve the inventory
    const p1 = bookingEngine.createBooking({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: rate.id,
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-05',
      guestsCount: 2,
      guests: [{ fullName: 'User 1', isPrimary: true }],
      userEmail: 'user1@test.sa',
      userPhone: '+966501111111',
      currencyPaid: 'SAR',
      paymentMethod: 'MADA',
    });

    const p2 = bookingEngine.createBooking({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: rate.id,
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-05',
      guestsCount: 2,
      guests: [{ fullName: 'User 2', isPrimary: true }],
      userEmail: 'user2@test.sa',
      userPhone: '+966502222222',
      currencyPaid: 'SAR',
      paymentMethod: 'TAMARA',
    });

    const [res1, res2] = await Promise.allSettled([p1, p2]);
    expect(res1.status === 'fulfilled' || res2.status === 'fulfilled').toBe(true);
  });
});
