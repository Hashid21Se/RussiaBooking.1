import React from 'react';
import { Bookmark, Building, Heart, Trash2 } from 'lucide-react';
import { Hotel, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { HotelCard } from './HotelCard';

interface SavedFavoritesViewProps {
  favoriteHotels: Hotel[];
  lang: Language;
  currency: SupportedCurrency;
  favorites: string[];
  onToggleFavorite: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onExploreHotels: () => void;
}

export const SavedFavoritesView: React.FC<SavedFavoritesViewProps> = ({
  favoriteHotels,
  lang,
  currency,
  favorites,
  onToggleFavorite,
  onSelectHotel,
  onExploreHotels,
}) => {
  const t = translations[lang];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Bookmark className="w-6 h-6 text-rose-500" />
          <span>{t.nav.saved}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {lang === 'ar'
            ? 'الفنادق الروسية الفاخرة التي قمت بحفظها للرجوع إليها لاحقاً والتخطيط لرحلتك'
            : 'Curated collection of your saved Russian hotels for future bookings and trip planning.'}
        </p>
      </div>

      {favoriteHotels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Heart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {lang === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'Your saved list is empty'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {lang === 'ar'
              ? 'اضغط على علامة القلب في أي فندق لحفظه هنا ومقارنة أسعاره ومزاياه.'
              : 'Click the heart icon on any hotel card to save it for quick reference.'}
          </p>
          <button
            onClick={onExploreHotels}
            className="rounded-xl bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white px-5 py-2.5 text-xs font-bold shadow-md transition"
          >
            {lang === 'ar' ? 'استكشف فنادق روسيا الآن' : 'Explore Hotels Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {favoriteHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              lang={lang}
              currency={currency}
              isFavorite={favorites.includes(hotel.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectHotel}
            />
          ))}
        </div>
      )}
    </div>
  );
};
