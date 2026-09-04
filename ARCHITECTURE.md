# RussiaBooking — وثيقة المعمارية الهندسية الشاملة (Production Architecture Plan)
**الإصدار:** 1.0.0-PROD  
**تاريخ الإعداد:** سبتمبر 2026  
**الفريق الهندسي:** Senior Full-Stack, Software Architect, QA, DevOps, Product, Security  

---

## 1. تقرير التدقيق الشامل والفجوات (Comprehensive Gap Analysis)

### 1.1 ملخص فحص المكونات الحالية
تم فحص كافة ملفات المشروع في (`src/`, `server.ts`, `src/server/*`, `src/components/`, `src/lib/`):

| المجال | الوضع الحالي (Current Prototype) | المتطلبات الإنتاجية (Production Standard) | الفجوة والمخاطر (Gap & Risk) |
| :--- | :--- | :--- | :--- |
| **قاعدة البيانات والتخزين** | مصفوفات في الذاكرة (`LocalDatabaseProvider`, `in-memory arrays`) | قاعدة بيانات علائقية موثوقة (PostgreSQL) مع Drizzle ORM أو Prisma + Redis Cluster | فقدان كامل للبيانات عند إعادة تشغيل الحاوية أو التوسع الأفقي (Multi-instance race conditions). |
| **المصادقة والصلاحيات (AuthN/AuthZ)** | محاكاة عبر البريد الإلكتروني أو باراميترات وهمية (`actor: 'admin'`, `userId: 'guest-user'`) | مصفوفة أمان مبنية على JWT + HttpOnly Cookies، RBAC (Customer, Hotel Partner, Admin, Auditor) مع MFA | ثغرة انتحال شخصية (Privilege Escalation) وحقن بيانات بلا تحقق من الهوية. |
| **إدارة المخزون والتزامن (Concurrency)** | فحص لحظي بسيط في الذاكرة دون قفل موزع | محرك حجز مدعوم بـ Distributed Locks (Redis Redlock / DB row-level locking `SELECT ... FOR UPDATE`) | حجز مزدوج للغرفة الواحدة (Double Booking / Overbooking) عند تزامن الدفع. |
| **بوابات الدفع والأمان** | محاكاة وتجهيز هياكل Intent دون ربط فعلي بمفاتيح الإنتاج؛ Webhooks بدون تحقق من توقيع HMAC | بوابات دفع خليجية حقيقية (Mada, Tamara, Tap Payments, HyperPay, Apple Pay) مع Webhook Signature Verification | خطر التلاعب بالدفع (Payment Tampering) وقبول طلبات غير مسددة فعلياً. |
| **أمن البيانات والخصوصية (OWASP & PII)** | بيانات الجوازات والاتصال مخزنة بنص صريح (Plaintext) في الذاكرة | تشفير البيانات الحساسة (Field-Level Encryption AES-256-GCM) متوافق مع NDMO وGDPR | تسرب بيانات الهوية وجوازات السفر للمسافرين الدوليين. |
| **لوحة تحكم الفنادق (Partner Extranet)** | لوحة إدارية موحدة بسيطة (`AdminPortalView.tsx`) | لوحة مخصصة للشركاء (Hotel Partner Extranet) لإدارة الغرف والأسعار والتوافر وتقارير الإشغال | عدم قدرة الفنادق على تحديث أسعارها ومخزونها بشكل مستقل. |
| **تطبيقات الجوال (Mobile Apps)** | تطبيق ويب تقدمي PWA فقط | مشروع React Native / Expo موحد أو Flutter جاهز لإنتاج حزم Android (AAB/APK) و iOS (IPA) | غياب الحضور الرسمي على متاجر Google Play Store و Apple App Store. |
| **المراقبة والاستقرار (Observability)** | تسجيل بسيط `console.log` | سجلات مهيكلة (Pino / OpenTelemetry)، تتبع الأخطاء (Sentry)، ومقاييس الأداء (Prometheus/Grafana) | تعذر رصد الأعطال الإنتاجية وحوادث الدفع في الوقت الفعلي. |
| **إدارة المهام الخلفية (Async Jobs)** | توليد PDF وإرسال الإشعارات داخل دورة طلب العميل (Client Request Loop) | طابور مهام غير متزامن (BullMQ / Redis) مع عمال منفصلين (Workers) للبريد، WhatsApp، وإصدار الفاوتشر | بطء الاستجابة وفشل الطلب عند تعليق عمليات توليد المستندات أو إرسال الرسائل. |

---

## 2. قرار البنية المعمارية للمستودع: Monorepo vs Multi-repo

