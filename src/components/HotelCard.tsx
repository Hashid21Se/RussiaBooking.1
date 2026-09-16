import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  CheckCircle, 
  Utensils, 
  Wifi, 
  Heart, 
  Eye, 
  Sparkles,
  ShieldCheck,
  Coffee,
  Waves,
  Flame,
  Clock,
  Tag,
  FileDown,
  Loader2
} from 'lucide-react';
import { Hotel, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';
import { OptimizedImage } from './OptimizedImage';
import { downloadHotelFactSheetPdf } from '../lib/pdfVoucherGenerator';

interface HotelCardProps {
  hotel: Hotel;
  lang: Language;
  currency: SupportedCurrency;
  isFavorite: boolean;
  onToggleFavorite: (hotelId: string) => void;
  onSelect: (hotel: Hotel) => void;
  isCompared?: boolean;
  onToggleCompare?: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  lang,
  currency,
  isFavorite,
  onToggleFavorite,
  onSelect,
  isCompared = false,
  onToggleCompare,
}) => {
  const t = translations[lang];
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const primaryImage = hotel.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  const handleQuickExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadHotelFactSheetPdf(hotel, lang, currency);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div 
      id={`hotel-card-${hotel.id}`}
      className="hotel-card group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#151C28] shadow-xs hover:shadow-md transition-all duration-200"
    >
      {/* Image Thumbnail Container */}
      <div className="relative w-full sm:w-72 md:w-80 shrink-0 aspect-[16/11] sm:aspect-auto overflow-hidden bg-[#F3F4F6] dark:bg-slate-800">
        <OptimizedImage
          src={primaryImage}
          alt={lang === 'ar' ? hotel.nameAr : hotel.nameEn}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          containerClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:hidden"></div>

        {/* Favorite, Compare & PDF Export Buttons Container */}
        <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
          {onToggleCompare && (
            <button
              id={`compare-btn-${hotel.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(hotel);
              }}
              className={`min-h-[44px] min-w-[44px] rounded-full px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all active:scale-90 flex items-center justify-center gap-1 shadow-sm ${
                isCompared
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-white/90 dark:bg-black/70 text-[#111827] dark:text-white hover:bg-white'
              }`}
              title={isCompared ? t.compare.addedToCompare : t.compare.addToCompare}
              aria-label="Toggle compare"
            >
              <span>{isCompared ? '✓ ' + (lang === 'ar' ? 'مقارن' : 'Comparing') : '+ ' + (lang === 'ar' ? 'مقارنة' : 'Compare')}</span>
            </button>
          )}

          {/* Quick PDF Factsheet Export */}
          <button
            id={`pdf-export-btn-${hotel.id}`}
            onClick={handleQuickExportPdf}
            disabled={isExportingPdf}
            className="min-h-[44px] min-w-[44px] rounded-full p-2.5 backdrop-blur-md transition-all active:scale-90 flex items-center justify-center bg-white/90 dark:bg-black/70 text-[#111827] dark:text-white hover:bg-white shadow-sm"
            title={t.pdfExport?.quickExport || 'Export PDF'}
            aria-label="Export hotel PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#E11D48]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#E11D48]" />
            )}
          </button>

          <button
            id={`fav-btn-${hotel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(hotel.id);
            }}
            className={`min-h-[44px] min-w-[44px] rounded-full p-2.5 backdrop-blur-md transition-all active:scale-90 flex items-center justify-center shadow-sm ${
              isFavorite 
                ? 'bg-[#E11D48] text-white' 
                : 'bg-white/90 dark:bg-black/70 text-[#111827] dark:text-white hover:bg-white'
            }`}
            title={isFavorite ? t.common.unsaved : t.common.saved}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Featured & High Demand Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1 z-10">
          {hotel.featured && (
            <div className="rounded-full bg-[#E11D48] text-white px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'ar' ? 'مميز وحصري' : 'Featured'}</span>
            </div>
          )}
          {hotel.minPriceRub > 25000 && (
            <div className="rounded-full bg-amber-500 text-slate-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs">
              {lang === 'ar' ? 'طلب مرتفع اليوم' : 'High Demand'}
            </div>
          )}
        </div>

        {/* E-Visa Support Tag */}
        <div className="absolute bottom-3 start-3 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-[#10B981] border border-gray-100 dark:border-slate-800 flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-[#10B981]" />
          <span>{lang === 'ar' ? 'دعوة تأشيرة معتمدة' : 'Official E-Visa Voucher'}</span>
        </div>
      </div>

      {/* Hotel Content & Info */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 md:p-6">
        <div>
          {/* Top meta: Stars & Rating */}
          <div className="flex items-start justify-between gap-2">
            <div>
              {/* Star Rating Badges */}
              <div className="flex items-center gap-1 mb-1.5 text-amber-500">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <span className="text-[11px] font-semibold text-[#9CA3AF] ms-1">
                  {hotel.stars} {t.search.starsCount.replace('{count}', '')}
                </span>
              </div>

              {/* Hotel Title */}
              <h3 
                onClick={() => onSelect(hotel)}
                className="text-lg font-bold text-[#111827] dark:text-white group-hover:text-[#E11D48] transition-colors cursor-pointer min-h-[44px] flex items-center"
              >
                {lang === 'ar' ? hotel.nameAr : hotel.nameEn}
              </h3>

              {/* City & Distance to landmark */}
              <div className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-slate-400 mt-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                <span className="font-semibold text-[#111827] dark:text-slate-300 shrink-0">
                  {lang === 'ar' ? hotel.cityAr : hotel.city}
                </span>
                <span>•</span>
                <span className="truncate min-w-0">
                  {lang === 'ar' ? hotel.addressAr : hotel.addressEn}
                </span>
              </div>
            </div>

            {/* Overall Rating Score Box */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-end hidden sm:block">
                <div className="text-xs font-bold text-[#111827] dark:text-slate-200">
                  {hotel.rating >= 9.5 ? (lang === 'ar' ? 'استثنائي' : 'Exceptional') : (lang === 'ar' ? 'ممتاز جداً' : 'Superb')}
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
                  {hotel.reviewCount} {lang === 'ar' ? 'تقييم' : 'reviews'}
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] dark:bg-white font-bold text-white dark:text-[#111827] text-sm shadow-xs">
                ★ {hotel.rating.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Amenities Badges */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs">
            {hotel.policies.halalCertifiedFood && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F9FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#111827] dark:text-slate-300">
                <Utensils className="w-3 h-3 text-[#E11D48]" />
                {t.hotelCard.halalAvailable}
              </span>
            )}
            {hotel.policies.freeCancellationHours > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F9FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#10B981] dark:text-[#10B981]">
                <CheckCircle className="w-3 h-3 text-[#10B981]" />
                {t.hotelCard.freeCancellation}
              </span>
            )}
            {hotel.amenities.includes('pool') && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F9FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#4B5563] dark:text-slate-300">
                <Waves className="w-3 h-3 text-blue-500" />
                {t.search.pool}
              </span>
            )}
            {hotel.amenities.includes('wifi') && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F9FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700/60 px-2.5 py-0.5 text-[11px] font-medium text-[#4B5563] dark:text-slate-300">
                <Wifi className="w-3 h-3 text-[#9CA3AF]" />
                WiFi
              </span>
            )}
          </div>

          {/* Booking.com Style Urgency & Demand Indicator */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
            {/* Scarcity badge */}
            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
              <Clock className="w-3 h-3" />
              <span>
                {t.urgency.onlyRoomsLeft.replace('{count}', String(hotel.rooms[0]?.rates[0]?.availableQuantity || 2))}
              </span>
            </span>

            {/* High demand text */}
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Flame className="w-3 h-3" />
              <span>
                {t.urgency.highDemand.replace('{count}', String(Math.floor((hotel.rating * 2) + 3)))}
              </span>
            </span>
          </div>
        </div>

        {/* Bottom Price & Booking CTA */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF]">
              {t.hotelCard.perNight}
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white">
                {CurrencyService.format(hotel.minPriceRub, currency, lang)}
              </span>
              {currency !== 'RUB' && (
                <span className="text-xs text-[#9CA3AF] font-medium">
                  ({hotel.minPriceRub.toLocaleString()} ₽)
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#10B981] font-medium">
              {t.hotelCard.taxesIncluded}
            </div>
          </div>

          <button
            id={`view-rooms-btn-${hotel.id}`}
            onClick={() => onSelect(hotel)}
            className="min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-[#E11D48] dark:hover:bg-[#BE123C] px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>{t.hotelCard.viewDetails}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
