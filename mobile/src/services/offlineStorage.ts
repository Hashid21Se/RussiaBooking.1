// ==============================================================================
// Offline Storage Engine for RussiaBooking Mobile App
// Stores confirmed vouchers, hotel details, and contact numbers locally
// ==============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineBookingVoucher {
  bookingId: string;
  confirmationCode: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  passportNumberMasked: string;
  totalPaid: number;
  currency: string;
  qrPayload: string;
  voucherPdfBase64?: string;
  cachedAt: string;
}

const OFFLINE_BOOKINGS_KEY = '@russiabooking_offline_vouchers';
const RECENT_SEARCHES_KEY = '@russiabooking_recent_searches';

export const saveBookingOffline = async (voucher: OfflineBookingVoucher): Promise<void> => {
  try {
    const existing = await getOfflineBookings();
    const filtered = existing.filter((b) => b.bookingId !== voucher.bookingId);
    const updated = [voucher, ...filtered];
    await AsyncStorage.setItem(OFFLINE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save booking offline:', error);
  }
};

export const getOfflineBookings = async (): Promise<OfflineBookingVoucher[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_BOOKINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineBookingVoucher[];
  } catch (error) {
    console.error('Failed to read offline bookings:', error);
    return [];
  }
};

export const removeOfflineBooking = async (bookingId: string): Promise<void> => {
  try {
    const existing = await getOfflineBookings();
    const updated = existing.filter((b) => b.bookingId !== bookingId);
    await AsyncStorage.setItem(OFFLINE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete offline booking:', error);
  }
};

export const clearAllOfflineData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([OFFLINE_BOOKINGS_KEY, RECENT_SEARCHES_KEY]);
  } catch (error) {
    console.error('Failed to clear offline storage:', error);
  }
};
