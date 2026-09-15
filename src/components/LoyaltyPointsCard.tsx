import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Gift, 
  ChevronRight, 
  ChevronDown,
  Info,
  Hotel as HotelIcon,
  Calendar,
  Zap,
  Crown
} from 'lucide-react';
import { UserProfile, SupportedCurrency, LoyaltyTier } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

export interface LoyaltyComponentProps {
  profile: UserProfile;
  lang: Language;
  currency?: SupportedCurrency;
  onExploreHotels?: () => void;
  className?: string;
}

export const getTierBadgeConfig = (t: any) => ({
  EXPLORER: {
    label: t.loyalty.tiers.EXPLORER,
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300 dark:border-slate-700',
    icon: Award,
    multiplier: '1.0x',
  },
  SILVER: {
    label: t.loyalty.tiers.SILVER,
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-900 dark:text-white',
    border: 'border-slate-400 dark:border-slate-600',
    icon: ShieldCheck,
    multiplier: '1.25x',
  },
  GOLD: {
    label: t.loyalty.tiers.GOLD,
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-400/40',
    icon: Zap,
    multiplier: '1.5x',
  },
  PLATINUM: {
    label: t.loyalty.tiers.PLATINUM,
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-400/40',
    icon: Crown,
    multiplier: '2.0x',
  },
});

/**
 * Top Loyalty Status Banner (Points Balance, Tier Status, Progress Bar, Book CTA)
 */