### القرار المعتمد: Monorepo باستخدام Turborepo + pnpm Workspaces
تم اختيار بنية **Monorepo** للأسباب الهندسية التالية:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   RUSSIA-BOOKING MONOREPO (Turborepo)                   │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   apps/web       │   apps/mobile    │   apps/partner  │   apps/admin   │
│ (Next.js / Vite) │  (Expo / React   │ (Partner Hotel  │ (Master Admin  │
│   Public Booking │     Native)      │    Extranet)    │    Console)    │
├──────────────────┴──────────────────┴─────────────────┴────────────────┤
│                              packages/                                 │
│  ├─ packages/core-types     (Shared TypeScript DTOs, Enums, Contracts) │
│  ├─ packages/validation     (Zod Schemas shared between Frontend & API)│
│  ├─ packages/api-client     (Type-safe RPC / TanStack Query client)    │
│  ├─ packages/ui-tokens      (Tailwind tokens, RTL & GCC themes, fonts) │
│  └─ packages/i18n           (Arabic, English, Russian locale bundles)  │
├────────────────────────────────────────────────────────────────────────┤
│                           services/backend                             │
│       Node.js / Express or Fastify + Drizzle ORM + Redis + Worker      │
└────────────────────────────────────────────────────────────────────────┘
```

#### تحليل المفاضلة والخيارات (Trade-offs):
1. **مشاركة العقود والأنواع (Single Source of Truth):**
   - تغيير أي حقل في حجز الفندق أو كائن الدفع ينعكس فوراً وبشكل نوعي (Type-safe) على تطبيق الويب، تطبيق الجوال، ومتحكمات الـ API.
2. **سرعة التطوير والـ CI/CD الموحد:**
   - خط بناء مؤتمت يختبر التغييرات المشتركة مرة واحدة مع ميزة Remote Caching لتسريع الاختبارات.
3. **تجنب تكرار الكود:**
   - منطق تحويل العملات (RUB, SAR, AED, USD)، حساب الضرائب الفندقية، فحص صلاحية التواريخ، ومصفوفات اللغات (RTL) يتم كتابتها واختبارها في حزمة مركزية واحدة.

---

## 3. مخطط البنية المعمارية للنظام (End-to-End System Architecture Diagram)

```
                              ┌───────────────────────────┐
                              │  Cloudflare CDN & WAF     │
                              │  (DDoS, SSL/TLS, Geo-DNS) │
                              └─────────────┬─────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               │                                                         │
   [Web Client: React 19 + Vite]                               [Mobile Apps: React Native]
   - Responsive & RTL First (Arabic/GCC)                       - iOS (IPA) / Android (AAB)
   - PWA Offline Storage + Service Worker                      - Biometric Auth & Offline Vouchers
   - TanStack Query Cache                                      - Push Notifications (FCM / APNs)
               │                                                         │
               └────────────────────────────┬────────────────────────────┘
                                            │ HTTPS / WSS / REST
                                            ▼
                              ┌───────────────────────────┐
                              │ API Gateway / Reverse     │
                              │ Proxy (Nginx / Cloud Run) │
                              │ Rate Limit & Security     │
                              └─────────────┬─────────────┘
                                            │
 ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
 │                               BACKEND SERVICES LAYER                                │
 │                                                                                     │
 │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
 │  │ Auth Service     │  │ Inventory Engine │  │ Booking Engine   │  │ Payment Svc │ │
 │  │ - JWT / HttpOnly │  │ - Multi-Provider │  │ - State Machine  │  │ - Mada/Tap  │ │
 │  │ - RBAC + MFA     │  │ - Real-time Sync │  │ - 15-min Hold    │  │ - Tamara    │ │
 │  │ - Passport PII   │  │ - Dynamic Rates  │  │ - Anti-Overbook  │  │ - Webhooks  │ │
 │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘ │
 └───────────┼─────────────────────┼─────────────────────┼────────────────────┼────────┘
             │                     │                     │                    │
             ▼                     ▼                     ▼                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │                               DATA & MESSAGING LAYER                                │
 │                                                                                     │
 │  ┌──────────────────────────────┐                ┌───────────────────────────────┐  │
 │  │ PostgreSQL (Primary Relational)│               │ Redis (Cluster / Memorystore) │  │
 │  │ - Hot Table Partitioning     │                │ - Distributed Locks (Redlock) │  │
 │  │ - Encrypted PII Columns      │                │ - Idempotency & Rate Limiting │  │
 │  │ - Full-Text Search (AR/EN/RU)│                │ - BullMQ Task Queues          │  │
 │  └──────────────────────────────┘                └───────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────────────┘
             ▲                                                                │
             │                                                                ▼
 ┌───────────┴───────────────────────┐              ┌─────────────────────────────────┐
 │ External Inventory & GDS Connectors│              │ Asynchronous Background Workers │
 │ - Bronevik Russian Hotel GDS      │              │ - PDF Voucher Generator (Puppet)│
 │ - Ostrovok / Bnovo Channel Mgr    │              │ - WhatsApp & SMS Alerts (Twilio)│
 │ - Direct Extranet Hotel Contracts │              │ - E-Visa Document Dispatcher    │
 └───────────────────────────────────┘              └─────────────────────────────────┘
