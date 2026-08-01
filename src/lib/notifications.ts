import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // If expo-notifications is available dynamically
    const Notifications = require('expo-notifications');
    if (Notifications && Notifications.requestPermissionsAsync) {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      return status === 'granted';
    }
  } catch (err) {
    console.log('Notification permission request notice:', err);
  }

  // Web or fallback default
  return Platform.OS === 'web';
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = require('expo-notifications');
    if (Notifications && Notifications.getPermissionsAsync) {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    }
  } catch (err) {
    console.log('Notification check notice:', err);
  }
  return true;
}
