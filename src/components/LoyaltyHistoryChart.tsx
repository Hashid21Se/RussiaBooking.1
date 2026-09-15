import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Award,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { UserProfile, SupportedCurrency, LoyaltyTransaction } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

interface LoyaltyHistoryChartProps {
  profile: UserProfile;
  lang: Language;
  currency: SupportedCurrency;
  className?: string;
}

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  year: number;
  monthIndex: number;
  points: number;
  cumulativePoints: number;
  bookingsCount: number;
  hotels: string[];
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ENGLISH_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const LoyaltyHistoryChart: React.FC<LoyaltyHistoryChartProps> = ({
  profile,
  lang,
  currency,
  className = '',
}) => {
  const t = translations[lang];
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeMetric, setActiveMetric] = useState<'monthly' | 'cumulative'>('monthly');

  // Generate last 6 months buckets leading up to current date / most recent transaction
  const monthlyData = useMemo<MonthlyDataPoint[]>(() => {
    const transactions = profile.loyaltyTransactions || [];
    
    // Find anchor date: latest transaction or current date (Sept 2026)
    let anchorDate = new Date();
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.createdAt).getTime()).filter(d => !isNaN(d));
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        // If max transaction date is further in future than anchor, use it
        if (maxDate.getTime() > anchorDate.getTime()) {
          anchorDate = maxDate;
        }
      }
    }

    const months: MonthlyDataPoint[] = [];
    const targetYear = anchorDate.getFullYear();
    const targetMonth = anchorDate.getMonth(); // 0-indexed

    // Last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      
      const labelAr = `${ARABIC_MONTHS[m]} ${y !== 2026 ? y : ''}`.trim();
      const labelEn = `${ENGLISH_MONTHS[m]} ${y !== 2026 ? y : ''}`.trim();

      months.push({
        monthKey,
        monthLabel: lang === 'ar' ? labelAr : labelEn,
        monthShort: lang === 'ar' ? ARABIC_MONTHS[m] : ENGLISH_MONTHS[m],
        year: y,
        monthIndex: m,
        points: 0,
        cumulativePoints: 0,
        bookingsCount: 0,
        hotels: [],
      });
    }

    // Populate transactions into buckets
    transactions.forEach((tx) => {
      const txDate = new Date(tx.createdAt);
      if (isNaN(txDate.getTime())) return;
      
      const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find(m => m.monthKey === txKey);
      if (bucket) {
        // Only count positive earnings in earnings chart
        if (tx.points > 0) {
          bucket.points += tx.points;
          bucket.bookingsCount += 1;
          const hotel = lang === 'ar' ? tx.hotelNameAr || tx.hotelNameEn : tx.hotelNameEn || tx.hotelNameAr;
          if (hotel && !bucket.hotels.includes(hotel)) {
            bucket.hotels.push(hotel);
          }
        }
      }
    });

    // Compute cumulative rolling growth across the 6-month window
    let runningTotal = 0;
    months.forEach((m) => {
      runningTotal += m.points;
      m.cumulativePoints = runningTotal;
    });

    return months;
  }, [profile.loyaltyTransactions, lang]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalEarned6M = monthlyData.reduce((sum, d) => sum + d.points, 0);
    const avgMonthly = Math.round(totalEarned6M / (monthlyData.length || 1));
    
    let peakMonth = monthlyData[0];
    monthlyData.forEach(d => {
      if (d.points > (peakMonth?.points || 0)) {
        peakMonth = d;
      }
    });

    return {
      totalEarned6M,
      avgMonthly,
      peakMonth,
      totalBookings6M: monthlyData.reduce((sum, d) => sum + d.bookingsCount, 0),
    };
  }, [monthlyData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyDataPoint = payload[0].payload;
      const pointsVal = activeMetric === 'cumulative' ? data.cumulativePoints : data.points;
      const discountEquiv = CurrencyService.format(pointsVal, currency, lang);

      return (
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2 min-w-[200px]"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white font-display text-sm">
              {data.monthLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              {data.bookingsCount} {lang === 'ar' ? 'إقامات' : 'stays'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>{activeMetric === 'cumulative' ? t.loyalty.cumulativeTotal : t.loyalty.monthlyEarned}:</span>
              <span className="font-extrabold text-slate-900 dark:text-white font-numeric text-sm">
                +{pointsVal.toLocaleString()} {t.loyalty.pts}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>{t.loyalty.cashValue}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-numeric">
                ≈ {discountEquiv}
              </span>
            </div>
          </div>

          {data.hotels.length > 0 && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'الفنادق المؤكدة:' : 'Hotels:'}</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                {data.hotels.join(', ')}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="loyalty-points-history-card"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* Header with Title and Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              {t.loyalty.chartTitle}
            </h2>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
              {t.loyalty.chartSubtitle}
            </p>
          </div>
        </div>

        {/* Chart View Mode & Metric Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Selector: Monthly Earned vs Cumulative Growth */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold">
            <button
              id="chart-metric-monthly"
              onClick={() => setActiveMetric('monthly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeMetric === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.loyalty.monthlyEarned}
            </button>
            <button
              id="chart-metric-cumulative"
              onClick={() => setActiveMetric('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeMetric === 'cumulative'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.loyalty.cumulativeTotal}
            </button>
          </div>

          {/* Chart Shape Toggle: Area vs Bar */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              id="chart-type-area"
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.loyalty.chartViewArea}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              id="chart-type-bar"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.loyalty.chartViewBar}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>{t.loyalty.sixMonthTotal}</span>
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-numeric text-slate-900 dark:text-white">
            +{stats.totalEarned6M.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-sans">
              {t.loyalty.pts}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ≈ {CurrencyService.format(stats.totalEarned6M, currency, lang)}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>{t.loyalty.monthlyAverage}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-numeric text-slate-900 dark:text-white">
            ~{stats.avgMonthly.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-sans">
              {t.loyalty.pts} / {lang === 'ar' ? 'شهر' : 'mo'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.totalBookings6M} {lang === 'ar' ? 'إقامات مكتملة' : 'completed stays'}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>{t.loyalty.bestMonth}</span>
            <Award className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-numeric text-slate-900 dark:text-white">
            {stats.peakMonth ? `+${stats.peakMonth.points.toLocaleString()}` : '0'}{' '}
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              {t.loyalty.pts}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
            {stats.peakMonth?.monthLabel || '—'} {stats.peakMonth?.hotels[0] ? `• ${stats.peakMonth.hotels[0]}` : ''}
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="loyaltyRoseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E11D48" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="loyaltyAmberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="monthShort"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={activeMetric === 'cumulative' ? 'cumulativePoints' : 'points'}
                stroke={activeMetric === 'cumulative' ? '#F59E0B' : '#E11D48'}
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${activeMetric === 'cumulative' ? 'loyaltyAmberGradient' : 'loyaltyRoseGradient'})`}
                activeDot={{ r: 6, fill: activeMetric === 'cumulative' ? '#F59E0B' : '#E11D48', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <XAxis
                dataKey="monthShort"
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={activeMetric === 'cumulative' ? 'cumulativePoints' : 'points'}
                fill={activeMetric === 'cumulative' ? '#F59E0B' : '#E11D48'}
                radius={[8, 8, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Indicator */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {lang === 'ar'
              ? 'يتم تحديث الرصيد تلقائياً فور التحقق المصرفي من الحجز وتأكيد الإقامة'
              : 'Points are credited in real-time upon confirmed booking settlement'}
          </span>
        </span>
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          {lang === 'ar' ? '100 نقطة ≈ 100 روبل خصم فندقي' : '100 pts ≈ 100 RUB hotel discount'}
        </span>
      </div>
    </div>
  );
};
