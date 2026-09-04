/**
 * Currency Service & Money Abstraction
 * Russian Ruble (RUB) is the authoritative primary currency in storage and settlement.
 * Display currencies (SAR, AED, USD, KWD, QAR) are converted dynamically with accurate formatting.
 */

import { SupportedCurrency, CurrencyRate } from '../types';

// Central bank & market exchange rates (approximate for display; live feeds can override)
export const CURRENCY_RATES: Record<SupportedCurrency, CurrencyRate> = {
  RUB: {
    code: 'RUB',
    symbol: '₽',
    symbolAr: 'روبل',
    nameEn: 'Russian Ruble',
    nameAr: 'روبل روسي',
    rateFromRub: 1.0,
    rateToRub: 1.0,
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    symbolAr: 'ر.س',
    nameEn: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    rateFromRub: 0.0408, // 1 RUB ≈ 0.0408 SAR (or ~24.5 RUB per SAR)
    rateToRub: 24.50,
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    symbolAr: 'د.إ',
    nameEn: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    rateFromRub: 0.0400, // 1 RUB ≈ 0.04 AED (or 25.0 RUB per AED)
    rateToRub: 25.00,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    symbolAr: '$',
    nameEn: 'US Dollar',
    nameAr: 'دولار أمريكي',
    rateFromRub: 0.0109, // 1 RUB ≈ 0.0109 USD (or ~92.0 RUB per USD)
    rateToRub: 92.00,
  },
  KWD: {
    code: 'KWD',
    symbol: 'KWD',
    symbolAr: 'د.ك',
    nameEn: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    rateFromRub: 0.0033, // 1 RUB ≈ 0.0033 KWD (or ~300 RUB per KWD)
    rateToRub: 300.00,
  },
  QAR: {
    code: 'QAR',
    symbol: 'QAR',
    symbolAr: 'ر.ق',
    nameEn: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    rateFromRub: 0.0396, // 1 RUB ≈ 0.0396 QAR (or ~25.2 RUB per QAR)
    rateToRub: 25.20,
  },
};

export class CurrencyService {
  /**
   * Convert RUB base amount to target currency
   */
  static convertFromRub(rubAmount: number, target: SupportedCurrency): number {
    const rateInfo = CURRENCY_RATES[target];
    if (!rateInfo) return rubAmount;
    const converted = rubAmount * rateInfo.rateFromRub;
    return Math.round(converted * 100) / 100;
  }

  /**
   * Convert foreign currency back to authoritative RUB
   */
  static convertToRub(amount: number, from: SupportedCurrency): number {
    const rateInfo = CURRENCY_RATES[from];
    if (!rateInfo) return amount;
    return Math.round(amount * rateInfo.rateToRub);
  }

  /**
   * Format money according to locale and currency
   */
  static format(
    rubAmount: number, 
    targetCurrency: SupportedCurrency = 'RUB', 
    locale: 'ar' | 'en' = 'ar',
    options?: { showBoth?: boolean }
  ): string {
    const targetInfo = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES.RUB;
    const converted = this.convertFromRub(rubAmount, targetCurrency);
    
    const formattedTarget = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      maximumFractionDigits: targetCurrency === 'RUB' ? 0 : 1,
      minimumFractionDigits: targetCurrency === 'RUB' ? 0 : 0,
    }).format(converted);

    const symbol = locale === 'ar' ? targetInfo.symbolAr : targetInfo.symbol;
    const targetStr = locale === 'ar' ? `${formattedTarget} ${symbol}` : `${symbol} ${formattedTarget}`;

    if (options?.showBoth && targetCurrency !== 'RUB') {
      const formattedRub = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        maximumFractionDigits: 0,
      }).format(rubAmount);
      const rubSymbol = locale === 'ar' ? 'روبل' : '₽';
      return `${targetStr} (~${formattedRub} ${rubSymbol})`;
    }

    return targetStr;
  }
}
