import { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { CurrencyCalculator } from '@/components/calculator/currency-calculator';
import { GoldScreen } from '@/components/gold/gold-screen';
import { HeroHeader } from '@/components/home/hero-header';
import { NoticeBanner } from '@/components/home/notice-banner';
import { RatesTable } from '@/components/home/rates-table';
import { RegionalBorsaCard } from '@/components/home/regional-borsa-card';
import { BottomNavBar } from '@/components/navigation/bottom-nav-bar';
import { SideDrawer } from '@/components/navigation/side-drawer';
import { DETAILED_RATES, REGIONAL_BORSAMARKETS } from '@/constants/market-data';
import { supabase } from '@/lib/supabase';
import type { TabId } from '@/types/market';

export function HomeScreen({ session }: { session: Session }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    setIsDrawerOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#3B50C8" />

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        {activeTab === 'home' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              width >= 720 && styles.desktopContainer,
              { paddingBottom: insets.bottom + 80 },
            ]}
          >
            <HeroHeader topInset={insets.top} onOpenDrawer={() => setIsDrawerOpen(true)} />
            <NoticeBanner />
            <RegionalBorsaCard items={REGIONAL_BORSAMARKETS} />
            <RatesTable rates={DETAILED_RATES.filter((r) => r.category === 'currency')} />
          </ScrollView>
        )}

        {activeTab === 'updates' && (
          <ScrollView contentContainerStyle={[styles.tabContent, { paddingTop: Math.max(insets.top + 20, 24) }]}>
            <Text style={styles.tabHeading}>ئاڵوگۆڕی ڕۆژانە</Text>
            <Text style={styles.tabSubheading}>ئاگاداری و لێدوانەکانی بێنەری بۆرسەی کوردستان</Text>
            <NoticeBanner />
          </ScrollView>
        )}

        {activeTab === 'gold' && (
          <ScrollView contentContainerStyle={[styles.tabContent, { paddingTop: Math.max(insets.top + 16, 20) }]}>
            <GoldScreen />
          </ScrollView>
        )}

        {activeTab === 'global' && (
          <ScrollView contentContainerStyle={[styles.tabContent, { paddingTop: Math.max(insets.top + 20, 24) }]}>
            <Text style={styles.tabHeading}>دراوە جیهانیەکان</Text>
            <RatesTable rates={DETAILED_RATES.filter((r) => r.category === 'currency')} />
          </ScrollView>
        )}

        {activeTab === 'calc' && (
          <ScrollView contentContainerStyle={[styles.tabContent, { paddingTop: Math.max(insets.top + 16, 20) }]}>
            <CurrencyCalculator />
          </ScrollView>
        )}
      </View>

      {/* Modular Side Drawer Menu */}
      <SideDrawer
        visible={isDrawerOpen}
        topInset={insets.top}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSignOut={handleSignOut}
      />

      {/* Modular Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        bottomInset={insets.bottom}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F8',
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  desktopContainer: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  tabContent: {
    paddingBottom: 100,
    gap: 14,
  },
  tabHeading: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    paddingHorizontal: 16,
  },
  tabSubheading: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'right',
    paddingHorizontal: 16,
  },
});
