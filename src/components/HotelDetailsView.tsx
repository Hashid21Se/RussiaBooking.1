import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  MapPin, 
  ShieldCheck, 
  Utensils, 
  Waves, 
  Sparkles, 
  Wifi, 
  Coffee, 
  CheckCircle2, 
  Heart, 
  Share2, 
  Calendar, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Building,
  Plane,
  Coins,
  Compass,
  FileDown,
  Loader2
} from 'lucide-react';
import { Hotel, HotelRoom, RoomRate, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService, CURRENCY_RATES } from '../lib/currency';
import { GuestReviewsBreakdown } from './GuestReviewsBreakdown';
import { OptimizedImage } from './OptimizedImage';
import { HotelLocationMap } from './HotelLocationMap';
import { downloadHotelFactSheetPdf } from '../lib/pdfVoucherGenerator';

interface HotelDetailsViewProps {
  hotel: Hotel;
  allHotels: Hotel[];
  lang: Language;
  currency: SupportedCurrency;
  onCurrencyChange?: (currency: SupportedCurrency) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onSelectRoomAndRate: (room: HotelRoom, rate: RoomRate) => void;
  onSelectSimilarHotel: (hotel: Hotel) => void;
}

export const HotelDetailsView: React.FC<HotelDetailsViewProps> = ({
  hotel,
  allHotels,
  lang,
  currency,
  onCurrencyChange,
  isFavorite,
  onToggleFavorite,
  onBack,
  onSelectRoomAndRate,
  onSelectSimilarHotel,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const t = translations[lang];

  const currencies: SupportedCurrency[] = ['SAR', 'RUB', 'AED', 'USD', 'KWD', 'QAR'];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadHotelFactSheetPdf(hotel, lang, currency);
    } catch (err) {
      console.error('Error exporting factsheet PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const similarHotels = allHotels
    .filter((h) => h.id !== hotel.id && (h.city === hotel.city || h.stars === hotel.stars))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-10">
      {/* Top Navigation Back bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="hotel-back-btn"
          onClick={onBack}
          className="min-h-[44px] flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{lang === 'ar' ? 'العودة للنتائج' : 'Back to results'}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Switcher Dropdown */}
          {onCurrencyChange && (
            <div className="relative">
              <button
                id="hotel-currency-btn"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="min-h-[44px] min-w-[44px] flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs active:scale-95"
                title="Change Currency"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{currency}</span>
              </button>

              {currencyDropdownOpen && (
                <div 
                  className="absolute end-0 mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-1.5 shadow-xl dark:bg-slate-900 z-50 text-xs"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'ar' ? 'اختر عملة العرض' : 'Select Currency'}
                  </div>
                  {currencies.map((curr) => {
                    const info = (CURRENCY_RATES as any)[curr];
                    return (
                      <button
                        key={curr}
                        id={`hotel-curr-option-${curr}`}
                        onClick={() => {
                          onCurrencyChange(curr);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`min-h-[44px] w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                          currency === curr 
                            ? 'bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-bold">{curr}</span>
                          <span className="text-slate-500 text-[11px]">
                            {lang === 'ar' ? info?.nameAr : info?.nameEn}
                          </span>
                        </span>
                        <span className="font-semibold text-slate-400">
                          {lang === 'ar' ? info?.symbolAr : info?.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Export PDF Factsheet Button */}
          <button
            id="hotel-export-pdf-btn"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="min-h-[44px] flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#E11D48] dark:hover:text-[#E11D48] hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs active:scale-95"
            title={t.pdfExport?.exportFactsheet || 'Export Hotel PDF'}
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#E11D48]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#E11D48]" />
            )}
            <span>{isExportingPdf ? (t.pdfExport?.exportingPdf || 'Exporting...') : (t.pdfExport?.exportFactsheet || 'PDF')}</span>
          </button>

          <button
            id="hotel-share-btn"
            onClick={handleShare}
            className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedLink ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة' : 'Share')}</span>
          </button>
          <button
            id="hotel-fav-btn"
            onClick={() => onToggleFavorite(hotel.id)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-xs font-semibold transition active:scale-95 ${
              isFavorite ? 'bg-rose-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hotel Title & Header Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-amber-500">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {hotel.stars} {lang === 'ar' ? 'نجوم فاخر' : 'Star Luxury'}
            </span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'ar' ? 'تأكيد إلكتروني فوري' : 'Instant Confirmation'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-slate-900 dark:text-white">
            {lang === 'ar' ? hotel.nameAr : hotel.nameEn}
          </h1>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {lang === 'ar' ? hotel.cityAr : hotel.city}
            </span>
            <span>•</span>
            <span>{lang === 'ar' ? hotel.addressAr : hotel.addressEn}</span>
          </div>
        </div>

        {/* Rating Score & Reviews summary */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3 shrink-0">
          <div className="text-end">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {hotel.rating >= 9.5 ? (lang === 'ar' ? 'تقييم استثنائي' : 'Exceptional') : (lang === 'ar' ? 'رائع جداً' : 'Superb')}
            </div>
            <div className="text-xs text-slate-500">
              {hotel.reviewCount} {lang === 'ar' ? 'تقييم موثق من النزلاء' : 'verified guest reviews'}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-amber-900 text-white font-black text-lg">
            {hotel.rating.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <section className="space-y-3" aria-label={lang === 'ar' ? 'معرض صور الفندق' : 'Hotel Photo Gallery'}>
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
          <OptimizedImage
            src={hotel.images[selectedImageIndex]?.url || hotel.images[0]?.url}
            alt={lang === 'ar' ? hotel.nameAr : hotel.nameEn}
            priority={true}
            className="h-full w-full object-cover transition-opacity duration-300"
            containerClassName="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="absolute bottom-4 start-4 text-white text-xs sm:text-sm font-medium">
            {lang === 'ar' 
              ? hotel.images[selectedImageIndex]?.captionAr 
              : hotel.images[selectedImageIndex]?.captionEn}
          </div>

          {/* Nav arrows */}
          <button
            onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : hotel.images.length - 1))}
            className="absolute top-1/2 start-3 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white backdrop-blur-md"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedImageIndex((prev) => (prev < hotel.images.length - 1 ? prev + 1 : 0))}
            className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/70 p-2 text-white backdrop-blur-md"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnails list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {hotel.images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                selectedImageIndex === idx
                  ? 'border-amber-500 scale-95 shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="thumbnail" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* Highlights & Description */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
              {t.hotelDetails.aboutHotel}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-text prose-ar">
              {lang === 'ar' ? hotel.descriptionAr : hotel.descriptionEn}
            </p>
          </div>

          {/* Key Amenities */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {t.hotelDetails.amenities}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              {hotel.policies.halalCertifiedFood && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 p-2.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>{t.search.halalCertified}</span>
                </div>
              )}
              {hotel.policies.prayerRugsAvailable && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 p-2.5 text-amber-700 dark:text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'ar' ? 'سجادات صلاة وتحديد القبلة' : 'Prayer Rugs & Qibla'}</span>
                </div>
              )}
              {hotel.amenities.includes('pool') && (
                <div className="flex items-center gap-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/40 p-2.5 text-cyan-700 dark:text-cyan-300 font-semibold">
                  <Waves className="w-4 h-4 text-cyan-600" />
                  <span>{t.search.pool}</span>
                </div>
              )}
              {hotel.amenities.includes('spa') && (
                <div className="flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 p-2.5 text-purple-700 dark:text-purple-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>{t.search.spa}</span>
                </div>
              )}
              {hotel.amenities.includes('airportShuttle') && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 p-2.5 text-blue-700 dark:text-blue-300 font-semibold">
                  <Plane className="w-4 h-4 text-blue-600" />
                  <span>{t.search.airportShuttle}</span>
                </div>
              )}
              {hotel.amenities.includes('wifi') && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <Wifi className="w-4 h-4 text-slate-600" />
                  <span>{t.search.wifi}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & Nearby Landmarks Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>{t.hotelDetails.location}</span>
            </h3>
            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {hotel.coordinates.lat.toFixed(3)}°, {hotel.coordinates.lng.toFixed(3)}°
            </span>
          </div>

          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {lang === 'ar' ? hotel.cityAr : hotel.city}
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {lang === 'ar' ? hotel.addressAr : hotel.addressEn}
            </p>
            <button
              onClick={() => {
                document.getElementById('hotel-interactive-map-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold py-2 px-3 text-xs transition mt-2"
            >
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'ar' ? 'استكشف الخريطة التفاعلية بالأسفل' : 'Open Interactive Map Below'}</span>
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'ar' ? 'معالم قريبة يمكنك زيارتها مشياً:' : 'Nearby Highlights & Distance:'}
            </h4>
            <div className="space-y-2 text-xs">
              {(lang === 'ar' ? hotel.nearbyLandmarksAr : hotel.nearbyLandmarksEn)?.map((lm, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{lm.name}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{lm.distance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Component for GCC Travelers */}
      <HotelLocationMap hotel={hotel} lang={lang} currency={currency} />

      {/* Available Rooms & Rates Engine */}
      <section id="rooms-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.hotelDetails.availableRooms}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar' 
                ? 'اختر نوع الغرفة وخطة الأسعار المناسبة لك، مع تأكيد فوري ودفع آمن'
                : 'Select your preferred room category and rate plan with immediate confirmation.'}
            </p>
          </div>

          {/* Currency Switching Bar */}
          {onCurrencyChange && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ar' ? 'العملة:' : 'Currency:'}</span>
              </span>
              {currencies.map((curr) => (
                <button
                  key={curr}
                  id={`room-rate-curr-${curr}`}
                  onClick={() => onCurrencyChange(curr)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    currency === curr
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                  title={`Switch to ${curr}`}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {hotel.rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              {/* Room Header Info */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? room.nameAr : room.nameEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'ar' ? room.descriptionAr : room.descriptionEn}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                    <span>{room.sizeSqm} {t.hotelDetails.sqm}</span>
                    <span>•</span>
                    <span>{lang === 'ar' ? room.bedTypeAr : room.bedTypeEn}</span>
                    <span>•</span>
                    <span>{room.maxGuests} {t.common.guestsPlural}</span>
                  </div>
                </div>

                <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0">
                  <OptimizedImage 
                    src={room.images[0]} 
                    alt={lang === 'ar' ? room.nameAr : room.nameEn} 
                    className="h-full w-full object-cover" 
                    containerClassName="h-full w-full"
                  />
                </div>
              </div>

              {/* Rate Plans for this Room */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {room.rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                  >
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {lang === 'ar' ? rate.nameAr : rate.nameEn}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {rate.breakfastIncluded ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <Coffee className="w-3.5 h-3.5" />
                            {t.search.breakfastIncluded}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {lang === 'ar' ? 'الإقامة فقط بدون وجبات' : 'Room only'}
                          </span>
                        )}

                        {rate.refundable ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {lang === 'ar' ? `إلغاء مجاني حتى ${rate.freeCancellationDeadlineHours} ساعة` : `Free cancellation until ${rate.freeCancellationDeadlineHours}h before`}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {lang === 'ar' ? 'غير قابل للاسترداد (سعر مخفض)' : 'Non-refundable discount'}
                          </span>
                        )}

                        {/* Booking.com Scarcity & High Demand Signals */}
                        {rate.availableQuantity && rate.availableQuantity <= 3 && (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md text-[11px]">
                            {lang === 'ar' ? `تبقت ${rate.availableQuantity} غرف فقط بهذا السعر!` : `Only ${rate.availableQuantity} rooms left!`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-end">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {CurrencyService.format(rate.pricePerNightRub, currency, lang)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rate.pricePerNightRub.toLocaleString()} ₽ {t.hotelCard.perNight}
                        </div>
                      </div>

                      <button
                        id={`reserve-rate-${rate.id}`}
                        onClick={() => onSelectRoomAndRate(room, rate)}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
                      >
                        {t.hotelDetails.reserve}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hotel Policies Card */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-bold font-display text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-500" />
          <span>{t.hotelDetails.policies}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              {t.hotelDetails.checkIn}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">
              {hotel.policies.checkInTime}
            </span>
            <span className="block text-slate-500 text-[11px] mt-1">
              {lang === 'ar' ? 'مكتب الاستقبال يعمل على مدار 24 ساعة' : '24/7 reception desk'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              {t.hotelDetails.checkOut}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">
              {hotel.policies.checkOutTime}
            </span>
            <span className="block text-slate-500 text-[11px] mt-1">
              {lang === 'ar' ? 'إمكانية طلب تسجيل مغادرة متأخر' : 'Late checkout upon request'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              {t.hotelDetails.cancellationPolicy}
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-text prose-ar">
              {lang === 'ar' ? hotel.policies.cancellationPolicyAr : hotel.policies.cancellationPolicyEn}
            </p>
          </div>
        </div>
      </section>

      {/* Guest Reviews & Sub-Ratings Section (Booking.com style) */}
      <GuestReviewsBreakdown hotel={hotel} lang={lang} />

      {/* Similar Hotels */}
      {similarHotels.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            {t.hotelDetails.similarHotels}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {similarHotels.map((sim) => (
              <div
                key={sim.id}
                onClick={() => onSelectSimilarHotel(sim)}
                className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={sim.images[0]?.url}
                    alt={sim.nameEn}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {lang === 'ar' ? sim.nameAr : sim.nameEn}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {CurrencyService.format(sim.minPriceRub, currency, lang)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sim.city}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
