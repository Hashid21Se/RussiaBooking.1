import React from 'react';
import { 
  Building2, 
  Globe2, 
  Moon, 
  Sun, 
  Bookmark, 
  Briefcase, 
  ShieldCheck, 
  Menu, 
  X, 
  Coins, 
  Sparkles,
  Compass,
  FileText
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';
import { SupportedCurrency } from '../types';
import { CURRENCY_RATES } from '../lib/currency';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currency: SupportedCurrency;
  onCurrencyChange: (curr: SupportedCurrency) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  savedCount: number;
  bookingsCount: number;
  userRole: 'USER' | 'ADMIN';
  onToggleRole: () => void;
  loyaltyPoints?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  currency,
  onCurrencyChange,
  theme,
  onToggleTheme,
  currentView,
  onNavigate,
  savedCount,
  bookingsCount,
  userRole,
  onToggleRole,
  loyaltyPoints = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = React.useState(false);
  const t = translations[lang];

  const currencies: SupportedCurrency[] = ['SAR', 'RUB', 'AED', 'USD', 'KWD', 'QAR'];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#0F141C]/95 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            id="nav-logo"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#E11D48] text-white font-black text-lg shadow-sm group-hover:opacity-95 transition-opacity">
              ₽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#E11D48]">
                  Russia<span className="text-[#111827] dark:text-white font-extrabold">Booking</span>
                </span>
                <span className="rounded-full bg-[#F3F4F6] dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#6B7280] dark:text-slate-300">
                  RU • GCC
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-[#6B7280] dark:text-slate-400">
          <button
            id="nav-home"
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors ${
              currentView === 'home'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            {t.nav.home}
          </button>
          <button
            id="nav-explore-hotels"
            onClick={() => onNavigate('search')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              currentView === 'search'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t.nav.hotels}
          </button>
          <button
            id="nav-destinations"
            onClick={() => onNavigate('destinations')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              currentView === 'destinations'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            {t.nav.destinations}
          </button>
          <button
            id="nav-guide"
            onClick={() => onNavigate('guide')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              currentView === 'guide'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t.nav.guide}
          </button>
          <button
            id="nav-my-bookings"
            onClick={() => onNavigate('my-bookings')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              currentView === 'my-bookings'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{t.nav.myBookings}</span>
            {bookingsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E11D48] text-[10px] font-bold text-white">
                {bookingsCount}
              </span>
            )}
          </button>
          <button
            id="nav-saved"
            onClick={() => onNavigate('saved')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              currentView === 'saved'
                ? 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white font-semibold'
                : 'hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{t.nav.saved}</span>
            {savedCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E7EB] dark:bg-slate-700 text-[10px] font-bold text-[#111827] dark:text-slate-200">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* PWA Install Button - hidden on narrow phones to prevent header overflow, available in mobile drawer instead */}
          <div className="hidden sm:block">
            <PWAInstallButton lang={lang} />
          </div>

          {/* Currency Dropdown Selector - hidden on narrow phones, available in mobile drawer instead */}
          <div className="relative hidden sm:block">
            <button
              id="currency-selector-btn"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[#111827] dark:text-slate-200 hover:bg-[#F8F9FA] dark:hover:bg-slate-800 transition shadow-xs"
              title="Change Display Currency"
            >
              <Coins className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>{currency}</span>
            </button>

            {currencyDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 bg-white p-1.5 shadow-xl dark:bg-slate-900 z-50 text-xs"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  {lang === 'ar' ? 'اختر عملة العرض' : 'Select Currency'}
                </div>
                {currencies.map(curr => {
                  const info = (CURRENCY_RATES as any)[curr];
                  return (
                    <button
                      key={curr}
                      onClick={() => {
                        onCurrencyChange(curr);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition ${
                        currency === curr 
                          ? 'bg-[#E11D48]/10 font-bold text-[#E11D48]' 
                          : 'text-[#111827] dark:text-slate-300 hover:bg-[#F3F4F6] dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold">{curr}</span>
                        <span className="text-[#6B7280] text-[11px]">
                          {lang === 'ar' ? info?.nameAr : info?.nameEn}
                        </span>
                      </span>
                      <span className="font-semibold text-[#9CA3AF]">
                        {lang === 'ar' ? info?.symbolAr : info?.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Toggle Button - icon-only on narrow phones to save horizontal space */}
          <button
            id="lang-toggle-btn"
            onClick={() => onLanguageChange(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-3 py-1.5 text-xs font-semibold text-[#111827] dark:text-slate-200 hover:bg-[#F8F9FA] dark:hover:bg-slate-800 transition shadow-xs"
            title="Toggle Language (العربية / English)"
          >
            <Globe2 className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-[#6B7280] dark:text-slate-300 hover:bg-[#F8F9FA] dark:hover:bg-slate-800 transition shadow-xs"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#111827]" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Loyalty Points & Profile Button */}
          <button
            id="nav-user-profile-btn"
            onClick={() => onNavigate('profile')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              currentView === 'profile'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-[#E11D48] border border-rose-300 dark:border-rose-800'
                : 'border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-200 hover:bg-[#F8F9FA] dark:hover:bg-slate-800'
            }`}
            title={lang === 'ar' ? 'الملف الشخصي ورصيد نقاط المكافآت' : 'User Profile & Loyalty Rewards'}
          >
            <span className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-md bg-[#E11D48] text-white">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
            <span className="font-mono text-[#E11D48] font-extrabold">
              {loyaltyPoints.toLocaleString()}
            </span>
            <span className="hidden xl:inline text-[11px] text-slate-500 font-normal">
              {t.loyalty.pts}
            </span>
          </button>

          {/* Admin Switcher Pill */}
          <button
            id="admin-mode-btn"
            onClick={onToggleRole}
            className={`hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              userRole === 'ADMIN'
                ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827]'
                : 'border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
            title="Toggle Admin View"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{userRole === 'ADMIN' ? 'Admin Mode' : 'Admin'}</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-[#0F141C] px-4 py-4 space-y-1.5 shadow-lg">
          {/* Currency selector - moved here from header row on narrow phones */}
          <div className="sm:hidden pb-2 mb-1.5 border-b border-[#E5E7EB] dark:border-slate-800">
            <div className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              {lang === 'ar' ? 'عملة العرض' : 'Display Currency'}
            </div>
            <div className="flex flex-wrap gap-1.5 px-3.5">
              {currencies.map(curr => (
                <button
                  key={curr}
                  onClick={() => onCurrencyChange(curr)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    currency === curr
                      ? 'bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/30'
                      : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#111827] dark:text-slate-300'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
          {/* PWA install access - moved here from header row on narrow phones */}
          <div className="sm:hidden pb-2 mb-1.5 border-b border-[#E5E7EB] dark:border-slate-800 px-3.5">
            <PWAInstallButton lang={lang} />
          </div>
          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <span>{t.nav.home}</span>
          </button>
          <button
            onClick={() => { onNavigate('search'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <Building2 className="w-4 h-4 text-[#E11D48]" />
            <span>{t.nav.hotels}</span>
          </button>
          <button
            onClick={() => { onNavigate('destinations'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <Compass className="w-4 h-4 text-[#6B7280]" />
            <span>{t.nav.destinations}</span>
          </button>
          <button
            onClick={() => { onNavigate('guide'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <FileText className="w-4 h-4 text-[#6B7280]" />
            <span>{t.nav.guide}</span>
          </button>
          <button
            onClick={() => { onNavigate('my-bookings'); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-[#6B7280]" />
              <span>{t.nav.myBookings}</span>
            </span>
            {bookingsCount > 0 && (
              <span className="rounded-full bg-[#E11D48] px-2 py-0.5 text-xs font-bold text-white">
                {bookingsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { onNavigate('saved'); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-[#6B7280]" />
              <span>{t.nav.saved}</span>
            </span>
            {savedCount > 0 && (
              <span className="rounded-full bg-[#E5E7EB] dark:bg-slate-700 px-2 py-0.5 text-xs font-bold text-[#111827]">
                {savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#E11D48]" />
              <span>{t.profile.title}</span>
            </span>
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-bold text-[#E11D48] font-mono">
              {loyaltyPoints.toLocaleString()} {t.loyalty.pts}
            </span>
          </button>
          <button
            onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#111827] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
          >
            <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
            <span>{t.admin.portalTitle}</span>
          </button>
        </div>
      )}
    </header>
  );
};
