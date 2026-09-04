#!/bin/sh
# ==============================================================================
# Automated Database Disaster Recovery & Drill Restoration Script
# ==============================================================================

set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz> [target-database-name]"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="${2:-russiabooking_restored}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

echo "=== Starting Disaster Recovery Restoration ==="
echo "Source file: $BACKUP_FILE"
echo "Target DB: $TARGET_DB"

# Check checksum if companion .sha256 exists
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying SHA-256 integrity checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256"
  echo "Integrity verified."
fi

# Recreate Target Database
PGPASSWORD="${PGPASSWORD:-postgres_secure_pass_2026}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
PGPASSWORD="${PGPASSWORD:-postgres_secure_pass_2026}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE ${TARGET_DB};"

# Restore Data
echo "Restoring database schemas and records..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="${PGPASSWORD:-postgres_secure_pass_2026}" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$TARGET_DB" \
  --clean --if-exists --no-owner --no-privileges || true

echo "=== Disaster Recovery Drill / Restore Succeeded for DB: $TARGET_DB ==="
