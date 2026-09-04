-- ==============================================================================
-- Initial Database Setup Script for RussiaBooking PostgreSQL 16
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Audit Schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Set timezone to UTC
SET timezone = 'UTC';

-- Comment indicating successful initialization
COMMENT ON SCHEMA public IS 'RussiaBooking core schema with multi-currency and security extensions';
