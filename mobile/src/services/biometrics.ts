// ==============================================================================
// Biometric Authentication Service (Face ID / Touch ID / Android BiometricPrompt)
// ==============================================================================

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@russiabooking_biometric_enabled';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  isEnabledByUser: boolean;
}

export const checkBiometricAvailability = async (): Promise<BiometricStatus> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypesNum = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    const supportedTypes: string[] = [];
    if (supportedTypesNum.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      supportedTypes.push('Face ID');
    }
    if (supportedTypesNum.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      supportedTypes.push('Touch ID / بصمة الإصبع');
    }

    const savedPref = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const isEnabledByUser = savedPref === 'true';

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      isEnabledByUser,
    };
  } catch (error) {
    console.error('Biometric check failed:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      isEnabledByUser: false,
    };
  }
};

export const setBiometricPreference = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const authenticateWithBiometrics = async (
  promptMessage = 'يرجى المصادقة بالبصمة أو الوجه للوصول إلى حجوزاتك'
): Promise<boolean> => {
  try {
    const status = await checkBiometricAvailability();
    if (!status.hasHardware || !status.isEnrolled) {
      return true; // Bypass if device lacks biometric hardware
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'إلغاء',
      fallbackLabel: 'استخدام رمز المرور',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
};
