import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/context/theme-context';
import type { TranslationKeys } from '@/constants/translations';
import type { TabId } from '@/types/market';

interface TabItem {
  id: TabId;
  labelKey: keyof TranslationKeys;
  iconName: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'calc', labelKey: 'calcTab', iconName: 'swap-horizontal' },
  { id: 'chart', labelKey: 'chartTab', iconName: 'stats-chart' },
  { id: 'gold', labelKey: 'goldTab', iconName: 'diamond-outline' },
  { id: 'home', labelKey: 'homeTab', iconName: 'home' },
];

interface BottomNavBarProps {
  activeTab: TabId;
  bottomInset: number;
  onSelectTab: (tab: TabId) => void;
}

export function BottomNavBar({ activeTab, bottomInset, onSelectTab }: BottomNavBarProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth - 32, 500);
  const tabWidth = containerWidth / TABS.length;

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const translateX = useSharedValue(activeIndex === -1 ? 0 : activeIndex * tabWidth);

  useEffect(() => {
    const targetIdx = TABS.findIndex((t) => t.id === activeTab);
    if (targetIdx !== -1) {
      translateX.value = withSpring(targetIdx * tabWidth, {
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      });
    }
  }, [activeTab, tabWidth, translateX]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <View style={[styles.navContainer, { width: containerWidth, backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
        {/* Animated Sliding Pill Background */}
        <Animated.View style={[styles.activePill, { width: tabWidth, backgroundColor: colors.primaryAccent }, pillAnimatedStyle]} />

        {/* Tab Buttons Row */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onSelectTab(tab.id)}
                style={styles.tabButton}
              >
                <Ionicons
                  name={tab.iconName}
                  size={20}
                  color={isActive ? '#FFFFFF' : colors.textSecondary}
                />
                <Text style={[styles.tabLabel, { color: colors.textSecondary }, isActive && styles.tabLabelActive]}>
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navContainer: {
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    boxShadow: '0 8px 28px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 27,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
