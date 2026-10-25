import AsyncStorage from '@react-native-async-storage/async-storage';

// The old onboarding_done flag was also written at sign-in, even when no
// slides were shown. Track actual completion separately on native and web.
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed_v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === '1';
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
}
