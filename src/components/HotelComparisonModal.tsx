import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Minus, 
  Star, 
  MapPin, 
  Utensils, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  FileDown,
  Loader2
} from 'lucide-react';
import { Hotel, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';
import { downloadComparisonPdf } from '../lib/pdfVoucherGenerator';

interface HotelComparisonModalProps {
  hotels: Hotel[];
  lang: Language;
  currency: SupportedCurrency;
  isOpen?: boolean;
  onClose: () => void;
  onRemoveHotel: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onClearAll: () => void;
}

export const HotelComparisonModal: React.FC<HotelComparisonModalProps> = ({
  hotels,
  lang,
  currency,
  isOpen = true,
  onClose,
  onRemoveHotel,
  onSelectHotel,
  onClearAll,
}) => {
  const t = translations[lang];
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    if (isExportingPdf || hotels.length === 0) return;
    setIsExportingPdf(true);
    try {
      await downloadComparisonPdf(hotels, lang, currency);
    } catch (err) {
      console.error('Error exporting comparison PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                {t.compare.modalTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.compare.modalSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {hotels.length > 0 && (
              <>
                <button
                  id="export-comparison-pdf-btn"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#E11D48] dark:hover:text-[#E11D48] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs active:scale-95"
                  title={t.pdfExport?.compareExportPdf || 'Export Comparison PDF'}
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#E11D48]" />
                  ) : (
                    <FileDown className="w-4 h-4 text-[#E11D48]" />
                  )}
                  <span>
                    {isExportingPdf 
                      ? (t.pdfExport?.exportingPdf || 'Exporting...') 
                      : (t.pdfExport?.compareExportPdf || 'Export PDF')}
                  </span>
                </button>

                <button
                  onClick={onClearAll}
                  className="min-h-[44px] hidden sm:flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.compare.clearAll}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Content Table (Horizontal scroll on mobile) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          {hotels.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm">{lang === 'ar' ? 'لم تقم بتحديد أي فنادق للمقارنة بعد.' : 'No hotels selected for comparison yet.'}</p>
            </div>
          ) : (
            <div className="min-w-[680px]">
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: `200px repeat(${hotels.length}, minmax(220px, 1fr))` }}
              >
                {/* Header Row: Hotel Preview Card */}
                <div className="flex flex-col justify-end pb-4 font-bold text-xs text-slate-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'الفنادق المحددة' : 'Selected Hotels'}
                </div>

                {hotels.map((hotel) => (
                  <div 
                    key={hotel.id}
                    className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 flex flex-col"
                  >
                    <button
                      onClick={() => onRemoveHotel(hotel.id)}
                      className="absolute top-2 end-2 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition shadow-sm active:scale-95"
                      title={t.compare.remove}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="aspect-[16/10] w-full rounded-xl overflow-hidden mb-2.5 bg-slate-200 dark:bg-slate-700">
                      <img
                        src={hotel.images[0]?.url}
                        alt={lang === 'ar' ? hotel.nameAr : hotel.nameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {lang === 'ar' ? hotel.nameAr : hotel.nameEn}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {hotel.city}
                    </div>

                    <button
                      onClick={() => {
                        onSelectHotel(hotel);
                        onClose();
                      }}
                      className="min-h-[44px] mt-3 w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>{t.compare.bookThis}</span>
                      {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                ))}

                {/* Metric: Price Per Night */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricPrice}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 font-black text-sm text-amber-700 dark:text-amber-400 flex items-center">
                    {CurrencyService.format(h.minPriceRub, currency, lang)}
                  </div>
                ))}

                {/* Metric: Rating & Stars */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricRating}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="flex items-center gap-1 font-bold text-xs text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{h.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      ({h.stars} ★)
                    </span>
                  </div>
                ))}

                {/* Metric: Location & Landmark */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricLocation}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {lang === 'ar' ? h.addressAr : h.addressEn}
                    </span>
                  </div>
                ))}

                {/* Metric: Halal Certified Dining */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricHalal}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center">
                    {h.policies.halalCertifiedFood ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>{lang === 'ar' ? 'متوفر ومعتمد' : 'Certified Available'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                        <Minus className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'عند الطلب المسبق' : 'Upon Request'}</span>
                      </span>
                    )}
                  </div>
                ))}

                {/* Metric: Prayer Rug & Qibla Direction */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricPrayer}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center">
                    {h.policies.prayerRugsAvailable ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>{lang === 'ar' ? 'في الغرفة مجاناً' : 'Complimentary In-Room'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">{lang === 'ar' ? 'غير متوفر' : 'Not available'}</span>
                    )}
                  </div>
                ))}

                {/* Metric: E-Visa Tourist Voucher */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricVisa}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{lang === 'ar' ? 'دعوة إلكترونية فورية' : 'Instant Official Voucher'}</span>
                    </span>
                  </div>
                ))}

                {/* Metric: Free Cancellation */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricCancellation}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center">
                    {h.policies.freeCancellationHours > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {lang === 'ar'
                          ? `إلغاء مجاني حتى قبل ${h.policies.freeCancellationHours} ساعة`
                          : `Free cancel up to ${h.policies.freeCancellationHours}h`}
                      </span>
                    ) : (
                      <span className="text-slate-400">{lang === 'ar' ? 'غير قابل للاسترداد' : 'Non-refundable'}</span>
                    )}
                  </div>
                ))}

                {/* Metric: Amenities */}
                <div className="py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center">
                  {t.compare.metricAmenities}
                </div>
                {hotels.map((h) => (
                  <div key={h.id} className="py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex flex-wrap gap-1">
                      {h.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
