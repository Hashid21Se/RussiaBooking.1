import React from 'react';
import { 
  Building, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  FileCheck2, 
  HeartHandshake, 
  Headphones, 
  Plane, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Wifi,
  Compass
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

interface DestinationsGuideProps {
  lang: Language;
  onSelectCity: (city: string) => void;
}

export const DestinationsGuide: React.FC<DestinationsGuideProps> = ({ lang, onSelectCity }) => {
  const t = translations[lang];

  const destinationsList = [
    {
      key: 'Moscow',
      nameAr: 'موسكو',
      nameEn: 'Moscow',
      descAr: 'الساحة الحمراء، الكرملين، ومراكز التسوق العالمية الفخمة مثل غوم ونيكولسكايا',
      descEn: 'Red Square, the Kremlin, luxury malls, and historic palace hotels',
      image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&q=80',
      badgeAr: 'العاصمة النابضة',
      badgeEn: 'Iconic Capital',
      hotelCount: '18+ فندق 5 نجوم',
    },
    {
      key: 'Saint Petersburg',
      nameAr: 'سانت بطرسبرغ',
      nameEn: 'Saint Petersburg',
      descAr: 'مدينة القياصرة والأرميتاج وقصر الشتاء، والقنوات المائية البديعة والليالي البيضاء',
      descEn: 'Cultural capital, Winter Palace, enchanting canals, and imperial architecture',
      image: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?auto=format&fit=crop&w=800&q=80',
      badgeAr: 'عاصمة الثقافة',
      badgeEn: 'Cultural Crown',
      hotelCount: '15+ فندق تاريخي',
    },
    {
      key: 'Sochi',
      nameAr: 'سوتشي وروز خوتور',
      nameEn: 'Sochi & Rosa Khutor',
      descAr: 'شواطئ البحر الأسود الدافئة ومنتجعات التزلج في قمم القوقاز الخلابة صيفاً وشتاءً',
      descEn: 'Subtropical Black Sea beaches and majestic Caucasus mountain ski resorts',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
      badgeAr: 'ريفييرا البحر الأسود',
      badgeEn: 'Resort Paradise',
      hotelCount: '12+ منتجع فاخر',
    },
    {
      key: 'Kazan',
      nameAr: 'قازان (تتارستان)',
      nameEn: 'Kazan (Tatarstan)',
      descAr: 'العاصمة التاريخية لتتارستان، جامع قول شريف الشهير، وطعام حلال معتمد في كل مكان',
      descEn: 'Cultural gem of Tatarstan, Kul Sharif Mosque, and 100% Halal culinary heritage',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      badgeAr: 'التراث الإسلامي والحلال',
      badgeEn: 'Halal Heartland',
      hotelCount: '10+ فنادق حلال',
    },
    {
      key: 'Murmansk',
      nameAr: 'مورمانسك (القطب الشمالي)',
      nameEn: 'Murmansk (Aurora)',
      descAr: 'وجهة رصد الشفق القطبي المذهل (Aurora)، وركوب زلاجات الهاسكي وتجربة الشتاء القطبي',
      descEn: 'Prime Northern Lights viewing, Arctic wildlife, and magical tundra safaris',
      image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
      badgeAr: 'الشفق القطبي',
      badgeEn: 'Northern Lights',
      hotelCount: '8+ فنادق قطبية',
    },
  ];

  return (
    <div className="space-y-12 md:space-y-16 py-8 md:py-12">
      {/* 1. Destinations Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400">
              {t.destinations.title}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#111827] dark:text-white mt-1">
              {lang === 'ar' ? 'أفضل الوجهات السياحية في روسيا' : 'Top Destinations in Russia'}
            </h2>
          </div>
          <button 
            onClick={() => onSelectCity('')}
            className="text-sm font-semibold text-[#E11D48] underline underline-offset-4 hover:opacity-85 transition self-start sm:self-auto"
          >
            {lang === 'ar' ? 'عرض كافة المدن' : 'View all 124 cities'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinationsList.map((dest) => (
            <div
              key={dest.key}
              onClick={() => onSelectCity(dest.key)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#151C28] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#F3F4F6] dark:bg-slate-800 relative">
                <img
                  src={dest.image}
                  alt={lang === 'ar' ? dest.nameAr : dest.nameEn}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <span className="absolute top-3 end-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#111827] dark:text-white shadow-xs">
                  {lang === 'ar' ? dest.badgeAr : dest.badgeEn}
                </span>
                <div className="absolute bottom-3 start-4 end-4 text-white">
                  <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
                    {lang === 'ar' ? 'روسيا الاتّحادية' : 'Russia'}
                  </div>
                  <h3 className="text-xl font-bold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span>{lang === 'ar' ? dest.nameAr : dest.nameEn}</span>
                  </h3>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed mb-4">
                  {lang === 'ar' ? dest.descAr : dest.descEn}
                </p>
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#111827] dark:text-slate-300">
                    <Building className="w-4 h-4 text-[#E11D48]" />
                    <span>{dest.hotelCount}</span>
                  </span>
                  <span className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-[#111827] dark:text-white transition">
                    {lang === 'ar' ? 'عرض الفنادق' : 'Explore'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Value Proposition for Middle Eastern Travelers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#151C28] p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF] dark:text-slate-400">
              {lang === 'ar' ? 'مميزات حصرية' : 'Exclusive Advantages'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#111827] dark:text-white mt-1">
              {t.benefits.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-slate-400 mt-2">
              {lang === 'ar' 
                ? 'صُممت منصة RussiaBooking خصيصاً لتجاوز جميع عقبات الدفع والتأشيرات واللغة للمسافر العربي'
                : 'Engineered specifically to solve payment barriers, visa vouchers, and halal hospitality for Middle Eastern guests.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/70 p-5 border border-gray-100 dark:border-slate-700/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-[#10B981] shadow-xs mb-3.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#111827] dark:text-white text-base mb-1">
                {t.benefits.madaTamara}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                {t.benefits.madaTamaraDesc}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/70 p-5 border border-gray-100 dark:border-slate-700/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-[#E11D48] shadow-xs mb-3.5">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#111827] dark:text-white text-base mb-1">
                {t.benefits.evisaSupport}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                {t.benefits.evisaSupportDesc}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/70 p-5 border border-gray-100 dark:border-slate-700/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs mb-3.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#111827] dark:text-white text-base mb-1">
                {t.benefits.halalFriendly}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                {t.benefits.halalFriendlyDesc}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/70 p-5 border border-gray-100 dark:border-slate-700/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs mb-3.5">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#111827] dark:text-white text-base mb-1">
                {t.benefits.concierge}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">
                {t.benefits.conciergeDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Russia E-Visa & Travel Guide */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-[#151C28] p-6 sm:p-10 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D48]/10 text-[#E11D48] font-bold">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#111827] dark:text-white">
                {lang === 'ar' ? 'دليل التأشيرة الإلكترونية والسفر لروسيا (E-Visa Guide)' : 'Russian Electronic Visa & Travel Guide for GCC Citizens'}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-slate-400">
                {lang === 'ar' ? 'كل ما تحتاج معرفته للسفر بسلاسة من الرياض، دبي، الدوحة، الكويت، المنامة ومسقط' : 'Essential travel insights for passengers flying from GCC gateways'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm">
            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/50 p-5 border border-gray-100 dark:border-slate-700/50 space-y-2.5">
              <h4 className="font-bold text-[#111827] dark:text-white text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E11D48]" />
                <span>{lang === 'ar' ? 'متطلبات التأشيرة الروسية الإلكترونية' : 'Electronic Visa Requirements'}</span>
              </h4>
              <ul className="space-y-2 text-[#6B7280] dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'متاحة إلكترونياً لمواطني دول الخليج (السعودية، الإمارات، الكويت، قطر، البحرين، عمان)' : 'Available 100% online for GCC passport holders'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'تصدر خلال 4 أيام عمل فقط وصالحة للإقامة حتى 16 يوماً' : 'Issued within 4 calendar days, valid for stays up to 16 days'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'قسيمة RussiaBooking المعتمدة كافية كإثبات سكن رسمي' : 'RussiaBooking confirmation voucher serves as valid accommodation proof'}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/50 p-5 border border-gray-100 dark:border-slate-700/50 space-y-2.5">
              <h4 className="font-bold text-[#111827] dark:text-white text-sm flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-blue-500" />
                <span>{lang === 'ar' ? 'رحلات الطيران المباشرة والترانزيت' : 'Flight Routes & Direct Connections'}</span>
              </h4>
              <ul className="space-y-2 text-[#6B7280] dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'رحلات مباشرة يومية من دبي، أبوظبي، الشارقة عبر طيران الإمارات، فلاي دبي، والعربية' : 'Multiple daily direct flights from DXB, AUH, SHJ to Moscow and Sochi'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'رحلات مريحة عبر الخطوط التركية، طيران الخليج والقطرية' : 'Seamless 1-stop connections from Riyadh, Jeddah, Doha, Kuwait City'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'مطارات موسكو (Sheremetyevo SVO, Domodedovo DME, Vnukovo VKO)' : 'Modern international terminals with luxury fast-track services'}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/50 p-5 border border-gray-100 dark:border-slate-700/50 space-y-2.5">
              <h4 className="font-bold text-[#111827] dark:text-white text-sm flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span>{lang === 'ar' ? 'الاتصالات والإنترنت والعملة' : 'Connectivity, SIMs & Currency'}</span>
              </h4>
              <ul className="space-y-2 text-[#6B7280] dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'تتوفر شرائح eSIM الروسية (MTS, Megafon, Beeline) فور وصولك' : 'Local 5G eSIMs easily activated upon arrival at airports'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'يمكن صرف الريال والدولار في مطارات وفنادق روسيا بسهولة' : 'Currency exchange available widely for SAR, AED, and USD to RUB'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{lang === 'ar' ? 'تطبيقات التاكسي الروسية (Yandex Go) توفر تنقلات مريحة بأسعار ممتازة' : 'Yandex Go ride-hailing works efficiently across all major cities'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
