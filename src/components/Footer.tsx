import React from 'react';
import { 
  Building, 
  ShieldCheck, 
  Headphones, 
  MapPin, 
  Mail, 
  Phone, 
  Sparkles,
  CreditCard,
  FileCheck2,
  Lock
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface FooterProps {
  lang: Language;
  onNavigate: (view: string) => void;
  onSelectCity: (city: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onNavigate, onSelectCity }) => {
  const t = translations[lang];

  return (
    <footer className="border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-[#0F141C] text-[#6B7280] dark:text-slate-400 transition-colors pt-12 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-gray-100 dark:border-slate-800">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-black text-sm">
                ₽
              </div>
              <span className="text-xl font-bold text-[#111827] dark:text-white">
                Russia<span className="text-[#E11D48]">Booking</span>
              </span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'المنصة الرائدة لحجز أفخم فنادق روسيا وتقديم قسائم التأشيرة الإلكترونية المعتمدة للمسافرين من المملكة العربية السعودية ودول الخليج العربي.'
                : 'The premier Russian hotel reservation platform and certified tourist voucher provider for travelers across Saudi Arabia and the GCC.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E11D48] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ar' ? 'معتمد رسمياً لطلبات التأشيرة الروسية' : 'Authorized Russian E-Visa Accommodations'}</span>
            </div>
          </div>

          {/* Column 2: Popular Cities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
              {t.destinations.title}
            </h4>
            <ul className="space-y-2 text-xs text-[#6B7280] dark:text-slate-400">
              <li>
                <button
                  onClick={() => onSelectCity('Moscow')}
                  className="hover:text-[#E11D48] transition"
                >
                  {lang === 'ar' ? 'فنادق موسكو (Red Square & Arbat)' : 'Moscow Hotels & Suites'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCity('Saint Petersburg')}
                  className="hover:text-[#E11D48] transition"
                >
                  {lang === 'ar' ? 'فنادق سانت بطرسبرغ (Nevsky & Hermitage)' : 'Saint Petersburg Imperial Stays'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCity('Sochi')}
                  className="hover:text-[#E11D48] transition"
                >
                  {lang === 'ar' ? 'منتجعات سوتشي وروز خوتور' : 'Sochi Beach & Mountain Ski Resorts'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCity('Kazan')}
                  className="hover:text-[#E11D48] transition"
                >
                  {lang === 'ar' ? 'فنادق قازان الإسلامية والحلال' : 'Kazan Halal Certified Hotels'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCity('Murmansk')}
                  className="hover:text-[#E11D48] transition"
                >
                  {lang === 'ar' ? 'منتجعات مورمانسك والشفق القطبي' : 'Murmansk Aurora Stays'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Travel & Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
              {lang === 'ar' ? 'روابط ومساعدة السفر' : 'Travelers Hub'}
            </h4>
            <ul className="space-y-2 text-xs text-[#6B7280] dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('guide')} className="hover:text-[#E11D48] transition">
                  {lang === 'ar' ? 'دليل التأشيرة الإلكترونية الروسية' : 'Russian E-Visa Step-by-Step Guide'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-bookings')} className="hover:text-[#E11D48] transition">
                  {t.nav.myBookings}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('saved')} className="hover:text-[#E11D48] transition">
                  {t.nav.saved}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('guide')} className="hover:text-[#E11D48] transition">
                  {lang === 'ar' ? 'قائمة المطاعم الحلال بموسكو' : 'Halal Food Guide in Russia'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: 24/7 Concierge & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
              {lang === 'ar' ? 'خدمة العملاء والكونسيرج 24/7' : '24/7 Dedicated Concierge'}
            </h4>
            <p className="text-xs text-[#6B7280] dark:text-slate-400">
              {lang === 'ar'
                ? 'فريق دعم عربي وروسي متخصص لمساعدتك في أي استفسار حول حجزك أو الوصول للفندق.'
                : 'Bilingual Arabic & Russian concierge to assist with transfers, vouchers, and reception support.'}
            </p>
            <div className="space-y-1.5 text-xs text-[#111827] dark:text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>+966 11 800 7824 (KSA / GCC)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>vip-concierge@russiabooking.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Payment Gateways & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#6B7280] dark:text-slate-400 me-2">
              {lang === 'ar' ? 'طرق الدفع المعتمدة:' : 'Accepted Payment Gateways:'}
            </span>
            <span className="rounded-lg bg-[#F8F9FA] dark:bg-slate-800 px-2.5 py-1 font-bold text-[#10B981] border border-gray-100 dark:border-slate-700">mada</span>
            <span className="rounded-lg bg-[#F8F9FA] dark:bg-slate-800 px-2.5 py-1 font-bold text-[#E11D48] border border-gray-100 dark:border-slate-700">Tamara</span>
            <span className="rounded-lg bg-[#F8F9FA] dark:bg-slate-800 px-2.5 py-1 font-bold text-blue-500 border border-gray-100 dark:border-slate-700">Tap</span>
            <span className="rounded-lg bg-[#F8F9FA] dark:bg-slate-800 px-2.5 py-1 font-bold text-[#111827] dark:text-slate-200 border border-gray-100 dark:border-slate-700">Apple Pay</span>
            <span className="rounded-lg bg-[#F8F9FA] dark:bg-slate-800 px-2.5 py-1 font-bold text-[#111827] dark:text-slate-200 border border-gray-100 dark:border-slate-700">Visa / Mastercard</span>
          </div>

          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#10B981]" />
            <span>© {new Date().getFullYear()} RussiaBooking Inc. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
