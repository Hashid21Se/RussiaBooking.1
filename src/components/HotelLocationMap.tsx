import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Compass, 
  Navigation, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Utensils, 
  ShoppingBag, 
  Landmark, 
  Building, 
  Building2, 
  Footprints, 
  Car, 
  Train, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { Hotel, SupportedCurrency } from '../types';
import { Language } from '../lib/i18n';

export type POICategory = 'all' | 'mosque' | 'halal' | 'shopping' | 'landmark' | 'embassy' | 'transit';

export interface GCCPointOfInterest {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'mosque' | 'halal' | 'shopping' | 'landmark' | 'embassy' | 'transit';
  lat: number;
  lng: number;
  descriptionEn: string;
  descriptionAr: string;
  highlightEn?: string;
  highlightAr?: string;
  addressEn?: string;
  addressAr?: string;
}

interface HotelLocationMapProps {
  hotel: Hotel;
  lang: Language;
  currency?: SupportedCurrency;
  className?: string;
}

// Earth distance calculation using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate precise Qibla bearing from hotel coordinates to Mecca (21.4225° N, 39.8262° E)
function calculateQiblaBearing(lat: number, lng: number): number {
  const meccaLat = 21.422487;
  const meccaLng = 39.826206;
  const phiK = (meccaLat * Math.PI) / 180;
  const lambdaK = (meccaLng * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const psi =
    (180 / Math.PI) *
    Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    );
  return Math.round((psi + 360) % 360);
}

// Get standard compass cardinal direction from degrees
function getCardinalDirection(deg: number, lang: Language): string {
  const directionsEn = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const directionsAr = ['شمال', 'شمال-شمال-شرق', 'شمال-شرق', 'شرق-شمال-شرق', 'شرق', 'شرق-جنوب-شرق', 'جنوب-شرق', 'جنوب-جنوب-شرق', 'جنوب', 'جنوب-جنوب-غرب', 'جنوب-غرب', 'غرب-جنوب-غرب', 'غرب', 'غرب-شمال-غرب', 'شمال-غرب', 'شمال-شمال-غرب'];
  const index = Math.round(deg / 22.5) % 16;
  return lang === 'ar' ? directionsAr[index] : directionsEn[index];
}