```

---

## 4. تصميم الطبقات الهندسية (Architectural Layers Specification)

### 4.1 طبقة الواجهة الأمامية للويب (Web Client Architecture)
- **الإطار:** React 19 + TypeScript + Vite.
- **التصميم وتجربة المستخدم:** Tailwind CSS v4، دعم كامل وفوري للغة العربية والإنجليزية واتجاه القراءة (RTL/LTR)، لوحة ألوان دافئة ومريحة للمسافرين الخليجيين.
- **إدارة الحالة والبيانات:** TanStack Query v5 لإدارة التخزين المؤقت للطلبات (Stale-while-revalidate)، وحالة الواجهة عبر Zustand.
- **توليد الوثائق الرسمية:** محرك ثنائي لتوليد قسيمة الحجز المعتمدة رسمياً (PDF Voucher):
  - توليد محلي فوري للمعاينة السريعة عبر `jspdf` و `html2canvas`.
  - توليد خلفي عالي الدقة عبر Background Worker للطباعة الجمركية وتأشيرة الدخول الإلكترونية (E-Visa).

### 4.2 طبقة تطبيقات الجوال (Mobile Apps Architecture)
- **المنصة المعتمدة:** React Native مع Expo Application Services (EAS).
- **أهداف التوزيع:**
  - **Android:** توليد ملفات `.aab` متوافقة مع متطلبات Google Play Store و`.apk` للتثبيت المباشر.
  - **iOS:** توليد ملفات `.ipa` مخصصة لـ TestFlight وApple App Store.
- **الميزات الأصلية المدمجة:**
  - فتح وقفل التطبيق عبر القياسات الحيوية (Face ID / Fingerprint).
  - حفظ القسائم وتذاكر الحجز بدون إنترنت داخل Apple Wallet / Google Wallet.
  - إشعارات فورية بحالة تأكيد الحجز ورمز التأشيرة السياحية الروسية.

### 4.3 طبقة الواجهات الخلفية (Backend API & Domain Services)
- **الإطار:** Node.js (TypeScript) + Express / Fastify.
- **الهيكل الميداني (Domain-Driven Design):**
  1. `InventoryDomain`: إدارة الفنادق، الغرف، خطط الأسعار (Room Rates)، وتوافر الأسرة.
  2. `BookingDomain`: دورة حياة الحجز وآلة الحالة (`PENDING_PAYMENT` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED`).
  3. `PaymentDomain`: التفاعل مع بوابات الدفع، التوفيق المالي (Reconciliation)، ومنع السحب المزدوج (Idempotency Key).
  4. `NotificationDomain`: قوالب الرسائل ثنائية اللغة (عربي/إنجليزي) لـ WhatsApp والبريد الإلكتروني.
  5. `PartnerDomain`: واجهة خاصة بالفنادق الشريكة لإدارة الحصص والتحويلات المالية بالروبل.

### 4.4 نموذج البيانات وقاعدة البيانات (Relational Schema Design)
تعتمد المنصة مخططاً علائقياً (PostgreSQL Schema) يتضمن:
- `users`: بيانات المستخدمين، التشفير، الأدوار (`CUSTOMER`, `HOTEL_PARTNER`, `ADMIN`).
- `hotels`: الفنادق الشريكة، الاعتماد السياحي الروسي، الموقع الجغرافي، المرافق الحلال واللغة العربية.
- `rooms` & `room_rates`: الغرف، السعة القصوى، سياسة الإلغاء، ووجبات الإفطار.
- `inventory_allotments`: عدد الغرف المتاحة يومياً لكل خطة سعر مع قفل تزامن.
- `bookings`: بيانات الحجز المالية (الروبل والريال)، كود الحجز المرجعي، تفاصيل النزلاء.
- `payments`: القيود المالية، كود التحقق من بوابة الدفع، مفتاح عدم التكرار (Idempotency).
- `audit_logs`: سجلات الرقابة الإدارية والأمنية غير القابلة للتعديل (Immutable Append-only).

