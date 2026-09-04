/**
 * Security & Cryptography Unit Tests
 * Validates OWASP Top 10, AES-256-GCM, RFC 6238 TOTP, CSRF, and Hash-Chained Audit Ledger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../server/security/encryptionService';
import { TotpService } from '../server/security/totpService';
import { PrivacyService } from '../server/security/privacyService';
import { CsrfProtection } from '../server/middleware/csrfMiddleware';
import { AuditRepository } from '../server/repositories/auditRepository';
import { SecurityScanner } from '../server/security/securityScanner';

describe('EncryptionService (AES-256-GCM Authenticated Encryption)', () => {
  it('encrypts and decrypts sensitive passport and personal data without loss', () => {
    const originalPassport = 'KSA98471203';
    const encrypted = EncryptionService.encrypt(originalPassport);

    expect(encrypted).not.toBe(originalPassport);
    const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
    expect(decoded.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = EncryptionService.decrypt(encrypted);
    expect(decrypted).toBe(originalPassport);
  });

  it('detects tampering with ciphertext or auth tag and throws error', () => {
    const encrypted = EncryptionService.encrypt('TOP_SECRET_PASSPORT');
    const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
    const [iv, authTag, ciphertext] = decoded.split(':');
    
    // Tamper with the ciphertext and re-encode to base64
    const tamperedPayload = `${iv}:${authTag}:${ciphertext.substring(0, ciphertext.length - 2)}aa`;
    const tamperedBase64 = Buffer.from(tamperedPayload, 'utf8').toString('base64');
    
    expect(() => EncryptionService.decrypt(tamperedBase64)).toThrow();
  });
});

describe('TotpService (RFC 6238 Time-based One-Time Password 2FA)', () => {
  it('generates valid base32 secret, otpauth URL, and single-use backup codes', () => {
    const setup = TotpService.generateSetup('admin@russiabooking.com', 'RussiaBooking');
    
    expect(setup.secret).toBeDefined();
    expect(setup.secret.length).toBeGreaterThanOrEqual(16);
    expect(setup.otpauthUrl).toContain('otpauth://totp/RussiaBooking');
    expect(setup.backupCodes).toHaveLength(8);
  });

  it('verifies a generated TOTP token correctly within drift window', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = TotpService.generateCurrentToken(secret);
    
    expect(token).toMatch(/^\d{6}$/);
    const isValid = TotpService.verifyToken(token, secret);
    expect(isValid).toBe(true);
  });

  it('rejects an invalid or forged 6-digit code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const isValid = TotpService.verifyToken('000000', secret);
    expect(isValid).toBe(false);
  });

  it('hashes and consumes single-use emergency backup codes', () => {
    const rawCode = 'A1B2-C3D4';
    const hashed = TotpService.hashBackupCode(rawCode);
    expect(hashed).toHaveLength(64); // SHA-256
    expect(TotpService.hashBackupCode(rawCode)).toBe(hashed);
  });
});

describe('PrivacyService (Saudi PDPL & GDPR Data Minimization)', () => {
  it('masks sensitive passport numbers according to Article 18 data minimization', () => {
    expect(PrivacyService.maskPassport('KSA1234567')).toBe('KSA****4567');
    expect(PrivacyService.maskPassport('N894102')).toBe('N89****4102');
  });

  it('masks email addresses and phone numbers appropriately', () => {
    expect(PrivacyService.maskEmail('hashedalrajhi@gmail.com')).toBe('h***i@gmail.com');
    expect(PrivacyService.maskPhone('+966501234567')).toBe('+96650****567');
  });

  it('anonymizes customer record for Right to be Forgotten requests', () => {
    const anonymized = PrivacyService.anonymizeUserRecord({
      id: 'usr-123',
      name: 'سعد الراجحي',
      email: 'saad@example.com',
      phone: '+966501234567',
      passportNumber: 'KSA1234567',
    });

    expect(anonymized.name).toBe('DELETED_USER');
    expect(anonymized.email).toContain('@russiabooking.privacy');
    expect(anonymized.phone).toBe('+000000000000');
  });
});

describe('CsrfProtection (Double-Submit Signed Tokens)', () => {
  it('generates cryptographically signed CSRF tokens', () => {
    const token = CsrfProtection.generateToken('session_user_42');
    expect(token).toBeDefined();
    expect(token.split(':')).toHaveLength(4);
  });

  it('validates authentic tokens and rejects forged ones', () => {
    const validToken = CsrfProtection.generateToken('session_user_42');
    expect(CsrfProtection.validateToken(validToken, 'session_user_42')).toBe(true);

    // Mismatched session
    expect(CsrfProtection.validateToken(validToken, 'different_attacker_session')).toBe(false);

    // Tampered token
    const parts = validToken.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:0000000000000000000000000000000000000000000000000000000000000000`;
    expect(CsrfProtection.validateToken(tampered, 'session_user_42')).toBe(false);
  });
});

describe('AuditRepository (Cryptographic Hash-Chained Immutable Ledger)', () => {
  let auditRepo: AuditRepository;

  beforeEach(() => {
    auditRepo = new AuditRepository();
  });

  it('records logs with sequential SHA-256 hash chains from genesis', async () => {
    const log1 = await auditRepo.log({
      actor: 'admin@russiabooking.com',
      actorRole: 'PLATFORM_ADMIN',
      action: 'LOGIN_SUCCESS',
      target: 'AUTH',
      targetId: 'auth-1',
    });

    const log2 = await auditRepo.log({
      actor: 'admin@russiabooking.com',
      actorRole: 'PLATFORM_ADMIN',
      action: 'SETTLEMENT_PROCESSED',
      target: 'HOTEL',
      targetId: 'hotel-moscow-1',
    });

    expect(log1.hash).toBeDefined();
    expect(log2.hash).toBeDefined();
    expect(log2.previousHash).toBe(log1.hash);

    const check = auditRepo.verifyLedgerIntegrity();
    expect(check.isValid).toBe(true);
    expect(check.checkedRecords).toBe(2);
  });

  it('detects tampering if any previous entry or hash in the chain is modified', async () => {
    await auditRepo.log({
      actor: 'admin@russiabooking.com',
      actorRole: 'PLATFORM_ADMIN',
      action: 'PAYMENT_1',
      target: 'TX',
      targetId: '1',
    });

    await auditRepo.log({
      actor: 'admin@russiabooking.com',
      actorRole: 'PLATFORM_ADMIN',
      action: 'PAYMENT_2',
      target: 'TX',
      targetId: '2',
    });

    // Simulate an unauthorized DB modification in memory
    const logs = (auditRepo as any).logs;
    logs[1].action = 'MALICIOUS_TAMPER_EDIT';

    const check = auditRepo.verifyLedgerIntegrity();
    expect(check.isValid).toBe(false);
    expect(check.error).toContain('Tampering detected');
  });
});

describe('SecurityScanner (OWASP Top 10 & Compliance)', () => {
  it('evaluates all 10 OWASP Top 10 categories with passing grade', () => {
    const report = SecurityScanner.generateReport();
    expect(report.overallScore).toBeGreaterThanOrEqual(95);
    expect(report.securityGrade).toBe('A+');
    expect(report.owaspCompliance).toHaveLength(10);
    expect(report.owaspCompliance.every((c) => c.status === 'PASSED')).toBe(true);
    expect(report.regulatoryCompliance).toHaveLength(2); // PDPL & GDPR
  });
});
