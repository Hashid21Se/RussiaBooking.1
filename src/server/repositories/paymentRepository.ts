/**
 * Payment Repository
 * Idempotent ledger, transaction verification, and settlements
 */

import { PaymentTransaction, Settlement, PaymentStatus } from '../../types';

export class PaymentRepository {
  private transactions = new Map<string, PaymentTransaction>();
  private idempotencyStore = new Map<string, PaymentTransaction>();
  private settlements = new Map<string, Settlement>();

  public async findByBookingId(bookingId: string): Promise<PaymentTransaction | null> {
    for (const tx of this.transactions.values()) {
      if (tx.bookingId === bookingId) return tx;
    }
    return null;
  }

  public async findByIdempotencyKey(key: string): Promise<PaymentTransaction | null> {
    return this.idempotencyStore.get(key) || null;
  }

  public async recordTransaction(tx: PaymentTransaction): Promise<PaymentTransaction> {
    this.transactions.set(tx.id, tx);
    this.idempotencyStore.set(tx.idempotencyKey, tx);
    return tx;
  }

  public async updateStatus(id: string, status: PaymentStatus): Promise<PaymentTransaction | null> {
    const tx = this.transactions.get(id);
    if (!tx) return null;

    tx.status = status;
    if (status === 'CAPTURED') {
      tx.verifiedAt = new Date().toISOString();
    }
    this.transactions.set(id, tx);
    return tx;
  }

  // Settlements
  public async getSettlementsByHotelId(hotelId: string): Promise<Settlement[]> {
    return Array.from(this.settlements.values()).filter(s => s.hotelId === hotelId);
  }

  public async getAllSettlements(): Promise<Settlement[]> {
    return Array.from(this.settlements.values());
  }

  public async saveSettlement(settlement: Settlement): Promise<Settlement> {
    this.settlements.set(settlement.id, settlement);
    return settlement;
  }
}

export const paymentRepository = new PaymentRepository();
