/**
 * Production SSR & SEO Rendering Engine
 * Equivalent to Next.js metadata generation, OpenGraph, JSON-LD Schema.org,
 * Alternate hreflang tags, and server-side pre-rendered semantic HTML.
 */

import fs from 'fs';
import path from 'path';
import { Hotel } from '../../types';
import { hotelRepository } from '../repositories/hotelRepository';

export interface SeoMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  canonicalUrl: string;
  jsonLd?: object;
  lang?: 'ar' | 'en' | 'ru';
  dir?: 'rtl' | 'ltr';
  prerenderHtml?: string;
}

export class SeoRenderer {
  /**
   * Build metadata and Schema.org JSON-LD for a specific hotel page
   */
  public static generateHotelMetadata(hotel: Hotel, host: string, lang: 'ar' | 'en' | 'ru' = 'ar'): SeoMetadata {
    const isAr = lang === 'ar';
    const baseUrl = `https://${host}`;
    const hotelUrl = `${baseUrl}/hotel/${hotel.id}`;
    const primaryImage = hotel.images[0]?.url || `${baseUrl}/assets/og-image.png`;

    const title = isAr
      ? `${hotel.nameAr} | حجز فنادق ${hotel.cityAr} - RussiaBooking`
      : `${hotel.nameEn} | Luxury Stay in ${hotel.city} - RussiaBooking`;

    const description = isAr
      ? `احجز إقامتك في ${hotel.nameAr} (${hotel.stars} نجوم) في ${hotel.cityAr}. تقييم ${hotel.rating}/5، خيارات دفع بالريال والدرهم عبر مدى وتمارا، شامل إفطار حلال واستقبال عربي.`
      : `Book your stay at ${hotel.nameEn} (${hotel.stars}-star) in ${hotel.city}. Rated ${hotel.rating}/5. GCC payment methods accepted (Mada, Tamara). Halal breakfast and Arabic concierge available.`;

    // Schema.org Hotel / LodgingBusiness Microdata
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      '@id': hotelUrl,
      'name': hotel.nameEn,
      'alternateName': hotel.nameAr,
      'description': hotel.descriptionEn,
      'image': hotel.images.map((img) => img.url),
      'starRating': {
        '@type': 'Rating',
        'ratingValue': hotel.stars,
        'bestRating': 5,
        'worstRating': 1,
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': hotel.rating,
        'reviewCount': hotel.reviewCount || 100,
        'bestRating': 5,
      },
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': hotel.addressEn,
        'addressLocality': hotel.city,
        'addressCountry': 'RU',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': hotel.coordinates.lat,
        'longitude': hotel.coordinates.lng,
      },
      'priceRange': `${hotel.minPriceRub} RUB - ${Math.round(hotel.minPriceRub * 2.5)} RUB`,
      'currenciesAccepted': 'RUB, SAR, AED, USD, KWD, QAR',
      'paymentAccepted': 'Cash, Credit Card, Mada, Tamara, Apple Pay',
      'amenityFeature': hotel.amenities.map((amenity) => ({
        '@type': 'LocationFeatureSpecification',
        'name': amenity,
        'value': true,
      })),
      'petsAllowed': hotel.policies.petFriendly,
      'checkinTime': hotel.policies.checkInTime || '14:00',
      'checkoutTime': hotel.policies.checkOutTime || '12:00',
    };

    // Semantic Pre-rendered HTML for search engine crawlers (Next.js SSR parity)
    const prerenderHtml = `
      <article id="ssr-hotel-card-${hotel.id}" class="ssr-hotel-meta" data-ssr="true" style="display:none;" aria-hidden="false">
        <header>
          <h1>${isAr ? hotel.nameAr : hotel.nameEn}</h1>
          <p class="hotel-stars">${hotel.stars} Stars Luxury Hotel</p>
          <p class="hotel-address">${isAr ? hotel.addressAr : hotel.addressEn}, ${isAr ? hotel.cityAr : hotel.city}</p>
        </header>
        <div class="hotel-rating">
          <span>Rating: <strong>${hotel.rating} / 5</strong> (${hotel.reviewCount} reviews)</span>
        </div>
        <div class="hotel-pricing">
          <span>Starting Rate: <strong>${hotel.minPriceRub} RUB</strong> per night</span>
        </div>
        <div class="hotel-description">
          <p>${isAr ? hotel.descriptionAr : hotel.descriptionEn}</p>
        </div>
        <div class="hotel-amenities">
          <h3>Featured Amenities</h3>
          <ul>
            ${hotel.amenities.map((a) => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      </article>
    `;

    return {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: primaryImage,
      ogUrl: hotelUrl,
      canonicalUrl: hotelUrl,
      jsonLd,
      lang,
      dir: isAr ? 'rtl' : 'ltr',
      prerenderHtml,
    };
  }

  /**
   * Default Portal Metadata (Home / Search)
   */
  public static getDefaultMetadata(host: string, lang: 'ar' | 'en' | 'ru' = 'ar'): SeoMetadata {
    const isAr = lang === 'ar';
    const baseUrl = `https://${host}`;

    const title = isAr
      ? 'RussiaBooking | منصة حجز فنادق روسيا الفاخرة للخليج والشرق الأوسط'
      : 'RussiaBooking | Premium Hotels & Luxury Resorts in Russia for GCC Travelers';

    const description = isAr
      ? 'احجز أفضل وأفخم فنادق موسكو، سانت بطرسبرغ، سوتشي وقازان مع خيارات دفع موثوقة (مدى، تمارا، بطاقات بنكية)، وتأشيرة إلكترونية، وخدمات الضيافة الحلال.'
      : 'Book top verified luxury hotels in Moscow, St. Petersburg, Sochi and Kazan with regional GCC payment support (Mada, Tamara, Credit Cards), visa vouchers, and halal hospitality.';

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'url': baseUrl,
      'name': 'RussiaBooking',
      'alternateName': 'منصة حجز فنادق روسيا',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${baseUrl}/?city={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    return {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: `${baseUrl}/assets/og-image.png`,
      ogUrl: baseUrl,
      canonicalUrl: baseUrl,
      jsonLd,
      lang,
      dir: isAr ? 'rtl' : 'ltr',
    };
  }

  /**
   * Inject SSR metadata, OpenGraph, JSON-LD, and pre-rendered markup into index.html
   */
  public static injectMetadata(htmlTemplate: string, meta: SeoMetadata): string {
    let result = htmlTemplate;

    // Replace <html lang="..." dir="...">
    result = result.replace(
      /<html[^>]*>/i,
      `<html lang="${meta.lang || 'ar'}" dir="${meta.dir || 'rtl'}">`
    );

    // Replace <title>...</title>
    result = result.replace(
      /<title>.*?<\/title>/i,
      `<title>${meta.title}</title>`
    );

    // Dynamic Meta Tags block
    const metaTags = `
    <!-- SSR Dynamic SEO Metadata (Next.js Architecture Parity) -->
    <meta name="description" content="${meta.description.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${meta.ogTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${meta.ogDescription.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${meta.ogImage}" />
    <meta property="og:url" content="${meta.ogUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.ogTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${meta.ogDescription.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${meta.ogImage}" />
    <link rel="canonical" href="${meta.canonicalUrl}" />
    <link rel="alternate" hreflang="ar" href="${meta.canonicalUrl}?lang=ar" />
    <link rel="alternate" hreflang="en" href="${meta.canonicalUrl}?lang=en" />
    <link rel="alternate" hreflang="ru" href="${meta.canonicalUrl}?lang=ru" />
    <link rel="alternate" hreflang="x-default" href="${meta.canonicalUrl}" />
    ${meta.jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(meta.jsonLd, null, 2)}\n    </script>` : ''}
    `;

    // Replace or inject before </head>
    if (result.includes('</head>')) {
      result = result.replace('</head>', `${metaTags}\n  </head>`);
    }

    // Inject SSR HTML content inside <div id="root">
    if (meta.prerenderHtml && result.includes('<div id="root"></div>')) {
      result = result.replace('<div id="root"></div>', `<div id="root">${meta.prerenderHtml}</div>`);
    }

    return result;
  }

  /**
   * Generate sitemap.xml dynamically with all hotels and destinations
   */
  public static async generateSitemap(host: string): Promise<string> {
    const baseUrl = `https://${host}`;
    const hotels = await hotelRepository.findAll();
    const currentDate = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    // Home URL
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/?lang=ar"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/?lang=ru"/>\n`;
    xml += `  </url>\n`;

    // Hotel URLs
    for (const h of hotels) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/hotel/${h.id}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/hotel/${h.id}?lang=ar"/>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/hotel/${h.id}?lang=en"/>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/hotel/${h.id}?lang=ru"/>\n`;
      xml += `  </url>\n`;
    }

    // City URLs
    const cities = ['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan'];
    for (const c of cities) {
      const slug = encodeURIComponent(c.toLowerCase());
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/?city=${slug}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;
    return xml;
  }

  /**
   * Generate robots.txt
   */
  public static generateRobotsTxt(host: string): string {
    return `User-agent: *
Allow: /
Allow: /hotel/*
Allow: /api/hotels*
Disallow: /api/admin/*
Disallow: /api/partner/*
Disallow: /api/payments/*

Sitemap: https://${host}/sitemap.xml
`;
  }
}
