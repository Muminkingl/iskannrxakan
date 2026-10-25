import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Clipboard, Linking, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SUPPORT_WHATSAPP_NUMBER } from '@/constants/config';
import { PRIVACY_POLICY_CONTENT, TERMS_CONTENT } from '@/constants/legal';
import { PREMIUM_TEXT } from '@/constants/premium-translations';
import { useLanguage } from '@/context/language-context';
import { usePlan } from '@/context/plan-context';
import { useTheme } from '@/context/theme-context';
import { canUseApplePurchases } from '@/lib/purchases';

type Page = 'premium' | 'support' | 'privacy' | 'terms';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const FEATURE_ICONS = ['cash-outline', 'ribbon-outline', 'calculator-outline', 'stats-chart-outline'] as const;

export function PremiumPlanModal() {
  const { language } = useLanguage();
  const txt = PREMIUM_TEXT[language];
  const { colors, isDark } = useTheme();
  const {
    isPremium, premiumExpiresAt, daysRemaining, isPlanModalOpen, closePlanModal,
    userCode, billingStatus, purchasePackage, isBillingBusy, hasStorePremium,
    needsPurchaseConfirmation, purchasePremium, restorePurchases, refreshSubscriptionStatus,
  } = usePlan();
  const [page, setPage] = useState<Page>('premium');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRtl = language !== 'english';
  const busy = isBillingBusy || isRefreshing;
  const canRestore = canUseApplePurchases();

  useEffect(() => {
    if (isPlanModalOpen) { setPage('premium'); setCopied(false); }
  }, [isPlanModalOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  const openUrl = async (url: string, errorMessage = txt.purchaseError) => {
    try { await Linking.openURL(url); }
    catch { Alert.alert(txt.errorTitle, errorMessage); }
  };

  const handlePurchase = async () => {
    try {
      const result = await purchasePremium();
      if (result === 'activated') Alert.alert(txt.success, txt.successBody);
      else if (result === 'pending_confirmation') Alert.alert(txt.pending, txt.pendingBody);
      else if (result === 'pending_approval') Alert.alert(txt.approval, txt.approvalBody);
    } catch { Alert.alert(txt.errorTitle, txt.purchaseError); }
  };

  const handleRestore = async () => {
    try {
      const result = await restorePurchases();
      if (result === 'restored') Alert.alert(txt.restored, txt.restoredBody);
      else if (result === 'pending_confirmation') Alert.alert(txt.pending, txt.pendingBody);
      else Alert.alert(txt.restore, txt.nothingToRestore);
    } catch { Alert.alert(txt.errorTitle, txt.restoreError); }
  };

  const handleRefresh = async () => {
    if (busy) return;
    setIsRefreshing(true);
    try { await refreshSubscriptionStatus(); }
    catch { Alert.alert(txt.errorTitle, txt.purchaseError); }
    finally { setIsRefreshing(false); }
  };

  const bodyColor = { color: colors.textSecondary };
  const titleColor = { color: colors.textPrimary };
  const textDirection = { textAlign: isRtl ? 'right' : 'left' } as const;
  const panelColors = { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor };

  return (
    <Modal visible={isPlanModalOpen} transparent animationType="fade" onRequestClose={() => { if (!busy) closePlanModal(); }}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <View style={styles.toolbar}>
            {page !== 'premium' ? (
              <Pressable accessibilityRole="button" accessibilityLabel={txt.back} onPress={() => setPage('premium')} hitSlop={12} style={styles.toolbarButton}>
                <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.textSecondary} />
              </Pressable>
            ) : <View style={styles.toolbarButton} />}
            <Pressable accessibilityRole="button" accessibilityLabel={txt.close} disabled={busy} onPress={closePlanModal} hitSlop={12} style={[styles.toolbarButton, busy && styles.disabled]}>
              <Ionicons name="close" size={23} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {page === 'premium' && <>
              <View style={[styles.emblem, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                <Ionicons name="sparkles" size={32} color={colors.primaryAccent} />
              </View>
              <Text style={[styles.title, titleColor]}>{txt.title}</Text>
              <Text style={[styles.subtitle, bodyColor]}>{txt.subtitle}</Text>

              {isPremium && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <View style={styles.flex}>
                    <Text style={styles.activeTitle}>{txt.active}</Text>
                    <Text style={styles.activeDetail}>{premiumExpiresAt ? txt.daysLeft(daysRemaining) : txt.unlimited}</Text>
                  </View>
                </View>
              )}

              <View style={styles.features}>
                {txt.features.map((feature, index) => (
                  <View key={feature} style={[styles.feature, isRtl && styles.rowRtl]}>
                    <Ionicons name={FEATURE_ICONS[index]} size={20} color={colors.primaryAccent} />
                    <Text style={[styles.featureText, titleColor, textDirection]}>{feature}</Text>
                  </View>
                ))}
              </View>

              {Platform.OS === 'ios' && <>
                {!isPremium && !hasStorePremium && (
                  <View style={[styles.panel, panelColors]}>
                    {purchasePackage && billingStatus === 'ready' ? <>
                      <Text style={[styles.planLabel, bodyColor]}>{txt.monthly}</Text>
                      <Text style={[styles.price, titleColor]}>{purchasePackage.product.priceString}</Text>
                      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void handlePurchase()} style={[styles.primaryButton, { backgroundColor: colors.primaryAccent }, busy && styles.disabled]}>
                        {isBillingBusy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
                        <Text style={styles.primaryLabel}>{txt.upgrade}</Text>
                      </Pressable>
                      <Text style={[styles.caption, bodyColor]}>{txt.renewal}</Text>
                    </> : <>
                      {billingStatus === 'loading' && <ActivityIndicator color={colors.primaryAccent} />}
                      <Text accessibilityLiveRegion="polite" style={[styles.caption, bodyColor]}>{billingStatus === 'loading' ? txt.loading : txt.unavailable}</Text>
                      {canRestore && billingStatus !== 'loading' && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void handleRefresh()} style={styles.linkButton}>
                        <Text style={{ color: colors.primaryAccent }}>{txt.retry}</Text>
                      </Pressable>}
                    </>}
                  </View>
                )}

                {needsPurchaseConfirmation && <View style={[styles.panel, panelColors]}>
                  <Text style={[styles.featureText, titleColor]}>{txt.pending}</Text>
                  <Text style={[styles.caption, bodyColor]}>{txt.pendingBody}</Text>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => void handleRefresh()} style={styles.linkButton}>
                    {isRefreshing ? <ActivityIndicator color={colors.primaryAccent} /> : <Text style={{ color: colors.primaryAccent }}>{txt.confirm}</Text>}
                  </Pressable>
                </View>}

                <Pressable accessibilityRole="button" disabled={busy || !canRestore} onPress={() => void handleRestore()} style={[styles.linkButton, (!canRestore || busy) && styles.disabled]}>
                  <Text style={[styles.linkLabel, { color: colors.primaryAccent }]}>{txt.restore}</Text>
                </Pressable>
                {hasStorePremium && <Pressable accessibilityRole="link" disabled={busy} onPress={() => void openUrl(APPLE_SUBSCRIPTIONS_URL)} style={styles.linkButton}>
                  <Text style={[styles.linkLabel, { color: colors.primaryAccent }]}>{txt.manage}</Text>
                </Pressable>}
              </>}

              <View style={styles.legalLinks}>
                <Pressable accessibilityRole="button" onPress={() => setPage('terms')} style={styles.legalLink}><Text style={[styles.legalText, bodyColor]}>{txt.terms}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setPage('privacy')} style={styles.legalLink}><Text style={[styles.legalText, bodyColor]}>{txt.privacy}</Text></Pressable>
                {Platform.OS === 'ios' && <Pressable accessibilityRole="link" onPress={() => void openUrl(APPLE_EULA_URL)} style={styles.legalLink}><Text style={[styles.legalText, bodyColor]}>{txt.appleTerms}</Text></Pressable>}
              </View>

              <View style={[styles.supportFooter, { borderTopColor: colors.borderColor }]}>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => setPage('support')} style={styles.linkButton}>
                  <Ionicons name="help-circle-outline" size={19} color={colors.textSecondary} />
                  <Text style={[styles.linkLabel, bodyColor]}>{txt.support}</Text>
                </Pressable>
              </View>
            </>}

            {page === 'support' && <>
              <View style={[styles.emblem, panelColors]}><Ionicons name="chatbubbles-outline" size={30} color={colors.primaryAccent} /></View>
              <Text style={[styles.title, titleColor]}>{txt.support}</Text>
              <Text style={[styles.subtitle, bodyColor]}>{txt.supportDescription}</Text>
              <View style={[styles.panel, panelColors]}>
                <Text style={[styles.planLabel, bodyColor]}>{txt.reference}</Text>
                <Text selectable style={[styles.accountCode, titleColor]}>{userCode}</Text>
                <Pressable accessibilityRole="button" onPress={() => { Clipboard.setString(userCode); setCopied(true); }} style={styles.linkButton}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={17} color={colors.primaryAccent} />
                  <Text style={{ color: colors.primaryAccent }}>{copied ? txt.copied : txt.copy}</Text>
                </Pressable>
              </View>
              <Pressable accessibilityRole="link" onPress={() => void openUrl(`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(txt.supportDraft(userCode))}`, txt.supportError)} style={[styles.primaryButton, { backgroundColor: '#128C7E' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.primaryLabel}>{txt.whatsapp}</Text>
              </Pressable>
            </>}

            {(page === 'privacy' || page === 'terms') && <>
              <Text style={[styles.title, titleColor]}>{page === 'privacy' ? txt.privacy : txt.terms}</Text>
              {(page === 'privacy' ? PRIVACY_POLICY_CONTENT[language] : TERMS_CONTENT[language]).split('\n\n').map((block, index) => (
                <Text key={index} style={[styles.policyText, titleColor, textDirection, block.startsWith('**') && styles.policyHeading]}>{block.replace(/\*\*/g, '')}</Text>
              ))}
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 440, maxHeight: '90%', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10 },
  toolbarButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  emblem: { width: 68, height: 68, borderRadius: 22, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 27, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 22 },
  features: { gap: 16, marginBottom: 24 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowRtl: { flexDirection: 'row-reverse' },
  featureText: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  flex: { flex: 1 },
  panel: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 12, gap: 10 },
  planLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  price: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginVertical: 2 },
  primaryButton: { minHeight: 52, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  primaryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  caption: { fontSize: 12, lineHeight: 19, textAlign: 'center' },
  linkButton: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  linkLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  legalLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16 },
  legalLink: { minHeight: 44, justifyContent: 'center' },
  legalText: { fontSize: 12, textDecorationLine: 'underline' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.1)', padding: 14, marginBottom: 20 },
  activeTitle: { color: '#059669', fontSize: 15, fontWeight: '700' },
  activeDetail: { color: '#059669', fontSize: 12, marginTop: 3 },
  supportFooter: { borderTopWidth: 1, marginTop: 12, paddingTop: 8 },
  accountCode: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 1.5, writingDirection: 'ltr' },
  policyText: { fontSize: 14, lineHeight: 23, marginTop: 12 },
  policyHeading: { fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.45 },
});
