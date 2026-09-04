/**
 * Payment Controller
 * Idempotent Payment Intent Creation, Confirmation, and Webhook ingestion
 */

import { Router } from 'express';
import { paymentService } from '../services/paymentService';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Create Payment Intent (with rate limiter and idempotency)
router.post('/intent', rateLimit({ maxRequests: 20, windowSeconds: 60, keyPrefix: 'pay_intent' }), async (req, res) => {
  try {
    const idempotencyKey = 
      (req.headers['idempotency-key'] as string) || 
      req.body.idempotencyKey || 
      `idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const { bookingId, amountRub, amountTargetCurrency, targetCurrency, provider } = req.body;

    if (!bookingId || !amountRub || !amountTargetCurrency || !targetCurrency) {
      res.status(400).json({ success: false, error: 'Missing required payment parameters.' });
      return;
    }

    const intent = await paymentService.createPaymentIntent({
      bookingId,
      amountRub,
      amountTargetCurrency,
      targetCurrency,
      provider: provider || 'MADA',
      idempotencyKey
    });

    res.json({ success: true, ...intent });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Confirm Payment
router.post('/confirm', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      res.status(400).json({ success: false, error: 'Transaction ID is required.' });
      return;
    }

    const result = await paymentService.confirmPayment(transactionId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Bank Gateway Webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = (req.headers['x-webhook-signature'] as string) || '';
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
