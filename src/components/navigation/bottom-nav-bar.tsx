import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TabId } from '@/types/market';

interface BottomNavBarProps {
  activeTab: TabId;
  bottomInset: number;
  onSelectTab: (tab: TabId) => void;
}

export function BottomNavBar({ activeTab, bottomInset, onSelectTab }: BottomNavBarProps) {
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <Pressable onPress={() => onSelectTab('home')} style={styles.tabBtn}>
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'home' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
        />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
          نرخی دراوەکان
        </Text>
      </Pressable>

      <Pressable onPress={() => onSelectTab('updates')} style={styles.tabBtn}>
        <Ionicons
          name={activeTab === 'updates' ? 'chatbubbles' : 'chatbubbles-outline'}
          size={22}
          color={activeTab === 'updates' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
        />
        <Text style={[styles.tabLabel, activeTab === 'updates' && styles.tabLabelActive]}>
          ئاڵوگۆڕی ڕۆژانە
        </Text>
      </Pressable>

      <Pressable onPress={() => onSelectTab('gold')} style={styles.tabBtn}>
        <Ionicons
          name={activeTab === 'gold' ? 'diamond' : 'diamond-outline'}
          size={22}
          color={activeTab === 'gold' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
        />
        <Text style={[styles.tabLabel, activeTab === 'gold' && styles.tabLabelActive]}>
          نرخی زێڕ
        </Text>
      </Pressable>

      <Pressable onPress={() => onSelectTab('global')} style={styles.tabBtn}>
        <Ionicons
          name={activeTab === 'global' ? 'planet' : 'planet-outline'}
          size={22}
          color={activeTab === 'global' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
        />
        <Text style={[styles.tabLabel, activeTab === 'global' && styles.tabLabelActive]}>
          دراوە جیهانیەکان
        </Text>
      </Pressable>

      <Pressable onPress={() => onSelectTab('calc')} style={styles.tabBtn}>
        <Ionicons
          name={activeTab === 'calc' ? 'swap-horizontal' : 'swap-horizontal-outline'}
          size={22}
          color={activeTab === 'calc' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
        />
        <Text style={[styles.tabLabel, activeTab === 'calc' && styles.tabLabelActive]}>
          ئاڵوگۆڕ
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3B50C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
