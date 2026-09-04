/**
 * Booking Engine, State Machine & Business Logic
 * Sections 15, 16, 21 of RussiaBooking Specification
 * Authoritative server-side price calculation, date validation, and state machine transitions.
 */

import { 
  Booking, 
  BookingStatus, 
  PaymentStatus, 
  PaymentMethodType, 
  Settlement, 
  AuditLog, 
  HotelReview,
  SupportedCurrency,
  LoyaltyTier,
  LoyaltyTransaction,
  UserProfile
} from '../types';
import { LocalDatabaseProvider } from './inventoryProvider';
import { CurrencyService } from '../lib/currency';
import { SEED_REVIEWS } from './seedData';

export interface CreateBookingRequest {
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

export class BookingEngine {
  private inventory: LocalDatabaseProvider;
  private bookings: Booking[] = [];
  private settlements: Settlement[] = [];
  private reviews: HotelReview[] = [...SEED_REVIEWS];
  private auditLogs: AuditLog[] = [];
  private favorites: { userId: string; hotelId: string; addedAt: string }[] = [];
  private userProfile: UserProfile = {
    id: 'user-hashed-1',
    name: 'سعد بن خالد الراجحي',
    email: 'hashedalrajhi@gmail.com',
    phone: '+966 50 123 4567',
    nationality: 'Saudi Arabia',
    passportNumber: 'N12345678',
    country: 'المملكة العربية السعودية',
    avatarUrl: '',
    totalPoints: 7048,
    lifetimePoints: 7048,
    tier: 'GOLD',
    nextTierPointsThreshold: 10000,
    memberSince: '2026-01-15T10:00:00Z',
    loyaltyTransactions: [
      {
        id: 'tx-init-6',
        bookingId: 'book-init-1',
        bookingCode: 'RB-2026-101',
        hotelNameEn: 'Four Seasons Hotel Moscow',
        hotelNameAr: 'فندق فور سيزونز موسكو',
        points: 1948,
        type: 'EARNED',
        descriptionEn: 'Earned on completed booking at Four Seasons Hotel Moscow',
        descriptionAr: 'نقاط مكتسبة عن حجز مؤكد ومكتمل في فندق فور سيزونز موسكو',
        createdAt: '2026-08-20T10:05:00Z',
      },
      {
        id: 'tx-init-5',
        bookingId: 'book-init-5',
        bookingCode: 'RB-2026-088',
        hotelNameEn: 'Lotte Hotel Saint Petersburg',
        hotelNameAr: 'فندق لوت سانت بطرسبرغ',
        points: 1470,
        type: 'EARNED',
        descriptionEn: 'Earned on luxury canal-side suite booking in Saint Petersburg',
        descriptionAr: 'نقاط مكتسبة عن حجز جناح فاخر مطل على القنوات المائية في سانت بطرسبرغ',
        createdAt: '2026-07-14T14:20:00Z',
      },
      {
        id: 'tx-init-4',
        bookingId: 'book-init-4',
        bookingCode: 'RB-2026-074',
        hotelNameEn: 'The Carlton Moscow',
        hotelNameAr: 'فندق ذا كارلتون موسكو',
        points: 940,
        type: 'EARNED',
        descriptionEn: 'Earned on 3-night stay near Red Square',
        descriptionAr: 'نقاط مكتسبة عن إقامة 3 ليالٍ قرب الساحة الحمراء في موسكو',
        createdAt: '2026-06-22T09:15:00Z',
      },
      {
        id: 'tx-init-3',
        bookingId: 'book-init-3',
        bookingCode: 'RB-2026-059',
        hotelNameEn: 'Swissôtel Resort Sochi Kamelia',
        hotelNameAr: 'منتجع سويسوتيل كاميليا سوتشي',
        points: 1120,
        type: 'EARNED',
        descriptionEn: 'Earned on Black Sea subtropical beach retreat',
        descriptionAr: 'نقاط مكتسبة عن عطلة شاطئية عائلية على ريفييرا البحر الأسود في سوتشي',
        createdAt: '2026-05-18T16:45:00Z',
      },
      {
        id: 'tx-init-2',
        bookingId: 'book-init-2',
        bookingCode: 'RB-2026-042',
        hotelNameEn: 'Radisson Collection Hotel Moscow',
        hotelNameAr: 'فندق راديسون كوليكشن موسكو (أوكرانيا سابقاً)',
        points: 850,
        type: 'EARNED',
        descriptionEn: 'Earned on historic landmark skyscraper suite',
        descriptionAr: 'نقاط مكتسبة عن إقامة في ناطحة سحاب كلاسيكية تاريخية على نهر موسكفا',
        createdAt: '2026-04-10T11:30:00Z',
      },
      {
        id: 'tx-init-1',
        bookingId: 'book-init-0',
        bookingCode: 'RB-2026-021',
        hotelNameEn: 'Grand Hotel Europe St. Petersburg',
        hotelNameAr: 'جراند هوتيل أوروبا سانت بطرسبرغ',
        points: 720,
        type: 'EARNED',
        descriptionEn: 'Earned on cultural stay near the Winter Palace & Hermitage',
        descriptionAr: 'نقاط مكتسبة عن إقامة ثقافية فاخرة قرب متحف الأرميتاج وقصر الشتاء',
        createdAt: '2026-03-05T13:00:00Z',
      }
    ],
    preferences: {
      halalFood: true,
      prayerRugs: true,
      arabicSupport: true,
      autoVisaVoucher: true,
    }
  };

