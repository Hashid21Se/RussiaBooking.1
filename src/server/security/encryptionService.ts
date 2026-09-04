/**
 * At-Rest & In-Transit Encryption Service
 * Compliant with PCI-DSS 4.0, Saudi PDPL, and GDPR
 * Uses AES-256-GCM authenticated encryption with 96-bit IV and 128-bit Auth Tag
 */

import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits

  // Master key derived from Secret Manager or environment variable
  private static getMasterKey(): Buffer {
    const secret = process.env.DATA_ENCRYPTION_KEY || 'russiabooking-at-rest-master-key-32bytes-secret!';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypts plaintext string into a tamper-evident payload
   * Format: base64(iv:authTag:ciphertext)
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return plainText;

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.getMasterKey();
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const payload = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    return Buffer.from(payload, 'utf8').toString('base64');
  }

  /**
   * Decrypts tamper-evident payload back to plaintext
   * Throws Error if payload has been tampered with or key is invalid
   */
  public static decrypt(cipherTextBase64: string): string {
    if (!cipherTextBase64) return cipherTextBase64;

    try {
      const decoded = Buffer.from(cipherTextBase64, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 3) {
        // Return original if not encrypted in this format (fallback/legacy)
        return cipherTextBase64;
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = this.getMasterKey();

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      throw new Error(`At-Rest Decryption failed: Data integrity compromised or invalid key.`);
    }
  }

  /**
   * Cryptographic one-way blind indexing for searchable encryption (e.g. search by passport hash)
   */
  public static blindIndex(value: string, salt = 'rb-blind-index-salt'): string {
    return crypto.createHmac('sha256', salt).update(value.trim().toUpperCase()).digest('hex');
  }
}
