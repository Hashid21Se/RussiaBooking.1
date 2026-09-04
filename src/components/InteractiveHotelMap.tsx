import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Star, 
  Utensils, 
  CheckCircle, 
  X, 
  ExternalLink, 
  Compass, 
  Plus, 
  Minus, 
  Maximize2,
  Building,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Hotel, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

interface InteractiveHotelMapProps {
  hotels: Hotel[];
  lang: Language;
  currency: SupportedCurrency;
  activeCity?: string;
  selectedHotelId?: string | null;
  onSelectHotel: (hotel: Hotel) => void;
  onCloseMap?: () => void;
}

interface MapCoordinate {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

// Normalized geographic anchors for Russian cities on the map canvas
const CITY_CONFIGS: Record<string, {
  nameAr: string;
  nameEn: string;
  center: { lat: number; lng: number };
  landmarks: { nameAr: string; nameEn: string; x: number; y: number; type: 'monument' | 'transit' | 'nature' }[];
  geoBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}> = {
  Moscow: {
    nameAr: 'موسكو',
    nameEn: 'Moscow',
    center: { lat: 55.7558, lng: 37.6173 },
    landmarks: [
      { nameAr: 'الساحة الحمراء والكرملين', nameEn: 'Red Square & Kremlin', x: 50, y: 50, type: 'monument' },
      { nameAr: 'مسرح البولشوي', nameEn: 'Bolshoi Theatre', x: 52, y: 44, type: 'monument' },
      { nameAr: 'شارع أربات التاريخي', nameEn: 'Old Arbat Street', x: 42, y: 56, type: 'monument' },
      { nameAr: 'موسكو سيتي للأعمال', nameEn: 'Moscow City Skyscrapers', x: 34, y: 48, type: 'monument' },
    ],
    geoBounds: { minLat: 55.70, maxLat: 55.80, minLng: 37.52, maxLng: 37.70 },
  },
  'Saint Petersburg': {
    nameAr: 'سانت بطرسبرغ',
    nameEn: 'St. Petersburg',
    center: { lat: 59.9343, lng: 30.3351 },
    landmarks: [
      { nameAr: 'قصر الشتاء ومتحف الأرميتاج', nameEn: 'Hermitage & Winter Palace', x: 48, y: 46, type: 'monument' },
      { nameAr: 'شارع نيفسكي بروسبيكت', nameEn: 'Nevsky Prospekt', x: 55, y: 54, type: 'monument' },
      { nameAr: 'كاتدرائية القديس إسحاق', nameEn: "St. Isaac's Cathedral", x: 44, y: 51, type: 'monument' },
      { nameAr: 'نهر نيفا وقنوات بطرسبرغ', nameEn: 'Neva River Channels', x: 50, y: 42, type: 'nature' },
    ],
    geoBounds: { minLat: 59.88, maxLat: 59.98, minLng: 30.25, maxLng: 30.42 },
  },
  Sochi: {
    nameAr: 'سوتشي وروز خوتور',
    nameEn: 'Sochi & Rosa Khutor',
    center: { lat: 43.6028, lng: 39.7342 },
    landmarks: [
      { nameAr: 'ساحل البحر الأسود والمنتجع', nameEn: 'Black Sea Waterfront', x: 40, y: 65, type: 'nature' },
      { nameAr: 'حديقة سوتشي الأولمبية', nameEn: 'Sochi Olympic Park', x: 55, y: 70, type: 'monument' },
      { nameAr: 'منتجع روزا خوتور الجبلي', nameEn: 'Rosa Khutor Alpine Peak', x: 75, y: 35, type: 'nature' },
    ],
    geoBounds: { minLat: 43.40, maxLat: 43.70, minLng: 39.70, maxLng: 40.30 },
  },
  Kazan: {
    nameAr: 'قازان (تتارستان)',
    nameEn: 'Kazan',
    center: { lat: 55.7887, lng: 49.1221 },
    landmarks: [
      { nameAr: 'كرملين قازان وجامع قول شريف', nameEn: 'Kazan Kremlin & Qol Sharif', x: 47, y: 44, type: 'monument' },
      { nameAr: 'شارع باومان التراثي للمشاة', nameEn: 'Bauman Walking Street', x: 52, y: 54, type: 'monument' },
      { nameAr: 'نهر الفولغا الخالد', nameEn: 'Volga River Waterfront', x: 38, y: 62, type: 'nature' },
    ],
    geoBounds: { minLat: 55.74, maxLat: 55.83, minLng: 49.05, maxLng: 49.20 },
  },
  Murmansk: {
    nameAr: 'مورمانسك',
    nameEn: 'Murmansk',
    center: { lat: 68.9585, lng: 33.0827 },
    landmarks: [
      { nameAr: 'ساحة خمسة أركان المركزية', nameEn: 'Five Corners Square', x: 50, y: 48, type: 'monument' },
      { nameAr: 'كاسحة الجليد النووية لينين', nameEn: 'Lenin Nuclear Icebreaker', x: 44, y: 40, type: 'monument' },
      { nameAr: 'نقطة رصد الشفق القطبي', nameEn: 'Aurora Borealis Watchpoint', x: 65, y: 30, type: 'nature' },
    ],
    geoBounds: { minLat: 68.90, maxLat: 69.02, minLng: 33.00, maxLng: 33.16 },
  }
};

export const InteractiveHotelMap: React.FC<InteractiveHotelMapProps> = ({
  hotels,
  lang,
  currency,
  activeCity,
  selectedHotelId,
  onSelectHotel,
  onCloseMap,
}) => {
  const t = translations[lang];
  const [selectedCity, setSelectedCity] = useState<string>(activeCity || 'Moscow');
  const [hoveredHotel, setHoveredHotel] = useState<Hotel | null>(null);
  const [activePopupHotel, setActivePopupHotel] = useState<Hotel | null>(
    hotels.find((h) => h.id === selectedHotelId) || null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [halalOnlyFilter, setHalalOnlyFilter] = useState(false);

  // Available cities from hotel data
  const availableCities = useMemo(() => {
    const citySet = new Set(hotels.map((h) => h.city));
    return Array.from(citySet);
  }, [hotels]);

  const currentCityConfig = CITY_CONFIGS[selectedCity] || CITY_CONFIGS['Moscow'];

  // Filter hotels displayed on the current map
  const visibleHotels = useMemo(() => {
    return hotels.filter((h) => {
      const matchCity = selectedCity === 'ALL' || h.city === selectedCity;
      const matchStar = starFilter === null || h.stars === starFilter;
      const matchHalal = !halalOnlyFilter || h.policies.halalCertifiedFood;
      return matchCity && matchStar && matchHalal;
    });
  }, [hotels, selectedCity, starFilter, halalOnlyFilter]);

  // Convert hotel lat/lng coordinates to percentage offsets within canvas
  const getHotelCanvasCoordinates = (hotel: Hotel, index: number, total: number): MapCoordinate => {
    const bounds = currentCityConfig.geoBounds;
    if (hotel.coordinates?.lat && hotel.coordinates?.lng && bounds) {
      const latRange = bounds.maxLat - bounds.minLat;
      const lngRange = bounds.maxLng - bounds.minLng;
      
      const xPercent = ((hotel.coordinates.lng - bounds.minLng) / lngRange) * 70 + 15;
      const yPercent = (1 - (hotel.coordinates.lat - bounds.minLat) / latRange) * 70 + 15;

      const clampedX = Math.max(12, Math.min(88, xPercent));
      const clampedY = Math.max(15, Math.min(85, yPercent));
      return { x: clampedX, y: clampedY };
    }

    // Stable radial fallback algorithm based on hotel index
    const angle = (index / Math.max(1, total)) * 2 * Math.PI;
    const radius = 25 + (index % 3) * 10;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    };
  };

  return (
    <div 
      id="interactive-hotel-map-container"
      className="relative w-full h-[620px] md:h-[700px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#F4F6F9] dark:bg-[#0B0F17] shadow-xl flex flex-col select-none"
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 pointer-events-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedCity('Moscow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCity === 'Moscow'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'ar' ? 'موسكو' : 'Moscow'}
          </button>
          <button
            onClick={() => setSelectedCity('Saint Petersburg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCity === 'Saint Petersburg'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'ar' ? 'سانت بطرسبرغ' : 'St. Petersburg'}
          </button>
          <button
            onClick={() => setSelectedCity('Sochi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCity === 'Sochi'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'ar' ? 'سوتشي' : 'Sochi'}
          </button>
          <button
            onClick={() => setSelectedCity('Kazan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCity === 'Kazan'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'ar' ? 'قازان' : 'Kazan'}
          </button>
          <button
            onClick={() => setSelectedCity('Murmansk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCity === 'Murmansk'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'ar' ? 'مورمانسك' : 'Murmansk'}
          </button>
        </div>

        {/* Quick Filter Badges & Close */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Halal Quick Filter */}
          <button
            onClick={() => setHalalOnlyFilter((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition backdrop-blur-md shadow-sm ${
              halalOnlyFilter
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'حلال فقط' : 'Halal Only'}</span>
          </button>

          {/* 5-Star Filter */}
          <button
            onClick={() => setStarFilter((prev) => (prev === 5 ? null : 5))}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition backdrop-blur-md shadow-sm ${
              starFilter === 5
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>5 ★</span>
          </button>

          {/* Close Map if inside modal */}
          {onCloseMap && (
            <button
              onClick={onCloseMap}
              className="p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-md transition"
              title={lang === 'ar' ? 'إغلاق الخريطة' : 'Close map'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Subtle Architectural Grid and Rivers background (Custom Vector Topography) */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80 dark:opacity-40"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-out' }}
        >
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300/40 dark:text-slate-800/40" />
            </pattern>
            {/* Water Linear Gradient */}
            <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          {/* City Distinctive Geographic Flow Lines */}
          {selectedCity === 'Moscow' && (
            <>
              {/* Moskva River elegant sweeping curve */}
              <path
                d="M 0 350 Q 200 480, 450 380 T 900 450 T 1400 320"
                fill="none"
                stroke="url(#riverWater)"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M 0 350 Q 200 480, 450 380 T 900 450 T 1400 320"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              {/* Garden Ring Road Outline */}
              <ellipse cx="50%" cy="50%" rx="35%" ry="32%" fill="none" stroke="#E2E8F0" dark:stroke="#1E293B" strokeWidth="1.5" strokeDasharray="6 6" className="text-slate-300 dark:text-slate-800" />
              <ellipse cx="50%" cy="50%" rx="20%" ry="18%" fill="none" stroke="#CBD5E1" strokeWidth="2" className="text-slate-400/40 dark:text-slate-700/40" />
            </>
          )}

          {selectedCity === 'Saint Petersburg' && (
            <>
              {/* Great Neva river delta fork */}
              <path
                d="M 1200 500 Q 800 380, 550 440 T 200 350 T 0 300"
                fill="none"
                stroke="url(#riverWater)"
                strokeWidth="38"
                strokeLinecap="round"
              />
              <path
                d="M 550 440 Q 400 600, 100 680"
                fill="none"
                stroke="url(#riverWater)"
                strokeWidth="22"
                strokeLinecap="round"
              />
            </>
          )}

          {selectedCity === 'Sochi' && (
            <>
              {/* Black Sea Coastline */}
              <path
                d="M 0 700 Q 300 620, 600 660 T 1200 690"
                fill="none"
                stroke="url(#riverWater)"
                strokeWidth="90"
              />
              {/* Caucasus Mountain Range Ridges */}
              <path
                d="M 300 200 L 450 150 L 600 220 L 800 130 L 1000 210"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeDasharray="3 3"
                className="dark:stroke-slate-700"
              />
            </>
          )}
        </svg>

        {/* Map Interactive Landmarks Markers */}
        <div 
          className="absolute inset-0 transition-transform duration-300 pointer-events-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {currentCityConfig.landmarks.map((lm, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/75 dark:bg-slate-800/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm border border-white/20"
              style={{ left: `${lm.x}%`, top: `${lm.y}%` }}
            >
              <Compass className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">{lang === 'ar' ? lm.nameAr : lm.nameEn}</span>
            </div>
          ))}
        </div>

        {/* Hotel Price Pins Layer */}
        <div 
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {visibleHotels.map((hotel, index) => {
            const coords = getHotelCanvasCoordinates(hotel, index, visibleHotels.length);
            const isHovered = hoveredHotel?.id === hotel.id;
            const isSelected = activePopupHotel?.id === hotel.id;
            const formattedPrice = CurrencyService.format(hotel.minPriceRub, currency, lang);

            return (
              <div
                key={hotel.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'z-30 scale-110' : isHovered ? 'z-20 scale-105' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setHoveredHotel(hotel)}
                onMouseLeave={() => setHoveredHotel(null)}
                onClick={() => setActivePopupHotel(hotel)}
              >
                {/* Hotel Price Badge Pill (Booking.com signature element) */}
                <div 
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs shadow-lg transition-all border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-4 ring-amber-500/30'
                      : isHovered
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xl'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-amber-500">★</span>
                  <span>{formattedPrice}</span>
                </div>

                {/* Pin pointer tip */}
                <div 
                  className={`w-2 h-2 rotate-45 mx-auto -mt-1 shadow-xs transition-colors ${
                    isSelected 
                      ? 'bg-amber-500' 
                      : isHovered 
                      ? 'bg-slate-950 dark:bg-white' 
                      : 'bg-white dark:bg-slate-900'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Selected Hotel Floating Preview Card (Booking.com style) */}
        {activePopupHotel && (
          <div 
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="absolute bottom-6 inset-x-4 sm:inset-x-auto sm:end-6 sm:w-96 z-40 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            {/* Close card button */}
            <button
              onClick={() => setActivePopupHotel(null)}
              className="absolute top-3 end-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition"
              aria-label="Close preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Image Preview & Badges */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={activePopupHotel.images[0]?.url}
                alt={lang === 'ar' ? activePopupHotel.nameAr : activePopupHotel.nameEn}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

              {/* Rating badge */}
              <div className="absolute bottom-3 start-3 flex items-center gap-1.5">
                <div className="flex h-7 px-2 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-sm">
                  ★ {activePopupHotel.rating.toFixed(1)}
                </div>
                <div className="text-white text-xs font-bold drop-shadow-sm">
                  {activePopupHotel.stars} {lang === 'ar' ? 'نجوم فاخرة' : 'Stars'}
                </div>
              </div>

              {/* Official E-Visa badge */}
              <div className="absolute top-3 start-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold backdrop-blur-md">
                <ShieldCheck className="w-3 h-3" />
                <span>{lang === 'ar' ? 'دعوة تأشيرة معتمدة' : 'E-Visa Voucher'}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {lang === 'ar' ? activePopupHotel.nameAr : activePopupHotel.nameEn}
                </h4>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {lang === 'ar' ? activePopupHotel.addressAr : activePopupHotel.addressEn}
                  </span>
                </div>
              </div>

              {/* Perks Highlights */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {activePopupHotel.policies.halalCertifiedFood && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 font-medium border border-emerald-200/50 dark:border-emerald-800/40">
                    <Utensils className="w-3 h-3" />
                    {lang === 'ar' ? 'طعام حلال' : 'Halal'}
                  </span>
                )}
                {activePopupHotel.policies.freeCancellationHours > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 font-medium border border-blue-200/50 dark:border-blue-800/40">
                    <CheckCircle className="w-3 h-3" />
                    {lang === 'ar' ? 'إلغاء مجاني' : 'Free cancellation'}
                  </span>
                )}
              </div>

              {/* Price & CTA button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {t.hotelCard.perNight}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {CurrencyService.format(activePopupHotel.minPriceRub, currency, lang)}
                  </div>
                </div>

                <button
                  id={`map-select-hotel-${activePopupHotel.id}`}
                  onClick={() => onSelectHotel(activePopupHotel)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 px-4 py-2 text-xs font-bold shadow-md transition"
                >
                  <span>{lang === 'ar' ? 'عرض الغرف والحجز' : 'View Rooms & Book'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Zoom Controls */}
        <div className="absolute bottom-6 start-6 z-20 flex flex-col gap-1 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 shadow-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0))}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          <button
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-800" />
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[10px] font-bold"
            title="Reset Zoom"
          >
            100%
          </button>
        </div>

        {/* Map Legend / Counter banner */}
        <div className="absolute top-20 start-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Building className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {lang === 'ar'
              ? `${visibleHotels.length} فنادق معروضة في ${currentCityConfig.nameAr}`
              : `${visibleHotels.length} hotels in ${currentCityConfig.nameEn}`}
          </span>
        </div>
      </div>
    </div>
  );
};
