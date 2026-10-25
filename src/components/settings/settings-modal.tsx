import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PRIVACY_POLICY_CONTENT, TERMS_CONTENT } from '@/constants/legal';
import type { Language } from '@/constants/translations';
import { useLanguage } from '@/context/language-context';
import { checkNotificationPermission, requestNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

// ─── Sub-modal component for displaying policy text ──────────────────────────

function PolicyModal({
  visible,
  title,
  content,
  closeLabel,
  onClose,
}: {
  visible: boolean;
  title: string;
  content: string;
  closeLabel: string;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={policyStyles.overlay}>
      <View style={policyStyles.card}>
          {/* Header */}
          <View style={policyStyles.header}>
            <Pressable
              hitSlop={12}
              onPress={onClose}
              style={({ pressed }) => [policyStyles.closeBtn, pressed && policyStyles.pressed]}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
            <Text style={policyStyles.title}>{title}</Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={policyStyles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={policyStyles.scrollContent}
          >
            {content.split('\n\n').map((block, i) => {
              const isBold = block.startsWith('**') && block.includes('**');
              const cleanText = block.replace(/\*\*/g, '');
              return (
                <Text
                  key={i}
                  style={[
                    policyStyles.bodyText,
                    isBold && block.split('\n')[0].startsWith('**')
                      ? policyStyles.heading
                      : null,
                  ]}
                >
                  {cleanText}
                </Text>
              );
            })}
          </ScrollView>

          {/* Close button — uses translated label */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [policyStyles.closeFooterBtn, pressed && policyStyles.pressed]}
          >
            <Text style={policyStyles.closeFooterText}>{closeLabel}</Text>
          </Pressable>
      </View>
    </View>
  );
}

// ─── Real Confirmation-by-Typing Delete Account Modal ─────────────────────────

function DeleteAccountModal({
  visible,
  language,
  userEmail,
  onClose,
  onConfirmDelete,
  isDeleting,
}: {
  visible: boolean;
  language: Language;
  userEmail?: string | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  if (!visible) return null;

  const targetWord = 'DELETE';
  const isMatch = confirmText.trim().toUpperCase() === targetWord;

  const isEn = language === 'english';
  const isAr = language === 'arabic';

  const title = isEn ? 'Delete Account & Data' : isAr ? 'حذف الحساب والبيانات' : 'سڕینەوەی هەژمار و زانیاری';
  const warningText = isEn
    ? 'This permanently deletes your account and associated account data. An internet connection is required. We may retain a limited email record to prevent the account from being recreated. Deleting your account does not cancel an Apple subscription; manage or cancel it in your Apple Account subscription settings.'
    : isAr
    ? 'سيؤدي هذا إلى حذف حسابك والبيانات المرتبطة به نهائياً. يلزم الاتصال بالإنترنت. قد نحتفظ بسجل محدود للبريد الإلكتروني لمنع إعادة إنشاء الحساب. حذف الحساب لا يلغي اشتراك Apple؛ يمكنك إدارته أو إلغاؤه من إعدادات اشتراكات حساب Apple.'
    : 'ئەم کردارە هەژمارەکەت و زانیاری پەیوەندیدارەکانی بە هەمیشەیی دەسڕێتەوە. پەیوەندی ئینتەرنێت پێویستە. لەوانەیە تۆمارێکی سنوورداری ئیمەیڵ بپارێزرێت بۆ ڕێگریکردن لە دروستکردنەوەی هەژمارەکە. سڕینەوەی هەژمار بەشداریی Apple هەڵناوەشێنێتەوە؛ لە ڕێکخستنەکانی بەشداریی هەژماری Apple بەڕێوەی ببە یان هەڵیوەشێنەوە.';

  const promptText = isEn
    ? `To confirm, please type "${targetWord}" below:`
    : isAr
    ? `للتأكيد، يرجى كتابة كلمة "${targetWord}" أدناه:`
    : `بۆ دڵنیابوونەوە، تکایە وشەی "${targetWord}" لە خوارەوە بنووسە:`;

  const btnDelete = isEn ? 'Permanently Delete' : isAr ? 'حذف الحساب نهائياً' : 'سڕینەوەی هەمیشەیی';
  const btnCancel = isEn ? 'Cancel' : isAr ? 'إلغاء' : 'پاشگەزبوونەوە';

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <View style={deleteStyles.overlay}>
      <View style={deleteStyles.card}>
          {/* Warning Icon Badge */}
          <View style={deleteStyles.iconBadge}>
            <Ionicons name="warning-outline" size={32} color="#DC2626" />
          </View>

          <Text style={deleteStyles.title}>{title}</Text>
          
          {userEmail ? (
            <View style={deleteStyles.emailBadge}>
              <Ionicons name="person-circle-outline" size={16} color="#64748B" />
              <Text style={deleteStyles.emailText}>{userEmail}</Text>
            </View>
          ) : null}

          <Text style={deleteStyles.warningText}>{warningText}</Text>

          {/* Typing Prompt */}
          <Text style={deleteStyles.promptText}>{promptText}</Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={targetWord}
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
            style={deleteStyles.input}
          />

          {/* Action Buttons */}
          <View style={deleteStyles.actionsRow}>
            <Pressable
              onPress={handleClose}
              disabled={isDeleting}
              style={({ pressed }) => [deleteStyles.cancelBtn, pressed && deleteStyles.pressed]}
            >
              <Text style={deleteStyles.cancelBtnText}>{btnCancel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirmDelete}
              disabled={!isMatch || isDeleting}
              style={({ pressed }) => [
                deleteStyles.confirmDeleteBtn,
                !isMatch && deleteStyles.confirmDeleteDisabled,
                pressed && isMatch && deleteStyles.pressed,
              ]}
            >
              <Text style={deleteStyles.confirmDeleteText}>
                {isDeleting ? (isEn ? 'Deleting...' : isAr ? 'جاري الحذف...' : 'لە سڕینەوەدایە...') : btnDelete}
              </Text>
            </Pressable>
          </View>
      </View>
    </View>
  );
}

// ─── Main Settings Modal ──────────────────────────────────────────────────────

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (visible) {
      checkNotificationPermission().then((granted) => {
        setNotificationsEnabled(granted);
      });
      supabase.auth.getUser().then(({ data }) => {
        const user = data?.user;
        setIsLoggedIn(!!user);
        setCurrentUserEmail(user?.email || null);
      });
    }
  }, [visible]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    }
  };

  const handleDeleteBtnPress = () => {
    if (!isLoggedIn) {
      const isEn = language === 'english';
      const isAr = language === 'arabic';
      Alert.alert(
        isEn ? 'Not Signed In' : isAr ? 'لم يتم تسجيل الدخول' : 'نەچوویتەتە ژوورەوە',
        isEn
          ? 'You are not signed in. Only registered accounts can be deleted.'
          : isAr
          ? 'أنت لست مسجلاً. يمكن فقط حذف الحسابات المسجلة.'
          : 'تۆ نەچوویتەتە ژوورەوە بە هیچ هەژمارێک. تەنها هەژمارە تۆمارکراوەکان دەسڕدرێنەوە.'
      );
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const { data, error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      // Some deployments return a boolean/JSON result; treat an explicit
      // negative result as failure. A successful void RPC returns null.
      const deletionResult = Array.isArray(data) ? data[0] : data;
      if (
        deletionResult === false ||
        (deletionResult !== null &&
          typeof deletionResult === 'object' &&
          'success' in deletionResult &&
          deletionResult.success === false)
      ) {
        throw new Error('Account deletion was not confirmed');
      }

      // The server-side RPC owns deletion and related-record cleanup. Clear
      // only this device's session after the server confirms completion.
      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) {
          console.warn('Could not clear the local session after account deletion:', signOutError.code);
        }
      } catch {
        // The account deletion has already succeeded on the server.
      }

      setShowDeleteModal(false);
      setIsLoggedIn(false);
      setCurrentUserEmail(null);
      onClose();

      const isEn = language === 'english';
      const isAr = language === 'arabic';
      Alert.alert(
        isEn ? 'Account Deleted' : isAr ? 'تم حذف الحساب' : 'هەژمار سڕایەوە',
        isEn
          ? 'Your account deletion was completed. You can no longer sign in with this account.'
          : isAr
          ? 'اكتمل حذف حسابك. لم يعد بإمكانك تسجيل الدخول بهذا الحساب.'
          : 'سڕینەوەی هەژمارەکەت تەواو بوو. چیتر ناتوانیت بەو هەژمارە بچیتە ژوورەوە.'
      );
    } catch (err) {
      const errorCode =
        err !== null && typeof err === 'object' && 'code' in err ? String(err.code) : 'unknown';
      console.warn('Could not confirm account deletion:', errorCode);

      const isEn = language === 'english';
      const isAr = language === 'arabic';
      Alert.alert(
        isEn ? 'Deletion Not Confirmed' : isAr ? 'تعذر تأكيد الحذف' : 'نەتوانرا سڕینەوە پشتڕاست بکرێتەوە',
        isEn
          ? 'We could not confirm that deletion finished. Check your connection and try again. If this continues, contact muminrtx@gmail.com to confirm your account status.'
          : isAr
          ? 'تعذر تأكيد اكتمال الحذف. تحقق من اتصالك وحاول مرة أخرى. إذا استمرت المشكلة، تواصل مع muminrtx@gmail.com للتأكد من حالة حسابك.'
          : 'نەتوانرا تەواوبوونی سڕینەوە پشتڕاست بکرێتەوە. پەیوەندی ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەوە. ئەگەر کێشەکە بەردەوام بوو، بۆ دڵنیابوونەوە لە دۆخی هەژمارەکەت پەیوەندی بکە بە muminrtx@gmail.com.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalRequestClose = () => {
    if (showPrivacy) {
      setShowPrivacy(false);
    } else if (showTerms) {
      setShowTerms(false);
    } else if (showDeleteModal) {
      setShowDeleteModal(false);
    } else {
      onClose();
    }
  };

  return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={handleModalRequestClose}>
        {showPrivacy ? (
          <PolicyModal
            visible
            title={t('privacyPolicyBtn')}
            content={PRIVACY_POLICY_CONTENT[language] || PRIVACY_POLICY_CONTENT.kurdish}
            closeLabel={t('closeBtn')}
            onClose={() => setShowPrivacy(false)}
          />
        ) : showTerms ? (
          <PolicyModal
            visible
            title={t('termsConditionsBtn')}
            content={TERMS_CONTENT[language] || TERMS_CONTENT.kurdish}
            closeLabel={t('closeBtn')}
            onClose={() => setShowTerms(false)}
          />
        ) : showDeleteModal ? (
          <DeleteAccountModal
            visible
            language={language}
            userEmail={currentUserEmail}
            isDeleting={isDeleting}
            onClose={() => setShowDeleteModal(false)}
            onConfirmDelete={handleConfirmDelete}
          />
        ) : (
        <View style={styles.modalOverlay}>
          {/* Backdrop — tap anywhere above the card to close */}
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={styles.modalCard}>
            {/* Header Bar */}
            <View style={styles.headerRow}>
              <Pressable hitSlop={12} onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
              <Text style={styles.modalTitle}>{t('settingsTitle')}</Text>
            </View>

            {/* Language Selector */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>{t('languageLabel')}</Text>
              <View style={styles.optionsGroup}>
                <Pressable
                  onPress={() => setLanguage('kurdish')}
                  style={[styles.optionPill, language === 'kurdish' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'kurdish' && styles.optionTextActive]}>
                    {t('kurdish')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLanguage('arabic')}
                  style={[styles.optionPill, language === 'arabic' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'arabic' && styles.optionTextActive]}>
                    {t('arabic')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLanguage('english')}
                  style={[styles.optionPill, language === 'english' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'english' && styles.optionTextActive]}>
                    {t('english')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Notifications Toggle */}
            <View style={styles.toggleRow}>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#CBD5E1', true: '#3B50C8' }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.toggleMeta}>
                <Text style={styles.toggleTitle}>{t('notificationsTitle')}</Text>
                <Text style={styles.toggleSub}>{t('notificationsSub')}</Text>
              </View>
            </View>

            {/* ─── Legal Section ─── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>{t('legalLabel')}</Text>

              {/* Privacy Policy Button */}
              <Pressable
                onPress={() => setShowPrivacy(true)}
                style={({ pressed }) => [styles.legalBtn, pressed && styles.pressed]}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#3B50C8" />
                <Text style={styles.legalBtnText}>{t('privacyPolicyBtn')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </Pressable>

              {/* Terms & Conditions Button */}
              <Pressable
                onPress={() => setShowTerms(true)}
                style={({ pressed }) => [styles.legalBtn, pressed && styles.pressed]}
              >
                <Ionicons name="document-text-outline" size={18} color="#3B50C8" />
                <Text style={styles.legalBtnText}>{t('termsConditionsBtn')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </Pressable>
            </View>

            {/* ─── Account Deletion (Google Play Compliance) ─── */}
            <Pressable
              onPress={handleDeleteBtnPress}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteBtnText}>
                {language === 'english' ? 'Delete Account & Data' : language === 'arabic' ? 'حذف الحساب والبيانات' : 'سڕینەوەی هەژمار و زانیاری'}
              </Text>
            </Pressable>

            {/* Done Button */}
            <Pressable onPress={onClose} style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}>
              <Text style={styles.doneBtnText}>{t('doneBtn')}</Text>
            </Pressable>
          </View>
        </View>
        )}
      </Modal>
  );
}

// ─── Settings Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  optionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  optionPillActive: {
    backgroundColor: '#3B50C8',
    borderColor: '#3B50C8',
  },
  optionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleMeta: {
    alignItems: 'flex-end',
    flex: 1,
  },
  toggleTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  legalBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  doneBtn: {
    backgroundColor: '#3B50C8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

// ─── Policy Modal Styles ──────────────────────────────────────────────────────

const policyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  heading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  bodyText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'right',
  },
  closeFooterBtn: {
    backgroundColor: '#3B50C8',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeFooterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});

// ─── Delete Modal Styles ──────────────────────────────────────────────────────

const deleteStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 2,
  },
  emailText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  warningText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  promptText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1.3,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
