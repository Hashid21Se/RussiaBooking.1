import React, { useState } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  RotateCcw, 
  Building, 
  MapPin, 
  Star, 
  Utensils, 
  CheckCircle2, 
  Sparkles,
  Waves,
  Coffee,
  X,
  Map,
  List,
  Columns,
  Scale
} from 'lucide-react';
import { Hotel, SupportedCurrency, SearchFilters, SortOption } from '../types';
import { Language, translations } from '../lib/i18n';
import { HotelCard } from './HotelCard';
import { CurrencyService } from '../lib/currency';
import { InteractiveHotelMap } from './InteractiveHotelMap';
import { HotelComparisonModal } from './HotelComparisonModal';

interface SearchResultsViewProps {
  hotels: Hotel[];
  loading: boolean;
  lang: Language;
  currency: SupportedCurrency;
  favorites: string[];
  onToggleFavorite: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  searchFilters: SearchFilters;
  onUpdateFilters: (newFilters: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  hotels,
  loading,
  lang,
  currency,
  favorites,
  onToggleFavorite,
  onSelectHotel,
  searchFilters,
  onUpdateFilters,
  onResetFilters,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('list');
  const [comparedHotels, setComparedHotels] = useState<Hotel[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const t = translations[lang];

  const handleToggleCompare = (hotel: Hotel) => {
    setComparedHotels((prev) => {
      const exists = prev.some((h) => h.id === hotel.id);
      if (exists) {
        return prev.filter((h) => h.id !== hotel.id);
      }
      if (prev.length >= 4) {
        alert(t.compare.maxLimitNotice);
        return prev;
      }
      return [...prev, hotel];
    });
  };

  const handleRemoveFromCompare = (hotelId: string) => {
    setComparedHotels((prev) => prev.filter((h) => h.id !== hotelId));
  };

  const handleClearCompare = () => {
    setComparedHotels([]);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popularity', label: t.search.sortRecommended },
    { value: 'price_low', label: t.search.sortPriceLow },
    { value: 'price_high', label: t.search.sortPriceHigh },
    { value: 'rating', label: t.search.sortRating },
    { value: 'stars', label: t.search.sortStars },
  ];

  const handleStarToggle = (starNumber: number) => {
    const currentStars = searchFilters.stars || [];
    const newStars = currentStars.includes(starNumber)
      ? currentStars.filter((s) => s !== starNumber)
      : [...currentStars, starNumber];
    onUpdateFilters({ stars: newStars.length > 0 ? newStars : undefined });
  };

  const handleAmenityToggle = (amenityKey: string) => {
    const current = searchFilters.amenities || [];
    const updated = current.includes(amenityKey)
      ? current.filter((a) => a !== amenityKey)
      : [...current, amenityKey];
    onUpdateFilters({ amenities: updated.length > 0 ? updated : undefined });
  };

  const renderFiltersContent = () => (
    <div className="space-y-6 text-xs sm:text-sm">
      {/* 1. Star Rating Filter */}
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5">
          {t.search.stars}
        </h4>
        <div className="space-y-1.5">
          {[5, 4, 3].map((s) => {
            const isChecked = searchFilters.stars?.includes(s) ?? false;
            return (
              <label 
                key={s} 
                className="flex items-center justify-between cursor-pointer rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleStarToggle(s)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                  />
                  <div className="flex text-amber-500">
                    {Array.from({ length: s }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {s} {lang === 'ar' ? 'نجوم' : 'stars'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Guest Rating */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5">
          {t.search.rating}
        </h4>
        <div className="space-y-1">
          {[
            { min: 9.0, label: t.search.excellent },
            { min: 8.0, label: t.search.veryGood },
            { min: 0.0, label: t.search.allRatings },
          ].map((item) => (
            <button
              key={item.min}
              type="button"
              onClick={() => onUpdateFilters({ minRating: item.min > 0 ? item.min : undefined })}
              className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                (searchFilters.minRating || 0) === item.min
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Special Middle Eastern & Guest Perks */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5">
          {lang === 'ar' ? 'مزايا وتسهيلات خاصة' : 'Special Inclusions'}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={searchFilters.freeCancellationOnly ?? false}
              onChange={(e) => onUpdateFilters({ freeCancellationOnly: e.target.checked })}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
            />
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.search.freeCancellation}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={searchFilters.halalFriendlyOnly ?? false}
              onChange={(e) => onUpdateFilters({ halalFriendlyOnly: e.target.checked })}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
            />
            <Utensils className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.search.halalCertified}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={searchFilters.breakfastIncludedOnly ?? false}
              onChange={(e) => onUpdateFilters({ breakfastIncludedOnly: e.target.checked })}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
            />
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.search.breakfastIncluded}</span>
          </label>
        </div>
      </div>

      {/* 4. Amenities */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5">
          {t.search.amenities}
        </h4>
        <div className="space-y-2">
          {[
            { key: 'pool', label: t.search.pool },
            { key: 'spa', label: t.search.spa },
            { key: 'airportShuttle', label: t.search.airportShuttle },
            { key: 'arabicTv', label: t.search.arabicTv },
            { key: 'wifi', label: t.search.wifi },
          ].map((am) => (
            <label key={am.key} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={searchFilters.amenities?.includes(am.key) ?? false}
                onChange={() => handleAmenityToggle(am.key)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
              />
              <span>{am.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Action */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.search.clearFilters}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header: Search Context & Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-500" />
            <span>
              {searchFilters.city 
                ? (lang === 'ar' ? `فنادق ${searchFilters.city}` : `Hotels in ${searchFilters.city}`) 
                : (lang === 'ar' ? 'جميع فنادق روسيا المتاحة' : 'All Available Russian Hotels')}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.search.resultsCount.replace('{count}', String(hotels.length))}
            {searchFilters.checkIn && ` • ${searchFilters.checkIn} إلى ${searchFilters.checkOut}`}
          </p>
        </div>

        {/* Sorting Dropdown, View Switcher & Mobile Filter Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Mode Switcher (Booking.com style) */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.map.showList}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.map.showList}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.map.showMap}
            >
              <Map className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{t.map.showMap}</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.map.splitView}
            >
              <Columns className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.map.splitView}</span>
            </button>
          </div>

          {/* Mobile filter toggle */}
          <button
            id="mobile-filter-open-btn"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold shadow-sm"
          >
            <Filter className="w-4 h-4 text-amber-500" />
            <span>{t.search.filters}</span>
          </button>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="sort-select"
              value={searchFilters.sortBy || 'popularity'}
              onChange={(e) => onUpdateFilters({ sortBy: e.target.value as SortOption })}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'map' ? (
        /* Full Map View */
        <div className="mt-6 space-y-4">
          <InteractiveHotelMap
            hotels={hotels}
            lang={lang}
            currency={currency}
            activeCity={searchFilters.city}
            onSelectHotel={onSelectHotel}
            onCloseMap={() => setViewMode('list')}
          />
        </div>
      ) : viewMode === 'split' ? (
        /* Split View: List on left, Sticky Map on right */
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-6 space-y-4 max-h-[800px] overflow-y-auto pe-2">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                lang={lang}
                currency={currency}
                isFavorite={favorites.includes(hotel.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectHotel}
                isCompared={comparedHotels.some((h) => h.id === hotel.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
          <div className="md:col-span-6 sticky top-20">
            <InteractiveHotelMap
              hotels={hotels}
              lang={lang}
              currency={currency}
              activeCity={searchFilters.city}
              onSelectHotel={onSelectHotel}
            />
          </div>
        </div>
      ) : (
        /* Standard List + Filter Sidebar Grid */
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm h-fit sticky top-20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>{t.search.filters}</span>
              </h3>
              <button
                onClick={onResetFilters}
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {t.search.clearFilters}
              </button>
            </div>
            {renderFiltersContent()}
          </aside>

          {/* Results List */}
          <main className="lg:col-span-9 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <Building className="mx-auto w-12 h-12 text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t.search.emptyResults}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {lang === 'ar' ? 'جرب اختيار مدينة أخرى، أو تعديل خيارات التصفية ونطاق الأسعار.' : 'Try changing your search destination, dates, or relaxing active filters.'}
                </p>
                <button
                  onClick={onResetFilters}
                  className="rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 px-4 py-2 text-xs font-bold"
                >
                  {t.search.resetFilters}
                </button>
              </div>
            ) : (
              hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  lang={lang}
                  currency={currency}
                  isFavorite={favorites.includes(hotel.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={onSelectHotel}
                  isCompared={comparedHotels.some((h) => h.id === hotel.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))
            )}
          </main>
        </div>
      )}

      {/* Floating Compare Tray (Booking.com feature) */}
      {comparedHotels.length > 0 && (
        <div 
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="fixed bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:end-8 z-40 bg-slate-950/95 dark:bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-md flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden">
            {comparedHotels.map((h) => (
              <img
                key={h.id}
                src={h.images[0]?.url}
                alt={h.nameEn}
                className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-950 object-cover"
              />
            ))}
          </div>

          <div className="text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.compare.trayTitle}</span>
              <span className="rounded-full bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                {comparedHotels.length}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {t.compare.trayCount.replace('{count}', String(comparedHotels.length))}
            </div>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition active:scale-95 whitespace-nowrap"
            >
              {t.compare.openModal}
            </button>
            <button
              onClick={handleClearCompare}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              title={t.compare.clearAll}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hotel Comparison Side-by-Side Modal */}
      {isCompareModalOpen && (
        <HotelComparisonModal
          hotels={comparedHotels}
          lang={lang}
          currency={currency}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveHotel={handleRemoveFromCompare}
          onSelectHotel={onSelectHotel}
          onClearAll={handleClearCompare}
        />
      )}

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div 
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div 
            className="w-full max-w-xs sm:max-w-sm ms-auto h-full overflow-y-auto bg-white dark:bg-slate-900 p-5 shadow-2xl flex flex-col justify-between"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-500" />
                  <span>{t.search.filters}</span>
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFiltersContent()}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6 pb-6">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-slate-950 shadow-md transition active:scale-98"
              >
                {lang === 'ar' ? `عرض النتائج (${hotels.length})` : `Show Results (${hotels.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
