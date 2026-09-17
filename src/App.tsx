/**
 * RussiaBooking - Main Application Component
 * Production-Ready Full-Stack SaaS & PWA Experience
 */

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { DestinationsGuide } from './components/DestinationsGuide';
import { Footer } from './components/Footer';
import { Language, translations } from './lib/i18n';
import { Hotel, HotelRoom, RoomRate, SearchFilters, SupportedCurrency, Booking, UserProfile, User, UserRole } from './types';
import { SEED_HOTELS } from './server/seedData';
import { HotelCard } from './components/HotelCard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Sparkles, Building, ArrowLeft, ArrowRight, ShieldCheck, Compass, Loader2, Building2, Briefcase, Bookmark } from 'lucide-react';

// Production Performance Code Splitting (React.lazy + Suspense for Lighthouse Score >= 90)
const SearchResultsView = lazy(() => import('./components/SearchResultsView').then(m => ({ default: m.SearchResultsView })));
const HotelDetailsView = lazy(() => import('./components/HotelDetailsView').then(m => ({ default: m.HotelDetailsView })));
const BookingCheckoutView = lazy(() => import('./components/BookingCheckoutView').then(m => ({ default: m.BookingCheckoutView })));
const BookingConfirmationView = lazy(() => import('./components/BookingConfirmationView').then(m => ({ default: m.BookingConfirmationView })));
const MyBookingsView = lazy(() => import('./components/MyBookingsView').then(m => ({ default: m.MyBookingsView })));
const SavedFavoritesView = lazy(() => import('./components/SavedFavoritesView').then(m => ({ default: m.SavedFavoritesView })));
const AdminPortalView = lazy(() => import('./components/AdminPortalView').then(m => ({ default: m.AdminPortalView })));
const UserProfileView = lazy(() => import('./components/UserProfileView').then(m => ({ default: m.UserProfileView })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));

/**
 * Accessible View Fallback skeleton with ARIA live region
 */
