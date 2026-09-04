// ==============================================================================
// RussiaBooking Native Mobile Application (React Native + Expo SDK 51)
// Features: Biometrics (Face ID/Touch ID), Offline Vouchers, Apple/Google Pay,
//           Push Notifications, Deep Linking, and Mandatory Store Policies
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
  setBiometricPreference,
  BiometricStatus,
} from './src/services/biometrics';
import {
  getOfflineBookings,
  saveBookingOffline,
  OfflineBookingVoucher,
} from './src/services/offlineStorage';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { initiateNativeMobilePayment } from './src/services/payment';
import { executeAccountDeletion } from './src/services/accountDeletion';

// Force RTL layout for Arabic interface
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type TabType = 'explore' | 'bookings' | 'account';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [offlineVouchers, setOfflineVouchers] = useState<OfflineBookingVoucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<string>('موسكو');
  const [showDeletionModal, setShowDeletionModal] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    // 1. Check biometrics
    const bio = await checkBiometricAvailability();
    setBiometricStatus(bio);
    if (bio.isEnabledByUser) {
      setIsLocked(true);
      const success = await authenticateWithBiometrics();
      if (success) {
        setIsLocked(false);
      }
    }

    // 2. Register push notifications
    await registerForPushNotificationsAsync();

    // 3. Hydrate offline bookings
    const saved = await getOfflineBookings();
    if (saved.length === 0) {
      // Seed an initial demo offline voucher for testing offline availability
      const sampleVoucher: OfflineBookingVoucher = {
        bookingId: 'BK-SA-882194',
        confirmationCode: 'RB-MOW-2026-99',
        hotelName: 'Four Seasons Hotel Moscow',
        hotelAddress: '2 Okhotny Ryad Street, Moscow',
        hotelPhone: '+7 499 277-71-00',
        roomType: 'Grand Premier King Suite',
        checkInDate: '2026-09-12',
        checkOutDate: '2026-09-16',
        guestName: 'سعد الراجحي / Saad Alrajhi',
        passportNumberMasked: 'KSA••••24',
        totalPaid: 9450,
        currency: 'SAR',
        qrPayload: 'RB-MOW-2026-99:SAAD-ALRAJHI:VERIFIED',
        cachedAt: new Date().toISOString(),
      };
      await saveBookingOffline(sampleVoucher);
      setOfflineVouchers([sampleVoucher]);
    } else {
      setOfflineVouchers(saved);
    }

    setLoading(false);
  };

  const handleUnlock = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setIsLocked(false);
    } else {
      Alert.alert('فشل التحقق', 'يرجى المحاولة مرة أخرى باستخدام البصمة أو رمز المرور');
    }
  };

  const handleToggleBiometric = async () => {
    if (!biometricStatus) return;
    const newState = !biometricStatus.isEnabledByUser;
    await setBiometricPreference(newState);
    setBiometricStatus({ ...biometricStatus, isEnabledByUser: newState });
    Alert.alert(
      'إعدادات الأمان',
      newState ? 'تم تفعيل الدخول بالبصمة/Face ID بنجاح' : 'تم تعطيل الدخول بالبصمة'
    );
  };

  const handleAppleGooglePayDemo = async () => {
    setIsProcessingPayment(true);
    const result = await initiateNativeMobilePayment({
      bookingId: `BK-${Date.now()}`,
      hotelName: 'The Carlton, Moscow',
      amount: 4850,
      currency: 'SAR',
      items: [{ label: 'إقامة جناح ديلوكس (3 ليالٍ)', amount: 4850 }],
    });
    setIsProcessingPayment(false);

    if (result.success) {
      Alert.alert(
        'تم الدفع وتأكيد الحجز!',
        `تمت معالجة الدفع الرقمي الآمن بنجاح.\nرقم المعاملة: ${result.transactionId}\nتم حفظ قسيمة الحجز للعمل دون اتصال بالإنترنت.`
      );
      // Save offline
      const newVoucher: OfflineBookingVoucher = {
        bookingId: `BK-${Date.now()}`,
        confirmationCode: `RB-${Math.floor(100000 + Math.random() * 900000)}`,
        hotelName: 'The Carlton, Moscow',
        hotelAddress: 'Tverskaya Street 3, Moscow',
        hotelPhone: '+7 495 225-88-88',
        roomType: 'Deluxe Kremlin View Room',
        checkInDate: '2026-10-01',
        checkOutDate: '2026-10-04',
        guestName: 'سعد الراجحي',
        passportNumberMasked: 'KSA••••24',
        totalPaid: 4850,
        currency: 'SAR',
        qrPayload: `VERIFIED-${Date.now()}`,
        cachedAt: new Date().toISOString(),
      };
      await saveBookingOffline(newVoucher);
      setOfflineVouchers((prev) => [newVoucher, ...prev]);
      setActiveTab('bookings');
    } else {
      Alert.alert('خطأ بالدفع', result.error);
    }
  };

  const handleAccountDeletion = async () => {
    const result = await executeAccountDeletion('user_current_id', 'hashedalrajhi@gmail.com');
    setShowDeletionModal(false);
    if (result.success) {
      setOfflineVouchers([]);
      Alert.alert('تم مسح الحساب', result.message);
    } else {
      Alert.alert('تنبيه', result.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>جاري تحميل منصة RussiaBooking...</Text>
      </SafeAreaView>
    );
  }

  // Biometric Lock Screen
  if (isLocked) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.lockCard}>
          <Text style={styles.lockTitle}>مرحبًا بك في RussiaBooking</Text>
          <Text style={styles.lockSub}>التطبيق مقفل لحماية بيانات حجوزاتك وجوازات السفر</Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock}>
            <Text style={styles.unlockBtnText}>فتح بواسطة Face ID / البصمة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F141C" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>RussiaBooking</Text>
          <Text style={styles.headerSubtitle}>فنادق روسيا الفاخرة | دفع بالريال والبطاقات الخليجية</Text>
        </View>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>⚡ وضع غير متصل متاح</Text>
        </View>
      </View>

      {/* Main Content Area based on Tab */}
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'explore' && (
          <View>
            {/* City Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
              {['موسكو', 'سانت بطرسبرغ', 'سوتشي', 'قازان'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityChip, selectedCity === city && styles.cityChipActive]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={[styles.cityText, selectedCity === city && styles.cityTextActive]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Featured Hotel Cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>أبرز الفنادق المختارة في {selectedCity}</Text>
            </View>

            <View style={styles.hotelCard}>
              <View style={styles.hotelCardContent}>
                <View style={styles.rowBetween}>
                  <Text style={styles.hotelName}>Four Seasons Hotel Moscow</Text>
                  <Text style={styles.hotelRating}>★ 4.9</Text>
                </View>
                <Text style={styles.hotelLocation}>الساحة الحمراء، موسكو • إطلالة الكرملين</Text>
                <Text style={styles.hotelPrice}>من 2,450 ر.س / ليلة</Text>
                <Text style={styles.hotelPerks}>✓ فطور حلال متوفر  ✓ فاوتشر تأشيرة فوري  ✓ خدمة كونسيرج عربي</Text>

                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={handleAppleGooglePayDemo}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.bookNowText}>
                    {isProcessingPayment ? 'جاري معالجة الدفع...' : 'حجز سريع عبر Apple Pay / Google Pay'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.hotelCard}>
              <View style={styles.hotelCardContent}>
                <View style={styles.rowBetween}>
                  <Text style={styles.hotelName}>The Carlton, Moscow</Text>
                  <Text style={styles.hotelRating}>★ 4.8</Text>
                </View>
                <Text style={styles.hotelLocation}>شارع تفيرسكايا 3، موسكو</Text>
                <Text style={styles.hotelPrice}>من 1,820 ر.س / ليلة</Text>
                <Text style={styles.hotelPerks}>✓ غرف عائلية متصلة  ✓ إلغاء مجاني حتى 48 ساعة</Text>

                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={handleAppleGooglePayDemo}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.bookNowText}>حجز سريع ببطاقة مدى / تمارا</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'bookings' && (
          <View>
            <Text style={styles.sectionTitle}>حجوزاتي والقسائم المحفوظة</Text>
            <Text style={styles.sectionSub}>
              جميع القسائم أدناه مخزنة محلياً على جهازك ويمكن إبرازها للفندق بدون اتصال إنترنت (Offline-Ready).
            </Text>

            {offlineVouchers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>لا توجد حجوزات محفوظة حالياً.</Text>
              </View>
            ) : (
              offlineVouchers.map((v) => (
                <View key={v.bookingId} style={styles.voucherCard}>
                  <View style={styles.voucherHeader}>
                    <Text style={styles.voucherCode}>{v.confirmationCode}</Text>
                    <Text style={styles.voucherStatus}>✓ مؤكد ومسدد</Text>
                  </View>
                  <Text style={styles.voucherHotel}>{v.hotelName}</Text>
                  <Text style={styles.voucherDates}>
                    الدخول: {v.checkInDate} | المغادرة: {v.checkOutDate}
                  </Text>
                  <Text style={styles.voucherGuest}>النزيل: {v.guestName} ({v.passportNumberMasked})</Text>
                  <Text style={styles.voucherAmount}>
                    المبلغ المسدد: {v.totalPaid.toLocaleString()} {v.currency}
                  </Text>

                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrText}>[ كود الاستجابة السريعة QR للتحقق السريع ]</Text>
                    <Text style={styles.qrSub}>{v.qrPayload}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'account' && (
          <View>
            <Text style={styles.sectionTitle}>إعدادات الحساب والأمان والخصوصية</Text>

            {/* Biometric Toggle Card */}
            <View style={styles.settingCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>تسجيل الدخول بالبصمة / Face ID</Text>
                  <Text style={styles.settingDesc}>
                    حماية التطبيق وقسائم السفر ببياناتك الحيوية
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    biometricStatus?.isEnabledByUser ? styles.toggleOn : styles.toggleOff,
                  ]}
                  onPress={handleToggleBiometric}
                >
                  <Text style={styles.toggleText}>
                    {biometricStatus?.isEnabledByUser ? 'مُفعّل' : 'معطّل'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Compliance: Account Deletion */}
            <View style={[styles.settingCard, { borderColor: '#F43F5E' }]}>
              <Text style={[styles.settingTitle, { color: '#F43F5E' }]}>
                حذف الحساب والبيانات الشخصية
              </Text>
              <Text style={styles.settingDesc}>
                التزاماً بإرشادات App Store و Google Play ونظام حماية البيانات الشخصية السعودي (PDPL)، يمكنك حذف حسابك بالكامل وإزالة كافة سجلاتك من النظام.
              </Text>
              <TouchableOpacity
                style={styles.deleteAccountBtn}
                onPress={() => setShowDeletionModal(true)}
              >
                <Text style={styles.deleteAccountText}>طلب حذف الحساب نهائياً</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Account Deletion Confirmation Modal */}
      <Modal visible={showDeletionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>تأكيد حذف الحساب نهائياً</Text>
            <Text style={styles.modalBody}>
              هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم محو جميع بيانات الهوية، وتاريخ الحجوزات، والقسائم المخزنة محلياً فوراً وبشكل لا يمكن استرجاعه.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAccountDeletion}
              >
                <Text style={styles.modalConfirmText}>تأكيد الحذف النهائي</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeletionModal(false)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'explore' && styles.navItemActive]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.navText, activeTab === 'explore' && styles.navTextActive]}>
            استكشاف الفنادق
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'bookings' && styles.navItemActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.navText, activeTab === 'bookings' && styles.navTextActive]}>
            حجوزاتي ({offlineVouchers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'account' && styles.navItemActive]}
          onPress={() => setActiveTab('account')}
        >
          <Text style={[styles.navText, activeTab === 'account' && styles.navTextActive]}>
            حسابي والخصوصية
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F141C',
  },
  lockContainer: {
    flex: 1,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  unlockBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offlineBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  cityScroll: {
    marginBottom: 16,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginLeft: 8,
  },
  cityChipActive: {
    backgroundColor: '#E11D48',
  },
  cityText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  cityTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'right',
  },
  sectionSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'right',
    lineHeight: 18,
  },
  hotelCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  hotelCardContent: {
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hotelName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
  },
  hotelRating: {
    color: '#FBBF24',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  hotelLocation: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'right',
  },
  hotelPrice: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'right',
  },
  hotelPerks: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'right',
  },
  bookNowBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookNowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  voucherCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  voucherHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  voucherStatus: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  voucherHotel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'right',
  },
  voucherDates: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'right',
  },
  voucherGuest: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'right',
  },
  voucherAmount: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  qrPlaceholder: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  qrText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qrSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  settingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 12,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  toggleOn: {
    backgroundColor: '#10B981',
  },
  toggleOff: {
    backgroundColor: '#64748B',
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  deleteAccountBtn: {
    backgroundColor: '#881337',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F43F5E',
  },
  deleteAccountText: {
    color: '#FFE4E6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F43F5E',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  modalConfirmBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalCancelBtn: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E11D48',
  },
  navText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
