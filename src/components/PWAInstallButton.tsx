import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { translations, Language } from '../lib/i18n';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const t = translations[lang];

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-semibold text-slate-950 transition shadow-sm"
        title={t.pwa.installApp}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{t.pwa.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'تثبيت على آيفون' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  {lang === 'ar' ? 'تثبيت RussiaBooking على iOS' : 'Install on iPhone / iPad'}
                </h3>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {lang === 'ar' ? (
                  <>
                    1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري.<br />
                    2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.<br />
                    3. ستتمكن من تصفح الفنادق وحجوزاتك بدون اتصال وتجربة التطبيق الكاملة.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                    3. Enjoy offline booking access and full native app performance.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 py-2 text-sm font-semibold hover:opacity-90 transition"
              >
                {t.myBookings.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
