/**
 * OWASP Recommended Security Headers & Input Sanitization Middleware
 * Configured to allow embedding within Google AI Studio preview iframes
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Applies HTTP Security Headers compatible with AI Studio preview iframes
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Allow iframe embedding by Google AI Studio and Cloud Run previews
  // Note: We do NOT set X-Frame-Options: SAMEORIGIN because the app runs inside an iframe in AI Studio.
  // Instead, frame-ancestors in Content-Security-Policy safely controls framing.
  
  // Legacy XSS filter activation
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Content Security Policy (CSP) allowing Google AI Studio iframe embedding and PWA workers
  const cspDirectives = [
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "style-src 'self' 'unsafe-inline' https: fonts.googleapis.com",
    "font-src 'self' https: data: fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https: http: wss: ws:",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.run.app",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  next();
};

/**
 * Deep Input Sanitization against XSS
 * Strips script tags, evil attributes, and javascript: protocols recursively
 */
export function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (typeof val === 'object' && val !== null) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return val;
}

export const xssSanitizationMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
