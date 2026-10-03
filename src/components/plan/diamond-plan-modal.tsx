import { useEffect, useState } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import { usePlan } from '@/context/plan-context';
import { useTheme } from '@/context/theme-context';

type ModalView = 'features' | 'payment' | 'pending' | 'success';

const getModalTexts = (lang: 'kurdish' | 'arabic' | 'english') => {
  if (lang === 'arabic') {
    return {
      planTitle: 'حساب (VIP)',
      perpetualAccess: 'وصول دائم مفعل',
      activeDaysLeft: (d: number) => `نشط · متبقي ${d} يوم`,
      features: [
        { title: 'أسعار الصرف المباشرة', sub: 'الدولار، اليورو، الليرة والعملات الأخرى' },
        { title: 'أسعار الذهب الفورية', sub: 'عيار ٢٤، ٢٢، ٢١ و ١٨' },
        { title: 'محاسبة تحويل سريعة', sub: 'حسابات وتحويلات مباشرة' },
        { title: 'مخططات وتحليلات السوق', sub: 'بيانات وأرشيف حركة السوق' },
      ],
      activateKey: 'تفعيل الحساب',
      continueBrowsing: 'الاستمرار في التصفح',
      back: 'رجوع',
      activationTitle: 'رمز حسابك الخاص',
      activationSub: 'لتفعيل حسابك، أرسل هذا الرمز إلينا عبر واتساب',
      userCodeLabel: 'رمز حسابك',
      instructionNote: 'اضغط على زر واتساب أدناه للتواصل معنا مباشرة وإتمام تفعيل حسابك فوراً.',
      contactSupportWhatsApp: 'تواصل معنا عبر واتساب للتفعيل',
      copyCode: 'نسخ',
      copiedText: 'تم النسخ!',
      submitVerification: 'التحقق من حالة الحساب',
      submitting: 'جاري التحقق...',
      backToApp: 'الرجوع للتطبيق',
      pendingTitle: 'طلبك قيد المراجعة',
      pendingSub: 'فريقنا يقوم بمراجعة طلبك، وسيتم تفعيل حساب VIP الخاص بك فور التأكيد.',
      successTitle: 'تم استلام طلبك',
      successSub: 'تم استلام طلبك بنجاح، وسيتم فتح ميزات VIP بعد التأكيد مباشرة.',
      gotIt: 'موافق',
      errorSubmit: 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى.',
    };
  }

  if (lang === 'english') {
    return {
      planTitle: 'VIP ACCOUNT',
      perpetualAccess: 'Perpetual Access Active',
      activeDaysLeft: (d: number) => `Active · ${d} Days Left`,
      features: [
        { title: 'Live Unmasked Rates', sub: 'USD, EUR, TRY, GBP & more' },
        { title: 'Spot Gold Pricing', sub: '24K, 22K, 21K & 18K gold' },
        { title: 'Precision Converter', sub: 'Instant live conversions' },
        { title: 'Trend Analytics Charts', sub: 'Historical market data' },
      ],
      activateKey: 'Activate VIP Account',
      continueBrowsing: 'Continue Browsing',
      back: 'Back',
      activationTitle: 'Your Activation Code',
      activationSub: 'Send this code to our support team on WhatsApp to activate your VIP access',
      userCodeLabel: 'Your Personal Code',
      instructionNote: 'Tap the WhatsApp button below to contact us directly and activate your VIP access.',
      contactSupportWhatsApp: 'Message Us on WhatsApp to Activate',
      copyCode: 'Copy',
      copiedText: 'Copied!',
      submitVerification: 'Check Activation Status',
      submitting: 'Checking...',
      backToApp: 'Back to App',
      pendingTitle: 'Activation Under Review',
      pendingSub: 'Our team is reviewing your activation request. Your VIP access will be unlocked shortly.',
      successTitle: 'Request Received',
      successSub: 'Your activation request has been received and will be approved shortly.',
      gotIt: 'Got it',
      errorSubmit: 'Could not submit your request. Please try again.',
    };
  }

  // Default: Kurdish
  return {
    planTitle: 'ئەکاونتی (VIP)',
    perpetualAccess: 'دەستگەیشتنی بەردەوام',
    activeDaysLeft: (d: number) => `چالاکە · ${d} ڕۆژ ماوە`,
    features: [
      { title: 'نرخی ڕاستەوخۆی دراوەکان', sub: 'دۆلار، یۆرۆ، لیرە و دراوەکانی تر' },
      { title: 'نرخی زێڕ بە عەیارەکان', sub: 'عەیاری ٢٤، ٢١ و ١٨' },
      { title: 'گۆڕەرەوەی خێرای دراو', sub: 'خەمڵاندن و گۆڕینەوەی کاتی' },
      { title: 'چارت و شیکارییەکانی بازاڕ', sub: 'ئەرشیفی گۆڕانکارییەکانی بازاڕ' },
    ],
    activateKey: 'چالاککردنی ئەکاونت',
    continueBrowsing: 'گەڕانەوە بۆ ئەپ',
    back: 'گەڕانەوە',
    activationTitle: 'کۆدی تایبەتی ئەکاونتەکەت',
    activationSub: 'بۆ چالاککردنی ئەکاونتەکەت، ئەم کۆدە لە ڕێگەی واتسئاپ بۆ ئێمە بنێرە',
    userCodeLabel: 'کۆدی ئەکاونتەکەت',
    instructionNote: 'کلیک لەسەر دوگمەی واتسئاپ بکە بۆ ئەوەی ڕاستەوخۆ پەیوەندیمان پێوە بکەیت و ئەکاونتەکەت چالاک بکەیت.',
    contactSupportWhatsApp: 'نامە بنێرە لە واتسئاپ بۆ چالاککردن',
    copyCode: 'کۆپیکردن',
    copiedText: 'کۆپیکرا!',
    submitVerification: 'پشکنینی دۆخی ئەکاونت',
    submitting: 'لە پشکنیندایە...',
    backToApp: 'گەڕانەوە بۆ ئەپ',
    pendingTitle: 'داواکارییەکەت لە پشکنیندایە',
    pendingSub: 'تیمەکەمان بەدواداچوون بۆ داواکارییەکەت دەکات. دوای دڵنیابوونەوە، ئەکاونتی VIPت بۆ چالاک دەکرێت.',
    successTitle: 'داواکارییەکەت گەیشت',
    successSub: 'داواکارییەکەت بە سەرکەوتوویی تۆمارکرا. پاش پەسەندکردن، ئەکاونتی VIP چالاک دەبێت.',
    gotIt: 'باشە',
    errorSubmit: 'داواکارییەکە نەنێردرا. تکایە دووبارە هەوڵبدەرەوە.',
  };
};

