import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';

interface HeroHeaderProps {
  topInset: number;
  isAdminOrOwner?: boolean;
  usdBuyRate?: string;
  onOpenDrawer: () => void;
  onPressChart?: () => void;
  onRefreshRates?: () => void;
  onOpenAdminPanel?: () => void;
}

function getLiveDate(language: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  if (language === 'english') {
    return `${month}/${day}/${year}`;
  }
  // Kurdish and Arabic: DD-MM-YYYY
  return `${day}-${month}-${year}`;
}

export function HeroHeader({
  topInset,
  isAdminOrOwner = false,
  usdBuyRate,
  onOpenDrawer,
  onPressChart,
  onRefreshRates,
  onOpenAdminPanel,
}: HeroHeaderProps) {
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rotation = useSharedValue(0);

  const isEnglish = language === 'english';
  const liveDate = getLiveDate(language);

  const animatedReloadStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    rotation.value = withSpring(rotation.value + 360, { damping: 12, stiffness: 120 });
    if (onRefreshRates) onRefreshRates();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <View style={[styles.headerCard, { paddingTop: Math.max(topInset, 16) + 12 }]}>
      {/* Top Action Row */}
      <View style={styles.topActionRow}>
        <View style={styles.leftActionsGroup}>
          <Pressable style={({ pressed }) => [styles.actionCircleGold, pressed && styles.pressed]}>
            <Ionicons name="ribbon" size={18} color="#FBBF24" />
          </Pressable>

          <Pressable
            onPress={onPressChart}
            style={({ pressed }) => [styles.actionCircle, pressed && styles.pressed]}
          >
            <Ionicons name="stats-chart" size={16} color="#FFFFFF" />
          </Pressable>

          {isAdminOrOwner && (
            <Pressable
              onPress={onOpenAdminPanel}
              style={({ pressed }) => [styles.adminShieldBtn, pressed && styles.pressed]}
            >
              <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
            </Pressable>
          )}
        </View>

        <Pressable
          hitSlop={12}
          onPress={onOpenDrawer}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Main Rate Hero Section */}
      <View style={[styles.heroBody, isEnglish && styles.heroBodyLtr]}>
        <Text style={[styles.spotlightKicker, isEnglish && styles.textLeft]}>
          {t('heroKicker')} · {liveDate}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.spotlightPrice}>
            {usdBuyRate ?? '—'} {t('heroCurrencyUnit')}
          </Text>
        </View>

        <View style={styles.cityPillFrame}>
          <Text style={styles.cityPillText}>{t('heroCity')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#3B50C8',
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    boxShadow: '0 8px 24px rgba(59, 80, 200, 0.3)',
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCircleGold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminShieldBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    marginTop: 18,
    alignItems: 'flex-end',
    gap: 6,
  },
  heroBodyLtr: {
    alignItems: 'flex-start',
  },
  spotlightKicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  spotlightPrice: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cityPillFrame: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cityPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
