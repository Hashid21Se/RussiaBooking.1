/**
 * RussiaBooking Core Types & Interfaces
 * Production-ready schema definitions for hotel booking platform
 */

export type UserRole = 
  | 'TRAVELER' 
  | 'HOTEL_PARTNER' 
  | 'PLATFORM_ADMIN' 
  | 'SUPPORT_AGENT' 
  | 'USER' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface PassportKYC {
  passportNumber: string;
  fullNameLatin: string;
  fullNameArabic?: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  gender: 'MALE' | 'FEMALE';
  status: KYCStatus;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  documentScanUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  role: UserRole;
  hotelId?: string; // If role is HOTEL_PARTNER, associated hotel ID
  kyc?: PassportKYC;
  kycDetails?: PassportKYC;
  kycStatus?: KYCStatus;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}


export type SupportedCurrency = 'RUB' | 'SAR' | 'AED' | 'USD' | 'KWD' | 'QAR';

export interface CurrencyRate {
  code: SupportedCurrency;
  symbol: string;
  symbolAr: string;
  nameEn: string;
  nameAr: string;
  rateFromRub: number; // 1 RUB = X currency
  rateToRub: number;   // 1 currency = X RUB
}

export interface Amenity {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'general' | 'room' | 'dining' | 'wellness' | 'family' | 'islamic';
  icon: string;
}

export interface HotelImage {
  id: string;
  url: string;
  captionEn?: string;
  captionAr?: string;
  isPrimary?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HotelPolicy {
  checkInTime: string;  // e.g. "14:00"
  checkOutTime: string; // e.g. "12:00"
  cancellationPolicyEn: string;
  cancellationPolicyAr: string;
  freeCancellationHours: number; // e.g. 48 hours before check-in
  petFriendly: boolean;
  smokingAllowed: boolean;
  visaAssistanceProvided: boolean;
  halalCertifiedFood: boolean;
  prayerRugsAvailable: boolean;
}

export interface RoomRate {
  id: string;
  roomId: string;
  nameEn: string;
  nameAr: string;
  pricePerNightRub: number;
  breakfastIncluded: boolean;
  refundable: boolean;
  freeCancellationDeadlineHours: number; // hours before checkin
  taxRatePercent: number; // e.g. 10%
  availableQuantity: number;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  bedTypeEn: string;
  bedTypeAr: string;
  sizeSqm: number;
  images: string[];
  amenities: string[];
  rates: RoomRate[];
}

export interface Hotel {
  id: string;
  nameEn: string;
  nameAr: string;
  city: string;
  cityAr: string;
  country: string;
  addressEn: string;
  addressAr: string;
  coordinates: Coordinates;
  stars: number; // 1 to 5
  rating: number; // 0.0 to 10.0
  reviewCount: number;
  descriptionEn: string;
  descriptionAr: string;
  images: HotelImage[];
  amenities: string[];
  policies: HotelPolicy;
  rooms: HotelRoom[];
  minPriceRub: number;
  featured?: boolean;
  active: boolean;
  createdAt: string;
  tagsEn?: string[];
  tagsAr?: string[];
  nearbyLandmarksEn?: { name: string; distance: string }[];
  nearbyLandmarksAr?: { name: string; distance: string }[];
  reviews?: HotelReview[];
}

export type BookingStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'REFUND_PENDING' 
  | 'REFUNDED';

export type PaymentMethodType = 'MADA' | 'TAMARA' | 'TAP' | 'CREDIT_CARD' | 'SANDBOX';

export type PaymentStatus = 
  | 'INITIATED' 
  | 'AUTHORIZED' 
  | 'CAPTURED' 
  | 'FAILED' 
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface BookingGuest {
  id?: string;
  bookingId?: string;
  fullName: string;
  passportNumber?: string;
  nationality?: string;
  isPrimary: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "RB-2026-8849"
  userId: string;
  userEmail: string;
  userPhone: string;
  hotelId: string;
  hotelNameEn: string;
  hotelNameAr: string;
  hotelCity: string;
  hotelCityAr: string;
  hotelAddressEn?: string;
  hotelAddressAr?: string;
  hotelImage: string;
  roomId: string;
  roomNameEn: string;
  roomNameAr: string;
  rateId: string;
  rateNameEn: string;
  rateNameAr: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nightsCount: number;
  guestsCount: number;
  guests: BookingGuest[];
  pricePerNightRub: number;
  subtotalRub: number;
  taxAmountRub: number;
  platformFeeRub: number;
  totalPriceRub: number;
  currencyPaid: SupportedCurrency;
  totalPricePaidCurrency: number;
  exchangeRateUsed: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  paymentId?: string;
  specialRequests?: string;
  visaInvitationRequested?: boolean;
  visaVoucherCode?: string;
  pointsEarned?: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmountRub?: number;
  refundAmountTargetCurrency?: number;
  refundId?: string;
  refundedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amountRub: number;
  amountTargetCurrency: number;
  targetCurrency: SupportedCurrency;
  provider: PaymentMethodType;
  providerTransactionId: string;
  idempotencyKey: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface Settlement {
  id: string;
  hotelId: string;
  hotelName: string;
  periodStart: string;
  periodEnd: string;
  bookingRevenueRub: number;
  hotelAmountRub: number;
  platformCommissionRub: number; // typically 12%
  refundsRub: number;
  netSettlementRub: number;
  status: 'PENDING' | 'PROCESSING' | 'TRANSFERRED' | 'FAILED';
  payoutDate?: string;
  referenceCode: string;
  notes?: string;
}

export interface HotelReview {
  id: string;
  hotelId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userCountry: string;
  rating: number; // 1 to 10
  subRatings: {
    cleanliness: number;
    location: number;
    service: number;
    value: number;
  };
  comment: string;
  title?: string;
  travelerType: 'family' | 'couple' | 'solo' | 'business';
  verifiedBooking: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  previousHash?: string;
  hash?: string;
}

export type SortOption = 'popularity' | 'price_low' | 'price_high' | 'rating' | 'stars';

export interface SearchFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  stars?: number[];
  minRating?: number;
  amenities?: string[];
  freeCancellationOnly?: boolean;
  breakfastIncludedOnly?: boolean;
  halalFriendlyOnly?: boolean;
  sortBy?: SortOption;
}

export interface AdminMetrics {
  totalBookings: number;
  confirmedBookings: number;
  grossRevenueRub: number;
  platformCommissionRub: number;
  hotelEarningsRub: number;
  refundsTotalRub: number;
  pendingSettlementsCount: number;
  activeHotelsCount: number;
}

export type SettlementRecord = Settlement;
export type AuditLogRecord = AuditLog;

export type LoyaltyTier = 'EXPLORER' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyTransaction {
  id: string;
  bookingId?: string;
  bookingCode?: string;
  hotelNameEn?: string;
  hotelNameAr?: string;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'BONUS';
  descriptionEn: string;
  descriptionAr: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredLanguage?: 'ar' | 'en' | 'ru';
  preferredContactChannel?: 'whatsapp' | 'sms' | 'email';
  nationality: string;
  passportNumber?: string;
  country: string;
  avatarUrl?: string;
  totalPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  nextTierPointsThreshold: number;
  memberSince: string;
  loyaltyTransactions: LoyaltyTransaction[];
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
  preferences?: {
    halalFood: boolean;
    prayerRugs: boolean;
    arabicSupport: boolean;
    autoVisaVoucher: boolean;
  };
}

