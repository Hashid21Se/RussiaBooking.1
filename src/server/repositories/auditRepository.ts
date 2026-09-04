/**
 * Audit Repository with Cryptographic Hash Chaining (Blockchain-like Immutable Ledger)
 * Guarantees tamper-evidence for sensitive financial, admin, and cancellation operations
 */

import crypto from 'crypto';
import { AuditLog } from '../../types';

export class AuditRepository {
  private logs: AuditLog[] = [];
  private latestHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis Hash

  /**
   * Computes SHA-256 hash of the audit entry including previous block's hash
   */
  private computeHash(
    previousHash: string,
    timestamp: string,
    actor: string,
    action: string,
    target: string,
    targetId: string,
    metadataStr: string
  ): string {
    const raw = `${previousHash}|${timestamp}|${actor}|${action}|${target}|${targetId}|${metadataStr}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public async log(entry: {
    actor: string;
    actorRole: string;
    action: string;
    target: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const timestamp = new Date().toISOString();
    const previousHash = this.latestHash;
    const metadataStr = JSON.stringify(entry.metadata || {});

    const hash = this.computeHash(
      previousHash,
      timestamp,
      entry.actor,
      entry.action,
      entry.target,
      entry.targetId,
      metadataStr
    );

    const logItem: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      previousHash,
      hash,
      ...entry,
    };

    this.latestHash = hash;
    this.logs.unshift(logItem);

    // Retain up to 2000 records
    if (this.logs.length > 2000) {
      this.logs.pop();
    }

    return logItem;
  }

  public async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    return this.logs.slice(0, limit);
  }

  /**
   * Mathematically audits the entire log ledger from genesis to tip
   * Returns validity status and exact index if tampering is detected
   */
  public verifyLedgerIntegrity(): { isValid: boolean; checkedRecords: number; error?: string } {
    if (this.logs.length === 0) {
      return { isValid: true, checkedRecords: 0 };
    }

    // Work in chronological order (from oldest to newest)
    const chronological = [...this.logs].reverse();
    let expectedPrevious = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < chronological.length; i++) {
      const item = chronological[i];
      if (item.previousHash !== expectedPrevious) {
        return {
          isValid: false,
          checkedRecords: i,
          error: `Audit chain broken at entry ID ${item.id}: previousHash mismatch.`,
        };
      }

      const recomputed = this.computeHash(
        item.previousHash,
        item.timestamp,
        item.actor,
        item.action,
        item.target,
        item.targetId,
        JSON.stringify(item.metadata || {})
      );

      if (recomputed !== item.hash) {
        return {
          isValid: false,
          checkedRecords: i,
          error: `Tampering detected at entry ID ${item.id}: calculated hash does not match stored hash.`,
        };
      }

      expectedPrevious = item.hash;
    }

    return { isValid: true, checkedRecords: chronological.length };
  }
}

export const auditRepository = new AuditRepository();
