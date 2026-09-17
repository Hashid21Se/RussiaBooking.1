import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { translations, Language } from '../lib/i18n';

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install, dismiss, isDismissed } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const t = translations[lang];

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  // 1. Banner Variant (e.g. at the bottom of mobile viewport)
  if (variant === 'banner' && isInstallable && !isDismissed) {
    return (
      <div 
        id="pwa-install-banner" 
        className="fixed bottom-16 sm:bottom-4 inset-x-4 z-40 mx-auto max-w-md rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all animate-in slide-in-from-bottom-5"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C8102E] text-white font-black text-xl shadow-sm">
            ₽
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'تطبيق RussiaBooking' : 'RussiaBooking App'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'ar' 
                ? 'ثبت التطبيق على هاتفك لتصفح أسرع وحجز فندقي مباشر بدون إنترنت.'
                : 'Install the app on your home screen for instant booking & offline access.'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A80D26] text-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تثبيت الآن' : 'Install App'}</span>
              </button>
              <button
                onClick={dismiss}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                {lang === 'ar' ? 'لاحقاً' : 'Not now'}
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Installable State for Header / Nav
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={handleInstall}
        className="flex items-center gap-1.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#C8102E] to-[#E11D48] hover:opacity-95 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm active:scale-95"
        title={t.pwa.installApp}
      >
        {installSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{lang === 'ar' ? 'تم التثبيت!' : 'Installed!'}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{t.pwa.installApp}</span>
          </>
        )}
      </button>
    );
  }

  // 3. iOS Safari Instructions
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 min-h-[44px] rounded-xl border border-[#C8102E]/30 bg-[#C8102E]/10 hover:bg-[#C8102E]/20 px-3.5 py-2 text-xs font-semibold text-[#C8102E] dark:text-rose-400 transition active:scale-95"
          title={lang === 'ar' ? 'تثبيت التطبيق على آيفون' : 'Install on iOS'}
        >
          <Smartphone className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تثبيت على آيفون' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div 
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right" 
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C8102E] text-white font-bold text-xs">
                    ₽
                  </div>
                  {lang === 'ar' ? 'تثبيت RussiaBooking على iOS' : 'Install on iPhone / iPad'}
                </h3>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-white text-xs font-bold">1</span>
                  <p className="leading-snug">
                    {lang === 'ar' ? (
                      <>اضغط على زر <strong>المشاركة</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> Share) في شريط متصفح سفاري السفلي.</>
                    ) : (
                      <>Tap the <strong>Share</strong> button (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />) in the Safari toolbar.</>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-white text-xs font-bold">2</span>
                  <p className="leading-snug">
                    {lang === 'ar' ? (
                      <>مرر لأسفل القائمة واختر <strong>إضافة إلى الشاشة الرئيسية</strong> (Add to Home Screen).</>
                    ) : (
                      <>Scroll down and select <strong>Add to Home Screen</strong>.</>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-white text-xs font-bold">3</span>
                  <p className="leading-snug">
                    {lang === 'ar' ? (
                      <>اضغط <strong>إضافة (Add)</strong> بالأعلى لتجد أيقونة التطبيق في شاشتك الرئيسية كأي تطبيق أصلي.</>
                    ) : (
                      <>Tap <strong>Add</strong> at top right to launch RussiaBooking directly from your home screen.</>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#C8102E] text-white font-bold py-2.5 text-sm hover:bg-[#A80D26] transition active:scale-95"
              >
                {lang === 'ar' ? 'فهمت ذلك' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
