import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

// Foreground pushes are shown as a banner; the in-app notice list (Avisos) is the source of truth.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/**
 * RF41, #77: asks for permission and registers this device's Expo push token with the API.
 * Only on iOS and Android builds on a real device, and only when the EAS project id is set
 * (it is created with `eas init`, issue #75). Silent otherwise, and never throws.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Avisos', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api('/api/v1/me/push-token', { method: 'POST', body: JSON.stringify({ token, platform: Platform.OS }) });
  } catch {
    // Push is a bonus: the notice is still in the app (RF38).
  }
}
