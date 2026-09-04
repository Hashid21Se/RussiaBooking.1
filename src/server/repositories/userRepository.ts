/**
 * User Repository
 * Handles persistent storage, password hashing, roles, OTP codes, and KYC verification
 */

import bcrypt from 'bcryptjs';
import { User, UserRole, PassportKYC } from '../../types';
import { EncryptionService } from '../security/encryptionService';
import { TotpService } from '../security/totpService';

export interface UserRecord extends User {
  passwordHash?: string;
  otpCode?: string;
  otpExpiresAt?: number;
  refreshTokenHash?: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  backupCodesHashed?: string[];
  encryptedPassportNumber?: string;
}

export class UserRepository {
  private users = new Map<string, UserRecord>();

  constructor() {
    this.seedInitialUsers();
  }

  private seedInitialUsers() {
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

    const initialUsers: UserRecord[] = [
      {
        id: 'user-traveler-1',
        name: 'سعد بن خالد الراجحي',
        email: 'hashedalrajhi@gmail.com',
        phone: '+966501234567',
        country: 'Saudi Arabia',
        role: 'TRAVELER',
        passwordHash: defaultPasswordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        kyc: {
          passportNumber: 'KSA8891024',
          fullNameLatin: 'SAAD KHALID ALRAJHI',
          fullNameArabic: 'سعد خالد الراجحي',
          nationality: 'Saudi Arabia',
          dateOfBirth: '1988-05-14',
          expiryDate: '2030-08-20',
          gender: 'MALE',
          status: 'VERIFIED',
          submittedAt: '2026-01-15T10:00:00Z',
          verifiedAt: '2026-01-16T14:30:00Z'
        },
        createdAt: '2026-01-10T00:00:00Z'
      },
      {
        id: 'user-partner-1',
        name: 'Dmitry Morozov (General Manager)',
        email: 'partner@carlton-moscow.ru',
        phone: '+74955105555',
        country: 'Russia',
        role: 'HOTEL_PARTNER',
        hotelId: 'moscow-the-carlton',
        passwordHash: defaultPasswordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'user-admin-1',
        name: 'System Platform Administrator',
        email: 'admin@russiabooking.com',
        phone: '+966500000001',
        country: 'Saudi Arabia',
        role: 'PLATFORM_ADMIN',
        passwordHash: defaultPasswordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'user-support-1',
        name: 'Support Agent (GCC & Russia Desk)',
        email: 'support@russiabooking.com',
        phone: '+966500000002',
        country: 'United Arab Emirates',
        role: 'SUPPORT_AGENT',
        passwordHash: defaultPasswordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];

    for (const u of initialUsers) {
      this.users.set(u.id, u);
    }
  }

  public async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return null;
  }

  public async findByPhone(phone: string): Promise<UserRecord | null> {
    const cleanPhone = phone.replace(/\s+/g, '');
    for (const u of this.users.values()) {
      if (u.phone && u.phone.replace(/\s+/g, '') === cleanPhone) {
        return u;
      }
    }
    return null;
  }

  public async create(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    country?: string;
    role?: UserRole;
    hotelId?: string;
  }): Promise<UserRecord> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user: UserRecord = {
      id,
      name: data.name,
      email: data.email.trim().toLowerCase(),
      passwordHash,
      phone: data.phone,
      country: data.country || 'SA',
      role: data.role || 'TRAVELER',
      hotelId: data.hotelId,
      isPhoneVerified: false,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(id, user);
    return user;
  }

  public async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserRecord = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, updated);
    return updated;
  }

  public async setOtp(userId: string, code: string, ttlSeconds = 300): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.otpCode = code;
      user.otpExpiresAt = Date.now() + (ttlSeconds * 1000);
      this.users.set(userId, user);
    }
  }

  public async verifyOtp(userId: string, code: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.otpCode || !user.otpExpiresAt) return false;
    if (Date.now() > user.otpExpiresAt) return false;
    if (user.otpCode !== code) return false;

    // Clear OTP after successful use
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.isPhoneVerified = true;
    this.users.set(userId, user);
    return true;
  }

  public async updatePassportKYC(userId: string, kyc: PassportKYC): Promise<UserRecord | null> {
    const encryptedPassport = EncryptionService.encrypt(kyc.passportNumber);
    return this.update(userId, { 
      kyc,
      encryptedPassportNumber: encryptedPassport 
    });
  }

  public async set2FASetup(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.twoFactorSecret = secret;
      user.backupCodesHashed = backupCodes.map(c => TotpService.hashBackupCode(c));
      this.users.set(userId, user);
    }
  }

  public async enable2FA(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.twoFactorSecret) return false;
    user.twoFactorEnabled = true;
    this.users.set(userId, user);
    return true;
  }

  public async disable2FA(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodesHashed = undefined;
    this.users.set(userId, user);
    return true;
  }

  public async verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.backupCodesHashed) return false;
    const targetHash = TotpService.hashBackupCode(code);
    const index = user.backupCodesHashed.indexOf(targetHash);
    if (index !== -1) {
      // Consume the backup code (single-use)
      user.backupCodesHashed.splice(index, 1);
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }
}

export const userRepository = new UserRepository();
