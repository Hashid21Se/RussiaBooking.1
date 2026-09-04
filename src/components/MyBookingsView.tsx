import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  Headphones,
  Search,
  Sparkles,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import { Booking, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';
import { downloadBookingVoucherPdf } from '../lib/pdfVoucherGenerator';

interface MyBookingsViewProps {
  bookings: Booking[];
  lang: Language;
  currency: SupportedCurrency;
  onSelectBookingForVoucher: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason: string) => Promise<void>;
  onExploreHotels: () => void;
  onViewProfile?: () => void;
  loyaltyPoints?: number;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  lang,
  currency,
  onSelectBookingForVoucher,
  onCancelBooking,
  onExploreHotels,
  onViewProfile,
  loyaltyPoints,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel dates');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [downloadingBookingId, setDownloadingBookingId] = useState<string | null>(null);
  const [downloadSuccessCode, setDownloadSuccessCode] = useState<string | null>(null);
  const t = translations[lang];

  const handleDownloadPdf = async (booking: Booking) => {
    setDownloadingBookingId(booking.id);
    try {
      const success = await downloadBookingVoucherPdf(booking, lang, currency);
      if (success) {
        setDownloadSuccessCode(booking.bookingCode);
        setTimeout(() => {
          setDownloadSuccessCode((prev) => (prev === booking.bookingCode ? null : prev));
        }, 5000);
      }
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingBookingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT';
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancel(true);
    try {
      await onCancelBooking(cancellingBooking.id, cancelReason);
      setCancellingBooking(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-amber-500" />
            <span>{t.myBookings.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'ar' ? 'إدارة جميع حجوزاتك وقسائم الفنادق المعتمدة والتأشيرات' : 'Manage your upcoming stays, vouchers, and travel reservations.'}
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold">
          {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' && t.myBookings.all}
              {tab === 'UPCOMING' && t.myBookings.upcoming}
              {tab === 'COMPLETED' && t.myBookings.past}
              {tab === 'CANCELLED' && t.myBookings.cancelled}
            </button>
          ))}
        </div>
      </div>

      {/* Loyalty points quick balance banner */}
      {loyaltyPoints !== undefined && onViewProfile && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {t.loyalty.title}
              </span>
              <span className="text-slate-500 text-[11px]">
                {lang === 'ar' ? 'رصيدك الحالي:' : 'Your current balance:'}{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-extrabold">
                  {loyaltyPoints.toLocaleString()} {t.loyalty.pts}
                </strong>
              </span>
            </div>
          </div>

          <button
            onClick={onViewProfile}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shadow-xs text-xs shrink-0"
          >
            {t.loyalty.viewInProfile}
          </button>
        </div>
      )}

      {/* Offline PDF Download Success Notification */}
      {downloadSuccessCode && (
        <div 
          id="pdf-download-success-banner"
          className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {lang === 'ar' ? 'تم تنزيل قسيمة الحجز كملف PDF بنجاح!' : 'Hotel Voucher PDF Downloaded Successfully!'}
              </span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                {lang === 'ar'
                  ? `تم حفظ قسيمة الحجز رقم (${downloadSuccessCode}) في جهازك. يمكنك إبرازها لموظف الفندق أو السلطات الروسية بدون اتصال بالإنترنت.`
                  : `Voucher (${downloadSuccessCode}) is saved offline. You can present it at check-in or Russian border control without internet.`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setDownloadSuccessCode(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t.myBookings.noBookings}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {lang === 'ar' ? 'لم تقم بحجز أي فندق حتى الآن. ابدأ باستكشاف أفخم فنادق موسكو وسانت بطرسبرغ وسوتشي.' : 'No reservations recorded under this filter yet. Explore luxury Russian hotels now.'}
          </p>
          <button
            onClick={onExploreHotels}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition"
          >
            {t.myBookings.bookNow}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Hotel and Booking Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md">
                    {b.bookingCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : b.status === 'CANCELLED'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {b.status === 'CONFIRMED' && t.myBookings.statusConfirmed}
                    {b.status === 'CANCELLED' && t.myBookings.statusCancelled}
                    {b.status === 'PENDING_PAYMENT' && t.myBookings.statusPending}
                    {b.status === 'COMPLETED' && t.myBookings.statusCompleted}
                  </span>
                  {b.pointsEarned ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-rose-600" />
                      <span>+{b.pointsEarned.toLocaleString()} {t.loyalty.pts}</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? b.hotelNameAr : b.hotelNameEn}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{b.hotelCity}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{b.checkInDate} - {b.checkOutDate} ({b.nightsCount} {lang === 'ar' ? 'ليالٍ' : 'nights'})</span>
                  </span>
                  <span>•</span>
                  <span>{lang === 'ar' ? b.roomNameAr : b.roomNameEn}</span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-start md:text-end">
                  <span className="text-xs text-slate-400 block">{t.voucher.totalAmountPaid}</span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {CurrencyService.format(b.totalPriceRub, b.currencyPaid, lang)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {b.totalPriceRub.toLocaleString()} ₽
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Download as PDF Button */}
                  {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                    <button
                      id={`download-pdf-btn-${b.id}`}
                      onClick={() => handleDownloadPdf(b)}
                      disabled={downloadingBookingId === b.id}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-xs disabled:opacity-60 cursor-pointer"
                      title={lang === 'ar' ? 'تحميل قسيمة الحجز الفندقي بصيغة PDF للاستخدام أوفلاين' : 'Download hotel voucher as PDF for offline travel'}
                    >
                      {downloadingBookingId === b.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>{t.voucher.downloadingPdf}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{t.voucher.downloadPdf}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    id={`view-voucher-btn-${b.id}`}
                    onClick={() => onSelectBookingForVoucher(b)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.myBookings.viewVoucher}</span>
                  </button>

                  {b.status === 'CONFIRMED' && (
                    <button
                      id={`cancel-booking-btn-${b.id}`}
                      onClick={() => setCancellingBooking(b)}
                      className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                    >
                      {t.myBookings.cancel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal Confirmation */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">
                {t.myBookings.cancelBookingTitle}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {lang === 'ar'
                ? `هل أنت متأكد من رغبتك في إلغاء الحجز رقم ${cancellingBooking.bookingCode}؟ سيتم فحص سياسة الإلغاء الفندقية وإرجاع المبلغ للبطاقة في حال كانت الإلغاءات المجانية سارية.`
                : `Are you sure you wish to cancel booking ${cancellingBooking.bookingCode}? Refunds will be automatically processed according to hotel cancellation policies.`}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar' ? 'سبب الإلغاء:' : 'Reason for cancellation:'}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
              >
                <option value="Change of travel dates">تغيير في مواعيد السفر</option>
                <option value="Flight schedule changed">تعديل في رحلات الطيران</option>
                <option value="Found alternative hotel">تم العثور على بديل أنسب</option>
                <option value="Visa delay or personal reasons">أسباب شخصية أو في استخراج التأشيرة</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.myBookings.close}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isSubmittingCancel ? 'جاري الإلغاء...' : t.myBookings.confirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
