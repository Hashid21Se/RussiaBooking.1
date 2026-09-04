/**
 * RussiaBooking - Main Application Component
 * Production-Ready Full-Stack SaaS & PWA Experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { DestinationsGuide } from './components/DestinationsGuide';
import { SearchResultsView } from './components/SearchResultsView';
import { HotelDetailsView } from './components/HotelDetailsView';
import { BookingCheckoutView } from './components/BookingCheckoutView';
import { BookingConfirmationView } from './components/BookingConfirmationView';
import { MyBookingsView } from './components/MyBookingsView';
import { SavedFavoritesView } from './components/SavedFavoritesView';
import { AdminPortalView } from './components/AdminPortalView';
import { UserProfileView } from './components/UserProfileView';
import { Footer } from './components/Footer';
import { Language, translations } from './lib/i18n';
import { Hotel, HotelRoom, RoomRate, SearchFilters, SupportedCurrency, Booking, UserProfile } from './types';
import { HotelCard } from './components/HotelCard';
import { Sparkles, Building, ArrowLeft, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

export default function App() {
  // Global App States
  const [lang, setLang] = useState<Language>('ar');
  const [currency, setCurrency] = useState<SupportedCurrency>('SAR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<string>('home');
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN'>('USER');

  // Inventory & Search States
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    sortBy: 'popularity',
  });

  // Flow & Selection States
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [selectedRate, setSelectedRate] = useState<RoomRate | null>(null);

  // Bookings & Customer States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'guest-user',
    name: 'سعد بن خالد الراجحي',
    email: 'saad.alrajhi@example.com',
    phone: '+966 50 123 4567',
    nationality: 'Saudi Arabia',
    passportNumber: 'N12345678',
    country: 'Saudi Arabia',
    loyaltyTier: 'SILVER',
    loyaltyPoints: 1948,
    lifetimePoints: 1948,
    memberSince: '2024-01-15',
    preferences: {
      halalFood: true,
      prayerRugs: true,
      arabicSupport: true,
      autoVisaVoucher: true,
    },
    transactions: [
      {
        id: 'tx_init',
        bookingId: 'RU-2024-8891',
        hotelName: 'The St. Regis Moscow Nikolskaya',
        type: 'EARN',
        points: 1948,
        date: '2024-03-20',
        description: 'Completed stay points (Silver Tier 1.25x)',
      },
    ],
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

  // Fetch Hotels API
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
      const json = await res.json();
      if (json.success) {
        setHotels(json.data);
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  }, [searchFilters]);

  // Fetch Bookings, Favorites & User Profile API
  const fetchBookingsAndFavorites = useCallback(async () => {
    try {
      const [bRes, fRes, pRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/favorites?userId=guest-user'),
        fetch('/api/user/profile?userId=guest-user'),
      ]);
      const [bJson, fJson, pJson] = await Promise.all([bRes.json(), fRes.json(), pRes.json()]);
      if (bJson.success) setBookings(bJson.data);
      if (fJson.success) setFavorites(fJson.data);
      if (pJson.success && pJson.data) setUserProfile(pJson.data);
    } catch (err) {
      console.error('Error fetching bookings/favorites/profile:', err);
    }
  }, []);

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', ...updated }),
      });
      const json = await res.json();
      if (json.success) {
        setUserProfile(json.data);
        showToast(lang === 'ar' ? 'تم حفظ بيانات الملف الشخصي بنجاح' : 'Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchBookingsAndFavorites();
  }, [fetchHotels, fetchBookingsAndFavorites]);

  // Favorite toggle handler
  const handleToggleFavorite = async (hotelId: string) => {
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', hotelId }),
      });
      const json = await res.json();
      if (json.success) {
        setFavorites((prev) =>
          json.isFavorited ? [...prev, hotelId] : prev.filter((id) => id !== hotelId)
        );
        showToast(
          json.isFavorited
            ? (lang === 'ar' ? 'تمت إضافة الفندق إلى قائمة المفضلة' : 'Added to favorites')
            : (lang === 'ar' ? 'تمت إزالة الفندق من المفضلة' : 'Removed from favorites')
        );
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
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

  // Booking completion
  const handleBookingComplete = (booking: Booking) => {
    setConfirmedBooking(booking);
    fetchBookingsAndFavorites();
    handleNavigate('confirmation');
    showToast(
      lang === 'ar'
        ? `تم تأكيد حجزك بنجاح! رقم الحجز: ${booking.bookingCode}`
        : `Booking Confirmed! Code: ${booking.bookingCode}`
    );
  };

  // Cancel booking handler
  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) {
        fetchBookingsAndFavorites();
        showToast(
          lang === 'ar'
            ? 'تم إلغاء الحجز بنجاح ومعالجة الاسترداد للبطاقة'
            : 'Booking cancelled and refund initiated.'
        );
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  const t = translations[lang];
  const featuredHotels = hotels.filter((h) => h.featured);
  const favoriteHotels = hotels.filter((h) => favorites.includes(h.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1A1A1A] dark:bg-[#0F141C] dark:text-white font-sans transition-colors">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#111827] text-white dark:bg-white dark:text-[#111827] px-5 py-3 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md border border-gray-200 dark:border-slate-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E11D48]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        lang={lang}
        onLanguageChange={setLang}
        currency={currency}
        onCurrencyChange={setCurrency}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        currentView={currentView}
        onNavigate={handleNavigate}
        savedCount={favorites.length}
        bookingsCount={bookings.filter((b) => b.status === 'CONFIRMED').length}
        loyaltyPoints={userProfile.loyaltyPoints}
        userRole={userRole}
        onToggleRole={() => {
          const nextRole = userRole === 'USER' ? 'ADMIN' : 'USER';
          setUserRole(nextRole);
          if (nextRole === 'ADMIN') handleNavigate('admin');
          else handleNavigate('home');
        }}
      />

      {/* Main Content Render Area */}
      <div className="flex-1">
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
            totalLoyaltyBalance={userProfile.loyaltyPoints}
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
            loyaltyPoints={userProfile.loyaltyPoints}
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
      </div>

      {/* Global Footer */}
      <Footer
        lang={lang}
        onNavigate={handleNavigate}
        onSelectCity={handleSelectCity}
      />
    </div>
  );
}
