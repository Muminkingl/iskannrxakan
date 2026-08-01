import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import type { TabId, UserRole } from '@/types/market';

interface SideDrawerProps {
  visible: boolean;
  topInset: number;
  userRole?: UserRole;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  onOpenCalcModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAboutAppModal: () => void;
  onOpenOwnerPanelModal?: () => void;
  onSignOut: () => void;
}

export function SideDrawer({
  visible,
  topInset,
  userRole = 'user',
  onClose,
  onSelectTab,
  onOpenCalcModal,
  onOpenSettingsModal,
  onOpenAboutAppModal,
  onOpenOwnerPanelModal,
  onSignOut,
}: SideDrawerProps) {
  const { t } = useLanguage();
  const [modalMounted, setModalMounted] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setModalMounted(true);
      progress.value = withTiming(1, { duration: 250 });
    } else {
      progress.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(setModalMounted)(false);
        }
      });
    }
  }, [visible, progress]);

  const handleCloseWithAnimation = (action?: () => void) => {
    progress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
        if (action) {
          runOnJS(action)();
        }
      }
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * 320 }],
  }));

  if (!modalMounted && !visible) return null;

  const isOwner = userRole === 'owner';
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

  return (
    <Modal
      visible={modalMounted || visible}
      transparent
      animationType="none"
      onRequestClose={() => handleCloseWithAnimation()}
    >
      <View style={styles.drawerOverlay}>
        {/* Backdrop Fade */}
        <Animated.View style={[styles.backdropFill, backdropStyle]}>
          <Pressable style={styles.flexOne} onPress={() => handleCloseWithAnimation()} />
        </Animated.View>

        {/* Drawer Sheet Slide */}
        <Animated.View
          style={[styles.drawerContent, sheetStyle, { paddingTop: Math.max(topInset + 12, 20) }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
            {/* Top Banner Activation Card */}
            <View style={styles.drawerBanner}>
              <View style={styles.starBadgeCircle}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.drawerBannerCopy}>
                <Text style={styles.drawerBannerTitle}>{t('drawerPlanBtnTitle')}</Text>
                <Text style={styles.drawerBannerSub}>{t('drawerPlanBtnSub')}</Text>
              </View>
            </View>

            {/* Role Privilege Badges */}
            {isOwner && (
              <Pressable
                onPress={() => handleCloseWithAnimation(() => onOpenOwnerPanelModal?.())}
                style={({ pressed }) => [styles.ownerPanelCard, pressed && styles.pressed]}
              >
                <Ionicons name="ribbon" size={18} color="#D97706" />
                <View style={styles.ownerCardMeta}>
                  <Text style={styles.ownerCardTitle}>{t('drawerOwnerTitle')}</Text>
                  <Text style={styles.ownerCardSub}>{t('drawerOwnerSub')}</Text>
                </View>
              </Pressable>
            )}

            {/* Menu Items List */}
            <View style={styles.menuList}>
              {isAdminOrOwner && (
                <Pressable
                  onPress={() => handleCloseWithAnimation(() => onSelectTab('admin'))}
                  style={({ pressed }) => [styles.menuItem, styles.adminMenuItem, pressed && styles.pressed]}
                >
                  <Text style={[styles.menuText, { color: '#3B50C8' }]}>{t('drawerAdmin')}</Text>
                  <Ionicons name="shield-checkmark" size={20} color="#3B50C8" />
                </Pressable>
              )}

              <Pressable
                onPress={() => handleCloseWithAnimation(() => onSelectTab('chart'))}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <Text style={styles.menuText}>{t('drawerChart')}</Text>
                <Ionicons name="stats-chart-outline" size={20} color="#3B50C8" />
              </Pressable>

              <Pressable
                onPress={() => handleCloseWithAnimation()}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <Text style={[styles.menuText, { color: '#FF6B6B' }]}>{t('drawerPlans')}</Text>
                <Ionicons name="ribbon-outline" size={20} color="#FF6B6B" />
              </Pressable>

              <Pressable
                onPress={() => handleCloseWithAnimation(() => onOpenCalcModal())}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <Text style={styles.menuText}>{t('drawerCalc')}</Text>
                <Ionicons name="calculator-outline" size={20} color="#2563EB" />
              </Pressable>

              <Pressable
                onPress={() => handleCloseWithAnimation(() => onOpenSettingsModal())}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <Text style={styles.menuText}>{t('drawerSettings')}</Text>
                <Ionicons name="settings-outline" size={20} color="#6366F1" />
              </Pressable>

              <Pressable
                onPress={() => handleCloseWithAnimation(() => onOpenAboutAppModal())}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <Text style={styles.menuText}>{t('drawerAbout')}</Text>
                <Ionicons name="information-circle-outline" size={20} color="#0EA5E9" />
              </Pressable>

              <Pressable
                onPress={() => handleCloseWithAnimation(() => onSignOut())}
                style={({ pressed }) => [styles.menuItem, { borderBottomWidth: 0 }, pressed && styles.pressed]}
              >
                <Text style={[styles.menuText, { color: '#DC2626' }]}>{t('drawerSignOut')}</Text>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdropFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  flexOne: {
    flex: 1,
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginLeft: 'auto',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
  },
  drawerScroll: {
    gap: 16,
  },
  drawerBanner: {
    backgroundColor: '#3B50C8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  starBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBannerCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  drawerBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  drawerBannerSub: {
    color: '#E0E7FF',
    fontSize: 11,
    marginTop: 2,
  },
  ownerPanelCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  ownerCardMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  ownerCardTitle: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '800',
  },
  ownerCardSub: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  menuList: {
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminMenuItem: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 4,
    borderBottomWidth: 0,
  },
  menuText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
  drawerFooter: {
    marginTop: 10,
    paddingTop: 16,
    alignItems: 'center',
  },
  drawerFooterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
  },
});
