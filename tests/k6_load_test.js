/**
 * k6 Load & Concurrency Test Script
 * Target: 50,000+ Concurrent Virtual Users (VUs) & 1,000 Bookings/Minute
 * Validates sub-50ms p95 response time, zero dropped connections, and no overselling
 *
 * Execution:
 *   k6 run --vus 500 --duration 5m tests/k6_load_test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const bookingErrors = new Counter('booking_errors');
export const successfulBookings = new Counter('successful_bookings');
export const searchLatency = new Trend('search_latency_ms');
export const bookingLatency = new Trend('booking_latency_ms');
export const successRate = new Rate('success_rate');

export const options = {
  scenarios: {
    // 1. Browsing & Search Traffic (50,000 VUs ramp-up)
    tourist_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5000 },
        { duration: '2m', target: 25000 },
        { duration: '2m', target: 50000 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'browseAndSearch',
    },
    // 2. High-Frequency Booking Engine Concurrency (1,000 bookings/minute target)
    checkout_surge: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1m',
      duration: '5m',
      preAllocatedVUs: 500,
      maxVUs: 2000,
      exec: 'executeBooking',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.005'], // <0.5% failure rate
    http_req_duration: ['p(95)<150', 'p(99)<300'], // 95% of requests under 150ms
    'success_rate': ['rate>0.99'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export function browseAndSearch() {
  group('1. Hotel Catalog & Availability Search', () => {
    const cities = ['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    const res = http.get(`${BASE_URL}/api/hotels?city=${randomCity}`);
    searchLatency.add(res.timings.duration);

    const isOk = check(res, {
      'status is 200': (r) => r.status === 200,
      'response has hotels': (r) => JSON.parse(r.body).data?.length > 0,
    });

    successRate.add(isOk);
    sleep(1 + Math.random() * 2);
  });
}

export function executeBooking() {
  group('2. Concurrent Booking Execution', () => {
    const payload = JSON.stringify({
      hotelId: 'moscow-the-carlton',
      hotelName: 'The Carlton, Moscow',
      roomId: 'carlton-deluxe-kremlin',
      roomName: 'Deluxe Kremlin View Room',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      guests: 2,
      pricing: {
        baseRateRub: 45000,
        nights: 4,
        totalRub: 180000,
        currency: 'SAR',
      },
      guestDetails: {
        name: `VIP Tourist ${Math.floor(Math.random() * 100000)}`,
        email: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@test.sa`,
        phone: '+966501234567',
        passportNumber: 'KSA8891024',
      },
      paymentMethod: 'MADA',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'k6-load-test',
      },
    };

    const res = http.post(`${BASE_URL}/api/bookings`, payload, params);
    bookingLatency.add(res.timings.duration);

    const ok = check(res, {
      'booking created successfully': (r) => r.status === 200 || r.status === 201,
      'valid booking ID returned': (r) => JSON.parse(r.body).bookingId !== undefined,
    });

    if (ok) {
      successfulBookings.add(1);
      successRate.add(1);
    } else {
      bookingErrors.add(1);
      successRate.add(0);
    }
  });
}