export function DiamondPlanModal() {
  const {
    isVip,
    daysRemaining,
    isPlanModalOpen,
    closePlanModal,
    pendingPaymentExists,
    userCode,
    submitPaymentRequest,
    refreshSubscriptionStatus,
  } = usePlan();
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const txt = getModalTexts(language as 'kurdish' | 'arabic' | 'english');

  const [view, setView] = useState<ModalView>('features');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set initial view based on whether a pending payment exists when modal is opened
  useEffect(() => {
    if (isPlanModalOpen) {
      setView(pendingPaymentExists ? 'pending' : 'features');
      setIsSubmitting(false);
      setCopied(false);
    }
  }, [isPlanModalOpen, pendingPaymentExists]);

  if (!isPlanModalOpen) return null;

  const currentView: ModalView = view;

  // Gentle light creamy theme colors matching dashboard
  const t = {
    modalCardBg: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
    titleColor: isDark ? '#F8FAFC' : '#0F172A',
    subColor: isDark ? '#94A3B8' : '#64748B',
    featureBg: isDark ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
    featureBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
    diamondGlowBg: isDark ? 'rgba(56, 189, 248, 0.1)' : '#E0F2FE',
    diamondGlowBorder: isDark ? 'rgba(56, 189, 248, 0.28)' : '#BAE6FD',
    diamondIconColor: isDark ? '#38BDF8' : '#0284C7',
    accountCardBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
    accountCardBorder: isDark ? '#334155' : '#E2E8F0',
    accountRowBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    accountValueColor: isDark ? '#E2E8F0' : '#0F172A',
    codeCardBg: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
    codeCardBorder: isDark ? 'rgba(56, 189, 248, 0.3)' : '#7DD3FC',
    codeValueColor: isDark ? '#FFFFFF' : '#0F172A',
    closeBtnBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    closeBtnColor: isDark ? '#94A3B8' : '#64748B',
  };

  const handleCopyCode = () => {
    Clipboard.setString(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const msg =
      language === 'arabic'
        ? `مرحباً! أود تفعيل حساب VIP. رمز حسابي هو: ${userCode}`
        : language === 'english'
        ? `Hello! I would like to activate VIP access. My code is: ${userCode}`
        : `سڵاو! دەمەوێت ئەکاونتی VIP چالاک بکەم. کۆدی ئەکاونتەکەم: ${userCode}`;

    const url = `https://wa.me/9647510201840?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        language === 'english' ? 'Error' : 'هەڵە',
        language === 'english'
          ? 'Could not open WhatsApp. Please contact +964 751 020 1840 directly.'
          : 'نەتوانرا واتسئاپ بکرێتەوە. تکایە پەیوەندی بکە بە ٠٧٥١٠٢٠١٨٤٠.'
      );
    });
  };

  const handleSendPayment = async () => {
    setIsSubmitting(true);
    try {
      await refreshSubscriptionStatus();
      const requestResult = await submitPaymentRequest(userCode);

      if (requestResult === 'submitted' || requestResult === 'already_pending') {
        setView('pending');
      } else {
        Alert.alert(
          language === 'english' ? 'Could not submit' : 'هەڵە',
          language === 'english'
            ? 'We could not save your activation request. Please check your connection and try again.'
            : 'داواکارییەکەت پاشەکەوت نەکرا. تکایە پەیوەندی ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەرەوە.'
        );
      }
    } catch {
      Alert.alert(
        language === 'english' ? 'Error' : 'هەڵە',
        language === 'english'
          ? 'Could not check activation status. Please try again.'
          : 'نەتوانرا دۆخی چالاکبوون پشکنینی بکرێت. تکایە دووبارە هەوڵبدەرەوە.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setView(pendingPaymentExists ? 'pending' : 'features');
    closePlanModal();
  };

  return (
    <Modal
      visible={isPlanModalOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdropOverlay}>
        <Animated.View
          entering={ZoomIn.duration(260)}
          style={[styles.modalCard, { backgroundColor: t.modalCardBg, borderColor: t.borderColor }]}
        >
          {/* Close Button */}
          <Pressable
            hitSlop={14}
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, { backgroundColor: t.closeBtnBg }, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={t.closeBtnColor} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* ─── DIAMOND BADGE HEADER ─────────────────────────── */}
            <Animated.View entering={FadeInUp.delay(60)} style={styles.headerBlock}>
              <View style={[styles.diamondOuterGlow, { backgroundColor: t.diamondGlowBg, borderColor: t.diamondGlowBorder }]}>
                <Ionicons name="diamond" size={36} color={t.diamondIconColor} />
              </View>
              <Text style={[styles.planTitle, { color: t.titleColor }]}>{txt.planTitle}</Text>

              {/* Active status badge */}
              {isVip && (
                <View style={styles.activeVipBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.activeVipText}>
                    {daysRemaining > 300 ? txt.perpetualAccess : txt.activeDaysLeft(daysRemaining)}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* ─── FEATURES VIEW ─────────────────────────────────── */}
            {currentView === 'features' && (
              <Animated.View entering={FadeInUp.delay(100)}>
                {/* Feature List */}
                <View style={styles.featuresList}>
                  {txt.features.map((f, i) => {
                    const icons = ['stats-chart', 'ribbon', 'calculator', 'analytics'];
                    const colors = ['#0284C7', '#D97706', '#7C3AED', '#059669'];
                    return (
                      <View key={i} style={[styles.featureItem, { backgroundColor: t.featureBg, borderColor: t.featureBorder }]}>
                        <View style={[styles.featureIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEF2FF' }]}>
                          <Ionicons name={icons[i] as any} size={18} color={colors[i]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.featureHeading, { color: t.titleColor }]}>{f.title}</Text>
                          <Text style={[styles.featureSub, { color: t.subColor }]}>{f.sub}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Action Buttons */}
                {!isVip && (
                  <View style={styles.actionsGroup}>
                    <Pressable
                      onPress={() => setView('payment')}
                      style={({ pressed }) => [styles.activateBtn, pressed && styles.pressed]}
                    >
                      <Ionicons name="key-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.activateBtnText}>{txt.activateKey}</Text>
                    </Pressable>

                    <Pressable onPress={handleClose} style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}>
                      <Text style={[styles.dismissText, { color: t.subColor }]}>{txt.continueBrowsing}</Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ─── ACTIVATION KEY VIEW (Clean Enterprise Key Flow) ──────── */}
            {currentView === 'payment' && (
              <Animated.View entering={FadeInUp.delay(60)}>
                {/* Back Button Header */}
                <Pressable
                  onPress={() => setView('features')}
                  style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
                >
                  <Ionicons name="arrow-back" size={18} color={t.subColor} />
                  <Text style={[styles.backText, { color: t.subColor }]}>{txt.back}</Text>
                </Pressable>

                {/* Key Header Badge */}
                <View style={styles.activationHeaderBadge}>
                  <View style={[styles.activationIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' }]}>
                    <Ionicons name="key-outline" size={22} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activationHeaderTitle, { color: t.titleColor }]}>{txt.activationTitle}</Text>
                    <Text style={[styles.activationHeaderSub, { color: t.subColor }]}>{txt.activationSub}</Text>
                  </View>
                </View>

                {/* Unified Activation Card */}
                <View style={[styles.unifiedCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                  {/* Required Request Key */}
                  <View style={[styles.noteCodeBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD' }]}>
                    <View style={styles.noteCodeHeader}>
                      <Ionicons name="finger-print-outline" size={18} color="#0284C7" />
                      <Text style={[styles.noteCodeTitle, { color: isDark ? '#38BDF8' : '#0369A1' }]}>{txt.userCodeLabel}</Text>
                    </View>

                    <View style={styles.noteCodeRow}>
                      <Text style={[styles.noteCodeValue, { color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: 1.5 }]}>{userCode}</Text>
                      <Pressable
                        onPress={handleCopyCode}
                        style={({ pressed }) => [styles.copyCodeBtn, { backgroundColor: '#0284C7' }, pressed && styles.pressed]}
                      >
                        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color="#FFFFFF" />
                        <Text style={styles.copyCodeBtnText}>{copied ? txt.copiedText : txt.copyCode}</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Informative Note */}
                  <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: t.subColor, textAlign: 'center', lineHeight: 20 }}>
                      {txt.instructionNote}
                    </Text>
                  </View>
                </View>

                {/* Primary Action Buttons */}
                <View style={styles.actionButtonsCol}>
                  {/* WhatsApp Customer Support */}
                  <Pressable
                    onPress={handleOpenWhatsApp}
                    style={({ pressed }) => [styles.whatsappBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappBtnText}>{txt.contactSupportWhatsApp}</Text>
                  </Pressable>

                  {/* Verify Activation Status */}
                  <Pressable
                    onPress={handleSendPayment}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.sentBtn, { backgroundColor: '#0284C7' }, isSubmitting && { opacity: 0.6 }, pressed && styles.pressed]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.sentBtnText}>
                      {isSubmitting ? txt.submitting : txt.submitVerification}
                    </Text>
                  </Pressable>
                </View>

                <Pressable onPress={handleClose} style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}>
                  <Text style={[styles.dismissText, { color: t.subColor }]}>{txt.backToApp}</Text>
                </Pressable>
              </Animated.View>
            )}


            {/* ─── PENDING VIEW ──────────────────────────────────── */}
            {currentView === 'pending' && (
              <Animated.View entering={FadeInUp.delay(60)} style={styles.statusBlock}>
                <View style={styles.statusIconCircle}>
                  <Ionicons name="time-outline" size={40} color="#D97706" />
                </View>
                <Text style={[styles.statusTitle, { color: t.titleColor }]}>{txt.pendingTitle}</Text>
                <Text style={[styles.statusSub, { color: t.subColor }]}>{txt.pendingSub}</Text>
                <Pressable onPress={handleClose} style={({ pressed }) => [styles.activateBtn, pressed && styles.pressed]}>
                  <Text style={styles.activateBtnText}>{txt.continueBrowsing}</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* ─── SUCCESS VIEW ──────────────────────────────────── */}
            {currentView === 'success' && (
              <Animated.View entering={FadeInUp.delay(60)} style={styles.statusBlock}>
                <View style={[styles.statusIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <Ionicons name="checkmark-circle-outline" size={42} color="#10B981" />
                </View>
                <Text style={[styles.statusTitle, { color: t.titleColor }]}>{txt.successTitle}</Text>
                <Text style={[styles.statusSub, { color: t.subColor }]}>{txt.successSub}</Text>
                <Pressable onPress={handleClose} style={({ pressed }) => [styles.activateBtn, pressed && styles.pressed]}>
                  <Text style={styles.activateBtnText}>{txt.gotIt}</Text>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  diamondOuterGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  activeVipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 6,
  },
  activeVipText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  featuresList: {
    gap: 10,
    marginBottom: 18,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsGroup: {
    gap: 10,
    width: '100%',
  },
  activateBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  dismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Payment view
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  paymentSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },


  sentBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  sentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Status views (pending / success)
  statusBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    width: '100%',
  },
  statusIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  // ── Sleek Activation Card Styles ─────────────────────────────
  activationHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  activationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activationHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activationHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  unifiedCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  qrHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  accountDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  accountLabelText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountNumberText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  copyPillBtnDone: {
    backgroundColor: '#10B981',
  },
  copyPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCodeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  noteCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteCodeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  noteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteCodeValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#1E3A8A',
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyCodeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsCol: {
    gap: 10,
    marginBottom: 6,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  transferAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  transferAmountText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
});
