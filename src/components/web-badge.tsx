import { Image } from 'expo-image';
import { version } from 'expo/package.json';
import { StyleSheet, useColorScheme } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});

// maybe something left but i swear im cryibng of my first day at fucking nightamare job omhhhhhmgggggggg im hungry asf its 5:49 p m in 8/4/2016 still i dint eat shii
// i wish i want kid everything was fine and i wish everything was before my fucking mouth as i said "PLEASE HOGR FIND ME JOb" fuck no i swear if i knew this shit will happne i iould never do any of that shi imm actualy pissed off
// what do you hink about uit  ? what is left 
