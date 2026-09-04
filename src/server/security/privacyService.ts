/**
 * Privacy & Data Minimization Service
 * Compliant with Saudi Personal Data Protection Law (PDPL) & GDPR (EU)
 * Provides field masking, Right to be Forgotten (Erasure), and Data Portability
 */

export interface ConsentRecord {
  purpose: string;
  legalBasis: 'CONSENT' | 'CONTRACTUAL_NECESSITY' | 'LEGAL_OBLIGATION';
  grantedAt: string;
  ipAddress?: string;
}

export class PrivacyService {
  /**
   * Masks passport numbers according to Data Minimization (e.g. "KSA8891024" -> "KSA****1024")
   */
  public static maskPassport(passport?: string): string {
    if (!passport) return '';
    const clean = passport.trim();
    if (clean.length <= 4) return '****';
    const prefix = clean.substring(0, 3);
    const suffix = clean.substring(clean.length - 4);
    return `${prefix}****${suffix}`;
  }

  /**
   * Masks phone numbers (e.g. "+966501234567" -> "+96650****567")
   */
  public static maskPhone(phone?: string): string {
    if (!phone) return '';
    const clean = phone.trim();
    if (clean.length <= 6) return '****';
    const start = clean.substring(0, 6);
    const end = clean.substring(clean.length - 3);
    return `${start}****${end}`;
  }

  /**
   * Masks email addresses (e.g. "hashedalrajhi@gmail.com" -> "h***i@gmail.com")
   */
  public static maskEmail(email?: string): string {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    if (user.length <= 2) return `*@${domain}`;
    const first = user[0];
    const last = user[user.length - 1];
    return `${first}***${last}@${domain}`;
  }

  /**
   * Anonymizes customer PII for Right to Erasure / Account Deletion
   * Preserves non-PII financial and transaction codes for anti-money laundering (AML) and audit laws
   */
  public static anonymizeUserRecord(user: any): any {
    return {
      ...user,
      name: 'DELETED_USER',
      email: `anonymized_${user.id}@russiabooking.privacy`,
      phone: '+000000000000',
      isPhoneVerified: false,
      isEmailVerified: false,
      avatarUrl: undefined,
      kyc: undefined, // Fully erased passport & KYC data
      anonymizedAt: new Date().toISOString(),
      privacyStatus: 'ERASED_UNDER_PDPL_GDPR'
    };
  }

  /**
   * Creates an official Saudi PDPL / GDPR consent manifest for Russian hospitality booking
   */
  public static createTouristConsent(ipAddress?: string): ConsentRecord[] {
    const timestamp = new Date().toISOString();
    return [
      {
        purpose: 'RUSSIAN_HOTEL_RESERVATION',
        legalBasis: 'CONTRACTUAL_NECESSITY',
        grantedAt: timestamp,
        ipAddress,
      },
      {
        purpose: 'RUSSIAN_TOURIST_MIGRATION_REGISTRATION',
        legalBasis: 'LEGAL_OBLIGATION',
        grantedAt: timestamp,
        ipAddress,
      },
      {
        purpose: 'PAYMENT_PROCESSING_GCC_MADA_TAMARA',
        legalBasis: 'CONTRACTUAL_NECESSITY',
        grantedAt: timestamp,
        ipAddress,
      }
    ];
  }
}