const ViewFallback: React.FC<{ lang?: Language }> = ({ lang = 'ar' }) => (
  <div 
    className="mx-auto max-w-7xl px-4 sm:px-6 py-16 flex flex-col items-center justify-center min-h-[50vh]"
    role="status"
    aria-live="polite"
    aria-label={lang === 'ar' ? 'جاري تحميل المحتوى' : 'Loading content'}
  >
    <div className="relative mb-4 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
    </div>
    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
      {lang === 'ar' ? 'جاري تحميل الصفحة، لحظات من فضلك...' : 'Loading page, please wait...'}
    </p>
    <span className="sr-only">{lang === 'ar' ? 'جاري تحميل الصفحة' : 'Page is loading'}</span>
  </div>
);

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-init-6',
    bookingCode: 'RB-2026-115',
    userId: 'user-hashed-1',
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
    checkInDate: '2026-09-20',
    checkOutDate: '2026-09-24',
    nightsCount: 4,
    guestsCount: 2,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true, passportNumber: 'N12345678' },
      { fullName: 'ضيف مرافق', nationality: 'Saudi Arabia', isPrimary: false }
    ],
    pricePerNightRub: 43500,
    subtotalRub: 174000,
    taxAmountRub: 17400,
    platformFeeRub: 3480,
    totalPriceRub: 194880,
    totalPricePaidCurrency: 8185,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'CONFIRMED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'MADA',
    paymentId: 'txn_mock_fs_115',
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-02T11:05:00Z',
    specialRequests: 'طابق علوي، سجادة صلاة، استقبال باللغة العربية',
    visaInvitationRequested: true,
    visaVoucherCode: 'VOUCH-RB-2026-115-SA',
  },
  {
    id: 'book-init-1',
    bookingCode: 'RB-2026-101',
    userId: 'user-hashed-1',
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
    checkInDate: '2026-08-18',
    checkOutDate: '2026-08-22',
    nightsCount: 4,
    guestsCount: 2,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true, passportNumber: 'N12345678' },
      { fullName: 'ضيف مرافق', nationality: 'Saudi Arabia', isPrimary: false }
    ],
    pricePerNightRub: 43500,
    subtotalRub: 174000,
    taxAmountRub: 17400,
    platformFeeRub: 3480,
    totalPriceRub: 194880,
    totalPricePaidCurrency: 8185,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'COMPLETED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'MADA',
    paymentId: 'txn_mock_fs_101',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-22T12:00:00Z',
    specialRequests: 'طابق علوي، سجادة صلاة، استقبال باللغة العربية',
    visaInvitationRequested: true,
    visaVoucherCode: 'VOUCH-RB-2026-101-SA',
  },
  {
    id: 'book-init-2',
    bookingCode: 'RB-2026-088',
    userId: 'user-hashed-1',
    userEmail: 'hashedalrajhi@gmail.com',
    userPhone: '+966501234567',
    hotelId: 'moscow-the-carlton',
    hotelNameEn: 'The Carlton, Moscow',
    hotelNameAr: 'ذا كارلتون، موسكو',
    hotelCity: 'Moscow',
    hotelCityAr: 'موسكو',
    hotelImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    roomId: 'carlton-superior',
    roomNameEn: 'Superior King Room',
    roomNameAr: 'غرفة سوبيريور كينغ',
    rateId: 'carlton-rate-breakfast',
    rateNameEn: 'Room + Carlton Buffet Breakfast',
    rateNameAr: 'غرفة + إفطار كارلتون الفاخر',
    checkInDate: '2026-07-12',
    checkOutDate: '2026-07-15',
    nightsCount: 3,
    guestsCount: 2,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true, passportNumber: 'N12345678' }
    ],
    pricePerNightRub: 37500,
    subtotalRub: 112500,
    taxAmountRub: 11250,
    platformFeeRub: 2250,
    totalPriceRub: 126000,
    totalPricePaidCurrency: 5140,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'COMPLETED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'MADA',
    paymentId: 'txn_mock_carlton_088',
    createdAt: '2026-07-01T14:30:00Z',
    updatedAt: '2026-07-15T12:00:00Z',
    specialRequests: 'إطلالة على الميدان، وجبات حلال',
    visaInvitationRequested: true,
  },
  {
    id: 'book-init-3',
    bookingCode: 'RB-2026-074',
    userId: 'user-hashed-1',
    userEmail: 'hashedalrajhi@gmail.com',
    userPhone: '+966501234567',
    hotelId: 'moscow-radisson-collection',
    hotelNameEn: 'Radisson Collection Hotel, Moscow',
    hotelNameAr: 'فندق راديسون كوليكشن موسكو',
    hotelCity: 'Moscow',
    hotelCityAr: 'موسكو',
    hotelImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    roomId: 'rad-collection-deluxe',
    roomNameEn: 'Collection River View Room',
    roomNameAr: 'غرفة كوليكشن بإطلالة على نهر موسكفا',
    rateId: 'rad-rate-standard',
    rateNameEn: 'Standard Room Rate',
    rateNameAr: 'السعر الأساسي القياسي',
    checkInDate: '2026-06-14',
    checkOutDate: '2026-06-18',
    nightsCount: 4,
    guestsCount: 2,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true }
    ],
    pricePerNightRub: 21000,
    subtotalRub: 84000,
    taxAmountRub: 8400,
    platformFeeRub: 1680,
    totalPriceRub: 94080,
    totalPricePaidCurrency: 3838,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'COMPLETED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'TAMARA',
    paymentId: 'txn_mock_rad_074',
    createdAt: '2026-06-05T09:15:00Z',
    updatedAt: '2026-06-18T12:00:00Z',
  },
  {
    id: 'book-init-4',
    bookingCode: 'RB-2026-059',
    userId: 'user-hashed-1',
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
    rateId: 'fs-deluxe-roomonly',
    rateNameEn: 'Room Only - Best Available Rate',
    rateNameAr: 'إقامة فقط - أفضل سعر متاح',
    checkInDate: '2026-05-08',
    checkOutDate: '2026-05-11',
    nightsCount: 3,
    guestsCount: 1,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true }
    ],
    pricePerNightRub: 38000,
    subtotalRub: 114000,
    taxAmountRub: 11400,
    platformFeeRub: 2280,
    totalPriceRub: 127680,
    totalPricePaidCurrency: 5209,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'COMPLETED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'MADA',
    paymentId: 'txn_mock_fs_059',
    createdAt: '2026-04-28T16:00:00Z',
    updatedAt: '2026-05-11T12:00:00Z',
  },
  {
    id: 'book-init-5',
    bookingCode: 'RB-2026-042',
    userId: 'user-hashed-1',
    userEmail: 'hashedalrajhi@gmail.com',
    userPhone: '+966501234567',
    hotelId: 'moscow-radisson-collection',
    hotelNameEn: 'Radisson Collection Hotel, Moscow',
    hotelNameAr: 'فندق راديسون كوليكشن موسكو',
    hotelCity: 'Moscow',
    hotelCityAr: 'موسكو',
    hotelImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    roomId: 'rad-collection-deluxe',
    roomNameEn: 'Collection River View Room',
    roomNameAr: 'غرفة كوليكشن بإطلالة على نهر موسكفا',
    rateId: 'rad-rate-standard',
    rateNameEn: 'Standard Room Rate',
    rateNameAr: 'السعر الأساسي القياسي',
    checkInDate: '2026-04-15',
    checkOutDate: '2026-04-18',
    nightsCount: 3,
    guestsCount: 1,
    guests: [
      { fullName: 'سعد بن خالد الراجحي', nationality: 'Saudi Arabia', isPrimary: true }
    ],
    pricePerNightRub: 21000,
    subtotalRub: 63000,
    taxAmountRub: 6300,
    platformFeeRub: 1260,
    totalPriceRub: 70560,
    totalPricePaidCurrency: 2878,
    currencyPaid: 'SAR',
    exchangeRateUsed: 0.0408,
    status: 'COMPLETED',
    paymentStatus: 'CAPTURED',
    paymentMethod: 'MADA',
    paymentId: 'txn_mock_rad_042',
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-18T12:00:00Z',
  },
];