  constructor(inventory: LocalDatabaseProvider) {
    this.inventory = inventory;
    this.seedInitialData();
  }

  private seedInitialData() {
    // Initial sample booking for demonstration & review verification
    const sampleBooking: Booking = {
      id: 'book-init-1',
      bookingCode: 'RB-2026-101',
      userId: 'demo-user-1',
      userEmail: 'hashedalrajhi@gmail.com',
      userPhone: '+966501234567',
      hotelId: 'moscow-four-seasons',
      hotelNameEn: 'Four Seasons Hotel Moscow',
      hotelNameAr: 'فندق فور سيزونز موسكو',
      hotelCity: 'Moscow',
      hotelCityAr: 'موسكو',
      hotelImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      roomId: 'fs-deluxe-king',
      roomNameEn: 'Deluxe City View Room',
      roomNameAr: 'غرفة ديلوكس بإطلالة على المدينة',
      rateId: 'fs-deluxe-bb',
      rateNameEn: 'Bed & Gourmet Halal Breakfast',
      rateNameAr: 'شامل بوفيه إفطار فاخر مع خيارات حلال',
      checkInDate: '2026-09-15',
      checkOutDate: '2026-09-19',
      nightsCount: 4,
      guestsCount: 2,
      guests: [
        { fullName: 'Hashed Al Rajhi', nationality: 'Saudi Arabia', isPrimary: true, passportNumber: 'P12345678' },
        { fullName: 'Guest Two', nationality: 'Saudi Arabia', isPrimary: false }
      ],
      pricePerNightRub: 43500,
      subtotalRub: 174000,
      taxAmountRub: 17400,
      platformFeeRub: 3480,
      totalPriceRub: 194880,
      currencyPaid: 'SAR',
      totalPricePaidCurrency: 7951.10,
      exchangeRateUsed: 24.5,
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      paymentMethod: 'MADA',
      paymentId: 'mada_auth_9812456',
      visaInvitationRequested: true,
      pointsEarned: 1948,
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:05:00Z',
    };

    this.bookings.push(sampleBooking);

    // Initial settlement record
    this.settlements.push({
      id: 'stl-2026-01',
      hotelId: 'moscow-four-seasons',
      hotelName: 'Four Seasons Hotel Moscow',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      bookingRevenueRub: 194880,
      hotelAmountRub: 171494, // 88%
      platformCommissionRub: 23386, // 12%
      refundsRub: 0,
      netSettlementRub: 171494,
      status: 'TRANSFERRED',
      payoutDate: '2026-09-01T12:00:00Z',
      referenceCode: 'SWIFT-RU-SA-88192',
      notes: 'Monthly payout transferred to hotel designated VTB account',
    });

    this.auditLogs.push({
      id: 'log-1',
      timestamp: '2026-08-20T10:05:00Z',
      actor: 'system',
      actorRole: 'SYSTEM',
      action: 'BOOKING_CONFIRMED',
      target: 'BOOKING',
      targetId: sampleBooking.bookingCode,
      metadata: { hotelId: sampleBooking.hotelId, totalRub: sampleBooking.totalPriceRub },
    });
  }

  /**
   * Validate dates and compute nights
   */
  private computeNights(checkInStr: string, checkOutStr: string): number {
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error('Invalid dates format. Use YYYY-MM-DD');
    }

