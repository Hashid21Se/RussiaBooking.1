import React, { useState } from 'react';
import { Search, Calendar, Users, MapPin, CheckCircle2, Shield, Utensils, CreditCard } from 'lucide-react';
import { Language, translations } from '../lib/i18n';
import { SearchFilters } from '../types';

interface HeroSearchProps {
  lang: Language;
  onSearch: (filters: Partial<SearchFilters>) => void;
  onSelectCity: (city: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ lang, onSearch, onSelectCity }) => {
  const t = translations[lang];

  // Default dates: tomorrow to +4 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkInDefault = tomorrow.toISOString().split('T')[0];

  const checkout = new Date();
  checkout.setDate(checkout.getDate() + 5);
  const checkOutDefault = checkout.toISOString().split('T')[0];

  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(checkInDefault);
  const [checkOut, setCheckOut] = useState(checkOutDefault);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showGuestsPopover, setShowGuestsPopover] = useState(false);

  // Quick filters
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [halalFriendly, setHalalFriendly] = useState(false);
  const [breakfastIncluded, setBreakfastIncluded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      city: city || undefined,
      checkIn,
      checkOut,
      guests: adults + children,
      rooms,
      freeCancellationOnly: freeCancellation,
      halalFriendlyOnly: halalFriendly,
      breakfastIncludedOnly: breakfastIncluded,
    });
  };

  const popularCities = [
    { key: 'Moscow', nameAr: 'موسكو', nameEn: 'Moscow' },
    { key: 'Saint Petersburg', nameAr: 'سانت بطرسبرغ', nameEn: 'St. Petersburg' },
    { key: 'Sochi', nameAr: 'سوتشي', nameEn: 'Sochi' },
    { key: 'Kazan', nameAr: 'قازان', nameEn: 'Kazan' },
    { key: 'Murmansk', nameAr: 'مورمانسك', nameEn: 'Murmansk' },
  ];

  return (
    <section className="relative bg-[#F8F9FA] dark:bg-[#0F141C] text-[#1A1A1A] dark:text-white py-10 md:py-16 px-4 sm:px-6 transition-colors">
      <div className="relative mx-auto max-w-6xl">
        {/* Main Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1 text-xs font-semibold text-[#E11D48] mb-4 shadow-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'بوابة رسمية معتمدة لتأشيرة السفر وحجوزات روسيا' : 'Verified Russian Hotel Booking & E-Visa Vouchers'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111827] dark:text-white leading-tight mb-3 font-display">
            {t.hero.title}
          </h1>
          <p className="text-[#6B7280] dark:text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Search Box Card */}
        <div className="rounded-3xl bg-white dark:bg-[#151C28] p-6 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-[#F3F4F6] dark:border-slate-800 text-[#111827] dark:text-white transition-all">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Destination Input */}
              <div className="md:col-span-4 relative">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400 mb-1.5">
                  {t.hero.searchDestination}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#E11D48]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    id="search-city-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 ps-10 pe-3 py-3 text-sm font-semibold text-[#111827] dark:text-white focus:border-[#E11D48] focus:outline-none transition"
                  >
                    <option value="">{t.hero.allCities}</option>
                    <option value="Moscow">{lang === 'ar' ? 'موسكو (Moscow)' : 'Moscow'}</option>
                    <option value="Saint Petersburg">{lang === 'ar' ? 'سانت بطرسبرغ (St. Petersburg)' : 'Saint Petersburg'}</option>
                    <option value="Sochi">{lang === 'ar' ? 'سوتشي وروز خوتور (Sochi)' : 'Sochi'}</option>
                    <option value="Kazan">{lang === 'ar' ? 'قازان - تتارستان (Kazan)' : 'Kazan'}</option>
                    <option value="Murmansk">{lang === 'ar' ? 'مورمانسك - الشفق القطبي (Murmansk)' : 'Murmansk'}</option>
                  </select>
                </div>
              </div>

              {/* Check-In Date */}
              <div className="md:col-span-2 relative">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400 mb-1.5">
                  {t.hero.checkIn}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#9CA3AF]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="search-checkin-input"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 ps-9 pe-2 py-3 text-xs sm:text-sm font-semibold text-[#111827] dark:text-white focus:border-[#E11D48] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Check-Out Date */}
              <div className="md:col-span-2 relative">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400 mb-1.5">
                  {t.hero.checkOut}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-[#9CA3AF]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="search-checkout-input"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 ps-9 pe-2 py-3 text-xs sm:text-sm font-semibold text-[#111827] dark:text-white focus:border-[#E11D48] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Guests & Rooms */}
              <div className="md:col-span-2 relative">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400 mb-1.5">
                  {t.hero.guests}
                </label>
                <button
                  id="search-guests-btn"
                  type="button"
                  onClick={() => setShowGuestsPopover(!showGuestsPopover)}
                  className="w-full flex items-center justify-between rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-xs sm:text-sm font-semibold text-[#111827] dark:text-slate-200"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Users className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                    <span>{adults + children} {t.common.guestsPlural}, {rooms} {t.hero.rooms}</span>
                  </span>
                </button>

                {/* Popover */}
                {showGuestsPopover && (
                  <div className="absolute z-30 start-0 mt-2 w-64 rounded-2xl border border-[#E5E7EB] dark:border-slate-700 bg-white p-4 shadow-xl dark:bg-slate-900">
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t.hero.adults}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >-</button>
                          <span className="w-5 text-center font-bold">{adults}</span>
                          <button
                            type="button"
                            onClick={() => setAdults(adults + 1)}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >+</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t.hero.children}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >-</button>
                          <span className="w-5 text-center font-bold">{children}</span>
                          <button
                            type="button"
                            onClick={() => setChildren(children + 1)}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >+</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t.hero.rooms}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >-</button>
                          <span className="w-5 text-center font-bold">{rooms}</span>
                          <button
                            type="button"
                            onClick={() => setRooms(rooms + 1)}
                            className="h-7 w-7 rounded-lg border border-[#E5E7EB] dark:border-slate-600 flex items-center justify-center font-bold text-[#111827] dark:text-white"
                          >+</button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowGuestsPopover(false)}
                        className="w-full mt-2 rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-[#E11D48] dark:hover:bg-[#BE123C] py-2 font-bold transition-colors"
                      >
                        {t.common.save}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  id="search-submit-btn"
                  type="submit"
                  className="w-full h-[46px] flex items-center justify-center gap-2 rounded-2xl bg-[#111827] hover:bg-black text-white dark:bg-[#E11D48] dark:hover:bg-[#BE123C] font-bold text-sm shadow-md transition-colors active:scale-98"
                >
                  <Search className="w-4 h-4" />
                  <span>{t.hero.searchHotels}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#F3F4F6] dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B7280] dark:text-slate-300 font-medium hover:text-[#111827]">
                <input
                  id="quick-filter-cancel"
                  type="checkbox"
                  checked={freeCancellation}
                  onChange={(e) => setFreeCancellation(e.target.checked)}
                  className="rounded border-[#E5E7EB] text-[#E11D48] focus:ring-[#E11D48] h-4 w-4"
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{t.search.freeCancellation}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B7280] dark:text-slate-300 font-medium hover:text-[#111827]">
                <input
                  id="quick-filter-halal"
                  type="checkbox"
                  checked={halalFriendly}
                  onChange={(e) => setHalalFriendly(e.target.checked)}
                  className="rounded border-[#E5E7EB] text-[#E11D48] focus:ring-[#E11D48] h-4 w-4"
                />
                <Utensils className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>{t.search.halalCertified}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B7280] dark:text-slate-300 font-medium hover:text-[#111827]">
                <input
                  id="quick-filter-breakfast"
                  type="checkbox"
                  checked={breakfastIncluded}
                  onChange={(e) => setBreakfastIncluded(e.target.checked)}
                  className="rounded border-[#E5E7EB] text-[#E11D48] focus:ring-[#E11D48] h-4 w-4"
                />
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.search.breakfastIncluded}</span>
              </label>
            </div>
          </form>
        </div>

        {/* Popular City Quick-links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[#9CA3AF] font-medium">{t.hero.popularSearches}</span>
          {popularCities.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setCity(c.key);
                onSelectCity(c.key);
              }}
              className="rounded-full bg-white dark:bg-slate-900 hover:border-[#111827] dark:hover:border-slate-500 text-[#4B5563] dark:text-slate-300 border border-[#E5E7EB] dark:border-slate-800 px-3.5 py-1 font-medium transition shadow-xs active:scale-95"
            >
              {lang === 'ar' ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