function filterHotelsClient(allHotels: Hotel[], filters: SearchFilters): Hotel[] {
  let list = allHotels.filter(h => h.active);

  if (filters.city && filters.city !== 'ALL') {
    const q = filters.city.trim().toLowerCase();
    list = list.filter(h =>
      h.city.toLowerCase().includes(q) ||
      h.cityAr.includes(q) ||
      h.nameEn.toLowerCase().includes(q) ||
      h.nameAr.includes(q)
    );
  }

  if (filters.stars && filters.stars.length > 0) {
    list = list.filter(h => filters.stars!.includes(h.stars));
  }

  if (filters.minPrice) {
    list = list.filter(h => h.minPriceRub >= filters.minPrice!);
  }

  if (filters.maxPrice) {
    list = list.filter(h => h.minPriceRub <= filters.maxPrice!);
  }

  if (filters.minRating) {
    list = list.filter(h => h.rating >= filters.minRating!);
  }

  if (filters.freeCancellationOnly) {
    list = list.filter(h => (h.policies.freeCancellationHours || 0) > 0);
  }

  if (filters.breakfastIncludedOnly) {
    list = list.filter(h =>
      h.rooms.some(r => r.rates.some(rate => rate.breakfastIncluded))
    );
  }

  if (filters.halalFriendlyOnly) {
    list = list.filter(h =>
      h.amenities.includes('halalCertified') || h.policies.halalCertifiedFood
    );
  }

  if (filters.amenities && filters.amenities.length > 0) {
    list = list.filter(h =>
      filters.amenities!.every(a => h.amenities.includes(a as any))
    );
  }

  // Sorting
  if (filters.sortBy === 'price_low') {
    list.sort((a, b) => a.minPriceRub - b.minPriceRub);
  } else if (filters.sortBy === 'price_high') {
    list.sort((a, b) => b.minPriceRub - a.minPriceRub);
  } else if (filters.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (filters.sortBy === 'stars') {
    list.sort((a, b) => b.stars - a.stars);
  } else {
    // popularity
    list.sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating));
  }

  return list;
}

