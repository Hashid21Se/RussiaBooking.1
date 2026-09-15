import { describe, it, expect } from 'vitest';
import { Booking } from '../types';
import { CurrencyService } from '../lib/currency';

describe('Booking Analytics Calculations', () => {
  const mockBookings: Booking[] = [
    {
      id: 'b-1',
      bookingCode: 'RB-2026-001',
      userId: 'u-1',
      userEmail: 'test@example.com',
      userPhone: '+966500000000',
      hotelId: 'h-1',
      hotelNameEn: 'Hotel Moscow',
      hotelNameAr: 'فندق موسكو',
      hotelCity: 'Moscow',
      hotelCityAr: 'موسكو',
      hotelImage: '',
      roomId: 'r-1',
      roomNameEn: 'Deluxe',
      roomNameAr: 'ديلوكس',
      rateId: 'rate-1',
      rateNameEn: 'BB',
      rateNameAr: 'إفطار',
      checkInDate: '2026-08-10',
      checkOutDate: '2026-08-14',
      nightsCount: 4,
      guestsCount: 2,
      guests: [{ fullName: 'User One', isPrimary: true }],
      pricePerNightRub: 40000,
      subtotalRub: 160000,
      taxAmountRub: 16000,
      platformFeeRub: 3200,
      totalPriceRub: 179200,
      currencyPaid: 'SAR',
      totalPricePaidCurrency: 7311,
      exchangeRateUsed: 0.0408,
      status: 'COMPLETED',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'MADA',
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-14T10:00:00Z',
    },
    {
      id: 'b-2',
      bookingCode: 'RB-2026-002',
      userId: 'u-1',
      userEmail: 'test@example.com',
      userPhone: '+966500000000',
      hotelId: 'h-2',
      hotelNameEn: 'Hotel St Petersburg',
      hotelNameAr: 'فندق سانت بطرسبرغ',
      hotelCity: 'Saint Petersburg',
      hotelCityAr: 'سانت بطرسبرغ',
      hotelImage: '',
      roomId: 'r-2',
      roomNameEn: 'Suite',
      roomNameAr: 'جناح',
      rateId: 'rate-2',
      rateNameEn: 'BB',
      rateNameAr: 'إفطار',
      checkInDate: '2026-07-15',
      checkOutDate: '2026-07-18',
      nightsCount: 3,
      guestsCount: 2,
      guests: [{ fullName: 'User One', isPrimary: true }],
      pricePerNightRub: 30000,
      subtotalRub: 90000,
      taxAmountRub: 9000,
      platformFeeRub: 1800,
      totalPriceRub: 100800,
      currencyPaid: 'SAR',
      totalPricePaidCurrency: 4112,
      exchangeRateUsed: 0.0408,
      status: 'COMPLETED',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'MADA',
      createdAt: '2026-07-02T10:00:00Z',
      updatedAt: '2026-07-18T10:00:00Z',
    },
  ];

  it('accurately computes total nights and spend across bookings', () => {
    const totalNights = mockBookings.reduce((sum, b) => sum + b.nightsCount, 0);
    expect(totalNights).toBe(7);

    const totalRub = mockBookings.reduce((sum, b) => sum + b.totalPriceRub, 0);
    expect(totalRub).toBe(280000);

    const avgSpendPerNightRub = Math.round(totalRub / totalNights);
    expect(avgSpendPerNightRub).toBe(40000);

    const convertedSar = CurrencyService.convertFromRub(avgSpendPerNightRub, 'SAR');
    expect(convertedSar).toBeCloseTo(1632, 0);
  });

  it('handles empty booking array gracefully without divide by zero', () => {
    const emptyList: Booking[] = [];
    const totalNights = emptyList.reduce((sum, b) => sum + b.nightsCount, 0);
    const totalSpend = emptyList.reduce((sum, b) => sum + b.totalPriceRub, 0);
    const avgSpend = totalNights > 0 ? Math.round(totalSpend / totalNights) : 0;
    expect(avgSpend).toBe(0);
    expect(isNaN(avgSpend)).toBe(false);
  });
});
