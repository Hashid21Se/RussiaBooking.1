import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  Calendar, 
  MapPin, 
  Users, 
  ShieldCheck, 
  FileText, 
  QrCode, 
  ArrowLeft, 
  ArrowRight,
  Briefcase,
  Share2,
  Sparkles
} from 'lucide-react';
import { Booking, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

interface BookingConfirmationViewProps {
  booking: Booking;
  lang: Language;
  currency: SupportedCurrency;
  onViewMyBookings: () => void;
  onGoHome: () => void;
  onViewProfile?: () => void;
  totalLoyaltyBalance?: number;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  booking,
  lang,
  currency,
  onViewMyBookings,
  onGoHome,
  onViewProfile,
  totalLoyaltyBalance,
}) => {
  const t = translations[lang];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Banner Success */}
      <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 text-center text-emerald-900 dark:text-emerald-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">
          {t.voucher.confirmedTitle}
        </h1>
        <p className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-300/80 max-w-lg mx-auto">
          {t.voucher.confirmedSubtitle}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 border border-emerald-500/20 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white shadow-sm">
          <span>{t.voucher.bookingCode}:</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base">
            {booking.bookingCode}
          </span>
        </div>
      </div>

      {/* Loyalty Reward Accrual Banner */}
      {booking.pointsEarned ? (
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t.loyalty.confirmationAward.replace('{points}', booking.pointsEarned.toLocaleString())}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalLoyaltyBalance !== undefined 
                  ? (lang === 'ar' ? `رصيدك الإجمالي الجديد: ${totalLoyaltyBalance.toLocaleString()} نقطة` : `Your new total balance is ${totalLoyaltyBalance.toLocaleString()} pts`)
                  : (lang === 'ar' ? 'تمت إضافة النقاط بنجاح إلى حساب مكافآتك' : 'Points credited to your loyalty balance')}
              </p>
            </div>
          </div>

          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition text-xs shadow-xs shrink-0"
            >
              <span>{t.loyalty.viewInProfile}</span>
              {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      ) : null}

      {/* Official Voucher Document Container (Printable) */}
      <div 
        id="printable-voucher"
        className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl space-y-8 print:border-none print:shadow-none"
      >
        {/* Voucher Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                Russia<span className="text-amber-600 dark:text-amber-400">Booking</span>
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                OFFICIAL HOTEL VOUCHER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Approved Russian Hotel Accommodation Voucher & Tourism Voucher
            </p>
          </div>

          <div className="text-start sm:text-end">
            <span className="text-xs text-slate-400 block">{t.voucher.bookingCode}</span>
            <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
              {booking.bookingCode}
            </span>
            <span className="block text-[11px] text-slate-500">
              Issued: {new Date(booking.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Hotel & Guest Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hotel Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'ar' ? 'بيانات الفندق المحجوز' : 'Hotel Details'}
            </h3>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {lang === 'ar' ? booking.hotelNameAr : booking.hotelNameEn}
              </h4>
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{lang === 'ar' ? booking.hotelAddressAr : booking.hotelAddressEn}, {booking.hotelCity}</span>
              </div>
              <div className="pt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? booking.roomNameAr : booking.roomNameEn} • {lang === 'ar' ? booking.rateNameAr : booking.rateNameEn}
              </div>
            </div>
          </div>

          {/* Lead Guest & E-Visa Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'ar' ? 'بيانات النزيل والتأشيرة' : 'Lead Guest & E-Visa Details'}
            </h3>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.booking.fullName}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{booking.guests[0]?.fullName || 'Lead Guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.booking.passportNumber}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{booking.guests[0]?.passportNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.booking.nationality}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{booking.guests[0]?.nationality || 'Saudi Arabia'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.booking.guests}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{booking.guestsCount} {t.common.guestsPlural}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Dates Bar */}
        <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-900 text-white p-4 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t.voucher.checkIn}</span>
            <span className="text-sm sm:text-base font-bold text-amber-400">{booking.checkInDate}</span>
          </div>
          <div className="border-x border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase block">{t.booking.nights}</span>
            <span className="text-sm sm:text-base font-bold">{booking.nightsCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t.voucher.checkOut}</span>
            <span className="text-sm sm:text-base font-bold text-amber-400">{booking.checkOutDate}</span>
          </div>
        </div>

        {/* QR Code & Payment Confirmation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* Visual QR Code Generator */}
            <div className="h-24 w-24 bg-white p-2 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-center shrink-0">
              <QrCode className="w-16 h-16 text-slate-900" />
              <span className="text-[8px] font-mono text-slate-500 mt-1">SCAN AT DESK</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {lang === 'ar' ? 'رمز التأكيد الفوري للريسبشن' : 'Digital Fast Check-In QR'}
              </span>
              <p className="max-w-xs text-[11px] leading-relaxed">
                {lang === 'ar'
                  ? 'أظهر هذا الرمز أو القسيمة المطبوعة لموظف الاستقبال عند وصولك للفندق لتسجيل الدخول السريع.'
                  : 'Present this QR code or printed voucher to hotel front desk for express check-in.'}
              </p>
            </div>
          </div>

          <div className="text-start sm:text-end space-y-1">
            <span className="text-xs text-slate-400 block">{t.voucher.totalAmountPaid}</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {CurrencyService.format(booking.totalPriceRub, booking.currencyPaid, lang)}
            </span>
            <span className="block text-xs text-slate-500">
              ({booking.totalPriceRub.toLocaleString()} ₽ Rubles • {booking.paymentMethod})
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.booking.paymentSuccess}
            </span>
          </div>
        </div>

        {/* Legal & E-Visa Footer note */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200/50 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            {lang === 'ar'
              ? 'هذه القسيمة مستخرجة رسمياً ومطابقة لمعايير وزارة التنمية الاقتصادية الروسية لتوثيق حجوزات الفنادق وطلبات التأشيرة الإلكترونية (Unified Electronic Visa - E-Visa).'
              : 'This voucher is an authorized tourist confirmation conforming to the Russian Ministry of Economic Development hotel booking verification standards for Unified E-Visa applications.'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{lang === 'ar' ? 'العودة للرئيسية' : 'Return to Home'}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            id="print-voucher-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>{t.voucher.printVoucher}</span>
          </button>

          <button
            id="view-my-bookings-btn"
            onClick={onViewMyBookings}
            className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 px-5 py-2.5 text-xs font-bold shadow-md transition"
          >
            <Briefcase className="w-4 h-4" />
            <span>{t.nav.myBookings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
