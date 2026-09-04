# دليل التوقيع الرقمي لتطبيقات الجوال (Mobile Code Signing Guide)
**المشروع:** RussiaBooking Mobile (iOS & Android)

---

## 1. توقيع تطبيق أندرويد (Google Play Console Code Signing)

### خطوة 1: توليد مفتاح التوقيع (Release Keystore)
قم بتشغيل الأمر التالي عبر Terminal لتوليد مفتاح تشفير RSA 2048-bit صالح لمدة 25 سنة:

```bash
keytool -genkeypair -v -keystore russiabooking-release.keystore \
  -alias russiabooking-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### خطوة 2: تهيئة ملف `android/gradle.properties`
أضف المتغيرات التالية مع استبدال كلمات المرور:

```properties
MYAPP_UPLOAD_STORE_FILE=russiabooking-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=russiabooking-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=SECURE_PASSWORD_HERE
MYAPP_UPLOAD_KEY_PASSWORD=SECURE_PASSWORD_HERE
```

### خطوة 3: بناء حزمة النشر المعتمدة AAB (Android App Bundle)
```bash
cd mobile
# باستخدام Expo EAS:
eas build --platform android --profile production

# أو محلياً عبر Gradle:
cd android && ./gradlew bundleRelease
```
يتم استخراج ملف الحزمة النهائي في:  
`android/app/build/outputs/bundle/release/app-release.aab` جاهز للرفع على مسار الإنتاج في Google Play Console.

---

## 2. توقيع تطبيق آبل (Apple Developer Program Code Signing)

### المتطلبات:
1. حساب Apple Developer مسجل ومفعّل ($99/سنة).
2. شهادة **Apple Distribution Certificate**.
3. ملف تعريف التوزيع **App Store Provisioning Profile** المربوط بمعرف الحزمة `com.russiabooking.app`.

### التوقيع الآلي السحابي عبر EAS:
```bash
cd mobile
eas build --platform ios --profile production
```
سيقوم Expo EAS بمزامنة المفاتيح والشهادات تلقائياً مع حسابك في Apple Developer، وتوليد ملف `RussiaBooking.ipa` الموقع والجاهز للرفع إلى TestFlight و App Store Connect.

### التوقيع اليدوي أو عبر Fastlane Match:
```bash
cd mobile
bundle exec fastlane match appstore
bundle exec fastlane ios release
```
يتم رفع الحزمة مباشرة إلى متجر App Store Connect للمراجعة والموافقة.