// Curated POI database for GCC travelers in Russian destinations
const DESTINATION_POIS: Record<string, GCCPointOfInterest[]> = {
  moscow: [
    {
      id: 'poi-moscow-cathedral-mosque',
      nameEn: 'Moscow Cathedral Mosque (Juma)',
      nameAr: 'المسجد الجامع الكبير في موسكو',
      category: 'mosque',
      lat: 55.7794,
      lng: 37.6267,
      descriptionEn: 'The principal mosque of Moscow, hosting up to 10,000 worshippers. Features stunning turquoise domes, Halal dining, and Islamic cultural exhibitions.',
      descriptionAr: 'المسجد الرئيسي في موسكو، يتسع لـ 10,000 مصلٍ. يتميز بقبابه الفيروزية المذهبة، ومطعم حلال، ومكتبة إسلامية كبرى.',
      highlightEn: 'Friday Jummah Prayers • Certified Halal Cafe',
      highlightAr: 'صلاة الجمعة • كافيه ومطعم حلال معتمد',
      addressEn: 'Vypolzov Pereulok 7, Moscow',
      addressAr: 'زقاق فيبولزوف 7، موسكو'
    },
    {
      id: 'poi-moscow-historic-mosque',
      nameEn: 'Historical Mosque of Moscow',
      nameAr: 'مسجد موسكو التاريخي (حي تاتارسكايا)',
      category: 'mosque',
      lat: 55.7383,
      lng: 37.6339,
      descriptionEn: 'Moscow’s oldest surviving mosque founded in 1823 in the historic Tatar quarter, renowned for its serene spiritual atmosphere.',
      descriptionAr: 'أقدم مسجد قائم في موسكو أُسس عام 1823 في حي التتار التاريخي، يتميز بأجواء روحانية هادئة.',
      highlightEn: 'Historic Landmark • Daily Congregation',
      highlightAr: 'معلم تاريخي • صلوات يومية ومصلى للنساء',
      addressEn: 'Bolshaya Tatarskaya St, 28, Moscow',
      addressAr: 'شارع بولشايا تاتارسكايا 28، موسكو'
    },
    {
      id: 'poi-moscow-uzbekistan',
      nameEn: 'Uzbekistan Luxury Halal Restaurant',
      nameAr: 'مطعم أوزبكستان الفاخر (حلال)',
      category: 'halal',
      lat: 55.7667,
      lng: 37.6214,
      descriptionEn: 'Legendary dining institution since 1951 serving authentic Uzbek and Arabic Silk Road delicacies with 100% Halal lamb, beef, and warm hospitality.',
      descriptionAr: 'أعرق مطعم شرقي فاخر منذ 1951 يقدم أشهى مأكولات طريق الحرير ولحم حلال 100% مع جلسات عائلية خاصة.',
      highlightEn: '100% Halal Certified • Family Seating',
      highlightAr: 'لحوم حلال معتمدة • جلسات عائلية مريحة',
      addressEn: 'Neglinnaya St, 29, Moscow',
      addressAr: 'شارع نيغلينيا 29، موسكو'
    },
    {
      id: 'poi-moscow-taj-mahal',
      nameEn: 'Taj Mahal Arabic & Mughlai Lounge',
      nameAr: 'لاونج تاج محل للأطباق العربية والشرقية',
      category: 'halal',
      lat: 55.7525,
      lng: 37.5925,
      descriptionEn: 'Highly popular with Gulf visitors near Arbat, offering authentic biryanis, grilled meats, shawarma platters, and Arabic tea service.',
      descriptionAr: 'وجهة مفضلة للمسافرين الخليجيين قرب شارع أربات، يقدم برياني، مشاوي مشكلة، وشاي عربي مع خيارات حلال كاملة.',
      highlightEn: 'Halal Meat • Arabic Speaking Staff',
      highlightAr: 'مأكولات حلال • طاقم يتحدث العربية',
      addressEn: 'Arbat St, 6/2, Moscow',
      addressAr: 'شارع أربات 6/2، موسكو'
    },
    {
      id: 'poi-moscow-gum',
      nameEn: 'GUM Luxury Department Store',
      nameAr: 'مركز غوم للتسوق الفاخر (الساحة الحمراء)',
      category: 'shopping',
      lat: 55.7547,
      lng: 37.6216,
      descriptionEn: 'The historic world-famous department store overlooking Red Square, housing flagship luxury fashion boutiques, gourmet halls, and Tax-Free desks.',
      descriptionAr: 'أشهر مجمع تجاري فاخر يطل على الساحة الحمراء مباشرة، يضم كبرى بيوت الأزياء العالمية وخدمة استرداد الضريبة Tax-Free.',
      highlightEn: 'Luxury Boutiques • Tax-Free Desk',
      highlightAr: 'أرقى الماركات • مكتب استرداد الضريبة',
      addressEn: 'Red Square, 3, Moscow',
      addressAr: 'الساحة الحمراء 3، موسكو'
    },
    {
      id: 'poi-moscow-tsum',
      nameEn: 'TSUM Department Store',
      nameAr: 'متجر تسوم للموضة الراقية',
      category: 'shopping',
      lat: 55.7600,
      lng: 37.6200,
      descriptionEn: 'Eastern Europe’s leading multi-brand luxury department store located next to the Bolshoi Theatre, featuring over 1,000 designer labels.',
      descriptionAr: 'الوجهة الأولى للموضة الفاخرة في أوروبا الشرقية بجوار مسرح البولشوي، يضم أكثر من 1,000 علامة تجارية عالمية.',
      highlightEn: 'High-End Fashion • VIP Concierge',
      highlightAr: 'أزياء عالمية حصرية • خدمة كونسيرج VIP',
      addressEn: 'Petrovka St, 2, Moscow',
      addressAr: 'شارع بتروفكا 2، موسكو'
    },
    {
      id: 'poi-moscow-red-square',
      nameEn: 'Red Square & Saint Basil’s Cathedral',
      nameAr: 'الساحة الحمراء وكاتدرائية القديس باسيل',
      category: 'landmark',
      lat: 55.7525,
      lng: 37.6231,
      descriptionEn: 'The cultural and historic epicentre of Russia, paved with cobblestones and surrounded by the Kremlin, State Historical Museum, and iconic domes.',
      descriptionAr: 'قلب روسيا التاريخي والثقافي النابض، محاط بجدران الكرملين ومتحف الدولة التاريخي والقباب الملونة الشهيرة عالمياً.',
      highlightEn: 'UNESCO World Heritage • Iconic Sights',
      highlightAr: 'موقع تراث عالمي لليونسكو • صور تذكارية أيقونية',
      addressEn: 'Red Square, Moscow',
      addressAr: 'الساحة الحمراء، موسكو'
    },
    {
      id: 'poi-moscow-kremlin',
      nameEn: 'The Moscow Kremlin & Diamond Fund',
      nameAr: 'كرملين موسكو وصندوق الماس والأسلحة',
      category: 'landmark',
      lat: 55.7505,
      lng: 37.6175,
      descriptionEn: 'The fortified heart of Russian history, housing the imperial Armory Chamber, royal carriages, Faberge eggs, and the Diamond Treasury.',
      descriptionAr: 'الحصن الإمبراطوري الأبرز لروسيا، يضم غرفة أسلحة القياصرة والعربات الملكية وكنوز صندوق الماس الإمبراطوري النادر.',
      highlightEn: 'Imperial Treasury • Royal Museums',
      highlightAr: 'المتاحف الملكية • مجوهرات القياصرة النادرة',
      addressEn: 'Kremlin, Moscow',
      addressAr: 'الكرملين، موسكو'
    },
    {
      id: 'poi-moscow-saudi-embassy',
      nameEn: 'Royal Embassy of Saudi Arabia',
      nameAr: 'سفارة المملكة العربية السعودية في موسكو',
      category: 'embassy',
      lat: 55.7397,
      lng: 37.6433,
      descriptionEn: 'Diplomatic mission and consular services for Saudi citizens visiting the Russian Federation, offering 24/7 citizen emergency assistance.',
      descriptionAr: 'البعثة الدبلوماسية والقنصلية الرسمية لرعاية شؤون المواطنين السعوديين وخدمات الطوارئ على مدار 24 ساعة.',
      highlightEn: 'Consular Services • 24/7 Emergency',
      highlightAr: 'خدمات المواطنين القنصلية • طوارئ 24/7',
      addressEn: '3rd Neopalimovsky Pereulok 3, Moscow',
      addressAr: 'زقاق نيباليموفسكي الثالث 3، موسكو'
    },
    {
      id: 'poi-moscow-uae-embassy',
      nameEn: 'Embassy of the United Arab Emirates',
      nameAr: 'سفارة دولة الإمارات العربية المتحدة في موسكو',
      category: 'embassy',
      lat: 55.7197,
      lng: 37.5256,
      descriptionEn: 'Embassy of the UAE providing consular protection, tourist documentation assistance, and diplomatic services for Emirati travelers.',
      descriptionAr: 'سفارة دولة الإمارات لتقديم الدعم القنصلي والمساعدة للمسافرين الإماراتيين في موسكو.',
      highlightEn: 'UAE Consular Section • Diplomatic Hub',
      highlightAr: 'القسم القنصلي الإماراتي • دعم المسافرين',
      addressEn: 'Ulofa Pal’me St, 4, Moscow',
      addressAr: 'شارع أولوف بالمه 4، موسكو'
    },
    {
      id: 'poi-moscow-qatar-embassy',
      nameEn: 'Embassy of the State of Qatar',
      nameAr: 'سفارة دولة قطر في موسكو',
      category: 'embassy',
      lat: 55.7208,
      lng: 37.5144,
      descriptionEn: 'Qatari diplomatic mission assisting Qatari citizens and families traveling in Russia with emergency support and travel logistics.',
      descriptionAr: 'البعثة الدبلوماسية القطرية في موسكو لخدمة ودعم المواطنين والأسر القطرية أثناء إقامتهم في روسيا.',
      highlightEn: 'Qatari Citizen Care • Consular Services',
      highlightAr: 'رعاية المواطنين القطريين • خدمات قنصلية',
      addressEn: 'Korobeinikov Pereulok 24, Moscow',
      addressAr: 'زقاق كوربينيكوف 24، موسكو'
    },
    {
      id: 'poi-moscow-metro-okhotny',
      nameEn: 'Okhotny Ryad Central Metro Station',
      nameAr: 'محطة مترو أوخوتني رياد المركزية',
      category: 'transit',
      lat: 55.7575,
      lng: 37.6167,
      descriptionEn: 'Major red line metro interchange station providing direct non-stop transit across Moscow’s iconic underground palace network.',
      descriptionAr: 'محطة مترو رئيسية على الخط الأحمر توفر وصولاً سريعاً لكافة أرجاء العاصمة الروسية بتكلفة رمزية وتصميم معماري كالقصر.',
      highlightEn: 'Direct Red Line • Central Hub',
      highlightAr: 'الخط الأحمر المباشر • انتقال سريع وفوري',
      addressEn: 'Manezhnaya Square, Moscow',
      addressAr: 'ساحة مانيج، موسكو'
    },
    {
      id: 'poi-moscow-aeroexpress',
      nameEn: 'Belorussky Aeroexpress Airport Train',
      nameAr: 'محطة قطار إيروبريس السريع لمطار شيريميتيفو',
      category: 'transit',
      lat: 55.7767,
      lng: 37.5819,
      descriptionEn: 'High-speed nonstop electric train connecting central Moscow directly to Sheremetyevo International Airport (SVO) in just 35 minutes.',
      descriptionAr: 'قطار سريع ينطلق كل 30 دقيقة ويربط وسط العاصمة بمطار شيريميتيفو الدولي (SVO) مباشرة خلال 35 دقيقة دون زحام.',
      highlightEn: '35-min to Airport • Free Wi-Fi on Board',
      highlightAr: '35 دقيقة للمطار • واي فاي مجاني بالقطار',
      addressEn: 'Ploshchad Tverskaya Zastava 7, Moscow',
      addressAr: 'ساحة تفيرسكايا زاستافا 7، موسكو'
    }
  ],

  'saint petersburg': [
    {
      id: 'poi-spb-grand-mosque',
      nameEn: 'Saint Petersburg Grand Mosque (Blue Mosque)',
      nameAr: 'مسجد سانت بطرسبرغ الكبير (المسجد الأزرق)',
      category: 'mosque',
      lat: 59.9553,
      lng: 30.3239,
      descriptionEn: 'A breathtaking architectural masterpiece built in 1913 with turquoise mosaic minarets modeled after Gur-e-Amir in Samarkand, welcoming 5,000 worshippers.',
      descriptionAr: 'تحفة معمارية إسلامية شُيدت عام 1913 بمآذن فيروزية مستوحاة من ضريح تيمورلنك في سمرقند، يتسع لـ 5,000 مصلٍ.',
      highlightEn: 'Friday Congregational Prayers • Women Prayer Hall',
      highlightAr: 'صلاة الجمعة الكبرى • مصلى خاص للنساء',
      addressEn: 'Kronverkskiy Prospekt 7, St. Petersburg',
      addressAr: 'كرونفيركسكي بروسبكت 7، سانت بطرسبرغ'
    },
    {
      id: 'poi-spb-baku',
      nameEn: 'Baku Halal Fine Dining',
      nameAr: 'مطعم باكو الفاخر (مأكولات حلال)',
      category: 'halal',
      lat: 59.9310,
      lng: 30.3550,
      descriptionEn: 'Premier Eastern restaurant on Sadovaya offering authentic Azerbaijani, Levantine, and Caucasian grilled meats prepared according to Halal standards.',
      descriptionAr: 'أرقى مطعم شرقي على شارع سادوفايا يقدم مشاوي أذربيجانية وشامية وفق معايير الحلال الصارمة مع ضيافة متميزة.',
      highlightEn: 'Certified Halal Meat • Arabic Tea & Baklava',
      highlightAr: 'لحوم حلال معتمدة • شاي تركي وحلويات شرقية',
      addressEn: 'Sadovaya St, 12, St. Petersburg',
      addressAr: 'شارع سادوفايا 12، سانت بطرسبرغ'
    },
    {
      id: 'poi-spb-galeria',
      nameEn: 'Galeria Shopping Mall',
      nameAr: 'مركز غاليريا للتسوق والترفيه',
      category: 'shopping',
      lat: 59.9278,
      lng: 30.3603,
      descriptionEn: 'The largest and most popular luxury shopping center in central St. Petersburg next to Moskovsky Station, with 300+ international fashion stores.',
      descriptionAr: 'أكبر وأحدث مجمع تسوق في وسط المدينة بجوار محطة موسكوفسكي، يضم أكثر من 300 متجر عالمي ومطاعم متنوعة.',
      highlightEn: '300+ Global Brands • Tax-Free Desk',
      highlightAr: 'أكثر من 300 متجر • استرداد الضريبة السياحية',
      addressEn: 'Ligovsky Ave, 30A, St. Petersburg',
      addressAr: 'شارع ليغوفسكي 30A، سانت بطرسبرغ'
    },
    {
      id: 'poi-spb-hermitage',
      nameEn: 'The State Hermitage Museum & Winter Palace',
      nameAr: 'متحف الإرميتاج وقصر الشتاء الإمبراطوري',
      category: 'landmark',
      lat: 59.9398,
      lng: 30.3146,
      descriptionEn: 'One of the world’s greatest museums, occupying the lavish Winter Palace of the Russian Czars with over 3 million masterpieces and imperial state rooms.',
      descriptionAr: 'أحد أعظم متاحف الفنون في العالم، يقع داخل قصر الشتاء الفخم لأباطرة روسيا ويضم أكثر من 3 ملايين قطعة فنية تاريخية.',
      highlightEn: 'Imperial State Rooms • UNESCO Site',
      highlightAr: 'قاعات القياصرة الذهبية • معلم اليونسكو العالمي',
      addressEn: 'Palace Square, 2, St. Petersburg',
      addressAr: 'ساحة القصر 2، سانت بطرسبرغ'
    },
    {
      id: 'poi-spb-metro',
      nameEn: 'Nevsky Prospekt Central Metro',
      nameAr: 'محطة مترو نيفسكي بروسبكت',
      category: 'transit',
      lat: 59.9356,
      lng: 30.3297,
      descriptionEn: 'Central metro hub located directly on Saint Petersburg’s main boulevard, connecting easily to the airport express bus and suburban palaces.',
      descriptionAr: 'المحطة المركزية على الجادة الرئيسية لسانت بطرسبرغ للوصول السريع لمحطات القطار وقصور الضواحي الإمبراطورية.',
      highlightEn: 'Central Boulevard • Airport Bus Link',
      highlightAr: 'قلب المدينة • خطوط حافلات المطار المباشرة',
      addressEn: 'Nevsky Prospekt, St. Petersburg',
      addressAr: 'شارع نيفسكي بروسبكت، سانت بطرسبرغ'
    }
  ],

  sochi: [
    {
      id: 'poi-sochi-mosque',
      nameEn: 'Sochi Central Community Mosque',
      nameAr: 'جامع سوتشي المركزي والمركز الإسلامي',
      category: 'mosque',
      lat: 43.6010,
      lng: 39.7340,
      descriptionEn: 'The main gathering place for Muslims in the Sochi resort region, offering daily and Friday prayers, Quran classes, and community halal assistance.',
      descriptionAr: 'المسجد والمركز الإسلامي الرئيسي في منتجع سوتشي، تقام فيه الصلوات الخمس والجمعة مع تقديم إرشادات للمسافرين المسلمين.',
      highlightEn: 'Friday Prayers • Halal Info Desk',
      highlightAr: 'صلاة الجمعة • إرشاد سياحي للمسافرين المسلمين',
      addressEn: 'Dagomysskaya St, Sochi',
      addressAr: 'شارع داغوميسكايا، سوتشي'
    },
    {
      id: 'poi-sochi-marina',
      nameEn: 'Sochi Grand Marina & Luxury Gallery',
      nameAr: 'مارينا سوتشي لليخوت وممشى التسوق الفاخر',
      category: 'shopping',
      lat: 43.5794,
      lng: 39.7180,
      descriptionEn: 'Stunning seaside promenade lined with mega-yachts, waterfront luxury boutiques, open-air seafood restaurants, and sunset cafes.',
      descriptionAr: 'ممشى بحري ساحر يطل على اليخوت الفاخرة ويضم متاجر راقية ومطاعم مأكولات بحرية طازجة وإطلالات غروب استثنائية.',
      highlightEn: 'Yacht Charters • Seaside Dining',
      highlightAr: 'رحلات يخوت خاصة • مطاعم بحرية بإطلالة خلابة',
      addressEn: 'Voykova St, 1, Sochi',
      addressAr: 'شارع فويكوفا 1، سوتشي'
    },
    {
      id: 'poi-sochi-olympic-park',
      nameEn: 'Sochi Olympic Park & Singing Fountain',
      nameAr: 'الحديقة الأولمبية والنافورة الراقصة بسوتشي',
      category: 'landmark',
      lat: 43.4020,
      lng: 39.9553,
      descriptionEn: 'The site of the 2014 Winter Games featuring the Fisht Olympic Stadium, Formula 1 Sochi Autodrom, and the grand nightly musical singing fountain show.',
      descriptionAr: 'موقع دورة الألعاب الأولمبية الشتوية 2014، يضم استاد فيشت وحلبة فورمولا 1 وعروض النوافير الراقصة الموسيقية المسائية.',
      highlightEn: 'Nightly Water Show • Formula 1 Track',
      highlightAr: 'عروض النوافير الموسيقية • مضمار فورمولا 1',
      addressEn: 'Olympic Ave, Sirius, Sochi',
      addressAr: 'شارع أولمبيك أفينيو، سيريوس، سوتشي'
    },
    {
      id: 'poi-sochi-rosa-khutor',
      nameEn: 'Rosa Khutor Alpine Peak & Cable Cars',
      nameAr: 'منتجع روزا خوتور وتلفريك القمم الجبلية',
      category: 'landmark',
      lat: 43.6710,
      lng: 40.2970,
      descriptionEn: 'World-class mountain resort featuring modern cable cars ascending to 2,320m with snow peaks, alpine hiking, family activities, and fresh mountain air.',
      descriptionAr: 'منتجع جبلي عالمي يضم أطول شبكة تلفريك حديثة تصعد لارتفاع 2,320 متراً مع ثلوج، ومطاعم جبلية، وأنشطة ترفيهية للأسر.',
      highlightEn: '2,320m Mountain Peak • Cable Car Views',
      highlightAr: 'ارتفاع 2,320 م • تلفريك وإطلالات بانورامية',
      addressEn: 'Rosa Khutor, Krasnaya Polyana, Sochi',
      addressAr: 'روزا خوتور، كراسنايا بوليانا، سوتشي'
    }
  ],

  kazan: [
    {
      id: 'poi-kazan-kul-sharif',
      nameEn: 'Kul Sharif Mosque (Kazan Kremlin)',
      nameAr: 'جامع قول شريف التاريخي (كرملين قازان)',
      category: 'mosque',
      lat: 55.7983,
      lng: 49.1052,
      descriptionEn: 'One of the largest and most magnificent mosques in Russia and Europe, situated inside the Kazan Kremlin with turquoise domes and Museum of Islamic Culture.',
      descriptionAr: 'أحد أكبر وأروع المساجد في روسيا وأوروبا، يقع داخل كرملين قازان بقبابه الفيروزية المذهلة ويضم متحف الثقافة الإسلامية.',
      highlightEn: 'Islamic Culture Museum • UNESCO Kremlin',
      highlightAr: 'متحف الثقافة الإسلامية • صلوات منتظمة وجمعة',
      addressEn: 'Kazan Kremlin, Kazan',
      addressAr: 'كرملين قازان، قازان'
    },
    {
      id: 'poi-kazan-marjani',
      nameEn: 'Al-Marjani Historic Mosque',
      nameAr: 'جامع المرجاني التاريخي (حي التتار)',
      category: 'mosque',
      lat: 55.7797,
      lng: 49.1175,
      descriptionEn: 'Built in 1767 by permission of Catherine the Great, this historic mosque has never closed its doors for prayer through centuries of Russian history.',
      descriptionAr: 'شُيد عام 1767 بإذن من الإمبراطورة كاترين العظمى، وظل مفتوحاً لإقامة الصلوات دون انقطاع عبر القرون في قلب حي التتار.',
      highlightEn: 'Never Closed Since 1767 • Tatar Heritage',
      highlightAr: 'أعرق مسجد قائم • تراث تتاري أصيل',
      addressEn: 'Kayum Nasyri St, 17, Kazan',
      addressAr: 'شارع كايوم ناصري 17، قازان'
    },
    {
      id: 'poi-kazan-tugan',
      nameEn: 'Tugan Avylym Halal Tatar Village',
      nameAr: 'قرية توغان أفيلم للمأكولات التتارية الحلال',
      category: 'halal',
      lat: 55.7770,
      lng: 49.1410,
      descriptionEn: 'Traditional wooden ethnic village complex featuring authentic certified Halal restaurants, handmade Tatar pastries, samovars, and artisan shops.',
      descriptionAr: 'مجمع قروي تراثي رائع يضم مطاعم حلال معتمدة تقدم الفطائر التتارية والمشاوي والشاي بالشمع وأجواء عائلية ممتعة.',
      highlightEn: '100% Halal Village • Family Activities',
      highlightAr: 'قرية حلال متكاملة • ألعاب للأطفال وحرف يدوية',
      addressEn: 'Tufan Minnullin St, 14/56, Kazan',
      addressAr: 'شارع طوفان مينولين 14/56، قازان'
    },
    {
      id: 'poi-kazan-mall',
      nameEn: 'Kazan Mall Shopping Center',
      nameAr: 'مركز كازان مول للتسوق الحديث',
      category: 'shopping',
      lat: 55.7730,
      lng: 49.1350,
      descriptionEn: 'The most modern shopping mall in Tatarstan with open rooftop terraces, international fashion brands, family entertainment, and Halal food courts.',
      descriptionAr: 'أحدث مجمع تجاري في تتارستان مع حدائق معلقة على السطح، متاجر أزياء عالمية، وردهة مطاعم تضم خيارات حلال واسعة.',
      highlightEn: 'Rooftop Terraces • Halal Food Court',
      highlightAr: 'حدائق بانورامية على السطح • ردهة طعام حلال',
      addressEn: 'Pavlyukhina St, 91, Kazan',
      addressAr: 'شارع بافليوخينا 91، قازان'
    }
  ],

  murmansk: [
    {
      id: 'poi-murmansk-mosque',
      nameEn: 'Nord Mosque (World’s Northernmost Mosque)',
      nameAr: 'مسجد الشمال (أقصى مسجد في شمال العالم)',
      category: 'mosque',
      lat: 68.9620,
      lng: 33.0950,
      descriptionEn: 'The northernmost Muslim prayer house in the world beyond the Arctic Circle, welcoming traveling Muslims with warm Arctic hospitality and prayers.',
      descriptionAr: 'أقصى بيت صلاة للمسلمين شمال العالم خلف الدائرة القطبية الشمالية، يستقبل المسافرين بحفاوة قطبية لإقامة الصلوات.',
      highlightEn: 'Arctic Circle Mosque • Friday Prayers',
      highlightAr: 'مسجد خلف الدائرة القطبية • صلاة الجمعة',
      addressEn: 'Baumana St, Murmansk',
      addressAr: 'شارع بومانا، مورمانسك'
    },
    {
      id: 'poi-murmansk-icebreaker',
      nameEn: 'Lenin Nuclear Icebreaker Museum',
      nameAr: 'متحف كاسحة الجليد النووية لينين',
      category: 'landmark',
      lat: 68.9750,
      lng: 33.0590,
      descriptionEn: 'The world’s first nuclear-powered surface vessel, now a legendary floating museum showcasing Arctic polar expeditions and nuclear engineering.',
      descriptionAr: 'أول سفينة تعمل بالطاقة النووية في تاريخ البشرية، تحولت لمتحف عائم أسطوري يعرض استكشافات المحيط المتجمد الشمالي.',
      highlightEn: 'Historic Polar Ship • Arctic Port',
      highlightAr: 'سفينة قطبية أسطورية • جولات سياحية موثقة',
      addressEn: 'Portovyy Proyezd 25, Murmansk',
      addressAr: 'بورتوفي برويزد 25، مورمانسك'
    },
    {
      id: 'poi-murmansk-aurora',
      nameEn: 'Aurora Borealis Northern Lights Vantage Point',
      nameAr: 'نقطة رصد أضواء الشفق القطبي الشمالي (الأورورا)',
      category: 'landmark',
      lat: 68.9850,
      lng: 33.1100,
      descriptionEn: 'Top vantage point for observing the ethereal dancing green Aurora Borealis across the Arctic night sky from September through April.',
      descriptionAr: 'أفضل نقطة لمشاهدة رقصات الشفق القطبي الخضراء الساحرة في سماء الليل من شهر سبتمبر حتى أبريل.',
      highlightEn: 'Northern Lights Tour • Prime Dark Sky',
      highlightAr: 'رصد الشفق القطبي • تجربة قطبية لا تُنسى',
      addressEn: 'Leningradskoye Shosse, Murmansk',
      addressAr: 'طريق لينينغرادسكوي السريع، مورمانسك'
    }
  ]
};

