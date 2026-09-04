/**
 * Gateway Manager & Payment Orchestration Engine
 * Enforces:
 * 1. Gateway resolution by payment method (Mada, Tamara, Tap, Stripe)
 * 2. Distributed Idempotency enforcement with collision locks
 * 3. HMAC webhook routing
 * 4. Refund gateway execution
 */

import { IPaymentGateway, GatewayChargeRequest, GatewayChargeResponse, GatewayRefundRequest, GatewayRefundResponse, WebhookVerificationResult } from './types';
import { MoyasarGateway } from './moyasarGateway';
import { TamaraGateway } from './tamaraGateway';
import { TapGateway } from './tapGateway';
import { StripeGateway } from './stripeGateway';
import { PaymentMethodType } from '../../types';
import { redisClient } from '../redis/redisClient';

class GatewayManager {
  private gateways: Record<string, IPaymentGateway>;
  private inMemoryIdempotencyStore = new Map<string, GatewayChargeResponse>();

  constructor() {
    this.gateways = {
      Moyasar: new MoyasarGateway(),
      Tamara: new TamaraGateway(),
      Tap: new TapGateway(),
      Stripe: new StripeGateway(),
    };
  }

  public resolveGateway(method: PaymentMethodType): IPaymentGateway {
    switch (method) {
      case 'MADA':
        return this.gateways.Moyasar;
      case 'TAMARA':
        return this.gateways.Tamara;
      case 'TAP':
        return this.gateways.Tap;
      case 'CREDIT_CARD':
        return this.gateways.Moyasar; // Default to Moyasar for GCC Mada/Visa, or Stripe for international
      case 'SANDBOX':
      default:
        return this.gateways.Moyasar;
    }
  }

  /**
   * Process Charge with Strict Distributed Idempotency
   */
  public async executeChargeWithIdempotency(req: GatewayChargeRequest): Promise<GatewayChargeResponse> {
    const idempotencyCacheKey = `idemp:charge:${req.idempotencyKey}`;

    // 1. Check Redis / Memory Idempotency Cache
    const cachedResponse = await redisClient.get<GatewayChargeResponse>(idempotencyCacheKey);
    if (cachedResponse) {
      console.log(`[Idempotency] Returning cached response for key: ${req.idempotencyKey}`);
      return cachedResponse;
    }

    if (this.inMemoryIdempotencyStore.has(req.idempotencyKey)) {
      console.log(`[Idempotency] Returning in-memory cached response for key: ${req.idempotencyKey}`);
      return this.inMemoryIdempotencyStore.get(req.idempotencyKey)!;
    }

    // 2. Acquire critical section lock to prevent concurrent double-charge attempts
    const lockKey = `lock:idemp:${req.idempotencyKey}`;
    const lock = await redisClient.acquireLock(lockKey, 15000); // 15s critical section
    if (!lock) {
      throw new Error('A payment with this idempotency key is already in progress. Please wait.');
    }

    try {
      // Re-check cache under lock
      const doubleCheck = await redisClient.get<GatewayChargeResponse>(idempotencyCacheKey);
      if (doubleCheck) {
        return doubleCheck;
      }

      const gateway = this.resolveGateway(req.source.brand === 'MADA' ? 'MADA' : req.source.type === 'tamara' ? 'TAMARA' : 'CREDIT_CARD');
      const response = await gateway.createCharge(req);

      // Save to idempotency store (24 hours TTL)
      await redisClient.set(idempotencyCacheKey, response, 86400);
      this.inMemoryIdempotencyStore.set(req.idempotencyKey, response);

      return response;
    } finally {
      await redisClient.releaseLock(lock);
    }
  }

  /**
   * Route Webhook to Appropriate Gateway for HMAC Verification
   */
  public async verifyWebhook(gatewayName: string, rawPayload: string | Buffer, signature: string): Promise<WebhookVerificationResult> {
    const gateway = this.gateways[gatewayName] || this.gateways.Moyasar;
    return gateway.verifyWebhook(rawPayload, signature);
  }

  /**
   * Dispatch Refund to Appropriate Gateway
   */
  public async executeRefund(gatewayMethod: PaymentMethodType, req: GatewayRefundRequest): Promise<GatewayRefundResponse> {
    const gateway = this.resolveGateway(gatewayMethod);
    return gateway.processRefund(req);
  }

  public getAllGateways(): { name: string; supportedMethods: PaymentMethodType[] }[] {
    return Object.values(this.gateways).map(g => ({
      name: g.name,
      supportedMethods: g.supportedMethods
    }));
  }
}

export const gatewayManager = new GatewayManager();
