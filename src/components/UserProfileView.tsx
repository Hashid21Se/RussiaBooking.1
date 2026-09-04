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
  FileCheck2
} from 'lucide-react';
import { UserProfile, SupportedCurrency, Booking } from '../types';
import { Language, translations } from '../lib/i18n';
import { 
  LoyaltyPointsBanner, 
  LoyaltyPrivilegesCard, 
  LoyaltyLedgerCard 
} from './LoyaltyPointsCard';
import { LoyaltyHistoryChart } from './LoyaltyHistoryChart';

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back to explore shortcut */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExploreHotels}
          className="inline-flex items-center gap-2 text-xs font-bold font-sans text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{lang === 'ar' ? 'العودة لاستكشاف الفنادق' : 'Back to explore hotels'}</span>
        </button>
      </div>

      {/* User Header Profile Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-rose-600 text-white font-extrabold font-display text-xl sm:text-2xl shadow-md shadow-rose-600/20 shrink-0">
              {name.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'SA'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                  {name}
                </h1>
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold font-sans text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'عضو موثق' : 'Verified Member'}</span>
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-sans">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{country}</span>
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 font-text">
                {t.profile.memberSince}:{' '}
                <span className="font-numeric font-medium">
                  {new Date(profile.memberSince).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToBookings}
              className="flex-1 sm:flex-initial flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-left transition"
            >
              <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
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
              className="flex-1 sm:flex-initial flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-left transition"
            >
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <div className="text-xs font-bold font-numeric text-slate-900 dark:text-white">
                  {favoritesCount}
                </div>
                <div className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                  {t.nav.saved}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* LOYALTY STATUS BANNER */}
      <LoyaltyPointsBanner
        profile={profile}
        lang={lang}
        currency={currency}
        onExploreHotels={onExploreHotels}
      />

      {/* BALANCED GRID: Personal Information & The Loyalty Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (lg:col-span-6): Personal Information & Travel Credentials */}
        <div className="lg:col-span-6 space-y-6">
          {/* Personal Information Form Card */}
          <div 
            id="user-personal-info-card" 
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
          >
            <div className="pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-rose-600" />
                <span>{t.profile.personalDetails}</span>
              </h2>
              <p className="text-xs font-text text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ar' ? 'تُستخدم هذه البيانات للتعبئة التلقائية السريعة عند حجز الفنادق وإصدار القسائم' : 'Used for fast autofill during hotel booking checkout and tourist vouchers'}
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.profile.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
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
                    <span className="text-[10px] font-sans text-slate-400">
                      {lang === 'ar' ? 'معتمد للواتساب وتأكيد الحجز' : 'Used for WhatsApp & confirmation'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 123 4567"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-numeric text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'ar' ? 'لغة التواصل المفضلة' : 'Preferred Language'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredLanguage('ar')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold font-sans border transition ${
                        preferredLanguage === 'ar'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredLanguage('en')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold font-sans border transition ${
                        preferredLanguage === 'en'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredLanguage('ru')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold font-sans border transition ${
                        preferredLanguage === 'ru'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Русский
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification & Communication Channel Preference */}
              <div>
                <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'ar' ? 'قناة استلام الفاوتشر والإشعارات' : 'Preferred Voucher Delivery Channel'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreferredContactChannel('whatsapp')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                      preferredContactChannel === 'whatsapp'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>WhatsApp ({lang === 'ar' ? 'فوري ومباشر' : 'Instant'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContactChannel('sms')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                      preferredContactChannel === 'sms'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>SMS ({lang === 'ar' ? 'رسائل قصيرة' : 'Text message'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContactChannel('email')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium font-sans text-start transition ${
                      preferredContactChannel === 'email'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Email ({lang === 'ar' ? 'بريد إلكتروني رسمي' : 'Official PDF'})</span>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold font-sans text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.profile.passportNumber}
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="e.g. N12345678"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-numeric font-medium tracking-wide text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
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

          {/* GCC Stay Preferences Card */}
          <div 
            id="user-gcc-preferences-card" 
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs"
          >
            <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-600" />
                <span>{t.profile.travelPreferences}</span>
              </h2>
              <p className="text-xs font-text text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ar' ? 'خدمات ضيافة مخصصة لراحة النزلاء الخليجيين والعرب في روسيا' : 'Tailored hospitality amenities for Arab & GCC travelers in Russia'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none transition">
                <input
                  type="checkbox"
                  checked={halalFood}
                  onChange={(e) => setHalalFood(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <Utensils className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  {t.profile.halalPref}
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none transition">
                <input
                  type="checkbox"
                  checked={prayerRugs}
                  onChange={(e) => setPrayerRugs(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  {t.profile.prayerRugPref}
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none transition">
                <input
                  type="checkbox"
                  checked={arabicSupport}
                  onChange={(e) => setArabicSupport(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  {t.profile.arabicSupportPref}
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none transition">
                <input
                  type="checkbox"
                  checked={autoVisaVoucher}
                  onChange={(e) => setAutoVisaVoucher(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <FileCheck2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-xs font-sans text-slate-700 dark:text-slate-300">
                  {t.profile.autoVisaPref}
                </span>
              </label>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-text text-slate-400">
              {lang === 'ar'
                ? 'يتم إرسال هذه التفضيلات تلقائياً إلى إدارة الفندق الروسي عند تأكيد الحجز.'
                : 'These preferences are automatically forwarded to hotel management upon booking confirmation.'}
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): The Loyalty History Chart & Points Ledger */}
        <div className="lg:col-span-6 space-y-6">
          {/* 6-Month Loyalty Points Earnings Visualization */}
          <LoyaltyHistoryChart
            profile={profile}
            lang={lang}
            currency={currency}
          />

          {/* Points Activity Ledger */}
          <LoyaltyLedgerCard
            profile={profile}
            lang={lang}
          />
        </div>
      </div>

      {/* MEMBERSHIP TIERS & PRIVILEGES SELECTOR */}
      <LoyaltyPrivilegesCard
        profile={profile}
        lang={lang}
      />
    </div>
  );
};
