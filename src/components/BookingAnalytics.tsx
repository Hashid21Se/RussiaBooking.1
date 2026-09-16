import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Moon,
  Building2,
  Sparkles,
  ArrowUpRight,
  Clock,
  Compass,
  CheckCircle2,
  Hotel as HotelIcon
} from 'lucide-react';
import { Booking, SupportedCurrency } from '../types';
import { Language } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

interface BookingAnalyticsProps {
  bookings: Booking[];
  lang: Language;
  currency: SupportedCurrency;
  onExploreHotels?: () => void;
  className?: string;
}

interface MonthlyAnalyticsBucket {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  year: number;
  monthIndex: number;
  bookingsCount: number;
  nightsCount: number;
  totalSpendRub: number;
  totalSpendConverted: number;
  avgSpendPerNightRub: number;
  avgSpendPerNightConverted: number;
  hotels: string[];
  cities: string[];
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const RUSSIAN_MONTHS = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

export const BookingAnalytics: React.FC<BookingAnalyticsProps> = ({
  bookings = [],
  lang,
  currency,
  onExploreHotels,
  className = '',
}) => {
  // Chart visual mode
  const [activeTab, setActiveTab] = useState<'avgSpend' | 'frequency' | 'combined'>('avgSpend');

  // Filter valid bookings (exclude cancelled or refunded if desired, but keep confirmed/completed)
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED'
    );
  }, [bookings]);

  // Aggregate monthly data for the last 6 months
  const monthlyData = useMemo<MonthlyAnalyticsBucket[]>(() => {
    // Determine anchor date: latest booking date or fallback to current date (e.g. Sept 2026)
    let anchorDate = new Date();
    if (activeBookings.length > 0) {
      const dates = activeBookings
        .map((b) => new Date(b.createdAt || b.checkInDate).getTime())
        .filter((d) => !isNaN(d));
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        if (maxDate.getTime() > anchorDate.getTime()) {
          anchorDate = maxDate;
        }
      }
    }

    const buckets: MonthlyAnalyticsBucket[] = [];
    const targetYear = anchorDate.getFullYear();
    const targetMonth = anchorDate.getMonth();

    // Last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

      let monthLabel = ENGLISH_MONTHS[m];
      if (lang === 'ar') monthLabel = ARABIC_MONTHS[m];
      else if (lang === 'ru') monthLabel = RUSSIAN_MONTHS[m];

      if (y !== 2026) {
        monthLabel = `${monthLabel} '${String(y).slice(-2)}`;
      }

      buckets.push({
        monthKey,
        monthLabel,
        monthShort: lang === 'ar' ? ARABIC_MONTHS[m] : (lang === 'ru' ? RUSSIAN_MONTHS[m] : ENGLISH_MONTHS[m]),
        year: y,
        monthIndex: m,
        bookingsCount: 0,
        nightsCount: 0,
        totalSpendRub: 0,
        totalSpendConverted: 0,
        avgSpendPerNightRub: 0,
        avgSpendPerNightConverted: 0,
        hotels: [],
        cities: [],
      });
    }

    // Map each booking to the appropriate 6-month bucket
    activeBookings.forEach((b) => {
      const dateStr = b.checkInDate || b.createdAt;
      const bDate = new Date(dateStr);
      if (isNaN(bDate.getTime())) return;

      const bKey = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find((bucket) => bucket.monthKey === bKey);

      if (bucket) {
        bucket.bookingsCount += 1;
        const nights = b.nightsCount > 0 ? b.nightsCount : 1;
        bucket.nightsCount += nights;

        // Use totalPriceRub
        const rubTotal = b.totalPriceRub || (b.pricePerNightRub ? b.pricePerNightRub * nights : 0);
        bucket.totalSpendRub += rubTotal;

        const hotelName = lang === 'ar' ? (b.hotelNameAr || b.hotelNameEn) : b.hotelNameEn;
        if (hotelName && !bucket.hotels.includes(hotelName)) {
          bucket.hotels.push(hotelName);
        }

        const city = lang === 'ar' ? (b.hotelCityAr || b.hotelCity) : b.hotelCity;
        if (city && !bucket.cities.includes(city)) {
          bucket.cities.push(city);
        }
      }
    });

    // Compute converted amounts and averages per night
    buckets.forEach((bucket) => {
      bucket.totalSpendConverted = CurrencyService.convertFromRub(bucket.totalSpendRub, currency);
      
      if (bucket.nightsCount > 0) {
        bucket.avgSpendPerNightRub = Math.round(bucket.totalSpendRub / bucket.nightsCount);
        bucket.avgSpendPerNightConverted = Math.round(bucket.totalSpendConverted / bucket.nightsCount);
      } else {
        bucket.avgSpendPerNightRub = 0;
        bucket.avgSpendPerNightConverted = 0;
      }
    });

    return buckets;
  }, [activeBookings, lang, currency]);

  // Executive Summary KPI calculations
  const stats = useMemo(() => {
    const totalBookings6M = monthlyData.reduce((sum, d) => sum + d.bookingsCount, 0);
    const totalNights6M = monthlyData.reduce((sum, d) => sum + d.nightsCount, 0);
    const totalSpendRub6M = monthlyData.reduce((sum, d) => sum + d.totalSpendRub, 0);
    const totalSpendConverted6M = CurrencyService.convertFromRub(totalSpendRub6M, currency);

    const overallAvgSpendPerNightRub = totalNights6M > 0 
      ? Math.round(totalSpendRub6M / totalNights6M) 
      : 0;

    const overallAvgSpendPerNightConverted = totalNights6M > 0
      ? Math.round(totalSpendConverted6M / totalNights6M)
      : 0;

    // Monthly frequency (bookings per month across 6 months)
    const monthlyFrequency = Math.round((totalBookings6M / 6) * 10) / 10;

    // Highest spending month
    let highestSpendMonth = monthlyData[0];
    monthlyData.forEach((d) => {
      if (d.avgSpendPerNightConverted > (highestSpendMonth?.avgSpendPerNightConverted || 0)) {
        highestSpendMonth = d;
      }
    });

    // City breakdown
    const cityCounts: Record<string, number> = {};
    activeBookings.forEach((b) => {
      const city = lang === 'ar' ? (b.hotelCityAr || b.hotelCity) : b.hotelCity;
      if (city) {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });

    let topCity = '';
    let topCityCount = 0;
    Object.entries(cityCounts).forEach(([c, cnt]) => {
      if (cnt > topCityCount) {
        topCity = c;
        topCityCount = cnt;
      }
    });

    return {
      totalBookings6M,
      totalNights6M,
      totalSpendRub6M,
      totalSpendConverted6M,
      overallAvgSpendPerNightRub,
      overallAvgSpendPerNightConverted,
      monthlyFrequency,
      highestSpendMonth,
      topCity: topCity || (lang === 'ar' ? 'موسكو' : 'Moscow'),
    };
  }, [monthlyData, activeBookings, currency, lang]);

  // Currency symbol
  const currencySymbol = useMemo(() => {
    return CurrencyService.format(0, currency, lang === 'ar' ? 'ar' : 'en').replace(/[\d\s.,]/g, '');
  }, [currency, lang]);

  // Custom Recharts Tooltip
  const CustomAnalyticsTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: MonthlyAnalyticsBucket = payload[0].payload;
    const isArabic = lang === 'ar';

    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md max-w-xs text-start">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
          <span className="text-xs font-bold font-display text-slate-900 dark:text-white">
            {data.monthLabel} {data.year}
          </span>
          <span className="text-[11px] font-sans font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
            {data.bookingsCount} {isArabic ? (data.bookingsCount === 1 ? 'حجز' : 'حجوزات') : (data.bookingsCount === 1 ? 'booking' : 'bookings')}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-sans">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{isArabic ? 'متوسط سعر الليلة:' : 'Avg. Spend / Night:'}</span>
            </span>
            <span className="font-numeric font-bold text-slate-900 dark:text-white">
              {CurrencyService.format(data.avgSpendPerNightRub, currency, isArabic ? 'ar' : 'en')}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{isArabic ? 'إجمالي الإنفاق:' : 'Total Spent:'}</span>
            </span>
            <span className="font-numeric font-semibold text-slate-900 dark:text-white">
              {CurrencyService.format(data.totalSpendRub, currency, isArabic ? 'ar' : 'en')}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>{isArabic ? 'عدد الليالي:' : 'Total Nights:'}</span>
            </span>
            <span className="font-numeric font-semibold text-slate-900 dark:text-white">
              {data.nightsCount} {isArabic ? 'ليلة' : 'nights'}
            </span>
          </div>

          {data.hotels.length > 0 && (
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                {isArabic ? 'الفنادق التي تمت زيارتها:' : 'Hotels visited:'}
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                {data.hotels.map((h, i) => (
                  <li key={i} className="truncate">{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isArabic = lang === 'ar';

  return (
    <div 
      id="user-booking-analytics-card"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              {isArabic ? 'تحليلات الحجوزات والإنفاق الفندقي' : 'Booking & Spend Analytics'}
            </h2>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
              {isArabic 
                ? 'مؤشرات وتوجهات السفر لآخر 6 أشهر: معدل وتيرة الحجز ومتوسط تكلفة الليلة بالعملة المفضلة' 
                : 'Travel patterns & trends over the last 6 months: booking frequency and average nightly spend'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('avgSpend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 ${
              activeTab === 'avgSpend'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isArabic ? 'متوسط سعر الليلة' : 'Avg Spend / Night'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frequency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 ${
              activeTab === 'frequency'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isArabic ? 'وتيرة الحجوزات' : 'Booking Frequency'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 ${
              activeTab === 'combined'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isArabic ? 'نظرة شاملة' : 'Combined Overview'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {/* Metric 1: Average Spend Per Night */}
        <div 
          id="analytics-metric-avg-spend"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition hover:border-rose-300 dark:hover:border-rose-900/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'متوسط سعر الليلة (6 أشهر)' : 'Avg Spend / Night (6M)'}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-numeric text-slate-900 dark:text-white">
            {CurrencyService.format(stats.overallAvgSpendPerNightRub, currency, isArabic ? 'ar' : 'en')}
          </div>
          <p className="mt-1 text-[10px] font-sans text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {isArabic 
                ? `مبني على ${stats.totalNights6M} ليلة إقامة` 
                : `Based on ${stats.totalNights6M} total nights`}
            </span>
          </p>
        </div>

        {/* Metric 2: Booking Frequency */}
        <div 
          id="analytics-metric-frequency"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition hover:border-blue-300 dark:hover:border-blue-900/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'وتيرة الحجوزات الشهرية' : 'Monthly Booking Rate'}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-numeric text-slate-900 dark:text-white">
            {stats.monthlyFrequency}{' '}
            <span className="text-xs font-normal font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'حجز / شهر' : 'stays / mo'}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-sans text-slate-400">
            {isArabic 
              ? `${stats.totalBookings6M} إقامات مكتملة ومؤكدة` 
              : `${stats.totalBookings6M} confirmed stays in 6 mos`}
          </p>
        </div>

        {/* Metric 3: Total Nights Stayed */}
        <div 
          id="analytics-metric-nights"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition hover:border-emerald-300 dark:hover:border-emerald-900/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'إجمالي الليالي الفندقية' : 'Total Nights Stayed'}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Moon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-numeric text-slate-900 dark:text-white">
            {stats.totalNights6M}{' '}
            <span className="text-xs font-normal font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'ليالٍ' : 'nights'}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-sans text-slate-400">
            {isArabic ? 'في فنادق ومشاريع روسيا' : 'Across Russian destinations'}
          </p>
        </div>

        {/* Metric 4: Total Spend */}
        <div 
          id="analytics-metric-total-spend"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition hover:border-amber-300 dark:hover:border-amber-900/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold font-sans text-slate-500 dark:text-slate-400">
              {isArabic ? 'إجمالي الإنفاق (6 أشهر)' : '6-Month Total Spend'}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-numeric text-slate-900 dark:text-white truncate">
            {CurrencyService.format(stats.totalSpendRub6M, currency, isArabic ? 'ar' : 'en')}
          </div>
          <p className="mt-1 text-[10px] font-sans text-slate-400 truncate">
            {isArabic ? `الوجهة الأكثر تفضيلاً: ${stats.topCity}` : `Top city: ${stats.topCity}`}
          </p>
        </div>
      </div>

      {/* Main Interactive Recharts Chart Area */}
      <div id="analytics-chart-container" className="pt-2">
        {stats.totalBookings6M === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-white mb-1">
              {isArabic ? 'لا توجد حجوزات مكتملة خلال الـ 6 أشهر الماضية' : 'No completed bookings recorded in the last 6 months'}
            </h3>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {isArabic 
                ? 'قم بحجز إقامتك الفندقية القادمة في روسيا لمتابعة مؤشرات إنفاقك ومتوسط سعر الإقامة وتطور سجل رحلاتك.'
                : 'Book your next Russian hotel stay to track spending trends, average nightly rates, and stay history.'}
            </p>
            {onExploreHotels && (
              <button
                type="button"
                onClick={onExploreHotels}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-sans transition shadow-xs"
              >
                <Building2 className="w-4 h-4" />
                <span>{isArabic ? 'استكشاف الفنادق الآن' : 'Explore Hotels Now'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Legend / Subtitle */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                {activeTab === 'avgSpend' && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-rose-600 shrink-0" />
                      <span>{isArabic ? 'متوسط سعر الليلة الشهري' : 'Monthly Avg. Spend / Night'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-3 h-0.5 bg-rose-400 border-t border-dashed shrink-0" />
                      <span>{isArabic ? 'متوسط 6 أشهر العام' : '6-Month Overall Average'}</span>
                    </span>
                  </>
                )}

                {activeTab === 'frequency' && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
                      <span>{isArabic ? 'عدد الحجوزات (الوتيرة)' : 'Booking Frequency'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                      <span>{isArabic ? 'إجمالي الليالي المحجوزة' : 'Total Nights Stayed'}</span>
                    </span>
                  </>
                )}

                {activeTab === 'combined' && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-rose-500/30 border border-rose-500 shrink-0" />
                      <span>{isArabic ? 'إجمالي الإنفاق' : 'Total Spend'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-blue-600 rounded-full shrink-0" />
                      <span>{isArabic ? 'وتيرة الحجوزات (حجوزات/شهر)' : 'Booking Frequency'}</span>
                    </span>
                  </>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                {isArabic 
                  ? `العملة الحالية: ${currency}` 
                  : `Active currency: ${currency}`}
              </span>
            </div>

            {/* Recharts Container */}
            <div className="w-full min-w-0 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'avgSpend' ? (
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'inherit' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'inherit' }}
                      tickFormatter={(val) => `${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    {stats.overallAvgSpendPerNightConverted > 0 && (
                      <ReferenceLine
                        y={stats.overallAvgSpendPerNightConverted}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                      />
                    )}
                    <Bar
                      dataKey="avgSpendPerNightConverted"
                      name={isArabic ? 'متوسط سعر الليلة' : 'Avg Spend / Night'}
                      fill="#e11d48"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                ) : activeTab === 'frequency' ? (
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'inherit' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'inherit' }}
                    />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    <Bar
                      dataKey="bookingsCount"
                      name={isArabic ? 'الحجوزات' : 'Bookings'}
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="nightsCount"
                      name={isArabic ? 'الليالي' : 'Nights'}
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                ) : (
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'inherit' }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'inherit' }}
                      tickFormatter={(val) => `${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'inherit' }}
                    />
                    <Tooltip content={<CustomAnalyticsTooltip />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalSpendConverted"
                      name={isArabic ? 'إجمالي الإنفاق' : 'Total Spend'}
                      fill="#f43f5e"
                      fillOpacity={0.15}
                      stroke="#e11d48"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bookingsCount"
                      name={isArabic ? 'وتيرة الحجوزات' : 'Bookings Count'}
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#2563eb' }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Contextual Travel Summary Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {isArabic 
                    ? `أعلى شهر في متوسط سعر الإقامة كان ${stats.highestSpendMonth?.monthLabel} (${CurrencyService.format(stats.highestSpendMonth?.avgSpendPerNightRub || 0, currency, 'ar')}/ليلة).`
                    : `Peak nightly spend was in ${stats.highestSpendMonth?.monthLabel} (${CurrencyService.format(stats.highestSpendMonth?.avgSpendPerNightRub || 0, currency, 'en')}/night).`}
                </span>
              </div>

              {onExploreHotels && (
                <button
                  type="button"
                  onClick={onExploreHotels}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition"
                >
                  <span>{isArabic ? 'احجز رحلتك القادمة' : 'Book your next stay'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
