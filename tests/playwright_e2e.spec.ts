/**
 * Playwright E2E Test Suite
 * Validates Full Customer Journey: (Search -> Room Selection -> KYC -> Payment -> Confirmation & Voucher)
 * Cross-Browser & Mobile Matrix: Chromium, WebKit (Safari), Mobile iOS & Android
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Customer End-to-End Journey (Cross-Browser & Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('Step 1 to 4: Search -> Select Hotel -> Checkout (Mada) -> Instant Voucher', async ({ page }) => {
    // 1. SEARCH: Fill search filters
    await expect(page.locator('h1')).toBeVisible();

    // Select City filter (Moscow)
    const cityInput = page.locator('input[placeholder*="المدينة"], input[placeholder*="City"]');
    if (await cityInput.isVisible()) {
      await cityInput.fill('Moscow');
    }

    // Trigger Search
    const searchBtn = page.locator('button:has-text("ابحث"), button:has-text("Search")');
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    }

    // 2. HOTEL CATALOG: Select First Hotel
    const hotelCards = page.locator('[data-testid="hotel-card"], .group:has(h3)');
    await expect(hotelCards.first()).toBeVisible();
    await hotelCards.first().click();

    // 3. ROOM SELECTION: Select room & click Reserve
    const bookNowBtn = page.locator('button:has-text("احجز الآن"), button:has-text("Book Now"), button:has-text("اختيار الغرفة")').first();
    await expect(bookNowBtn).toBeVisible();
    await bookNowBtn.click();

    // 4. CHECKOUT MODAL: Enter Guest & KYC Passport Info
    const nameInput = page.locator('input[name="name"], input[placeholder*="الاسم"], input[placeholder*="Full Name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('سعد بن خالد الراجحي');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('saad.alrajhi@example.sa');

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('+966501234567');

    const passportInput = page.locator('input[placeholder*="جواز"], input[placeholder*="Passport"]');
    if (await passportInput.isVisible()) {
      await passportInput.fill('KSA991024');
    }

    // Select Mada Payment Method
    const madaOption = page.locator('button:has-text("مدى"), button:has-text("MADA"), [data-method="MADA"]');
    if (await madaOption.isVisible()) {
      await madaOption.click();
    }

    // Accept PDPL Privacy & Terms
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit Payment & Confirm
    const submitBtn = page.locator('button:has-text("تأكيد ودفع"), button:has-text("Confirm & Pay")');
    await submitBtn.click();

    // 5. CONFIRMATION & VOUCHER: Verify booking reference and voucher details
    const confirmationHeader = page.locator('h2:has-text("تم تأكيد الحجز"), h2:has-text("Booking Confirmed")');
    await expect(confirmationHeader).toBeVisible({ timeout: 10000 });

    const voucherDownloadBtn = page.locator('button:has-text("تحميل الفاوتشر"), button:has-text("Download Voucher")');
    await expect(voucherDownloadBtn).toBeVisible();
  });

  test('Security Check: Admin Backoffice 2FA Gate Enforced', async ({ page }) => {
    await page.goto('/?view=admin');
    // Ensure 2FA Gate is displayed and prevents unauthenticated entry
    await expect(page.locator('text=المصادقة الثنائية الإلزامية (2FA), text=Two-Factor Authentication Required')).toBeVisible();

    // Test with invalid code
    const codeInput = page.locator('input[placeholder*="123456"]');
    await codeInput.fill('000000');
    await page.locator('button:has-text("التحقق والدخول")').click();

    await expect(page.locator('text=رمز الأمان غير صالح, text=Invalid code')).toBeVisible();

    // Test with valid demo code
    await codeInput.fill('123456');
    await page.locator('button:has-text("التحقق والدخول")').click();

    // Backoffice unlocked
    await expect(page.locator('text=OPERATIONS BACKOFFICE')).toBeVisible();
  });
});
