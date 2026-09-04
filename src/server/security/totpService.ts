/**
 * Standard RFC 6238 TOTP (Time-Based One-Time Password) Service
 * Powers mandatory Two-Factor Authentication (2FA) for Admin & Support Portal
 * Compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Keychain
 */

import crypto from 'crypto';

export interface TotpSetupResult {
  secret: string; // Base32 encoded secret
  otpauthUrl: string;
  backupCodes: string[];
}

export class TotpService {
  private static readonly BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  private static readonly TIME_STEP_SECONDS = 30;
  private static readonly CODE_DIGITS = 6;

  /**
   * Generates a cryptographically secure Base32 secret for TOTP
   */
  public static generateSecret(length = 20): string {
    const randomBuffer = crypto.randomBytes(length);
    let secret = '';
    for (let i = 0; i < randomBuffer.length; i++) {
      secret += this.BASE32_ALPHABET[randomBuffer[i] % 32];
    }
    return secret;
  }

  /**
   * Generates a full 2FA setup packet including secret, otpauth URL, and emergency backup codes
   */
  public static generateSetup(accountEmail: string, issuer = 'RussiaBooking'): TotpSetupResult {
    const secret = this.generateSecret();
    const encodedAccount = encodeURIComponent(accountEmail);
    const encodedIssuer = encodeURIComponent(issuer);
    const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

    // Generate 8 emergency backup recovery codes (format: XXXX-XXXX)
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      backupCodes.push(code);
    }

    return {
      secret,
      otpauthUrl,
      backupCodes
    };
  }

  /**
   * Decodes Base32 string into Buffer
   */
  private static base32ToBuffer(base32: string): Buffer {
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < cleaned.length; i++) {
      const val = this.BASE32_ALPHABET.indexOf(cleaned[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  /**
   * Generates the expected 6-digit TOTP token for current system time
   */
  public static generateCurrentToken(secret: string): string {
    const currentEpoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(currentEpoch / this.TIME_STEP_SECONDS);
    return this.generateTokenForCounter(secret, currentCounter);
  }

  /**
   * Generates the expected 6-digit TOTP token for a given counter/epoch step
   */
  public static generateTokenForCounter(secret: string, counter: number): string {
    const key = this.base32ToBuffer(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    // Dynamic Truncation (RFC 4226)
    const offset = digest[digest.length - 1] & 0xf;
    const codeNumber =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const token = (codeNumber % Math.pow(10, this.CODE_DIGITS)).toString();
    return token.padStart(this.CODE_DIGITS, '0');
  }

  /**
   * Verifies a 6-digit code against secret with ±1 time step tolerance (skew protection)
   */
  public static verifyToken(token: string, secret: string, window = 1): boolean {
    if (!token || !secret) return false;
    const cleanToken = token.trim().replace(/\s+/g, '');
    if (cleanToken.length !== this.CODE_DIGITS) return false;

    const currentEpoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(currentEpoch / this.TIME_STEP_SECONDS);

    for (let i = -window; i <= window; i++) {
      const expectedToken = this.generateTokenForCounter(secret, currentCounter + i);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expectedToken))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Hashes a backup code for secure storage
   */
  public static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }
}