export const LoyaltyPointsBanner: React.FC<LoyaltyComponentProps> = ({
  profile,
  lang,
  currency = 'RUB' as SupportedCurrency,
  onExploreHotels,
  className = '',
}) => {
  const t = translations[lang];
  const tierBadgeConfig = getTierBadgeConfig(t);
  const currentTier = (profile.tier || profile.loyaltyTier || 'GOLD') as LoyaltyTier;
  const currentTierBadge = tierBadgeConfig[currentTier] || tierBadgeConfig.GOLD;
  const totalPoints = profile.totalPoints ?? profile.loyaltyPoints ?? 0;
  const nextThreshold = profile.nextTierPointsThreshold || 10000;

  // Approximate monetary value of points: 100 pts ≈ 100 RUB equivalent discount
  const estDiscountRub = totalPoints;
  const estDiscountFormatted = CurrencyService.format(estDiscountRub, currency, lang);

  // Progress to next tier
  const tierProgressPercent = Math.min(
    100,
    Math.round((totalPoints / nextThreshold) * 100)
  );

  const pointsNeeded = Math.max(0, nextThreshold - totalPoints);

  return (
    <div
      id="loyalty-status-banner"
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs ${className}`}
    >
      {/* Subtle decorative background accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-rose-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase font-sans text-slate-500">
              {t.loyalty.title}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold font-display font-numeric text-slate-900 dark:text-white tracking-tight">
              {totalPoints.toLocaleString()}
            </span>
            <span className="text-base font-bold font-sans text-rose-600 dark:text-rose-400">
              {t.loyalty.pts}
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm font-text text-slate-500 dark:text-slate-400">
            {t.loyalty.cashValue}:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-bold font-numeric">
              {estDiscountFormatted}
            </strong>
          </p>
        </div>

        {/* Current Tier Badge & Status */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-sans ${currentTierBadge.bg} ${currentTierBadge.text} ${currentTierBadge.border}`}>
              <currentTierBadge.icon className="w-4 h-4" />
              <span>{currentTierBadge.label}</span>
              <span className="opacity-70 text-[11px] font-numeric">({currentTierBadge.multiplier})</span>
            </div>
          </div>

          <p className="text-xs font-text text-slate-500 dark:text-slate-400">
            {currentTier === 'PLATINUM' ? (
              <span>{t.loyalty.maxTierReached}</span>
            ) : (
              <span>
                {t.loyalty.pointsToNext
                  .replace('{points}', pointsNeeded.toLocaleString())
                  .replace('{tier}', tierBadgeConfig[currentTier === 'EXPLORER' ? 'SILVER' : currentTier === 'SILVER' ? 'GOLD' : 'PLATINUM'].label)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Next Tier Progress Bar */}
      {currentTier !== 'PLATINUM' && (
        <div className="pt-6">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span className="font-sans">{t.loyalty.progressToNext}</span>
            <span className="font-numeric font-bold text-slate-900 dark:text-white">{tierProgressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-rose-600 transition-all duration-500"
              style={{ width: `${tierProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Earning Rules & Fast Action */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-start gap-2 max-w-xl font-text">
          <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{t.loyalty.earnRule}</span>
        </div>

        {onExploreHotels && (
          <button
            onClick={onExploreHotels}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold font-sans hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition shadow-xs text-xs shrink-0"
          >
            <span>{lang === 'ar' ? 'احجز واكسب النقاط' : 'Book & Earn Points'}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Membership Tiers & Privileges Selector
 */
export const LoyaltyPrivilegesCard: React.FC<LoyaltyComponentProps> = ({
  profile,
  lang,
  className = '',
}) => {
  const t = translations[lang];
  const tierBadgeConfig = getTierBadgeConfig(t);
  const currentTier = (profile.tier || profile.loyaltyTier || 'GOLD') as LoyaltyTier;
  const [activeTierTab, setActiveTierTab] = useState<LoyaltyTier>(currentTier);

  return (
    <div
      id="loyalty-privileges-card"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              {t.loyalty.perksTitle}
            </h2>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar' ? 'مزايا حصرية تتصاعد تلقائياً مع كل حجز فندقي مؤكد' : 'Exclusive perks that scale automatically with your confirmed stays'}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {(['EXPLORER', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((tierKey) => {
          const isCurrent = currentTier === tierKey;
          const isSelected = activeTierTab === tierKey;
          const cfg = tierBadgeConfig[tierKey];

          return (
            <button
              key={tierKey}
              onClick={() => setActiveTierTab(tierKey)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition font-sans ${
                isSelected
                  ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <cfg.icon className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">{cfg.label}</span>
              </div>
              <div className="text-[11px] font-numeric font-medium text-slate-500 dark:text-slate-400">
                {cfg.multiplier}
              </div>
              {isCurrent && (
                <span className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold font-sans bg-rose-600 text-white">
                  {lang === 'ar' ? 'مستواك الحالي' : 'Active'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Tier Perks List */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold font-sans text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <span>{tierBadgeConfig[activeTierTab].label} Privileges</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-numeric font-bold">
            {tierBadgeConfig[activeTierTab].multiplier}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {t.loyalty.perks[activeTierTab].map((perk, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-sans text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Points Activity Ledger Card
 */
export const LoyaltyLedgerCard: React.FC<LoyaltyComponentProps> = ({
  profile,
  lang,
  className = '',
}) => {
  const t = translations[lang];
  const [showLedger, setShowLedger] = useState(true);

  return (
    <div
      id="loyalty-ledger-card"
      className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div 
        onClick={() => setShowLedger(!showLedger)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              {t.loyalty.transactionsHistory}
            </h2>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar'
                ? 'سجل النقاط المكتسبة عن كل حجز فندقي مؤكد ومكتمل'
                : 'Ledger of loyalty points credited on each confirmed stay'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-numeric text-slate-500 dark:text-slate-400">
            {profile.loyaltyTransactions?.length || 0}{' '}
            <span className="font-sans">{lang === 'ar' ? 'عمليات' : 'entries'}</span>
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            {showLedger ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            )}
          </div>
        </div>
      </div>

      {showLedger && (
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          {profile.loyaltyTransactions && profile.loyaltyTransactions.length > 0 ? (
            profile.loyaltyTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                    <HotelIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                      {lang === 'ar' ? tx.hotelNameAr || tx.hotelNameEn : tx.hotelNameEn || tx.hotelNameAr}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {tx.bookingCode && (
                        <span className="font-numeric font-semibold text-slate-700 dark:text-slate-300">
                          {tx.bookingCode}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 font-numeric">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-numeric bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    +{tx.points.toLocaleString()} <span className="font-sans font-bold">{t.loyalty.pts}</span>
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium font-sans">
                    {lang === 'ar' ? 'مؤكد ومضاف' : 'Credited'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs font-text text-slate-400">
              {t.loyalty.noTransactions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Composite LoyaltyPointsCard for backwards compatibility
 */
export const LoyaltyPointsCard: React.FC<LoyaltyComponentProps> = (props) => {
  return (
    <div className={`space-y-6 ${props.className || ''}`}>
      <LoyaltyPointsBanner {...props} />
      <LoyaltyPrivilegesCard {...props} />
      <LoyaltyLedgerCard {...props} />
    </div>
  );
};

