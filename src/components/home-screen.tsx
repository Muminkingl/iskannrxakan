import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { AdminRatesScreen } from '@/components/admin/admin-rates-screen';
import { OwnerPanelModal } from '@/components/admin/owner-panel-modal';
import { CalculatorModal } from '@/components/calculator/calculator-modal';
import { CurrencyCalculator } from '@/components/calculator/currency-calculator';
import { MarketChartScreen } from '@/components/chart/market-chart-screen';
import { AboutAppModal } from '@/components/common/about-app-modal';
import { GoldScreen } from '@/components/gold/gold-screen';
import { HeroHeader } from '@/components/home/hero-header';
import { NoticeBanner } from '@/components/home/notice-banner';
import { RatesTable } from '@/components/home/rates-table';
import { BottomNavBar } from '@/components/navigation/bottom-nav-bar';
import { SideDrawer } from '@/components/navigation/side-drawer';
import { DiamondPlanModal } from '@/components/plan/diamond-plan-modal';
import { SettingsModal } from '@/components/settings/settings-modal';
import { fetchDbAdmins, getUserRole } from '@/lib/auth-roles';
import { supabase } from '@/lib/supabase';
import type { TabId } from '@/types/market';

import { useLanguage } from '@/context/language-context';
import { PlanProvider } from '@/context/plan-context';
import { useRates } from '@/context/rates-context';
import { useTheme } from '@/context/theme-context';

export function HomeScreen({ session }: { session: Session }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAboutAppModalOpen, setIsAboutAppModalOpen] = useState(false);

  // Customer rates come from one cached CDN snapshot. No customer Realtime
  // channels are opened here; Supabase Realtime is reserved for the admin UI.
  const { rates: liveRates, refreshRates } = useRates();
  const [dbAdmins, setDbAdmins] = useState<string[]>([]);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  const userEmail = session.user.email;
  const userRole = getUserRole(userEmail, dbAdmins);
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

  // Admin membership changes rarely. A single request at app start avoids
  // opening an app_admins channel for every customer.
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    const admins = await fetchDbAdmins();
    setDbAdmins(admins);
  };

  const handleSignOut = async () => {
    setIsDrawerOpen(false);
    // Use scope:'local' so it ALWAYS clears the local session even when the
    // network is unreachable. Without this, iOS throws "network connection was
    // lost" and traps the user on the home screen.
    await supabase.auth.signOut({ scope: 'local' });
  };

  const renderHeader = () => {
    const usdRate = liveRates.find((r) => r.code === 'USD' || r.code === 'IQD');
    const usdBuyRate = usdRate
      ? (usdRate.code === 'USD' ? usdRate.buyRate : usdRate.sellRate)
      : '150,300';

    return (
      <HeroHeader
        topInset={insets.top}
        isAdminOrOwner={isAdminOrOwner}
        usdBuyRate={usdBuyRate}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onPressChart={() => setActiveTab('chart')}
        onOpenAdminPanel={() => setActiveTab('admin')}
        onRefreshRates={refreshRates}
      />
    );
  };

  const currencyRates = liveRates.filter((r) => r.category === 'currency' && r.code !== 'USD');

  return (
    <PlanProvider session={session} dbAdmins={dbAdmins}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#3B50C8" />

        {/* Main Content View Container */}
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
              {renderHeader()}
              <NoticeBanner />
              <RatesTable rates={currencyRates} />
            </ScrollView>
          )}

          {activeTab === 'updates' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                width >= 720 && styles.desktopContainer,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {renderHeader()}
              <View style={styles.tabHeadingBlock}>
                <Text style={styles.tabHeading}>ئاڵوگۆڕی ڕۆژانە</Text>
                <Text style={styles.tabSubheading}>ئاگاداری و لێدوانەکانی بێنەری بۆرسەی کوردستان</Text>
              </View>
              <NoticeBanner />
            </ScrollView>
          )}

          {activeTab === 'gold' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                width >= 720 && styles.desktopContainer,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {renderHeader()}
              <View style={{ paddingTop: 10 }}>
                <GoldScreen />
              </View>
            </ScrollView>
          )}

          {activeTab === 'chart' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                width >= 720 && styles.desktopContainer,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {renderHeader()}
              <MarketChartScreen />
            </ScrollView>
          )}

          {activeTab === 'calc' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                width >= 720 && styles.desktopContainer,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {renderHeader()}
              <View style={{ paddingTop: 10 }}>
                <CurrencyCalculator />
              </View>
            </ScrollView>
          )}

          {activeTab === 'admin' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                width >= 720 && styles.desktopContainer,
                { paddingBottom: insets.bottom + 80 },
              ]}
            >
              {renderHeader()}
              <AdminRatesScreen />
            </ScrollView>
          )}
        </View>

        {/* Modular Side Navigation Drawer */}
        <SideDrawer
          visible={isDrawerOpen}
          topInset={insets.top}
          userRole={userRole}
          onClose={() => setIsDrawerOpen(false)}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenCalcModal={() => setIsCalcModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenAboutAppModal={() => setIsAboutAppModalOpen(true)}
          onOpenOwnerPanelModal={() => setIsOwnerModalOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* Policy-Compliant Diamond VIP Modal */}
        <DiamondPlanModal />

        {/* Pop-up Calculator Modal */}
        <CalculatorModal
          visible={isCalcModalOpen}
          onClose={() => setIsCalcModalOpen(false)}
        />

        {/* Pop-up Settings Modal */}
        <SettingsModal
          visible={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />

        {/* Pop-up About App Modal */}
        <AboutAppModal
          visible={isAboutAppModalOpen}
          onClose={() => setIsAboutAppModalOpen(false)}
        />

        {/* Owner Panel Access Modal (For muminrtx@gmail.com) */}
        <OwnerPanelModal
          visible={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
        />

        {/* Modular Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          bottomInset={insets.bottom}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      </View>
    </PlanProvider>
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
  tabHeadingBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 4,
  },
  tabHeading: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },
  tabSubheading: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'right',
  },
});
