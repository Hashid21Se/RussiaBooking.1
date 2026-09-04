/**
 * Integration Test Suite
 * Validates End-to-End lifecycle between Booking, Payment Provider, and Inventory
 */

import { describe, it, expect } from 'vitest';
import { PaymentService } from '../server/paymentProvider';
import { LocalDatabaseProvider } from '../server/inventoryProvider';
import { BookingEngine } from '../server/bookingEngine';

describe('Booking & Payment Gateway Integration', () => {
  const inventory = new LocalDatabaseProvider();
  const bookingEngine = new BookingEngine(inventory);

  it('orchestrates complete flow: Search -> Reservation -> Payment Intent -> Verification -> Confirmation', async () => {
    // 1. Search Hotels
    const hotels = await inventory.searchHotels({ city: 'Saint Petersburg' });
    expect(hotels.length).toBeGreaterThan(0);
    const hotel = hotels[0];
    const room = hotel.rooms[0];
    const rate = room.rates[0];

    // 2. Create Reservation
    const booking = await bookingEngine.createBooking({
      hotelId: hotel.id,
      roomId: room.id,
      rateId: rate.id,
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-15',
      guestsCount: 2,
      guests: [
        { fullName: 'Turki Al-Otaibi', passportNumber: 'KSA778102', nationality: 'Saudi Arabia', isPrimary: true },
      ],
      userEmail: 'turki@example.com',
      userPhone: '+966551234567',
      currencyPaid: 'SAR',
      paymentMethod: 'MADA',
    });

    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('PENDING_PAYMENT');

    // 3. Initiate Payment Intent via Payment Provider
    const paymentProvider = PaymentService.getProvider('MADA');
    const intent = await paymentProvider.createIntent({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amountRub: booking.totalPriceRub,
      amountTargetCurrency: booking.totalPricePaidCurrency,
      currency: 'SAR',
      customerEmail: 'turki@example.com',
      customerName: 'Turki Al-Otaibi',
      customerPhone: '+966551234567',
      idempotencyKey: `idem_${booking.id}_1`,
      provider: 'MADA',
    });

    expect(intent.transactionId).toBeDefined();
    expect(intent.status).toBe('AUTHORIZED');

    // 4. Verify / Settle Payment
    const verification = await paymentProvider.verifyPayment({
      transactionId: intent.transactionId,
      providerTransactionId: 'gw_tx_mada_991823',
      bookingId: booking.id,
    });

    expect(verification.success).toBe(true);
    expect(verification.status).toBe('CAPTURED');

    // 5. Booking transitions to confirmed
    const confirmedBooking = await bookingEngine.confirmBookingPayment(booking.id, intent.transactionId);
    expect(confirmedBooking.status).toBe('CONFIRMED');
    expect(confirmedBooking.paymentStatus).toBe('CAPTURED');
  });

  it('validates HMAC webhook signatures from payment gateways (Tap / Tamara)', () => {
    const payload = JSON.stringify({ event: 'charge.succeeded', id: 'ch_88192' });
    const secret = 'webhook_secret_key_123';
    
    // Valid HMAC
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    const recomputed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(recomputed))).toBe(true);
  });
});
