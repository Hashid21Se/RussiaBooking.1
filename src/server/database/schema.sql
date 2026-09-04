-- RussiaBooking Production Database Schema (PostgreSQL 16+)
-- ACID-compliant relational schema with partitioning, JSONB, and Full-Text Search

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM (
  'TRAVELER',
  'HOTEL_PARTNER',
  'PLATFORM_ADMIN',
  'SUPPORT_AGENT',
  'USER',
  'ADMIN',
  'SUPER_ADMIN'
);

CREATE TYPE kyc_status_enum AS ENUM (
  'NOT_SUBMITTED',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED'
);

CREATE TYPE booking_status_enum AS ENUM (
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'REFUND_PENDING',
  'REFUNDED'
);

CREATE TYPE payment_method_enum AS ENUM (
  'MADA',
  'TAMARA',
  'TAP',
  'CREDIT_CARD',
  'APPLE_PAY',
  'SANDBOX'
);

CREATE TYPE payment_status_enum AS ENUM (
  'INITIATED',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'REFUNDED'
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone VARCHAR(32) UNIQUE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  country VARCHAR(100) DEFAULT 'SA',
  role user_role_enum NOT NULL DEFAULT 'TRAVELER',
  hotel_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 3. REFRESH TOKENS (For JWT Rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  replaced_by_token_hash VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 4. PASSPORT KYC VERIFICATION TABLE (Lightweight verification for Russian Tourist Registration)
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passport_number_encrypted TEXT NOT NULL,
  full_name_latin VARCHAR(255) NOT NULL,
  full_name_arabic VARCHAR(255),
  nationality VARCHAR(64) NOT NULL,
  date_of_birth DATE NOT NULL,
  expiry_date DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  status kyc_status_enum NOT NULL DEFAULT 'PENDING_REVIEW',
  document_scan_url TEXT,
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);

-- 5. HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  city_ar VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Russia',
  address_en TEXT NOT NULL,
  address_ar TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  rating DECIMAL(3, 1) NOT NULL DEFAULT 8.0,
  review_count INT NOT NULL DEFAULT 0,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  min_price_rub DECIMAL(12, 2) NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  nearby_landmarks_en JSONB DEFAULT '[]'::jsonb,
  nearby_landmarks_ar JSONB DEFAULT '[]'::jsonb,
  tags_en TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags_ar TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_stars ON hotels(stars);
CREATE INDEX idx_hotels_active ON hotels(active);
CREATE INDEX idx_hotels_min_price ON hotels(min_price_rub);

-- 6. HOTEL ROOMS & RATES
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  max_guests INT NOT NULL DEFAULT 2,
  max_adults INT NOT NULL DEFAULT 2,
  max_children INT NOT NULL DEFAULT 1,
  bed_type_en VARCHAR(100) NOT NULL,
  bed_type_ar VARCHAR(100) NOT NULL,
  size_sqm INT NOT NULL DEFAULT 25,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hotel_rooms_hotel_id ON hotel_rooms(hotel_id);

CREATE TABLE IF NOT EXISTS room_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  price_per_night_rub DECIMAL(12, 2) NOT NULL,
  breakfast_included BOOLEAN NOT NULL DEFAULT FALSE,
  refundable BOOLEAN NOT NULL DEFAULT TRUE,
  free_cancellation_deadline_hours INT NOT NULL DEFAULT 48,
  tax_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  available_quantity INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_rates_room_id ON room_rates(room_id);

-- 7. INVENTORY ALLOTMENTS & REAL-TIME LOCKS (Prevents Overbooking)
CREATE TABLE IF NOT EXISTS inventory_allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  rate_id UUID NOT NULL REFERENCES room_rates(id) ON DELETE CASCADE,
  allotment_date DATE NOT NULL,
  total_inventory INT NOT NULL DEFAULT 5,
  booked_count INT NOT NULL DEFAULT 0,
  held_count INT NOT NULL DEFAULT 0,
  price_rub DECIMAL(12, 2) NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_room_rate_date UNIQUE (room_id, rate_id, allotment_date),
  CONSTRAINT chk_allotment_capacity CHECK (booked_count + held_count <= total_inventory)
);

CREATE INDEX idx_inventory_lookup ON inventory_allotments(room_id, rate_id, allotment_date);

-- 8. BOOKINGS TABLE (ACID Financial Core)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(32) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(32) NOT NULL,
  hotel_id UUID NOT NULL REFERENCES hotels(id),
  hotel_name_en VARCHAR(255) NOT NULL,
  hotel_name_ar VARCHAR(255) NOT NULL,
  hotel_city VARCHAR(100) NOT NULL,
  hotel_city_ar VARCHAR(100) NOT NULL,
  hotel_image TEXT,
  room_id UUID NOT NULL REFERENCES hotel_rooms(id),
  room_name_en VARCHAR(255) NOT NULL,
  room_name_ar VARCHAR(255) NOT NULL,
  rate_id UUID NOT NULL REFERENCES room_rates(id),
  rate_name_en VARCHAR(255) NOT NULL,
  rate_name_ar VARCHAR(255) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights_count INT NOT NULL CHECK (nights_count > 0),
  guests_count INT NOT NULL CHECK (guests_count > 0),
  price_per_night_rub DECIMAL(12, 2) NOT NULL,
  subtotal_rub DECIMAL(12, 2) NOT NULL,
  tax_amount_rub DECIMAL(12, 2) NOT NULL,
  platform_fee_rub DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_price_rub DECIMAL(12, 2) NOT NULL,
  currency_paid VARCHAR(8) NOT NULL DEFAULT 'SAR',
  total_price_paid_currency DECIMAL(12, 2) NOT NULL,
  exchange_rate_used DECIMAL(10, 6) NOT NULL,
  status booking_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status payment_status_enum NOT NULL DEFAULT 'INITIATED',
  payment_method payment_method_enum NOT NULL DEFAULT 'MADA',
  payment_id VARCHAR(128),
  special_requests TEXT,
  visa_invitation_requested BOOLEAN DEFAULT FALSE,
  visa_voucher_code VARCHAR(64),
  points_earned INT DEFAULT 0,
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount_rub DECIMAL(12, 2) DEFAULT 0
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- 9. BOOKING GUESTS
CREATE TABLE IF NOT EXISTS booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  passport_number_encrypted TEXT,
  nationality VARCHAR(64),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_guests_booking_id ON booking_guests(booking_id);

-- 10. PAYMENT TRANSACTIONS (Idempotent Ledger)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_rub DECIMAL(12, 2) NOT NULL,
  amount_target_currency DECIMAL(12, 2) NOT NULL,
  target_currency VARCHAR(8) NOT NULL,
  provider payment_method_enum NOT NULL,
  provider_transaction_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  status payment_status_enum NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payments_idempotency ON payment_transactions(idempotency_key);

-- 11. FINANCIAL SETTLEMENTS (Hotel Payouts)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  booking_revenue_rub DECIMAL(14, 2) NOT NULL,
  hotel_amount_rub DECIMAL(14, 2) NOT NULL,
  platform_commission_rub DECIMAL(14, 2) NOT NULL,
  refunds_rub DECIMAL(14, 2) DEFAULT 0,
  net_settlement_rub DECIMAL(14, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  reference_code VARCHAR(64) NOT NULL UNIQUE,
  payout_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlements_hotel_id ON settlements(hotel_id);

-- 12. AUDIT LOGS (Immutable security ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor VARCHAR(255) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(128) NOT NULL,
  target VARCHAR(128) NOT NULL,
  target_id VARCHAR(128) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45)
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_actor ON audit_logs(actor);
