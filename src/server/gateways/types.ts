/**
 * Gateway Architecture & Payment Domain Types
 * Strictly enforces:
 * 1. PCI-DSS compliance: No raw PAN/CVV accepted on backend
 * 2. Tokenized source objects (e.g. tok_mada_..., apple_pay_token_...)
 * 3. Idempotency keys with distributed replay protection
 * 4. Multi-Gateway Abstraction (Moyasar, Tap, Tamara, Tabby, Stripe)
 */

import { SupportedCurrency, PaymentMethodType, PaymentStatus } from '../../types';

export interface PaymentSourceToken {
  type: 'token' | 'apple_pay' | 'tamara' | 'tabby' | 'saved_card';
  token: string;
  brand: 'MADA' | 'VISA' | 'MASTERCARD' | 'APPLE_PAY' | 'KNET' | 'BENEFIT' | 'AMEX';
  last4: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
}

export interface GatewayChargeRequest {
  bookingId: string;
  bookingCode: string;
  amountRub: number;
  amountTargetCurrency: number;
  currency: SupportedCurrency;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  idempotencyKey: string;
  source: PaymentSourceToken;
  description?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface GatewayChargeResponse {
  success: boolean;
  transactionId: string;
  providerTransactionId: string;
  status: PaymentStatus;
  provider: PaymentMethodType;
  paidAmountRub: number;
  paidCurrency: SupportedCurrency;
  requiresRedirect: boolean;
  redirectUrl?: string;
  clientSecret?: string;
  installmentPlan?: {
    totalInstallments: number;
    amountPerInstallment: number;
    currency: SupportedCurrency;
    dueDates?: string[];
  };
  error?: string;
}

export interface GatewayRefundRequest {
  transactionId: string;
  providerTransactionId: string;
  bookingId: string;
  amountRub: number;
  amountTargetCurrency: number;
  currency: SupportedCurrency;
  reason: string;
}

export interface GatewayRefundResponse {
  success: boolean;
  refundId: string;
  providerRefundId: string;
  refundedAmountRub: number;
  refundedAmountTargetCurrency: number;
  currency: SupportedCurrency;
  status: 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
  error?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventType: 'charge.captured' | 'charge.failed' | 'refund.created' | 'dispute.opened' | 'unknown';
  transactionId?: string;
  providerTransactionId?: string;
  amount?: number;
  currency?: SupportedCurrency;
  payload: any;
  error?: string;
}

export interface IPaymentGateway {
  name: string;
  supportedMethods: PaymentMethodType[];
  createCharge(req: GatewayChargeRequest): Promise<GatewayChargeResponse>;
  verifyWebhook(rawPayload: string | Buffer, signature: string, headers?: Record<string, string | string[] | undefined>): Promise<WebhookVerificationResult>;
  processRefund(req: GatewayRefundRequest): Promise<GatewayRefundResponse>;
}
