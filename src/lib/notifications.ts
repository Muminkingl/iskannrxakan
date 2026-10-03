import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior when notification arrives
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rate-alerts', {
        name: 'Rate Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B50C8',
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.log('Notification permission request error:', err);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.log('Notification check error:', err);
    return false;
  }
}

let lastNotificationTime = 0;
let lastNotificationKey = '';

export async function triggerLiveRateNotification(title: string, body: string) {
  if (Platform.OS === 'web') return;

  const now = Date.now();
  const key = `${title}:${body}`;

  // Deduplicate and debounce notifications within 2000ms
  if (now - lastNotificationTime < 2000 || (key === lastNotificationKey && now - lastNotificationTime < 5000)) {
    return;
  }

  lastNotificationTime = now;
  lastNotificationKey = key;

  try {
    const isGranted = await checkNotificationPermission();
    if (!isGranted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // trigger immediately
    });
  } catch (err) {
    console.log('Error triggering live notification:', err);
  }
}
