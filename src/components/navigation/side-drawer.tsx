import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { TabId } from '@/types/market';

interface SideDrawerProps {
  visible: boolean;
  topInset: number;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  onSignOut: () => void;
}

export function SideDrawer({ visible, topInset, onClose, onSelectTab, onSignOut }: SideDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} />

        <Animated.View
          entering={SlideInRight.duration(280)}
          exiting={SlideOutRight.duration(220)}
          style={[styles.drawerContent, { paddingTop: Math.max(topInset + 12, 20) }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
            {/* Top Banner Activation Card */}
            <View style={styles.drawerBanner}>
              <View style={styles.starBadgeCircle}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.drawerBannerCopy}>
                <Text style={styles.drawerBannerTitle}>بەشداری پلانێک بکە</Text>
                <Text style={styles.drawerBannerSub}>تایبەتمەندی زیاتر بە دەست بهێنە</Text>
              </View>
            </View>

            {/* Menu Items List */}
            <View style={styles.menuList}>
              <Pressable onPress={() => { onClose(); onSelectTab('home'); }} style={styles.menuItem}>
                <Text style={styles.menuText}>هێڵکاری</Text>
                <Ionicons name="stats-chart-outline" size={20} color="#3B50C8" />
              </Pressable>

              <Pressable onPress={() => { onClose(); onSelectTab('home'); }} style={styles.menuItem}>
                <Text style={[styles.menuText, { color: '#FF6B6B' }]}>پلانەکان</Text>
                <Ionicons name="ribbon-outline" size={20} color="#FF6B6B" />
              </Pressable>

              <Pressable onPress={() => { onClose(); onSelectTab('home'); }} style={styles.menuItem}>
                <Text style={styles.menuText}>دراوی دڵخواز</Text>
                <Ionicons name="heart-outline" size={20} color="#3B50C8" />
              </Pressable>

              <Pressable onPress={() => { onClose(); onSelectTab('calc'); }} style={styles.menuItem}>
                <Text style={styles.menuText}>حاسیبە</Text>
                <Ionicons name="calculator-outline" size={20} color="#3B50C8" />
              </Pressable>

              <Pressable onPress={onClose} style={styles.menuItem}>
                <Text style={styles.menuText}>رێکخستنەکان</Text>
                <Ionicons name="settings-outline" size={20} color="#475569" />
              </Pressable>

              <Pressable onPress={onClose} style={styles.menuItem}>
                <Text style={styles.menuText}>پێشنیار</Text>
                <Ionicons name="bulb-outline" size={20} color="#475569" />
              </Pressable>

              <Pressable onPress={onClose} style={styles.menuItem}>
                <Text style={styles.menuText}>ناردن بۆ هاوڕێیان</Text>
                <Ionicons name="share-social-outline" size={20} color="#475569" />
              </Pressable>

              <Pressable onPress={onClose} style={styles.menuItem}>
                <Text style={styles.menuText}>دەربارەی بەرنامە</Text>
                <Ionicons name="information-circle-outline" size={20} color="#475569" />
              </Pressable>

              <Pressable onPress={onClose} style={styles.menuItem}>
                <Text style={styles.menuText}>دەربارەی ئێمە</Text>
                <Ionicons name="person-outline" size={20} color="#475569" />
              </Pressable>

              <Pressable onPress={onSignOut} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <Text style={[styles.menuText, { color: '#DC2626' }]}>چوونە دەرەوە</Text>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </Pressable>
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterText}>WiseDevs  گەشەی پێدراوە لە لایەن</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
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
});
