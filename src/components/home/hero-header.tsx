import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeroHeaderProps {
  topInset: number;
  onOpenDrawer: () => void;
}

export function HeroHeader({ topInset, onOpenDrawer }: HeroHeaderProps) {
  return (
    <View style={[styles.heroHeader, { paddingTop: Math.max(topInset + 8, 16) }]}>
      {/* Header Action Buttons */}
      <View style={styles.headerTopRow}>
        <View style={styles.headerIconsLeft}>
          <Pressable style={({ pressed }) => [styles.iconCircleBadge, styles.goldBadge, pressed && styles.pressed]}>
            <Ionicons name="ribbon" size={20} color="#FFD700" />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconCircleBadge, pressed && styles.pressed]}>
            <Ionicons name="stats-chart" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconCircleBadge, pressed && styles.pressed]}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          onPress={onOpenDrawer}
          style={({ pressed }) => [styles.hamburgerBtn, pressed && styles.pressed]}
        >
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Today's Price Headline */}
      <View style={styles.heroCopyBlock}>
        <Text style={styles.heroDateLabel}>نرخی ئەمڕۆی 100 دۆلاری ئه‌مریکی  2026-07-27</Text>
        <Text style={styles.heroMainPrice}>150,300 د.ع</Text>
        <View style={styles.borsaPill}>
          <Text style={styles.borsaPillText}>بۆرسەی سلێمانی</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    backgroundColor: '#3B50C8',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIconsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  heroCopyBlock: {
    alignItems: 'flex-end',
  },
  heroDateLabel: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  heroMainPrice: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 4,
  },
  borsaPill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  borsaPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