    if (checkIn >= checkOut) {
      throw new Error('Check-out date must be strictly after check-in date');
    }

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      throw new Error('Minimum reservation is 1 night');
    }
    return nights;
  }

  /**
   * Create Booking with strict server-side calculation and transaction simulation
   */
  async createBooking(req: CreateBookingRequest): Promise<Booking> {
    const hotel = await this.inventory.getHotel(req.hotelId);
    if (!hotel) {
      throw new Error('Specified hotel does not exist or is inactive');
    }

    const room = hotel.rooms.find(r => r.id === req.roomId);
    if (!room) {
      throw new Error('Specified room does not exist in this hotel');
    }

    const rate = room.rates.find(r => r.id === req.rateId);
    if (!rate) {
      throw new Error('Specified rate plan was not found');
    }

    if (rate.availableQuantity < 1) {
      throw new Error('This room type is currently sold out for the selected dates');
    }

    // Validate guest capacity
    if (req.guestsCount > room.maxGuests) {
      throw new Error(`Room maximum capacity is ${room.maxGuests} guests`);
    }

    const nightsCount = this.computeNights(req.checkInDate, req.checkOutDate);

    // Server authoritative pricing
    const pricePerNightRub = rate.pricePerNightRub;
    const subtotalRub = pricePerNightRub * nightsCount;
    const taxAmountRub = Math.round(subtotalRub * (rate.taxRatePercent / 100));
    const platformFeeRub = Math.round(subtotalRub * 0.02); // 2% booking guarantee fee
    const totalPriceRub = subtotalRub + taxAmountRub + platformFeeRub;

    // Currency calculation
    const currencyPaid = req.currencyPaid || 'RUB';
    const totalPricePaidCurrency = CurrencyService.convertFromRub(totalPriceRub, currencyPaid);
    const exchangeRateUsed = CurrencyService.convertToRub(1, currencyPaid);

    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `RB-2026-${randomDigits}`;

    const now = new Date().toISOString();

    const booking: Booking = {
      id: bookingId,
      bookingCode,
      userId: req.userId || 'guest-user',
      userEmail: req.userEmail,
      userPhone: req.userPhone,
      hotelId: hotel.id,
      hotelNameEn: hotel.nameEn,
      hotelNameAr: hotel.nameAr,
      hotelCity: hotel.city,
      hotelCityAr: hotel.cityAr,
      hotelImage: hotel.images[0]?.url || '',
      roomId: room.id,
      roomNameEn: room.nameEn,
      roomNameAr: room.nameAr,
      rateId: rate.id,
      rateNameEn: rate.nameEn,
      rateNameAr: rate.nameAr,
      checkInDate: req.checkInDate,
      checkOutDate: req.checkOutDate,
      nightsCount,
      guestsCount: req.guestsCount,
      guests: req.guests,
      pricePerNightRub,
      subtotalRub,
      taxAmountRub,
      platformFeeRub,
      totalPriceRub,
      currencyPaid,
      totalPricePaidCurrency,
      exchangeRateUsed,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'INITIATED',
      paymentMethod: req.paymentMethod,
      specialRequests: req.specialRequests,
      visaInvitationRequested: req.visaInvitationRequested || false,
      createdAt: now,
      updatedAt: now,
    };

    this.bookings.unshift(booking);

    // Audit log
    this.recordAuditLog({
      actor: req.userEmail,
      actorRole: 'CUSTOMER',
      action: 'CREATE_BOOKING_INTENT',
      target: 'BOOKING',
      targetId: bookingCode,
      metadata: { totalPriceRub, nightsCount, hotelId: hotel.id },
    });

    return booking;
  }

  /**
   * Transition Booking status on Payment Verification
   */
  async confirmBookingPayment(bookingId: string, paymentTransactionId: string): Promise<Booking> {
    const booking = this.bookings.find(b => b.id === bookingId || b.bookingCode === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // State machine check
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      throw new Error(`Cannot pay for a booking in status ${booking.status}`);
    }

    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'CAPTURED';
    booking.paymentId = paymentTransactionId;
    booking.updatedAt = new Date().toISOString();

    // Award Loyalty Points for completed booking (1 pt per 100 RUB * tier multiplier)
    const tierInfo = this.getTierDetails(this.userProfile.totalPoints);
    const basePoints = Math.round(booking.totalPriceRub / 100);
    const earnedPoints = Math.max(10, Math.round(basePoints * tierInfo.multiplier));
    booking.pointsEarned = earnedPoints;

    // Credit points to user profile
    this.userProfile.totalPoints += earnedPoints;
    this.userProfile.lifetimePoints += earnedPoints;
    const updatedTier = this.getTierDetails(this.userProfile.totalPoints);
    this.userProfile.tier = updatedTier.tier;
    this.userProfile.nextTierPointsThreshold = updatedTier.nextThreshold;

    // Record Loyalty Transaction
    const loyaltyTx: LoyaltyTransaction = {
      id: `tx-points-${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      hotelNameEn: booking.hotelNameEn,
      hotelNameAr: booking.hotelNameAr,
      points: earnedPoints,
      type: 'EARNED',
      descriptionEn: `Earned on completed booking at ${booking.hotelNameEn}`,
      descriptionAr: `نقاط مكتسبة عن حجز مؤكد في ${booking.hotelNameAr}`,
      createdAt: new Date().toISOString(),
    };
    this.userProfile.loyaltyTransactions.unshift(loyaltyTx);

    // Deduct room availability inventory
    const hotel = await this.inventory.getHotel(booking.hotelId);
    if (hotel) {
      const room = hotel.rooms.find(r => r.id === booking.roomId);
      const rate = room?.rates.find(rt => rt.id === booking.rateId);
      if (rate && rate.availableQuantity > 0) {
        rate.availableQuantity -= 1;
      }
    }

    // Record audit
    this.recordAuditLog({
      actor: booking.userEmail,
      actorRole: 'CUSTOMER',
      action: 'PAYMENT_CONFIRMED',
      target: 'BOOKING',
      targetId: booking.bookingCode,
      metadata: { paymentId: paymentTransactionId, amountRub: booking.totalPriceRub },
    });

    return booking;
  }

  /**
   * Cancellation Service with refund rule validation
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<{ booking: Booking; refundAmountRub: number }> {
    const booking = this.bookings.find(b => b.id === bookingId || b.bookingCode === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      throw new Error('Booking is already cancelled');
    }

    const hotel = await this.inventory.getHotel(booking.hotelId);
    const freeCancellationHours = hotel?.policies.freeCancellationHours ?? 48;

    // Check deadline
    const checkInDateTime = new Date(`${booking.checkInDate}T14:00:00Z`).getTime();
    const now = Date.now();
    const hoursRemaining = (checkInDateTime - now) / (1000 * 60 * 60);

    let refundAmountRub = 0;
    if (booking.paymentStatus === 'CAPTURED') {
      if (hoursRemaining >= freeCancellationHours) {
        // 100% full refund
        refundAmountRub = booking.totalPriceRub;
      } else {
        // Late cancellation: refund minus 1 night fee
        refundAmountRub = Math.max(0, booking.totalPriceRub - booking.pricePerNightRub);
      }
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = reason || 'User requested cancellation';
    booking.refundAmountRub = refundAmountRub;
    if (refundAmountRub > 0) {
      booking.paymentStatus = 'REFUNDED';
    }

    this.recordAuditLog({
      actor: booking.userEmail,
      actorRole: 'CUSTOMER',
      action: 'CANCEL_BOOKING',
      target: 'BOOKING',
      targetId: booking.bookingCode,
      metadata: { refundAmountRub, reason },
    });

    return { booking, refundAmountRub };
  }

  getBookings(userEmail?: string): Booking[] {
    if (userEmail) {
      return this.bookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
    }
    return this.bookings;
  }

  getBookingById(id: string): Booking | null {
    return this.bookings.find(b => b.id === id || b.bookingCode === id) || null;
  }

  // Settlements
  getSettlements(): Settlement[] {
    return this.settlements;
  }

  createSettlement(hotelId: string, notes?: string): Settlement {
    const hotelBookings = this.bookings.filter(b => b.hotelId === hotelId && b.status === 'CONFIRMED');
    const revenue = hotelBookings.reduce((sum, b) => sum + b.totalPriceRub, 0);
    const commission = Math.round(revenue * 0.12); // 12% platform fee
    const hotelAmount = revenue - commission;

    const settlement: Settlement = {
      id: `stl-${Date.now()}`,
      hotelId,
      hotelName: hotelBookings[0]?.hotelNameEn || 'Partner Hotel',
      periodStart: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      bookingRevenueRub: revenue,
      hotelAmountRub: hotelAmount,
      platformCommissionRub: commission,
      refundsRub: 0,
      netSettlementRub: hotelAmount,
      status: 'PROCESSING',
      referenceCode: `STL-RU-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: notes || 'Standard 30-day payout',
    };

    this.settlements.unshift(settlement);

    this.recordAuditLog({
      actor: 'admin',
      actorRole: 'ADMIN',
      action: 'CREATE_SETTLEMENT',
      target: 'SETTLEMENT',
      targetId: settlement.id,
      metadata: { hotelId, netAmount: hotelAmount },
    });

    return settlement;
  }

  // Reviews
  getReviews(hotelId?: string): HotelReview[] {
    if (hotelId) {
      return this.reviews.filter(r => r.hotelId === hotelId);
    }
    return this.reviews;
  }

  addReview(review: Omit<HotelReview, 'id' | 'createdAt' | 'verifiedBooking'>): HotelReview {
    // Check if user has a completed/confirmed booking for this hotel
    const eligibleBooking = this.bookings.find(b => 
      b.hotelId === review.hotelId && 
      (b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    );

    const newReview: HotelReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      verifiedBooking: !!eligibleBooking,
    };

    this.reviews.unshift(newReview);
    return newReview;
  }

  // Favorites
  getFavorites(userId: string): string[] {
    return this.favorites.filter(f => f.userId === userId).map(f => f.hotelId);
  }

  toggleFavorite(userId: string, hotelId: string): boolean {
    const index = this.favorites.findIndex(f => f.userId === userId && f.hotelId === hotelId);
    if (index >= 0) {
      this.favorites.splice(index, 1);
      return false; // Removed
    } else {
      this.favorites.push({ userId, hotelId, addedAt: new Date().toISOString() });
      return true; // Added
    }
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
    // Keep max 200 logs in memory
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // Admin Overview KPI Metrics
  getAdminMetrics() {
    const totalBookings = this.bookings.length;
    const confirmedBookings = this.bookings.filter(b => b.status === 'CONFIRMED').length;
    const grossRevenueRub = this.bookings
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.totalPriceRub, 0);
    const platformCommissionRub = Math.round(grossRevenueRub * 0.12);
    const hotelEarningsRub = grossRevenueRub - platformCommissionRub;
    const refundsTotalRub = this.bookings
      .filter(b => b.status === 'REFUNDED' || b.refundAmountRub)
      .reduce((sum, b) => sum + (b.refundAmountRub || 0), 0);
    const pendingSettlementsCount = this.settlements.filter(s => s.status === 'PENDING' || s.status === 'PROCESSING').length;

    return {
      totalBookings,
      confirmedBookings,
      grossRevenueRub,
      platformCommissionRub,
      hotelEarningsRub,
      refundsTotalRub,
      pendingSettlementsCount,
      activeHotelsCount: 6,
    };
  }

  // ==========================================
  // LOYALTY POINTS & USER PROFILE ENGINE
  // ==========================================
  getTierDetails(points: number): { tier: LoyaltyTier; nextThreshold: number; multiplier: number } {
    if (points >= 10000) {
      return { tier: 'PLATINUM', nextThreshold: 10000, multiplier: 2.0 };
    }
    if (points >= 5000) {
      return { tier: 'GOLD', nextThreshold: 10000, multiplier: 1.5 };
    }
    if (points >= 1000) {
      return { tier: 'SILVER', nextThreshold: 5000, multiplier: 1.25 };
    }
    return { tier: 'EXPLORER', nextThreshold: 1000, multiplier: 1.0 };
  }

  getUserProfile(email?: string): UserProfile {
    if (email && email !== this.userProfile.email) {
      this.userProfile.email = email;
    }
    // Re-verify tier on read
    const currentTier = this.getTierDetails(this.userProfile.totalPoints);
    this.userProfile.tier = currentTier.tier;
    this.userProfile.nextTierPointsThreshold = currentTier.nextThreshold;
    return this.userProfile;
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    if (updates.name) this.userProfile.name = updates.name;
    if (updates.email) this.userProfile.email = updates.email;
    if (updates.phone) this.userProfile.phone = updates.phone;
    if (updates.nationality) this.userProfile.nationality = updates.nationality;
    if (updates.passportNumber !== undefined) this.userProfile.passportNumber = updates.passportNumber;
    if (updates.country) this.userProfile.country = updates.country;
    if (updates.preferences) {
      this.userProfile.preferences = {
        ...this.userProfile.preferences,
        ...updates.preferences,
      };
    }
    this.recordAuditLog({
      actor: this.userProfile.email,
      actorRole: 'CUSTOMER',
      action: 'UPDATE_PROFILE',
      target: 'USER_PROFILE',
      targetId: this.userProfile.id,
      metadata: { name: this.userProfile.name },
    });
    return this.userProfile;
  }

  getLoyaltySummary() {
    const tierDetails = this.getTierDetails(this.userProfile.totalPoints);
    return {
      totalPoints: this.userProfile.totalPoints,
      lifetimePoints: this.userProfile.lifetimePoints,
      tier: tierDetails.tier,
      nextTierPointsThreshold: tierDetails.nextThreshold,
      multiplier: tierDetails.multiplier,
      transactions: this.userProfile.loyaltyTransactions,
    };
  }
}

