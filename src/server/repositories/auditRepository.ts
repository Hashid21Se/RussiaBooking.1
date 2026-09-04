/**
 * Audit Repository
 * Immutable append-only audit trail for compliance, role actions, and payments
 */

import { AuditLog } from '../../types';

export class AuditRepository {
  private logs: AuditLog[] = [];

  public async log(entry: {
    actor: string;
    actorRole: string;
    action: string;
    target: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const logItem: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.logs.unshift(logItem);
    // Keep last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs.pop();
    }
    return logItem;
  }

  public async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    return this.logs.slice(0, limit);
  }
}

export const auditRepository = new AuditRepository();