export const HotelLocationMap: React.FC<HotelLocationMapProps> = ({
  hotel,
  lang,
  currency = 'SAR',
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<POICategory>('all');
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'dark'>('street');

  // Compute Qibla bearing from hotel coordinates
  const qiblaBearing = useMemo(() => {
    return calculateQiblaBearing(hotel.coordinates.lat, hotel.coordinates.lng);
  }, [hotel.coordinates.lat, hotel.coordinates.lng]);

  const cardinalDir = useMemo(() => {
    return getCardinalDirection(qiblaBearing, lang);
  }, [qiblaBearing, lang]);

  // Determine POIs for this hotel's city, plus dynamic landmarks from hotel object if any
  const destinationKey = (hotel.city || 'moscow').toLowerCase().trim();
  const rawCityPois = DESTINATION_POIS[destinationKey] || DESTINATION_POIS['moscow'];

  // Enrich with calculated distances & times from this specific hotel
  const allPoisWithDistance = useMemo(() => {
    return rawCityPois.map((poi) => {
      const distKm = calculateDistanceKm(
        hotel.coordinates.lat,
        hotel.coordinates.lng,
        poi.lat,
        poi.lng
      );
      // Average walking speed 4.5 km/h
      const walkMinutes = Math.max(1, Math.round((distKm / 4.5) * 60));
      // Average city drive speed 25 km/h + 2 min buffer
      const driveMinutes = Math.max(2, Math.round((distKm / 25) * 60 + 2));

      return {
        ...poi,
        distanceKm: distKm,
        walkMinutes,
        driveMinutes,
        displayDistance:
          distKm < 1
            ? `${Math.round(distKm * 1000)} ${lang === 'ar' ? 'متر' : 'm'}`
            : `${distKm.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [rawCityPois, hotel.coordinates.lat, hotel.coordinates.lng, lang]);

  // Filtered by selected category
  const filteredPois = useMemo(() => {
    if (selectedCategory === 'all') return allPoisWithDistance;
    return allPoisWithDistance.filter((p) => p.category === selectedCategory);
  }, [allPoisWithDistance, selectedCategory]);

  const selectedPOI = useMemo(() => {
    if (!selectedPOIId) return filteredPois[0] || allPoisWithDistance[0];
    return allPoisWithDistance.find((p) => p.id === selectedPOIId) || filteredPois[0];
  }, [selectedPOIId, allPoisWithDistance, filteredPois]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allPoisWithDistance.length };
    allPoisWithDistance.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allPoisWithDistance]);

  // Map scale & coordinates projection:
  // Convert lat/lng deltas to SVG coordinate box (center at 400, 250)
  const mapSvgPoints = useMemo(() => {
    const centerLat = hotel.coordinates.lat;
    const centerLng = hotel.coordinates.lng;

    // Scaling factor: degrees to SVG pixels
    const latScale = 3800 * zoomLevel;
    const lngScale = (3800 * zoomLevel) * Math.cos((centerLat * Math.PI) / 180);

    return allPoisWithDistance.map((poi) => {
      // Map coordinate projection:
      // X = CenterX + (poi.lng - hotel.lng) * lngScale
      // Y = CenterY - (poi.lat - hotel.lat) * latScale (since SVG Y goes downward)
      const x = 400 + (poi.lng - centerLng) * lngScale;
      const y = 220 - (poi.lat - centerLat) * latScale;
      return {
        ...poi,
        svgX: Math.max(30, Math.min(770, x)),
        svgY: Math.max(30, Math.min(410, y)),
        isWithinView: x >= 20 && x <= 780 && y >= 20 && y <= 420
      };
    });
  }, [allPoisWithDistance, hotel.coordinates.lat, hotel.coordinates.lng, zoomLevel]);

  // Category visual attributes
  const getCategoryTheme = (cat: POICategory) => {
    switch (cat) {
      case 'mosque':
        return {
          icon: Compass,
          labelAr: 'المساجد والمصليات',
          labelEn: 'Mosques & Prayer',
          color: 'emerald',
          bgClass: 'bg-emerald-500',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        };
      case 'halal':
        return {
          icon: Utensils,
          labelAr: 'مطاعم حلال معتمدة',
          labelEn: 'Halal Dining',
          color: 'rose',
          bgClass: 'bg-rose-500',
          badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
      case 'shopping':
        return {
          icon: ShoppingBag,
          labelAr: 'تسوق ومولات فاخرة',
          labelEn: 'Luxury Shopping',
          color: 'purple',
          bgClass: 'bg-purple-500',
          badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800'
        };
      case 'landmark':
        return {
          icon: Landmark,
          labelAr: 'معالم سياحية وثقافية',
          labelEn: 'Sightseeing',
          color: 'amber',
          bgClass: 'bg-amber-500',
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        };
      case 'embassy':
        return {
          icon: ShieldCheck,
          labelAr: 'سفارات دول الخليج',
          labelEn: 'GCC Embassies',
          color: 'teal',
          bgClass: 'bg-teal-600',
          badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800'
        };
      case 'transit':
        return {
          icon: Train,
          labelAr: 'مترو وقطار المطار',
          labelEn: 'Metro & Airport Train',
          color: 'blue',
          bgClass: 'bg-blue-500',
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          icon: MapPin,
          labelAr: 'جميع المعالم',
          labelEn: 'All Highlights',
          color: 'slate',
          bgClass: 'bg-slate-700',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        };
    }
  };

  // Google Maps navigation direction URL
  const getGoogleMapsDirectionsUrl = (poiLat: number, poiLng: number) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${hotel.coordinates.lat},${hotel.coordinates.lng}&destination=${poiLat},${poiLng}&travelmode=walking`;
  };

  // Yandex Maps URL
  const getYandexMapsUrl = (poiLat: number, poiLng: number) => {
    return `https://yandex.com/maps/?rtext=${hotel.coordinates.lat},${hotel.coordinates.lng}~${poiLat},${poiLng}&rtt=pd`;
  };

  return (
    <div className={`space-y-6 ${className}`} id="hotel-interactive-map-section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {lang === 'ar' ? 'الخريطة التفاعلية ودليل المسافر الخليجي' : 'Interactive Map & GCC Guide'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            {lang === 'ar' ? 'موقع الفندق وأبرز المعالم القريبة' : 'Hotel Location & Nearby Highlights'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? `إحداثيات دقيقة (${hotel.coordinates.lat.toFixed(4)}, ${hotel.coordinates.lng.toFixed(4)}) مع المساجد، المطاعم الحلال، مراكز التسوق الفاخرة، والسفارات.`
              : `Exact GPS (${hotel.coordinates.lat.toFixed(4)}, ${hotel.coordinates.lng.toFixed(4)}) with nearby Mosques, Halal dining, luxury malls, and GCC embassies.`}
          </p>
        </div>

        {/* Qibla Direction Badge Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-2.5 shrink-0 shadow-xs">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Navigation 
              className="w-5 h-5 transition-transform duration-500" 
              style={{ transform: `rotate(${qiblaBearing}deg)` }}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <span>{lang === 'ar' ? 'اتجاه القبلة الشريفة' : 'Qibla Direction'}</span>
              <span className="font-mono text-xs font-extrabold text-emerald-900 dark:text-emerald-200">{qiblaBearing}°</span>
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
              {lang === 'ar' ? `نحو مكة المكرمة (${cardinalDir})` : `Towards Makkah (${cardinalDir})`}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          id="poi-filter-all"
          onClick={() => { setSelectedCategory('all'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedCategory === 'all' 
              ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {categoryCounts.all}
          </span>
        </button>

        <button
          id="poi-filter-mosque"
          onClick={() => { setSelectedCategory('mosque'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'mosque'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-emerald-500" />
          <span>{lang === 'ar' ? 'المساجد' : 'Mosques'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {categoryCounts.mosque || 0}
          </span>
        </button>

        <button
          id="poi-filter-halal"
          onClick={() => { setSelectedCategory('halal'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'halal'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-rose-500" />
          <span>{lang === 'ar' ? 'مطاعم حلال' : 'Halal Food'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            {categoryCounts.halal || 0}
          </span>
        </button>

        <button
          id="poi-filter-shopping"
          onClick={() => { setSelectedCategory('shopping'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'shopping'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
          <span>{lang === 'ar' ? 'تسوق فاخر' : 'Shopping'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            {categoryCounts.shopping || 0}
          </span>
        </button>

        <button
          id="poi-filter-landmark"
          onClick={() => { setSelectedCategory('landmark'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'landmark'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ar' ? 'معالم سياحية' : 'Landmarks'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
            {categoryCounts.landmark || 0}
          </span>
        </button>

        <button
          id="poi-filter-embassy"
          onClick={() => { setSelectedCategory('embassy'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'embassy'
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>{lang === 'ar' ? 'السفارات الخليجية' : 'GCC Embassies'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
            {categoryCounts.embassy || 0}
          </span>
        </button>

        <button
          id="poi-filter-transit"
          onClick={() => { setSelectedCategory('transit'); setSelectedPOIId(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'transit'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Train className="w-3.5 h-3.5 text-blue-500" />
          <span>{lang === 'ar' ? 'مترو وقطار المطار' : 'Transit & Airport'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {categoryCounts.transit || 0}
          </span>
        </button>
      </div>

      {/* Main Interactive Map Container */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Top interactive action toolbar over the map */}
        <div className="absolute top-4 start-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
            <button
              id="map-zoom-in-btn"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom In"
              aria-label="Zoom in map"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              id="map-zoom-out-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom Out"
              aria-label="Zoom out map"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              id="map-reset-btn"
              onClick={() => { setZoomLevel(1); setSelectedPOIId(null); }}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[11px] font-bold"
              title="Recenter Map on Hotel"
              aria-label="Recenter on hotel"
            >
              {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
            </button>
          </div>

          <button
            id="map-theme-toggle-btn"
            onClick={() => setMapStyle((s) => (s === 'street' ? 'dark' : 'street'))}
            className="flex items-center gap-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Map Style"
          >
            <span>{mapStyle === 'street' ? (lang === 'ar' ? 'عرض داكن' : 'Night Mode') : (lang === 'ar' ? 'عرض الشوارع' : 'Street Mode')}</span>
          </button>
        </div>

        {/* Live coordinate readout chip */}
        <div className="absolute top-4 end-4 z-20 hidden sm:flex items-center gap-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{hotel.coordinates.lat.toFixed(5)}° N, {hotel.coordinates.lng.toFixed(5)}° E</span>
        </div>

        {/* SVG Map Canvas */}
        <div className={`relative h-[380px] sm:h-[450px] w-full select-none overflow-hidden transition-colors ${
          mapStyle === 'street' 
            ? 'bg-[#EBF1F6] dark:bg-[#131A24]' 
            : 'bg-[#0E131B]'
        }`}>
          <svg 
            className="w-full h-full" 
            viewBox="0 0 800 440" 
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Radial gradient for hotel marker pulse */}
              <radialGradient id="hotelPulseGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
              </radialGradient>
              {/* Pattern for city street grid lines */}
              <pattern id="streetGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke={mapStyle === 'street' ? 'rgba(203, 213, 225, 0.45)' : 'rgba(30, 41, 59, 0.5)'} 
                  strokeWidth="1" 
                />
              </pattern>
            </defs>

            {/* Background Grid Pattern simulating streets */}
            <rect width="100%" height="100%" fill="url(#streetGridPattern)" />

            {/* Stylized River Curve (e.g. Moskva River / Neva River) */}
            <path
              d="M 0,260 Q 220,290 400,280 T 800,210"
              fill="none"
              stroke={mapStyle === 'street' ? '#BFDBFE' : '#1E293B'}
              strokeWidth="28"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            <path
              d="M 0,260 Q 220,290 400,280 T 800,210"
              fill="none"
              stroke={mapStyle === 'street' ? '#93C5FD' : '#2563EB'}
              strokeWidth="16"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />

            {/* Secondary Boulevard Arcs */}
            <path
              d="M 80,0 C 200,160 300,320 380,440"
              fill="none"
              stroke={mapStyle === 'street' ? '#CBD5E1' : '#334155'}
              strokeWidth="6"
              strokeDasharray="4 4"
            />
            <path
              d="M 720,0 C 600,180 500,280 430,440"
              fill="none"
              stroke={mapStyle === 'street' ? '#CBD5E1' : '#334155'}
              strokeWidth="6"
              strokeDasharray="4 4"
            />

            {/* Distance circles around hotel (500m, 1km, 2km radius) */}
            <circle
              cx="400"
              cy="220"
              r={60 * zoomLevel}
              fill="none"
              stroke="#E11D48"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.3"
            />
            <circle
              cx="400"
              cy="220"
              r={120 * zoomLevel}
              fill="none"
              stroke="#E11D48"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.2"
            />

            {/* Line connecting hotel to selected POI */}
            {selectedPOI && (() => {
              const matchedPoint = mapSvgPoints.find((p) => p.id === selectedPOI.id);
              if (!matchedPoint) return null;
              return (
                <g>
                  <line
                    x1="400"
                    y1="220"
                    x2={matchedPoint.svgX}
                    y2={matchedPoint.svgY}
                    stroke="#E11D48"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  {/* Distance label midpoint */}
                  <rect
                    x={(400 + matchedPoint.svgX) / 2 - 35}
                    y={(220 + matchedPoint.svgY) / 2 - 12}
                    width="70"
                    height="24"
                    rx="12"
                    fill={mapStyle === 'street' ? '#1E293B' : '#FFFFFF'}
                    className="shadow-sm"
                  />
                  <text
                    x={(400 + matchedPoint.svgX) / 2}
                    y={(220 + matchedPoint.svgY) / 2 + 4}
                    textAnchor="middle"
                    fill={mapStyle === 'street' ? '#FFFFFF' : '#0F172A'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {matchedPoint.displayDistance}
                  </text>
                </g>
              );
            })()}

            {/* Qibla Direction Vector from Hotel */}
            <g transform={`rotate(${qiblaBearing}, 400, 220)`}>
              <line
                x1="400"
                y1="220"
                x2="400"
                y2={220 - 75 * zoomLevel}
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeOpacity="0.7"
              />
              <polygon
                points={`400,${220 - 80 * zoomLevel} 396,${220 - 70 * zoomLevel} 404,${220 - 70 * zoomLevel}`}
                fill="#10B981"
              />
            </g>

            {/* Render POI Pins */}
            {mapSvgPoints
              .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
              .map((poi) => {
                const isSelected = selectedPOI?.id === poi.id;
                const theme = getCategoryTheme(poi.category);

                let pinColor = '#3B82F6';
                if (poi.category === 'mosque') pinColor = '#10B981';
                else if (poi.category === 'halal') pinColor = '#F43F5E';
                else if (poi.category === 'shopping') pinColor = '#A855F7';
                else if (poi.category === 'landmark') pinColor = '#F59E0B';
                else if (poi.category === 'embassy') pinColor = '#0D9488';

                return (
                  <g
                    key={poi.id}
                    id={`map-pin-${poi.id}`}
                    transform={`translate(${poi.svgX}, ${poi.svgY})`}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    onClick={() => setSelectedPOIId(poi.id)}
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r="20"
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.7"
                      />
                    )}

                    {/* Shadow */}
                    <ellipse cx="0" cy="5" rx="7" ry="3" fill="rgba(0,0,0,0.25)" />

                    {/* Pin body */}
                    <circle
                      r={isSelected ? "14" : "11"}
                      fill={pinColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="shadow-md"
                    />

                    {/* Small category badge text */}
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {poi.category === 'mosque' ? '🕌' : poi.category === 'halal' ? '🍽️' : poi.category === 'shopping' ? '🛍️' : poi.category === 'landmark' ? '🏛️' : poi.category === 'embassy' ? '🇸🇦' : '🚇'}
                    </text>

                    {/* Pin Label on hover / selected */}
                    {isSelected && (
                      <g transform="translate(0, -22)">
                        <rect
                          x="-60"
                          y="-16"
                          width="120"
                          height="20"
                          rx="10"
                          fill="rgba(15, 23, 42, 0.95)"
                          stroke="#E11D48"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="-3"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {lang === 'ar' ? poi.nameAr.slice(0, 16) : poi.nameEn.slice(0, 18)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Hotel Anchor Pin (Center 400, 220) */}
            <g id="map-hotel-center-pin" transform="translate(400, 220)" className="cursor-pointer">
              {/* Continuous Pulse Glow */}
              <circle r="36" fill="url(#hotelPulseGrad)" className="animate-pulse" />
              <circle r="18" fill="#E11D48" stroke="#FFFFFF" strokeWidth="3" className="shadow-lg" />
              
              {/* Hotel Star Icon inside pin */}
              <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                ★
              </text>

              {/* Hotel Name Tag Tooltip */}
              <g transform="translate(0, -28)">
                <rect
                  x="-75"
                  y="-18"
                  width="150"
                  height="22"
                  rx="11"
                  fill="#E11D48"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="shadow-md"
                />
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {lang === 'ar' ? hotel.nameAr.slice(0, 20) : hotel.nameEn.slice(0, 22)}
                </text>
              </g>
            </g>
          </svg>

          {/* Floating Selected POI Detail Overlay Card inside map */}
          {selectedPOI && (
            <div className="absolute bottom-3 start-3 end-3 sm:start-4 sm:end-auto sm:max-w-md z-30 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-xl transition-all animate-fadeIn">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${getCategoryTheme(selectedPOI.category).badgeClass}`}>
                      {lang === 'ar' ? getCategoryTheme(selectedPOI.category).labelAr : getCategoryTheme(selectedPOI.category).labelEn}
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {selectedPOI.displayDistance}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {lang === 'ar' ? selectedPOI.nameAr : selectedPOI.nameEn}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {lang === 'ar' ? selectedPOI.descriptionAr : selectedPOI.descriptionEn}
                  </p>
                </div>

                <div className="text-end shrink-0 space-y-1">
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <Footprints className="w-3 h-3 text-amber-500" />
                    <span>{selectedPOI.walkMinutes} {lang === 'ar' ? 'دقيقة مشياً' : 'min walk'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <Car className="w-3 h-3" />
                    <span>{selectedPOI.driveMinutes} {lang === 'ar' ? 'دقيقة بالسيارة' : 'min taxi'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <a
                  href={getGoogleMapsDirectionsUrl(selectedPOI.lat, selectedPOI.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 px-3 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الاتجاهات (خرائط Google)' : 'Directions (Google Maps)'}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href={getYandexMapsUrl(selectedPOI.lat, selectedPOI.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2 px-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  title="Open in Yandex Maps (Popular in Russia)"
                >
                  <span>Yandex</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Nearby GCC Highlights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {lang === 'ar' ? `قائمة الأماكن القريبة (${filteredPois.length})` : `Nearby POI Directory (${filteredPois.length})`}
          </h3>
          <span className="text-xs text-slate-500">
            {lang === 'ar' ? 'مرتبة حسب الأقرب للفندق' : 'Sorted by distance from hotel'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPois.map((poi) => {
            const isSelected = selectedPOI?.id === poi.id;
            const theme = getCategoryTheme(poi.category);
            const CategoryIcon = theme.icon;

            return (
              <div
                key={poi.id}
                onClick={() => setSelectedPOIId(poi.id)}
                className={`group rounded-2xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${theme.badgeClass}`}>
                      <CategoryIcon className="w-3 h-3" />
                      <span>{lang === 'ar' ? theme.labelAr : theme.labelEn}</span>
                    </span>

                    <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {poi.displayDistance}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                    {lang === 'ar' ? poi.nameAr : poi.nameEn}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {lang === 'ar' ? poi.descriptionAr : poi.descriptionEn}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 font-medium">
                    <Footprints className="w-3.5 h-3.5 text-amber-500" />
                    <span>{poi.walkMinutes} {lang === 'ar' ? 'دقيقة مشياً' : 'min walk'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(getGoogleMapsDirectionsUrl(poi.lat, poi.lng), '_blank');
                    }}
                    className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <span>{lang === 'ar' ? 'عرض المسار' : 'Route'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
