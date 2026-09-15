import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  ShieldCheck, 
  Save, 
  Sparkles, 
  Briefcase, 
  Heart, 
  Check, 
  AlertCircle,
  Compass,
  ArrowLeft,
  ArrowRight,
  Utensils,
  BookOpen,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  Award,
  Layers,
  BarChart3,
  Crown
} from 'lucide-react';
import { UserProfile, SupportedCurrency, Booking } from '../types';
import { Language, translations } from '../lib/i18n';
import { 
  LoyaltyPointsBanner, 
  LoyaltyPrivilegesCard, 
  LoyaltyLedgerCard 
} from './LoyaltyPointsCard';
import { LoyaltyHistoryChart } from './LoyaltyHistoryChart';
import { BookingAnalytics } from './BookingAnalytics';

interface UserProfileViewProps {
  profile: UserProfile;
  bookings: Booking[];
  favoritesCount: number;
  lang: Language;
  currency: SupportedCurrency;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onNavigateToBookings: () => void;
  onNavigateToFavorites: () => void;
  onExploreHotels: () => void;
}

type ProfileSectionTab = 'overview' | 'analytics' | 'loyalty' | 'personal';

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  bookings,
  favoritesCount,
  lang,
  currency,
  onUpdateProfile,
  onNavigateToBookings,
  onNavigateToFavorites,
  onExploreHotels,
}) => {
  const t = translations[lang];
  const isArabic = lang === 'ar';

  // Section view filter (defaults to complete overview)
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>('overview');

  // Profile edit form state
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [preferredLanguage, setPreferredLanguage] = useState<'ar' | 'en' | 'ru'>(profile.preferredLanguage || lang);
  const [preferredContactChannel, setPreferredContactChannel] = useState<'whatsapp' | 'sms' | 'email'>(profile.preferredContactChannel || 'whatsapp');
  const [nationality, setNationality] = useState(profile.nationality);
  const [passportNumber, setPassportNumber] = useState(profile.passportNumber || '');
  const [country, setCountry] = useState(profile.country);

  // Travel preferences
  const [halalFood, setHalalFood] = useState(profile.preferences?.halalFood ?? true);
  const [prayerRugs, setPrayerRugs] = useState(profile.preferences?.prayerRugs ?? true);
  const [arabicSupport, setArabicSupport] = useState(profile.preferences?.arabicSupport ?? true);
  const [autoVisaVoucher, setAutoVisaVoucher] = useState(profile.preferences?.autoVisaVoucher ?? true);

  // Sync state when profile prop changes
  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setPreferredLanguage(profile.preferredLanguage || lang);
    setPreferredContactChannel(profile.preferredContactChannel || 'whatsapp');
    setNationality(profile.nationality);
    setPassportNumber(profile.passportNumber || '');
    setCountry(profile.country);
    if (profile.preferences) {
      setHalalFood(profile.preferences.halalFood ?? true);
      setPrayerRugs(profile.preferences.prayerRugs ?? true);
      setArabicSupport(profile.preferences.arabicSupport ?? true);
      setAutoVisaVoucher(profile.preferences.autoVisaVoucher ?? true);
    }
  }, [profile, lang]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onUpdateProfile({
        name,
        email,
        phone,
        preferredLanguage,
        preferredContactChannel,
        nationality,
        passportNumber,
        country,
        preferences: {
          halalFood,
          prayerRugs,
          arabicSupport,
          autoVisaVoucher,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Active completed bookings count
  const completedBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
  const currentTier = profile.tier || profile.loyaltyTier || 'GOLD';
  const totalPoints = profile.totalPoints ?? profile.loyaltyPoints ?? 0;

  const navTabs: { id: ProfileSectionTab; label: string; icon: React.ElementType }[] = [
    {
      id: 'overview',
      label: isArabic ? 'نظرة عامة شاملة' : 'Complete Overview',
      icon: Layers,
    },
    {
      id: 'analytics',
      label: isArabic ? 'تحليلات الحجوزات والإنفاق' : 'Spend & Travel Analytics',
      icon: BarChart3,
    },
    {
      id: 'loyalty',
      label: isArabic ? 'برنامج المكافآت والنقاط' : 'Loyalty & Rewards',
      icon: Sparkles,
    },
    {
      id: 'personal',
      label: isArabic ? 'البيانات الشخصية والتفضيلات' : 'Personal & Preferences',
      icon: UserIcon,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back to explore shortcut */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExploreHotels}
          className="inline-flex items-center gap-2 text-xs font-bold font-sans text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isArabic ? 'العودة لاستكشاف الفنادق' : 'Back to explore hotels'}</span>
        </button>
      </div>

      {/* User Header Profile Card */}
      <div 
        id="user-profile-header-card" 
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Basic Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-rose-600 text-white font-extrabold font-display text-xl sm:text-2xl shadow-md shadow-rose-600/20 shrink-0">
              {name.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'SA'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                  {name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold font-sans text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'عضو موثق' : 'Verified Member'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{country}</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-text pt-0.5">
                {t.profile.memberSince}:{' '}
                <span className="font-numeric font-medium text-slate-600 dark:text-slate-300">
                  {new Date(profile.memberSince).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onNavigateToBookings}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-left transition"
              title={t.nav.myBookings}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-numeric text-slate-900 dark:text-white">
                  {completedBookingsCount}
                </div>
                <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                  {t.nav.myBookings}
                </div>
              </div>
            </button>

            <button
              onClick={onNavigateToFavorites}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-left transition"
              title={t.nav.saved}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-numeric text-slate-900 dark:text-white">
                  {favoritesCount}
                </div>
                <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                  {t.nav.saved}
                </div>
              </div>
            </button>

            <div 
              onClick={() => setActiveTab('loyalty')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer hover:border-amber-300 transition"
              title={t.loyalty.balance}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-numeric text-amber-700 dark:text-amber-300">
                  {totalPoints.toLocaleString()} <span className="text-[10px] font-sans">{t.loyalty.pts}</span>
                </div>
                <div className="text-[10px] font-sans font-semibold text-amber-600/80 dark:text-amber-400/80">
                  {currentTier} VIP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs Switcher */}
      <div className="flex items-center justify-start overflow-x-auto pb-1 gap-2 no-scrollbar">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 gap-1 shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-sans transition shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. TRAVEL & SPEND ANALYTICS SECTION */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <section id="profile-analytics-section" className="space-y-4">
          {activeTab === 'overview' && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  {isArabic ? 'تحليلات الحجوزات والإنفاق الفندقي' : 'Travel & Booking Intelligence'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                {isArabic ? 'عرض التفاصيل' : 'Focus View'}
              </button>
            </div>
          )}

          {/* Booking Analytics Recharts Component */}
          <BookingAnalytics
            bookings={bookings}
            lang={lang}
            currency={currency}
            onExploreHotels={onExploreHotels}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. LOYALTY REWARDS & LEDGER SECTION */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'loyalty') && (
        <section id="profile-loyalty-section" className="space-y-6">
          {activeTab === 'overview' && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  {isArabic ? 'برنامج المكافآت ورصيد النقاط' : 'Loyalty Program & Privileges'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                {isArabic ? 'عرض التفاصيل' : 'Focus View'}
              </button>
            </div>
          )}

          {/* Top Loyalty Balance & Tier Progress Banner */}
          <LoyaltyPointsBanner
            profile={profile}
            lang={lang}
            currency={currency}
            onExploreHotels={onExploreHotels}
          />

          {/* Balanced 2-Column Grid: 6-Month Points History Chart + Recent Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <LoyaltyHistoryChart
                profile={profile}
                lang={lang}
                currency={currency}
              />
            </div>

            <div className="lg:col-span-5">
              <LoyaltyLedgerCard
                profile={profile}
                lang={lang}
              />
            </div>
          </div>

          {/* Membership Tiers & Privileges Selector */}
          <LoyaltyPrivilegesCard
            profile={profile}
            lang={lang}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. PERSONAL DETAILS & GCC PREFERENCES SECTION */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'personal') && (
        <section id="profile-personal-section" className="space-y-6">
          {activeTab === 'overview' && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  {isArabic ? 'بيانات المسافر وتفضيلات الإقامة الروسية' : 'Traveler Profile & Stay Preferences'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                {isArabic ? 'عرض التفاصيل' : 'Focus View'}
              </button>
            </div>
          )}

          {/* Balanced 2-Column Grid: Personal Details Form + GCC Stay Preferences */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Personal Information Form Card (lg:col-span-7) */}
            <div 
              id="user-personal-info-card" 
              className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                      {t.profile.personalDetails}
                    </h2>
                    <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'تُستخدم هذه البيانات للتعبئة التلقائية عند الحجز وإصدار قسائم التأشيرة' : 'Used for automated checkout autofill and official visa invitations'}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isArabic ? 'تشفير آمن' : 'Encrypted'}</span>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.profile.fullName}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.profile.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {t.profile.phone}
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 50 123 4567"
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-numeric font-medium tracking-wide text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <p className="mt-1 text-[11px] font-sans text-slate-400">
                      {isArabic ? 'يشمل مفتاح الدولة للتواصل الفوري عبر واتساب' : 'Include country code for instant WhatsApp notifications'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isArabic ? 'لغة التواصل وإصدار القسائم' : 'Preferred Language'}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: 'ar', label: 'العربية' },
                        { code: 'en', label: 'English' },
                        { code: 'ru', label: 'Русский' },
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setPreferredLanguage(item.code as 'ar' | 'en' | 'ru')}
                          className={`p-2.5 rounded-xl border text-xs font-medium font-sans text-center transition ${
                            preferredLanguage === item.code
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preferred Voucher Delivery Channel */}
                <div>
                  <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isArabic ? 'وسيلة استلام قسائم الحجوزات الرسمية' : 'Preferred Voucher Delivery Channel'}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredContactChannel('whatsapp')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                        preferredContactChannel === 'whatsapp'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>WhatsApp ({isArabic ? 'فوري ومباشر' : 'Instant'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredContactChannel('sms')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                        preferredContactChannel === 'sms'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>SMS ({isArabic ? 'رسائل قصيرة' : 'Text message'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredContactChannel('email')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                        preferredContactChannel === 'email'
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Email ({isArabic ? 'ملف PDF رسمي' : 'Official PDF'})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.profile.nationality}
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.profile.country}
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.profile.passportNumber}
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="e.g. N12345678"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-numeric font-medium tracking-wide text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 uppercase"
                  />
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-sans">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.profile.saveSuccess}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-sans transition shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? t.profile.saving : t.profile.saveChanges}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* GCC Stay & Travel Preferences Card (lg:col-span-5) */}
            <div 
              id="user-gcc-preferences-card" 
              className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                      {t.profile.travelPreferences}
                    </h2>
                    <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'خدمات ضيافة مخصصة لراحة النزلاء الخليجيين في روسيا' : 'Tailored hospitality amenities for Arab & GCC guests in Russia'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                  halalFood 
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  <input
                    type="checkbox"
                    checked={halalFood}
                    onChange={(e) => setHalalFood(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                        {t.profile.halalPref}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'ضمان تقديم لحوم حلال وتجنب الكحول في بوفيه الإفطار' : 'Certified Halal breakfast buffet and alcohol-free dining options'}
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                  prayerRugs 
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  <input
                    type="checkbox"
                    checked={prayerRugs}
                    onChange={(e) => setPrayerRugs(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                        {t.profile.prayerRugPref}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'توفير سجادة صلاة معقمة وملصق توضيح اتجاه القبلة في الغرفة' : 'Clean sanitized prayer mat and Qibla directional indicator'}
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                  arabicSupport 
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  <input
                    type="checkbox"
                    checked={arabicSupport}
                    onChange={(e) => setArabicSupport(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                        {t.profile.arabicSupportPref}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'أولوية التسكين مع موظف كونسيرج أو استقبال يتحدث اللغة العربية' : 'Priority assistance with Arabic-speaking hotel front desk staff'}
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                  autoVisaVoucher 
                    ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  <input
                    type="checkbox"
                    checked={autoVisaVoucher}
                    onChange={(e) => setAutoVisaVoucher(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                        {t.profile.autoVisaPref}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
                      {isArabic ? 'تضمين قسيمة دعوة التأشيرة السياحية الروسية المعتمدة تلقائياً' : 'Automatic generation of accredited tourist visa invitation voucher'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-text text-slate-400">
                {isArabic
                  ? 'يتم إرسال هذه التفضيلات تلقائياً إلى إدارة الفندق الروسي عند تأكيد أي حجز جديد لضمان أفضل تجربة ضيافة.'
                  : 'These hospitality preferences are automatically transmitted to Russian hotel management upon booking confirmation.'}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
