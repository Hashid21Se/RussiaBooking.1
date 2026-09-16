import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Booking, Hotel, SupportedCurrency } from '../types';
import { Language, translations } from './i18n';
import { CurrencyService } from './currency';

/**
 * Generates and downloads an official Russian Hotel Accommodation Voucher PDF
 * for offline access by travelers.
 */
export async function downloadBookingVoucherPdf(
  booking: Booking,
  lang: Language = 'ar',
  currency: SupportedCurrency = 'SAR'
): Promise<boolean> {
  const t = translations[lang];
  const hotelName = lang === 'ar' ? (booking.hotelNameAr || booking.hotelNameEn) : booking.hotelNameEn;
  const hotelCity = lang === 'ar' ? (booking.hotelCityAr || booking.hotelCity) : booking.hotelCity;
  const roomName = lang === 'ar' ? (booking.roomNameAr || booking.roomNameEn) : booking.roomNameEn;
  const rateName = lang === 'ar' ? (booking.rateNameAr || booking.rateNameEn) : booking.rateNameEn;
  const primaryGuest = booking.guests?.[0] || {
    fullName: 'Guest Traveler',
    passportNumber: 'N/A',
    nationality: 'Saudi Arabia',
  };

  const visaCode = booking.visaVoucherCode || `VOUCH-RB-${booking.bookingCode.replace(/[^0-9]/g, '') || '2026'}-SA`;
  const formattedPaidPrice = CurrencyService.format(booking.totalPriceRub, booking.currencyPaid || currency, lang);
  const formattedRubPrice = `${booking.totalPriceRub.toLocaleString()} ₽`;
  const qrData = encodeURIComponent(`https://russiabooking.com/vouchers/${booking.bookingCode}`);

  // Create temporary container for pristine A4 voucher rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '794px'; // 96 DPI A4 width ~ 794px
  container.style.minHeight = '1123px'; // A4 height ~ 1123px
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Plus Jakarta Sans", sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.padding = '36px 40px';
  container.style.zIndex = '-9999';
  container.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const qrSvg = `
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <rect x="10" y="10" width="28" height="28" rx="4" fill="#0f172a"/>
      <rect x="15" y="15" width="18" height="18" fill="white"/>
      <rect x="19" y="19" width="10" height="10" fill="#0f172a"/>
      <rect x="62" y="10" width="28" height="28" rx="4" fill="#0f172a"/>
      <rect x="67" y="15" width="18" height="18" fill="white"/>
      <rect x="71" y="19" width="10" height="10" fill="#0f172a"/>
      <rect x="10" y="62" width="28" height="28" rx="4" fill="#0f172a"/>
      <rect x="15" y="67" width="18" height="18" fill="white"/>
      <rect x="19" y="71" width="10" height="10" fill="#0f172a"/>
      <rect x="42" y="12" width="5" height="5" fill="#0f172a"/>
      <rect x="50" y="18" width="6" height="5" fill="#0f172a"/>
      <rect x="44" y="26" width="6" height="6" fill="#0f172a"/>
      <rect x="54" y="32" width="5" height="5" fill="#0f172a"/>
      <rect x="12" y="44" width="6" height="6" fill="#0f172a"/>
      <rect x="22" y="42" width="6" height="6" fill="#0f172a"/>
      <rect x="32" y="46" width="6" height="6" fill="#0f172a"/>
      <rect x="42" y="42" width="16" height="16" rx="2" fill="#d97706"/>
      <rect x="62" y="44" width="6" height="6" fill="#0f172a"/>
      <rect x="72" y="42" width="6" height="6" fill="#0f172a"/>
      <rect x="82" y="48" width="6" height="6" fill="#0f172a"/>
      <rect x="44" y="64" width="6" height="6" fill="#0f172a"/>
      <rect x="54" y="68" width="6" height="6" fill="#0f172a"/>
      <rect x="46" y="78" width="6" height="6" fill="#0f172a"/>
      <rect x="64" y="64" width="6" height="6" fill="#0f172a"/>
      <rect x="76" y="66" width="6" height="6" fill="#0f172a"/>
      <rect x="84" y="74" width="6" height="6" fill="#0f172a"/>
      <rect x="68" y="80" width="8" height="6" fill="#0f172a"/>
      <rect x="80" y="84" width="8" height="6" fill="#0f172a"/>
    </svg>
  `;

  // Build high-fidelity official voucher markup
  container.innerHTML = `
    <div style="border: 2px solid #e2e8f0; border-radius: 20px; padding: 28px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <!-- Official Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
              Russia<span style="color: #d97706;">Booking</span>
            </span>
            <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
              OFFICIAL HOTEL VOUCHER
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600;">
            ГОСТИНИЧНЫЙ ВАУЧЕР / ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${lang === 'ar' ? 'قسيمة إقامة فندقية معتمدة لمتطلبات التأشيرة الروسية الإلكترونية (E-Visa)' : 'Accredited Russian Hotel Accommodation Voucher & Tourism Confirmation'}
          </div>
        </div>

        <div style="text-align: ${lang === 'ar' ? 'left' : 'right'};">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">
            ${lang === 'ar' ? 'رقم الحجز المرجعي' : 'Booking Reference'}
          </div>
          <div style="font-family: monospace; font-size: 20px; font-weight: 900; color: #d97706; margin: 2px 0;">
            ${booking.bookingCode}
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            ${lang === 'ar' ? 'تاريخ الإصدار:' : 'Issued:'} ${new Date(booking.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
        </div>
      </div>

      <!-- Main Hotel & Guest Grid -->
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 24px;">
        <!-- Hotel Info Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
            ${lang === 'ar' ? 'بيانات الفندق المحجوز' : 'Hotel Information'}
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            ${hotelName}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
            📍 ${booking.hotelAddressEn || booking.hotelAddressAr || 'Central District'}, ${hotelCity}, Russian Federation
          </div>
          <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px;">
            <div style="font-size: 12px; font-weight: 700; color: #1e293b;">
              ${roomName}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              ${rateName}
            </div>
          </div>
        </div>

        <!-- Guest Details Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
            ${lang === 'ar' ? 'بيانات النزيل الأساسي' : 'Primary Guest Details'}
          </div>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 3px 0;">${lang === 'ar' ? 'الاسم:' : 'Name:'}</td>
              <td style="font-weight: 700; color: #0f172a; text-align: ${lang === 'ar' ? 'left' : 'right'};">${primaryGuest.fullName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">${lang === 'ar' ? 'رقم الجواز:' : 'Passport:'}</td>
              <td style="font-family: monospace; font-weight: 700; color: #0f172a; text-align: ${lang === 'ar' ? 'left' : 'right'};">${primaryGuest.passportNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">${lang === 'ar' ? 'الجنسية:' : 'Nationality:'}</td>
              <td style="font-weight: 700; color: #0f172a; text-align: ${lang === 'ar' ? 'left' : 'right'};">${primaryGuest.nationality || 'Saudi Arabia'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">${lang === 'ar' ? 'عدد النزلاء:' : 'Guests:'}</td>
              <td style="font-weight: 700; color: #0f172a; text-align: ${lang === 'ar' ? 'left' : 'right'};">${booking.guestsCount} ${lang === 'ar' ? 'نزلاء' : 'Guest(s)'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Stay Dates Highlight Banner -->
      <div style="display: grid; grid-template-columns: 1fr 0.8fr 1fr; background: #0f172a; color: #ffffff; border-radius: 14px; padding: 14px 20px; text-align: center; margin-bottom: 24px;">
        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">
            ${lang === 'ar' ? 'تاريخ الوصول (Check-in)' : 'Check-In Date'}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #f59e0b; margin-top: 3px;">
            ${booking.checkInDate}
          </div>
          <div style="font-size: 10px; color: #cbd5e1;">${lang === 'ar' ? 'من الساعة 14:00' : 'From 14:00'}</div>
        </div>

        <div style="border-right: 1px solid #334155; border-left: 1px solid #334155;">
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">
            ${lang === 'ar' ? 'عدد الليالي' : 'Duration'}
          </div>
          <div style="font-size: 16px; font-weight: 900; color: #ffffff; margin-top: 2px;">
            ${booking.nightsCount} ${lang === 'ar' ? 'ليالٍ' : 'Nights'}
          </div>
        </div>

        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">
            ${lang === 'ar' ? 'تاريخ المغادرة (Check-out)' : 'Check-Out Date'}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #f59e0b; margin-top: 3px;">
            ${booking.checkOutDate}
          </div>
          <div style="font-size: 10px; color: #cbd5e1;">${lang === 'ar' ? 'حتى الساعة 12:00' : 'Until 12:00'}</div>
        </div>
      </div>

      <!-- Payment & QR Code Row -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 14px; padding: 18px 22px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; text-align: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            ${qrSvg}
            <div style="font-family: monospace; font-size: 8px; color: #64748b; margin-top: 4px; font-weight: 700;">DESK CHECK-IN</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #0f172a;">
              ${lang === 'ar' ? 'تسجيل وصول فوري وسريع' : 'Express Front Desk Check-in'}
            </div>
            <div style="font-size: 11px; color: #64748b; max-width: 280px; line-height: 1.4; margin-top: 3px;">
              ${lang === 'ar' 
                ? 'أظهر هذه القسيمة أو الرمز عند الوصول لمكتب الاستقبال لتسجيل الدخول المباشر.' 
                : 'Present this digital voucher or printed copy at hotel reception for priority check-in.'}
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 4px;">
              ✔ ${lang === 'ar' ? 'مدفوع بالكامل ومؤكد قطيعاً' : 'Confirmed & Fully Paid'} (${booking.paymentMethod})
            </div>
          </div>
        </div>

        <div style="text-align: ${lang === 'ar' ? 'left' : 'right'};">
          <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">
            ${lang === 'ar' ? 'المبلغ الإجمالي المدفوع' : 'Total Amount Paid'}
          </div>
          <div style="font-size: 20px; font-weight: 900; color: #059669; margin: 2px 0;">
            ${formattedPaidPrice}
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #64748b;">
            ${formattedRubPrice}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
            ${lang === 'ar' ? 'شامل كافة الضرائب الفندقية والخدمة' : 'All taxes and service charges included'}
          </div>
        </div>
      </div>

      <!-- Official E-Visa Reference Block -->
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 800; color: #92400e;">
            🇷🇺 ${lang === 'ar' ? 'مرجع التأشيرة الإلكترونية الروسية المعتمد (E-Visa Tourism Confirmation)' : 'Official Russian E-Visa Tourist Confirmation Reference'}
          </span>
          <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #b45309; background: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #fcd34d;">
            ${visaCode}
          </span>
        </div>
        <div style="font-size: 10px; color: #78350f; line-height: 1.4;">
          ${lang === 'ar'
            ? 'هذه الوثيقة صادرة وفق اشتراطات وزارة التنمية الاقتصادية في روسيا الاتحادية وتصلح كإثبات حجز فندقي رسمي لطلبات التأشيرة السياحية الإلكترونية الموحدة.'
            : 'This voucher complies with the official Russian Ministry of Economic Development accreditation regulations and serves as verified hotel booking documentation for the Unified E-Visa portal.'}
        </div>
      </div>

      <!-- Muslim-Friendly Accommodations & Special Requests -->
      <div style="display: flex; justify-content: space-between; gap: 14px; font-size: 11px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 14px;">
        <div>
          <span style="font-weight: 700; color: #1e293b;">${lang === 'ar' ? 'المرافق المخصصة:' : 'GCC Guest Amenities:'}</span>
          <span> ${lang === 'ar' ? 'طعام حلال متوفر • سجادة صلاة وتحديد القبلة • دعم عربي 24/7' : 'Halal Food Available • Qibla & Prayer Rug • 24/7 Arabic Concierge'}</span>
        </div>
        ${booking.specialRequests ? `
          <div style="text-align: ${lang === 'ar' ? 'left' : 'right'};">
            <span style="font-weight: 700; color: #1e293b;">${lang === 'ar' ? 'الطلبات الخاصة:' : 'Special Requests:'}</span>
            <span> ${booking.specialRequests}</span>
          </div>
        ` : ''}
      </div>

      <!-- Legal & Concierge Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        <div>
          <span>RussiaBooking Travel Platform Ltd. • 24/7 Concierge: +966 11 800 2470 / +7 495 700 8820</span>
        </div>
        <div>
          <span>support@russiabooking.com • Verified by Central Bank PCI-DSS</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Render high resolution canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Retain sharp vector-like text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Initialize standard A4 PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Check if content fits nicely on one page
    if (contentHeight <= pdfHeight - margin * 2) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
    } else {
      // Multi-page handling if exceptionally tall
      let position = margin;
      let remainingHeight = contentHeight;
      const pageUsableHeight = pdfHeight - margin * 2;

      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      remainingHeight -= pageUsableHeight;

      while (remainingHeight > 0) {
        position -= pageUsableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        remainingHeight -= pageUsableHeight;
      }
    }

    // Trigger instant browser download
    const filename = `RussiaBooking-Voucher-${booking.bookingCode}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF Generation failed, invoking print fallback:', error);
    // Graceful fallback to browser print if canvas or jspdf was somehow blocked
    window.print();
    return false;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Generates and downloads an official Russian Hotel Factsheet & Rate Dossier PDF
 * for travelers, families, and travel planners.
 */
export async function downloadHotelFactSheetPdf(
  hotel: Hotel,
  lang: Language = 'ar',
  currency: SupportedCurrency = 'SAR'
): Promise<boolean> {
  const isAr = lang === 'ar';
  const hotelName = isAr ? hotel.nameAr : hotel.nameEn;
  const hotelCity = isAr ? hotel.cityAr : hotel.city;
  const hotelAddress = isAr ? hotel.addressAr : hotel.addressEn;
  const minPriceFormatted = CurrencyService.format(hotel.minPriceRub, currency, lang);
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Plus Jakarta Sans", sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.padding = '36px 40px';
  container.style.zIndex = '-9999';
  container.dir = isAr ? 'rtl' : 'ltr';

  const starsHtml = '★'.repeat(hotel.stars);

  const roomsRows = hotel.rooms.slice(0, 4).map((room) => {
    const rName = isAr ? room.nameAr : room.nameEn;
    const rType = isAr ? room.bedTypeAr : room.bedTypeEn;
    const lowestRate = room.rates[0];
    const priceFormatted = lowestRate 
      ? CurrencyService.format(lowestRate.pricePerNightRub, currency, lang) 
      : minPriceFormatted;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">
          ${rName}
          <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">
            ${rType} • ${isAr ? `يتسع حتى ${room.maxGuests} نزلاء` : `Max ${room.maxGuests} Guests`}
          </div>
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #334155;">
          ${lowestRate?.breakfastIncluded ? (isAr ? '✓ يشمل الإفطار' : '✓ Breakfast Included') : (isAr ? 'بدون وجبات' : 'Room Only')}
          ${lowestRate?.refundable ? `<br><span style="color: #059669; font-weight: 600;">${isAr ? '✓ إلغاء مجاني' : '✓ Free Cancellation'}</span>` : ''}
        </td>
        <td style="padding: 10px 12px; text-align: ${isAr ? 'left' : 'right'}; font-weight: 800; font-size: 14px; color: #e11d48;">
          ${priceFormatted}
          <div style="font-size: 10px; color: #94a3b8; font-weight: normal;">${isAr ? 'شامل الضرائب / ليلة' : 'Taxes incl. / night'}</div>
        </td>
      </tr>
    `;
  }).join('');

  const landmarksHtml = (isAr ? hotel.nearbyLandmarksAr : hotel.nearbyLandmarksEn)?.slice(0, 4).map(lm => `
    <li style="margin-bottom: 4px; color: #334155; font-size: 11px;">
      <strong>${lm.name}</strong>: <span style="color: #64748b;">${lm.distance}</span>
    </li>
  `).join('') || '';

  container.innerHTML = `
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
          Russia<span style="color: #e11d48;">Booking</span>.com
        </div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px;">
          ${isAr ? 'بوابة حجز الفنادق الروسية المعتمدة لدول الخليج' : 'Accredited Russian Hotel Booking Gateway for GCC'}
        </div>
      </div>
      <div style="text-align: ${isAr ? 'left' : 'right'};">
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px 10px; font-size: 10px; font-weight: 700; color: #334155; display: inline-block;">
          ${isAr ? 'كتيب الإقامة الفندقية الرسمي' : 'OFFICIAL HOTEL FACTSHEET'}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          ${isAr ? 'تاريخ الإصدار:' : 'Date:'} ${dateStr}
        </div>
      </div>
    </div>

    <!-- Hotel Identity Banner -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="color: #f59e0b; font-size: 14px; letter-spacing: 2px; margin-bottom: 4px;">
            ${starsHtml}
          </div>
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 6px 0; color: #0f172a; line-height: 1.2;">
            ${hotelName}
          </h1>
          <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 8px;">
            <span>📍 ${hotelCity} - ${hotelAddress}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            GPS: ${hotel.coordinates.lat.toFixed(4)}°, ${hotel.coordinates.lng.toFixed(4)}°
          </div>
        </div>

        <div style="text-align: center; background: #0f172a; color: #ffffff; padding: 8px 14px; border-radius: 10px;">
          <div style="font-size: 18px; font-weight: 900;">★ ${hotel.rating.toFixed(1)}</div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
            ${hotel.reviewCount} ${isAr ? 'تقييم موثق' : 'reviews'}
          </div>
        </div>
      </div>
    </div>

    <!-- Highlights Badges -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #166534;">${isAr ? 'طعام حلال معتمد' : 'Halal Certified Food'}</div>
        <div style="font-size: 10px; color: #15803d; margin-top: 2px;">${isAr ? 'خيارات حلال متوفرة' : 'Halal options available'}</div>
      </div>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #1e40af;">${isAr ? 'تأشيرة إلكترونية E-Visa' : 'E-Visa Voucher'}</div>
        <div style="font-size: 10px; color: #2563eb; margin-top: 2px;">${isAr ? 'دعوة سياحية رسمية' : 'Official confirmation'}</div>
      </div>
      <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #854d0e;">${isAr ? 'سجادة صلاة وقبلة' : 'Prayer Rug & Qibla'}</div>
        <div style="font-size: 10px; color: #a16207; margin-top: 2px;">${isAr ? 'جاهزة عند الطلب' : 'Available in room'}</div>
      </div>
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #9f1239;">${isAr ? 'دفع آمن بالريال' : 'Pay in GCC Currency'}</div>
        <div style="font-size: 10px; color: #be123c; margin-top: 2px;">${currency} / Mada / Tamara</div>
      </div>
    </div>

    <!-- Description -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        ${isAr ? 'عن الفندق ومميزات الإقامة' : 'About the Property & Stays'}
      </h3>
      <p style="font-size: 11px; line-height: 1.6; color: #334155; margin: 0;">
        ${isAr ? hotel.descriptionAr : hotel.descriptionEn}
      </p>
    </div>

    <!-- Rooms and Rates Schedule -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        ${isAr ? 'الغرف والأسعار المتاحة للحجز الفوري' : 'Available Rooms & Rate Plans'}
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: ${isAr ? 'right' : 'left'};">
            <th style="padding: 8px 12px; font-weight: 700; color: #475569;">${isAr ? 'فئة الغرفة' : 'Room Category'}</th>
            <th style="padding: 8px 12px; font-weight: 700; color: #475569;">${isAr ? 'خطة الوجبات والإلغاء' : 'Meal & Cancellation'}</th>
            <th style="padding: 8px 12px; font-weight: 700; color: #475569; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'السعر' : 'Price'}</th>
          </tr>
        </thead>
        <tbody>
          ${roomsRows}
        </tbody>
      </table>
    </div>

    <!-- Hotel Policies & Proximity -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 6px 0;">
          ${isAr ? 'سياسات الفندق' : 'Hotel Policies'}
        </h4>
        <div style="font-size: 11px; color: #475569; line-height: 1.5;">
          • ${isAr ? 'تسجيل الوصول من:' : 'Check-in from:'} <strong>${hotel.policies.checkInTime}</strong><br>
          • ${isAr ? 'تسجيل المغادرة حتى:' : 'Check-out until:'} <strong>${hotel.policies.checkOutTime}</strong><br>
          • ${isAr ? 'سياسة الإلغاء:' : 'Cancellation:'} ${hotel.policies.freeCancellationHours > 0 ? (isAr ? `إلغاء مجاني حتى ${hotel.policies.freeCancellationHours} ساعة قبل الوصول` : `Free cancellation up to ${hotel.policies.freeCancellationHours}h prior`) : (isAr ? 'غير قابل للاسترداد' : 'Non-refundable')}
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 6px 0;">
          ${isAr ? 'معالم ومواقع قريبة' : 'Nearby Highlights'}
        </h4>
        <ul style="margin: 0; padding-${isAr ? 'right' : 'left'}: 16px;">
          ${landmarksHtml}
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #cbd5e1; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
      <div>
        <strong>RussiaBooking GCC Portal</strong> • ${isAr ? 'دعم العملاء العربي 24/7' : '24/7 Arabic Concierge Support'}
        <br>
        ${isAr ? 'معتمد رسمياً من وزارة التنمية الاقتصادية الروسية لبرنامج التأشيرة الإلكترونية الموحدة.' : 'Official accredited partner under Russian Ministry of Economic Development E-Visa regulations.'}
      </div>
      <div style="text-align: ${isAr ? 'left' : 'right'};">
        <div style="font-weight: 700; color: #0f172a;">https://russiabooking.com</div>
        <div>ID: ${hotel.id}</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= pdfHeight - margin * 2) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
    } else {
      let position = margin;
      let remainingHeight = contentHeight;
      const pageUsableHeight = pdfHeight - margin * 2;
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      remainingHeight -= pageUsableHeight;
      while (remainingHeight > 0) {
        position -= pageUsableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        remainingHeight -= pageUsableHeight;
      }
    }

    const safeHotelName = hotel.nameEn.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `RussiaBooking-Factsheet-${safeHotelName}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Hotel PDF generation failed:', error);
    window.print();
    return false;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Generates and downloads a side-by-side Hotel Comparison Table PDF
 */
export async function downloadComparisonPdf(
  hotels: Hotel[],
  lang: Language = 'ar',
  currency: SupportedCurrency = 'SAR'
): Promise<boolean> {
  const isAr = lang === 'ar';
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '1123px'; // A4 Landscape 1123px x 794px
  container.style.minHeight = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Plus Jakarta Sans", sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.padding = '36px 40px';
  container.style.zIndex = '-9999';
  container.dir = isAr ? 'rtl' : 'ltr';

  const hotelCols = hotels.map(hotel => `
    <th style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; width: ${Math.floor(100 / (hotels.length + 1))}%; text-align: center; vertical-align: top;">
      <div style="color: #f59e0b; font-size: 11px; margin-bottom: 4px;">${'★'.repeat(hotel.stars)}</div>
      <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${isAr ? hotel.nameAr : hotel.nameEn}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${isAr ? hotel.cityAr : hotel.city}</div>
      <div style="display: inline-block; background: #0f172a; color: white; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: bold; margin-top: 6px;">
        ★ ${hotel.rating.toFixed(1)} (${hotel.reviewCount})
      </div>
    </th>
  `).join('');

  const priceRow = hotels.map(h => `
    <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 800; font-size: 14px; color: #e11d48;">
      ${CurrencyService.format(h.minPriceRub, currency, lang)}
      <div style="font-size: 10px; color: #94a3b8; font-weight: normal;">${h.minPriceRub.toLocaleString()} ₽</div>
    </td>
  `).join('');

  const halalRow = hotels.map(h => `
    <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
      ${h.policies.halalCertifiedFood ? `<span style="color: #059669; font-weight: bold;">✓ ${isAr ? 'معتمد 100%' : 'Certified 100%'}</span>` : (isAr ? 'عند الطلب' : 'On Request')}
    </td>
  `).join('');

  const visaRow = hotels.map(() => `
    <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #2563eb; font-weight: bold;">
      ✓ ${isAr ? 'دعوة معتمدة مجانية' : 'Official E-Visa Voucher'}
    </td>
  `).join('');

  const cancelRow = hotels.map(h => `
    <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
      ${h.policies.freeCancellationHours > 0 ? `<span style="color: #059669; font-weight: bold;">✓ ${isAr ? `إلغاء مجاني (${h.policies.freeCancellationHours}س)` : `Free (${h.policies.freeCancellationHours}h)`}</span>` : (isAr ? 'غير مسترد' : 'Non-refundable')}
    </td>
  `).join('');

  const addressRow = hotels.map(h => `
    <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #475569;">
      ${isAr ? h.addressAr : h.addressEn}
    </td>
  `).join('');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 22px; font-weight: 900; color: #0f172a;">
          Russia<span style="color: #e11d48;">Booking</span>.com
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b;">
          ${isAr ? 'تقرير مقارنة الفنادق الروسية للمسافرين الخليجيين' : 'Russian Hotel Side-by-Side Comparison Dossier'}
        </div>
      </div>
      <div style="text-align: ${isAr ? 'left' : 'right'}; font-size: 11px; color: #64748b;">
        <div>${isAr ? 'تاريخ التقرير:' : 'Generated:'} ${dateStr}</div>
        <div>${isAr ? 'العملة المعروضة:' : 'Currency:'} <strong>${currency}</strong></div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr>
          <th style="padding: 12px; background: #0f172a; color: white; text-align: ${isAr ? 'right' : 'left'}; width: 20%;">
            ${isAr ? 'معايير المقارنة' : 'Comparison Criteria'}
          </th>
          ${hotelCols}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
            ${isAr ? 'السعر للّيلة' : 'Rate / Night'}
          </td>
          ${priceRow}
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
            ${isAr ? 'الطعام الحلال' : 'Halal Dining'}
          </td>
          ${halalRow}
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
            ${isAr ? 'التأشيرة الروسية' : 'Russian E-Visa'}
          </td>
          ${visaRow}
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
            ${isAr ? 'سياسة الإلغاء' : 'Cancellation'}
          </td>
          ${cancelRow}
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">
            ${isAr ? 'العنوان' : 'Address'}
          </td>
          ${addressRow}
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
      <div>RussiaBooking.com • ${isAr ? 'جميع الأسعار المعروضة شاملة الضرائب وقابلة للتأكيد الفوري' : 'All rates displayed include taxes and instant confirmation'}</div>
      <div>https://russiabooking.com</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight, undefined, 'FAST');
    pdf.save(`RussiaBooking-Comparison-${Date.now()}.pdf`);
    return true;
  } catch (err) {
    console.error('Comparison PDF failed:', err);
    window.print();
    return false;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

