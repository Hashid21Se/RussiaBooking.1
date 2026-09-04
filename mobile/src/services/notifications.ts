// ==============================================================================
// Push Notification Service (Booking confirmations, reminders & promotional alerts)
// ==============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    token = expoPushToken.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('booking_updates', {
        name: 'تحديثات الحجز وسندات الفنادق',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E11D48',
      });
    }

    return token;
  } catch (error) {
    console.error('Error during push notification registration:', error);
    return null;
  }
};

export const scheduleBookingReminderNotification = async (
  hotelName: string,
  checkInDate: string
): Promise<string> => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `رحلتك القادمة إلى ${hotelName}`,
      body: `تذكير بموعد تسجيل الوصول بتاريخ ${checkInDate}. احرص على إبراز قسيمة الحجز وجواز السفر عند مكتب الاستقبال.`,
      data: { type: 'REMINDER', hotelName },
    },
    trigger: {
      seconds: 5, // Instant or scheduled based on timestamp in production
    },
  });
};