export default function App() {
  // Global App States
  const [lang, setLang] = useState<Language>('ar');
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    try {
      const saved = localStorage.getItem('russiabooking_currency');
      if (saved && ['SAR', 'RUB', 'AED', 'USD', 'KWD', 'QAR'].includes(saved)) {
        return saved as SupportedCurrency;
      }
    } catch (e) {}
    return 'SAR';
  });

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('russiabooking_currency', newCurrency);
    } catch (e) {}
  };

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<string>('home');
  const [userRole, setUserRole] = useState<UserRole>('TRAVELER');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('russiabooking_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'user-hashed-1',
      name: 'سعد بن خالد الراجحي',
      email: 'hashedalrajhi@gmail.com',
      phone: '+966 50 123 4567',
      role: 'TRAVELER',
      kycStatus: 'VERIFIED',
      kycDetails: {
        passportNumber: 'N12345678',
        fullNameLatin: 'Saad Khaled Alrajhi',
        nationality: 'Saudi Arabia',
        dateOfBirth: '1990-05-12',
        expiryDate: '2030-08-20',
        gender: 'MALE',
        verifiedAt: '2026-01-16T12:00:00Z',
      },
      loyaltyTier: 'GOLD',
      loyaltyPoints: 7048,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-08-20T10:05:00Z',
    };
  });

  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setUserRole(user.role);
    try {
      localStorage.setItem('russiabooking_user', JSON.stringify(user));
      localStorage.setItem('russiabooking_token', token);
    } catch (e) {}
    
    // Update local profile view state if name/email match
    setUserProfile((prev) => ({
      ...prev,
      name: user.name,
      email: user.email,
      phone: user.phone || prev.phone,
      passportNumber: user.kycDetails?.passportNumber || prev.passportNumber,
    }));

    showToast(
      lang === 'ar'
        ? `مرحباً ${user.name} (${user.role})`
        : `Welcome back, ${user.name} (${user.role})`
    );

    // If partner or admin, route them naturally to their extranet/admin portal
    if (user.role === 'HOTEL_PARTNER' || user.role === 'PLATFORM_ADMIN' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('TRAVELER');
    try {
      localStorage.removeItem('russiabooking_user');
      localStorage.removeItem('russiabooking_token');
    } catch (e) {}
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
  };

  // Inventory & Search States
  const [hotels, setHotels] = useState<Hotel[]>(SEED_HOTELS);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
  });

  // Flow & Selection States
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [selectedRate, setSelectedRate] = useState<RoomRate | null>(null);

  // Bookings & Customer States
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('russiabooking_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length >= INITIAL_BOOKINGS.length) return parsed;
          const existingIds = new Set(parsed.map((b: Booking) => b.id));
          return [...parsed, ...INITIAL_BOOKINGS.filter((b) => !existingIds.has(b.id))];
        }
      }
    } catch (e) {}
    return INITIAL_BOOKINGS;
  });
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('russiabooking_favorites');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['moscow-four-seasons'];
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const defaultProfile: UserProfile = {
      id: 'user-hashed-1',
      name: 'سعد بن خالد الراجحي',
      email: 'hashedalrajhi@gmail.com',
      phone: '+966 50 123 4567',
      nationality: 'Saudi Arabia',
      passportNumber: 'N12345678',
      country: 'المملكة العربية السعودية',
      tier: 'GOLD',
      loyaltyTier: 'GOLD',
      totalPoints: 7048,
      loyaltyPoints: 7048,
      lifetimePoints: 7048,
      nextTierPointsThreshold: 10000,
      memberSince: '2026-01-15T10:00:00Z',
      preferences: {
        halalFood: true,
        prayerRugs: true,
        arabicSupport: true,
        autoVisaVoucher: true,
      },
      loyaltyTransactions: [
        {
          id: 'tx-init-6',
          bookingId: 'book-init-6',
          bookingCode: 'RB-2026-115',
          hotelNameEn: 'Four Seasons Hotel Moscow',
          hotelNameAr: 'فندق فور سيزونز موسكو',
          points: 952,
          type: 'EARNED',
          descriptionEn: 'VIP Tier Bonus on Four Seasons Hotel Moscow reservation',
          descriptionAr: 'مكافأة المستوى الذهبي لحجز فندق فور سيزونز موسكو',
          createdAt: '2026-09-02T11:05:00Z',
        },
        {
          id: 'tx-init-5',
          bookingId: 'book-init-1',
          bookingCode: 'RB-2026-101',
          hotelNameEn: 'Four Seasons Hotel Moscow',
          hotelNameAr: 'فندق فور سيزونز موسكو',
          points: 1948,
          type: 'EARNED',
          descriptionEn: 'Earned on completed booking at Four Seasons Hotel Moscow',
          descriptionAr: 'نقاط مكتسبة عن حجز مؤكد ومكتمل في فندق فور سيزونز موسكو',
          createdAt: '2026-08-22T12:00:00Z',
        },
        {
          id: 'tx-init-4',
          bookingId: 'book-init-2',
          bookingCode: 'RB-2026-088',
          hotelNameEn: 'The Carlton, Moscow',
          hotelNameAr: 'ذا كارلتون، موسكو',
          points: 1260,
          type: 'EARNED',
          descriptionEn: 'Earned on completed stay at The Carlton, Moscow',
          descriptionAr: 'نقاط مكتسبة عن إقامة مكتملة في ذا كارلتون، موسكو',
          createdAt: '2026-07-15T12:00:00Z',
        },
        {
          id: 'tx-init-3',
          bookingId: 'book-init-3',
          bookingCode: 'RB-2026-074',
          hotelNameEn: 'Radisson Collection Hotel, Moscow',
          hotelNameAr: 'فندق راديسون كوليكشن موسكو',
          points: 941,
          type: 'EARNED',
          descriptionEn: 'Earned on completed stay at Radisson Collection Hotel',
          descriptionAr: 'نقاط مكتسبة عن إقامة مكتملة في فندق راديسون كوليكشن',
          createdAt: '2026-06-18T12:00:00Z',
        },
        {
          id: 'tx-init-2',
          bookingId: 'book-init-4',
          bookingCode: 'RB-2026-059',
          hotelNameEn: 'Four Seasons Hotel Moscow',
          hotelNameAr: 'فندق فور سيزونز موسكو',
          points: 1254,
          type: 'EARNED',
          descriptionEn: 'Earned on completed stay at Four Seasons Hotel Moscow',
          descriptionAr: 'نقاط مكتسبة عن إقامة مكتملة في فندق فور سيزونز موسكو',
          createdAt: '2026-05-11T12:00:00Z',
        },
        {
          id: 'tx-init-1',
          bookingId: 'book-init-5',
          bookingCode: 'RB-2026-042',
          hotelNameEn: 'Radisson Collection Hotel, Moscow',
          hotelNameAr: 'فندق راديسون كوليكشن موسكو',
          points: 693,
          type: 'EARNED',
          descriptionEn: 'Earned on completed stay at Radisson Collection Hotel',
          descriptionAr: 'نقاط مكتسبة عن إقامة مكتملة في فندق راديسون كوليكشن',
          createdAt: '2026-04-18T12:00:00Z',
        },
      ],
    };
    try {
      const saved = localStorage.getItem('russiabooking_profile');
      if (saved) return { ...defaultProfile, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultProfile;
  });

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync RTL and Language attribute with HTML
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync Dark Mode class with HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fetch Hotels API with client-side fallback
  const fetchHotels = useCallback(async (filters: SearchFilters = searchFilters) => {
    setLoadingHotels(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters.minRating) params.append('minRating', String(filters.minRating));
      if (filters.guests) params.append('guests', String(filters.guests));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.freeCancellationOnly) params.append('freeCancellation', 'true');
      if (filters.breakfastIncludedOnly) params.append('breakfastIncluded', 'true');
      if (filters.halalFriendlyOnly) params.append('halalFriendly', 'true');
      if (filters.stars && filters.stars.length > 0) params.append('stars', filters.stars.join(','));
      if (filters.amenities && filters.amenities.length > 0) params.append('amenities', filters.amenities.join(','));

      const res = await fetch(`/api/hotels?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setHotels(json.data);
          return;
        }
      }
    } catch (err) {
      // API not reachable or static deployment (e.g. GitHub Pages)
    } finally {
      setLoadingHotels(false);
    }

    // Client-side filtering fallback
    setHotels(filterHotelsClient(SEED_HOTELS, filters));
  }, [searchFilters]);

  // Fetch Bookings, Favorites & User Profile API with localStorage fallback
  const fetchBookingsAndFavorites = useCallback(async () => {
    try {
      const [bRes, fRes, pRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/favorites?userId=guest-user'),
        fetch('/api/user/profile?userId=guest-user'),
      ]);
      if (bRes.ok && fRes.ok && pRes.ok) {
        const [bJson, fJson, pJson] = await Promise.all([bRes.json(), fRes.json(), pRes.json()]);
        if (bJson.success && Array.isArray(bJson.data)) {
          setBookings(bJson.data);
          localStorage.setItem('russiabooking_bookings', JSON.stringify(bJson.data));
        }
        if (fJson.success && Array.isArray(fJson.data)) {
          setFavorites(fJson.data);
          localStorage.setItem('russiabooking_favorites', JSON.stringify(fJson.data));
        }
        if (pJson.success && pJson.data) {
          setUserProfile(pJson.data);
          localStorage.setItem('russiabooking_profile', JSON.stringify(pJson.data));
        }
        return;
      }
    } catch (err) {
      // Fallback to local data (GitHub Pages)
    }

    // Load from local storage
    try {
      const savedBookings = localStorage.getItem('russiabooking_bookings');
      if (savedBookings) setBookings(JSON.parse(savedBookings));
      const savedFavs = localStorage.getItem('russiabooking_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      const savedProf = localStorage.getItem('russiabooking_profile');
      if (savedProf) setUserProfile(JSON.parse(savedProf));
    } catch (e) {}
  }, []);

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', ...updated }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUserProfile(json.data);
          localStorage.setItem('russiabooking_profile', JSON.stringify(json.data));
          showToast(lang === 'ar' ? 'تم حفظ بيانات الملف الشخصي بنجاح' : 'Profile updated successfully');
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // Client fallback
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem('russiabooking_profile', JSON.stringify(next));
      return next;
    });
    showToast(lang === 'ar' ? 'تم حفظ بيانات الملف الشخصي بنجاح' : 'Profile updated successfully');
  };

  useEffect(() => {
    fetchHotels();
    fetchBookingsAndFavorites();
  }, [fetchHotels, fetchBookingsAndFavorites]);

  // Deep-link check for hotel pages & query params (Client / SSR Parity)
  useEffect(() => {
    if (hotels.length === 0) return;
    const path = window.location.pathname;
    const match = path.match(/^\/(?:hotel|hotels)\/([^/]+)/);
    const searchParams = new URLSearchParams(window.location.search);
    const hotelIdFromQuery = searchParams.get('hotel');
    const targetId = match ? match[1] : hotelIdFromQuery;

    if (targetId) {
      const found = hotels.find((h) => h.id === targetId);
      if (found) {
        setSelectedHotel(found);
        setCurrentView('hotel-details');
      }
    }
  }, [hotels]);

  // Sync dynamic document title, HTML lang and dir for WCAG AA and SEO
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (currentView === 'hotel-details' && selectedHotel) {
      document.title = lang === 'ar' 
        ? `${selectedHotel.nameAr} | حجز فنادق ${selectedHotel.cityAr} - RussiaBooking` 
        : `${selectedHotel.nameEn} | Luxury Hotels in ${selectedHotel.city} - RussiaBooking`;
    } else if (currentView === 'booking' && selectedHotel) {
      document.title = lang === 'ar'
        ? `إتمام حجز ${selectedHotel.nameAr} - RussiaBooking`
        : `Booking Checkout: ${selectedHotel.nameEn} - RussiaBooking`;
    } else if (currentView === 'my-bookings') {
      document.title = lang === 'ar' ? 'حجوزاتي وإدارة التذاكر - RussiaBooking' : 'My Bookings - RussiaBooking';
    } else if (currentView === 'profile') {
      document.title = lang === 'ar' ? 'الملف الشخصي وبرنامج الولاء - RussiaBooking' : 'Profile & Loyalty Rewards - RussiaBooking';
    } else if (currentView === 'search') {
      document.title = lang === 'ar' ? 'نتائج البحث عن فنادق روسيا - RussiaBooking' : 'Search Luxury Hotels in Russia - RussiaBooking';
    } else {
      document.title = lang === 'ar' 
        ? 'RussiaBooking | منصة حجز فنادق روسيا الفاخرة' 
        : 'RussiaBooking | Premium Russian Hotels & Resorts for GCC Travelers';
    }
  }, [lang, currentView, selectedHotel]);

  // Favorite toggle handler with client-side persistence
  const handleToggleFavorite = async (hotelId: string) => {
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', hotelId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setFavorites((prev) => {
            const next = json.isFavorited ? [...prev, hotelId] : prev.filter((id) => id !== hotelId);
            localStorage.setItem('russiabooking_favorites', JSON.stringify(next));
            return next;
          });
          showToast(
            json.isFavorited
              ? (lang === 'ar' ? 'تمت إضافة الفندق إلى قائمة المفضلة' : 'Added to favorites')
              : (lang === 'ar' ? 'تمت إزالة الفندق من المفضلة' : 'Removed from favorites')
          );
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // Client-side toggle fallback
    setFavorites((prev) => {
      const exists = prev.includes(hotelId);
      const next = exists ? prev.filter((id) => id !== hotelId) : [...prev, hotelId];
      localStorage.setItem('russiabooking_favorites', JSON.stringify(next));
      showToast(
        !exists
          ? (lang === 'ar' ? 'تمت إضافة الفندق إلى قائمة المفضلة' : 'Added to favorites')
          : (lang === 'ar' ? 'تمت إزالة الفندق من المفضلة' : 'Removed from favorites')
      );
      return next;
    });
  };

  // Navigate with window scroll reset
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search Handler
  const handleSearch = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...searchFilters, ...newFilters };
    setSearchFilters(updated);
    fetchHotels(updated);
    handleNavigate('search');
  };

  // City selection quick click
  const handleSelectCity = (city: string) => {
    handleSearch({ city });
  };

  // View hotel details
  const handleSelectHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    handleNavigate('hotel-details');
  };

  // Select room & rate to open checkout
  const handleSelectRoomAndRate = (room: HotelRoom, rate: RoomRate) => {
    setSelectedRoom(room);
    setSelectedRate(rate);
    handleNavigate('booking');
  };

  // Booking completion with offline / static persistence
  const handleBookingComplete = (booking: Booking) => {
    setConfirmedBooking(booking);
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === booking.id || b.bookingCode === booking.bookingCode);
      const next = exists ? prev.map((b) => (b.id === booking.id ? booking : b)) : [booking, ...prev];
      try {
        localStorage.setItem('russiabooking_bookings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    fetchBookingsAndFavorites();
    handleNavigate('confirmation');
    showToast(
      lang === 'ar'
        ? `تم تأكيد حجزك بنجاح! رقم الحجز: ${booking.bookingCode}`
        : `Booking Confirmed! Code: ${booking.bookingCode}`
    );
  };

  // Cancel booking handler with local fallback
  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          fetchBookingsAndFavorites();
          showToast(
            lang === 'ar'
              ? 'تم إلغاء الحجز بنجاح ومعالجة الاسترداد للبطاقة'
              : 'Booking cancelled and refund initiated.'
          );
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // Client-side cancel fallback
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b));
      try {
        localStorage.setItem('russiabooking_bookings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(
      lang === 'ar'
        ? 'تم إلغاء الحجز بنجاح ومعالجة الاسترداد للبطاقة'
        : 'Booking cancelled and refund initiated.'
    );
  };

  const t = translations[lang];
  const featuredHotels = hotels.filter((h) => h.featured);
  const favoriteHotels = hotels.filter((h) => favorites.includes(h.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1A1A1A] dark:bg-[#0F141C] dark:text-white font-sans transition-colors">
      {/* Toast Notification */}
      {toastMsg && (
        <div 
          role="status" 
          aria-live="polite" 
          className="fixed top-20 start-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#111827] text-white dark:bg-white dark:text-[#111827] px-5 py-3 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md border border-gray-200 dark:border-slate-700 flex items-center gap-2 animate-bounce"
        >
          <Sparkles className="w-4 h-4 text-[#E11D48]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        lang={lang}
        onLanguageChange={setLang}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        currentView={currentView}
        onNavigate={handleNavigate}
        savedCount={favorites.length}
        bookingsCount={bookings.filter((b) => b.status === 'CONFIRMED').length}
        loyaltyPoints={userProfile.totalPoints ?? userProfile.loyaltyPoints ?? 0}
        userRole={currentUser?.role || userRole}
        onToggleRole={() => {
          const nextRole: UserRole = (currentUser?.role === 'PLATFORM_ADMIN' || userRole === 'PLATFORM_ADMIN') ? 'TRAVELER' : 'PLATFORM_ADMIN';
          setUserRole(nextRole);
          if (nextRole === 'PLATFORM_ADMIN') handleNavigate('admin');
          else handleNavigate('home');
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Render Area - WCAG 2.1 AA Accessible Landmark */}
      <main id="main-content" role="main" tabIndex={-1} className="flex-1 pb-20 lg:pb-0 focus:outline-none">
        <Suspense fallback={<ViewFallback lang={lang} />}>
          {/* VIEW: HOME */}
          {currentView === 'home' && (
            <div>
              <HeroSearch
                lang={lang}
                onSearch={handleSearch}
                onSelectCity={handleSelectCity}
              />

              {/* Featured Luxury Hotels Section */}
              <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-12">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-slate-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                      <span>{lang === 'ar' ? 'فنادق مختارة حصرياً' : 'Handpicked for GCC Travelers'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
                      {lang === 'ar' ? 'أفخم الفنادق والمنتجعات الموصى بها في روسيا' : 'Top Luxury Stays in Russia'}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('search')}
                    className="text-xs sm:text-sm font-semibold text-[#E11D48] underline underline-offset-4 hover:opacity-85 flex items-center gap-1 self-start sm:self-auto transition"
                  >
                    <span>{lang === 'ar' ? 'تصفح كل الفنادق' : 'View all hotels'}</span>
                    {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4">
                  {(featuredHotels.length > 0 ? featuredHotels : hotels.slice(0, 3)).map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      lang={lang}
                      currency={currency}
                      isFavorite={favorites.includes(hotel.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={handleSelectHotel}
                    />
                  ))}
                </div>
              </section>

              {/* Destinations & Travel Guide Section */}
              <DestinationsGuide
                lang={lang}
                onSelectCity={handleSelectCity}
              />
            </div>
          )}

          {/* VIEW: SEARCH RESULTS */}
          {currentView === 'search' && (
            <SearchResultsView
              hotels={hotels}
              loading={loadingHotels}
              lang={lang}
              currency={currency}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectHotel={handleSelectHotel}
              searchFilters={searchFilters}
              onUpdateFilters={(newFilters) => {
                const updated = { ...searchFilters, ...newFilters };
                setSearchFilters(updated);
                fetchHotels(updated);
              }}
              onResetFilters={() => {
                const emptyFilters = { sortBy: 'popularity' as const };
                setSearchFilters(emptyFilters);
                fetchHotels(emptyFilters);
              }}
            />
          )}

          {/* VIEW: HOTEL DETAILS */}
          {currentView === 'hotel-details' && selectedHotel && (
            <HotelDetailsView
              hotel={selectedHotel}
              allHotels={hotels}
              lang={lang}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              isFavorite={favorites.includes(selectedHotel.id)}
              onToggleFavorite={handleToggleFavorite}
              onBack={() => handleNavigate('search')}
              onSelectRoomAndRate={handleSelectRoomAndRate}
              onSelectSimilarHotel={(h) => setSelectedHotel(h)}
            />
          )}

          {/* VIEW: BOOKING CHECKOUT */}
          {currentView === 'booking' && selectedHotel && selectedRoom && selectedRate && (
            <BookingCheckoutView
              hotel={selectedHotel}
              room={selectedRoom}
              rate={selectedRate}
              lang={lang}
              currency={currency}
              checkIn={searchFilters.checkIn || '2026-09-10'}
              checkOut={searchFilters.checkOut || '2026-09-15'}
              guestsCount={searchFilters.guests || 2}
              onBack={() => handleNavigate('hotel-details')}
              onBookingComplete={handleBookingComplete}
            />
          )}

          {/* VIEW: BOOKING CONFIRMATION & VOUCHER */}
          {currentView === 'confirmation' && confirmedBooking && (
            <BookingConfirmationView
              booking={confirmedBooking}
              lang={lang}
              currency={currency}
              totalLoyaltyBalance={userProfile.totalPoints ?? userProfile.loyaltyPoints ?? 0}
              onViewProfile={() => handleNavigate('profile')}
              onViewMyBookings={() => handleNavigate('my-bookings')}
              onGoHome={() => handleNavigate('home')}
            />
          )}

          {/* VIEW: MY BOOKINGS */}
          {currentView === 'my-bookings' && (
            <MyBookingsView
              bookings={bookings}
              lang={lang}
              currency={currency}
              loyaltyPoints={userProfile.totalPoints ?? userProfile.loyaltyPoints ?? 0}
              onViewProfile={() => handleNavigate('profile')}
              onSelectBookingForVoucher={(b) => {
                setConfirmedBooking(b);
                handleNavigate('confirmation');
              }}
              onCancelBooking={handleCancelBooking}
              onExploreHotels={() => handleNavigate('search')}
            />
          )}

          {/* VIEW: USER PROFILE & LOYALTY */}
          {currentView === 'profile' && (
            <UserProfileView
              profile={userProfile}
              bookings={bookings}
              favoritesCount={favorites.length}
              lang={lang}
              currency={currency}
              onUpdateProfile={handleUpdateProfile}
              onNavigateToBookings={() => handleNavigate('my-bookings')}
              onNavigateToFavorites={() => handleNavigate('saved')}
              onExploreHotels={() => handleNavigate('search')}
            />
          )}

          {/* VIEW: SAVED FAVORITES */}
          {currentView === 'saved' && (
            <SavedFavoritesView
              favoriteHotels={favoriteHotels}
              lang={lang}
              currency={currency}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectHotel={handleSelectHotel}
              onExploreHotels={() => handleNavigate('search')}
            />
          )}

          {/* VIEW: DESTINATIONS & GUIDE */}
          {(currentView === 'destinations' || currentView === 'guide') && (
            <DestinationsGuide
              lang={lang}
              onSelectCity={(city) => {
                handleSelectCity(city);
              }}
            />
          )}

          {/* VIEW: ADMIN PORTAL */}
          {currentView === 'admin' && (
            <AdminPortalView
              lang={lang}
              currency={currency}
              onExitAdmin={() => handleNavigate('home')}
            />
          )}
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer
        lang={lang}
        onNavigate={handleNavigate}
        onSelectCity={handleSelectCity}
      />

      {/* Unified Security & Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          onAuthSuccess={handleAuthSuccess}
        />
      </Suspense>

      {/* Mobile Bottom Navigation Bar (Thumb friendly with >= 44px tap targets) */}
      <nav 
        id="mobile-bottom-nav"
        className="mobile-nav fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F141C]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
          {/* Hotels / Search */}
          <button
            id="mobile-nav-hotels"
            onClick={() => handleNavigate('search')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 transition-colors active:scale-95 ${
              currentView === 'search' || currentView === 'home'
                ? 'text-[#E11D48] font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate max-w-full">{t.nav.hotels}</span>
          </button>

          {/* Destinations */}
          <button
            id="mobile-nav-destinations"
            onClick={() => handleNavigate('destinations')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 transition-colors active:scale-95 ${
              currentView === 'destinations' || currentView === 'guide'
                ? 'text-[#E11D48] font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate max-w-full">{t.nav.destinations}</span>
          </button>

          {/* My Bookings */}
          <button
            id="mobile-nav-bookings"
            onClick={() => handleNavigate('my-bookings')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 transition-colors active:scale-95 ${
              currentView === 'my-bookings'
                ? 'text-[#E11D48] font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            <Briefcase className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate max-w-full">{t.nav.myBookings}</span>
            {bookings.length > 0 && (
              <span className="absolute top-1.5 end-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[9px] font-bold text-white">
                {bookings.length}
              </span>
            )}
          </button>

          {/* Saved */}
          <button
            id="mobile-nav-saved"
            onClick={() => handleNavigate('saved')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 transition-colors active:scale-95 ${
              currentView === 'saved'
                ? 'text-[#E11D48] font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            <Bookmark className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight truncate max-w-full">{t.nav.saved}</span>
            {favorites.length > 0 && (
              <span className="absolute top-1.5 end-3 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 dark:bg-slate-700 text-[9px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Profile */}
          <button
            id="mobile-nav-profile"
            onClick={() => handleNavigate('profile')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 transition-colors active:scale-95 ${
              currentView === 'profile'
                ? 'text-[#E11D48] font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-amber-500" />
            <span className="text-[10px] leading-tight truncate max-w-full">{t.nav.profile}</span>
          </button>
        </div>
      </nav>

      {/* Non-intrusive PWA Mobile Install Banner */}
      <PWAInstallButton lang={lang} variant="banner" />
    </div>
  );
}
