import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import { checkNotificationPermission, requestNotificationPermission } from '@/lib/notifications';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      checkNotificationPermission().then((granted) => {
        setNotificationsEnabled(granted);
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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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

          {/* Done Button */}
          <Pressable onPress={onClose} style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}>
            <Text style={styles.doneBtnText}>{t('doneBtn')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

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
  pressed: {
    opacity: 0.8,
  },
});
