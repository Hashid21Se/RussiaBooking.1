# دليل النشر والتشغيل على بيئة الإنتاج (Production Deployment Guide)
**المشروع:** RussiaBooking Enterprise Platform  
**تاريخ التحديث:** سبتمبر 2026  

---

## 1. الخيارات المعمارية للنشر (Deployment Target Architectures)

تم تصميم المنصة كحاوية متكاملة (Dockerized Express 5 + Vite + React 18) متوافقة مع كافة البيئات السحابية القياسية:
- **الخيار الأول (الموصى به - GCP):** Google Cloud Run (Serverless Container) + Cloud SQL PostgreSQL 16 + Memorystore Redis.
- **الخيار الثاني (AWS):** AWS ECS Fargate + Aurora PostgreSQL Serverless v2 + ElastiCache Redis + CloudFront CDN.
- **الخيار الثالث (Hybrid):** Vercel (واجهة الويب Frontend) + خادم API مستقل على Cloud Run / Render مع إعدادات الـ CORS وترويسات الأمان.

---

## 2. خطوات النشر خطوة بخطوة على Google Cloud Run

### الخطوة 1: تهيئة الأدوات والمشروع
```bash
# تسجيل الدخول وتحديد المشروع السحابي
gcloud auth login
gcloud config set project russiabooking-prod

# تفعيل الواجهات السحابية اللازمة
gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com
```

### الخطوة 2: إنشاء قاعدة البيانات وسجلات الأسرار
```bash
# إنشاء قاعدة بيانات PostgreSQL 16
gcloud sql instances create russiabooking-db \
  --database-version=POSTGRES_16 \
  --tier=db-custom-2-7680 \
  --region=me-central1 \
  --availability-type=REGIONAL \
  --storage-auto-increase

# حفظ الأسرار في Secret Manager
echo -n "your-64-character-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-32-byte-hex-encryption-key" | gcloud secrets create ENCRYPTION_KEY --data-file=-
```

### الخطوة 3: بناء صورة Docker ورفعها لسجل الحاويات
```bash
# بناء الصورة باستخدام Dockerfile متعدد المراحل
gcloud builds submit --tag gcr.io/russiabooking-prod/app:latest
```

### الخطوة 4: تشغيل الخدمة على Cloud Run
```bash
gcloud run deploy russiabooking-prod \
  --image gcr.io/russiabooking-prod/app:latest \
  --platform managed \
  --region me-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 2 \
  --max-instances 50 \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,PORT=3000" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest"
```

---

## 3. ربط النطاق المخصص وتفعيل شهادة SSL (Custom Domain & SSL)

1. **الربط السحابي التلقائي:**
   ```bash
   gcloud run domain-mappings create --service russiabooking-prod --domain russiabooking.com
   ```
2. **إعداد سجلات الـ DNS لدى مزود النطاق (Cloudflare / Namecheap):**
   - أضف سجل `A` يشير إلى العناوين التي تظهر في مخرجات الأمر أعلاه.
   - أضف سجل `CNAME` للنطاق الفرعي `www.russiabooking.com`.
3. **شهادة SSL مجانية ومجددة تلقائياً:**
   - يقوم Google Cloud أو Cloudflare بإصدار وتثبيت شهادة SSL TLS 1.3 مجانية مع تفعيل التجديد التلقائي قبل الانتهاء بـ 30 يوماً.

---

## 4. الفحص الصحي بعد النشر (Post-Deployment Sanity Verification)
```bash
# 1. التحقق من سلامة الخدمة والاستجابة
curl -I https://russiabooking.com/api/health

# 2. فحص ترويسات الأمان
curl -I https://russiabooking.com/ | grep -E "X-Content-Type-Options|Content-Security-Policy"

# 3. فحص مقاييس Prometheus
curl -s https://russiabooking.com/api/metrics
```