### 4.5 طبقة الأمان وحماية البيانات (Security & OWASP Compliance)
1. **حماية أرقام الجوازات والبيانات الشخصية (PII Encryption):**
   - تشفير حقول أرقام الجوازات وتواريخ الميلاد باستخدام خوارزمية `AES-256-GCM` ومفتاح تشفير مدار عبر KMS.
2. **منع الاحتيال وهجمات الحرمان من الخدمة (Rate Limiting & Anti-Bruteforce):**
   - تحديد سقف الطلبات عبر Redis Token Bucket:
     - 10 طلبات/دقيقة لمسارات الدفع `/api/payments/intent`.
     - 5 محاولات/15 دقيقة لمسارات تسجيل الدخول.
3. **أمن جلسات الدفع والـ Webhooks:**
   - اشتراط التحقق من توقيع HMAC SHA-256 لجميع إشعارات البنوك قبل تغيير حالة أي حجز إلى `CONFIRMED`.
   - عدم تخزين أي بيانات بطاقات ائتمانية (لا PAN ولا CVV) والاعتماد الكامل على التوكن المشفر (Tokenization) من Mada / Tap.

---

## 5. استراتيجية الجودة والاختبارات (QA Strategy)

| نوع الاختبار (Test Type) | الأداة المعتمدة | نطاق التغطية (Target Scope) |
| :--- | :--- | :--- |
| **Unit Testing** | Vitest | حساب أسعار الغرف بالروبل والريال، منطق الضرائب، وفك تشفير الجوازات (هدف: 90%+). |
| **Integration Testing** | Supertest + Testcontainers | مسارات API الحجز والدفع والتحقق من آلة الحالة في قاعدة البيانات. |
| **E2E Testing** | Playwright | سيناريو كامل: البحث في موسكو -> اختيار الغرفة -> إدخال بيانات النزيل -> الدفع -> تحميل الفاوتشر. |
| **Load Testing** | k6 | اختبار تحمل 500 طلب حجز متزامن في الثانية والتأكد من عدم حدوث Overbooking. |
| **Security Scanning** | Snyk + OWASP ZAP | فحص ثغرات الاعتماديات وفحص حقن SQL أو XSS. |

---

## 6. خطة واستراتيجية النشر والـ DevOps (CI/CD & Cloud Infrastructure)

1. **البيئة السحابية:** Google Cloud Platform (Cloud Run لخدمات الـ API، Cloud SQL PostgreSQL، وMemorystore Redis).
2. **أنابيب النشر المؤتمتة (GitHub Actions Workflows):**
   - `ci-lint-test.yml`: تدقيق الكود، فحص الأنواع، وتشغيل الاختبارات الوحدوية عند كل Pull Request.
   - `deploy-production-web.yml`: بناء حزم الويب، تحديث الـ CDN، ونشر حاويات الخادم على Cloud Run.
   - `build-mobile-apps.yml`: بناء حزم الـ Android (`.aab`) والـ iOS (`.ipa`) عبر EAS CLI وتوقيع الشهادات الرقمية.
3. **النسخ الاحتياطي واستعادة الكوارث (Backup & DR):**
   - نسخ احتياطي يومي آلي لقاعدة البيانات مع Point-in-Time Recovery (PITR) لمدة 30 يوماً، واختبار استعادة دوري كل أسبوع.

---

## 7. خارطة طريق التنفيذ (Execution Roadmap)

- [x] **المرحلة 1:** التدقيق الهندسي الشامل، تقرير الفجوات، وتوثيق المعمارية في `ARCHITECTURE.md`.
- [ ] **المرحلة 2:** تأسيس بنية المستودع المنظم (Monorepo Packages) ومشاركة الأنواع DTOs ونماذج التحقق Zod.
- [ ] **المرحلة 3:** بناء طبقة قاعدة البيانات الحقيقية (PostgreSQL + Drizzle/Prisma) مع التشفير وآلية القفل الموزع.
- [ ] **المرحلة 4:** تطوير لوحة تحكم الفنادق الشريكة (Partner Extranet) لتمكين الفنادق الروسية من إدارة الغرف.
- [ ] **المرحلة 5:** تجهيز مشروع تطبيق الجوال (React Native / Expo) وتوليد إعدادات الحزم لـ Android و iOS.
- [ ] **المرحلة 6:** أتمتة الاختبارات الشاملة (Unit, Integration, E2E) وخط أنابيب النشر المستمر CI/CD.
