import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OWNER_EMAIL, addDbAdmin, fetchDbAdmins, removeDbAdmin } from '@/lib/auth-roles';
import { supabase } from '@/lib/supabase';

interface OwnerPanelModalProps {
  visible: boolean;
  onClose: () => void;
}

export function OwnerPanelModal({ visible, onClose }: OwnerPanelModalProps) {
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadAdmins();

      const channel = supabase
        .channel('app_admins_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_admins' }, () => {
          loadAdmins();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [visible]);

  const loadAdmins = async () => {
    const emails = await fetchDbAdmins();
    // Filter out owner email from admin list view
    setAdminEmails(emails.filter((e) => e.toLowerCase() !== OWNER_EMAIL.toLowerCase()));
  };

  const handleAdd = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('تکایە ئیمەیڵێکی دروست بنووسە');
      return;
    }
    if (trimmed === OWNER_EMAIL.toLowerCase()) {
      setErrorMessage('ئەم ئیمەیڵە خاوەنی بەرنامەکەیە!');
      return;
    }

    const success = await addDbAdmin(trimmed);
    if (success) {
      setNewEmail('');
      setErrorMessage(null);
      loadAdmins();
    } else {
      setErrorMessage('کێشەیەک ڕوویدا یاخود ئەم ئیمەیڵە پێشتر زیادکراوە');
    }
  };

  const handleRemove = async (email: string) => {
    const success = await removeDbAdmin(email);
    if (success) {
      loadAdmins();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <Pressable
              hitSlop={12}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>

            <View style={styles.headerTitleMeta}>
              <View style={styles.ownerBadge}>
                <Ionicons name="ribbon" size={14} color="#D97706" />
                <Text style={styles.ownerBadgeText}>خاوەنی بەرنامە (Supabase Live DB)</Text>
              </View>
              <Text style={styles.modalTitle}>دەستەی بەڕێوەبەرایەتی (Owner Panel)</Text>
            </View>
          </View>

          {/* Add Admin Email Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionLabel}>زیادکردنی بەڕێوەبەری نوێ (Add Admin)</Text>

            <View style={styles.addInputRow}>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>زیادکردن</Text>
              </Pressable>

              <TextInput
                value={newEmail}
                onChangeText={(text) => {
                  setNewEmail(text);
                  setErrorMessage(null);
                }}
                placeholder="ئیمەیڵ بنووسە (e.g. admin@gmail.com)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.emailInput}
              />
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          {/* Admins List */}
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>لیستی بەڕێوەبەرە ئاست بەرزەکان</Text>

            <ScrollView style={styles.adminList} showsVerticalScrollIndicator={false}>
              {/* Owner Item */}
              <View style={styles.ownerItemRow}>
                <View style={styles.ownerRoleTag}>
                  <Text style={styles.ownerRoleTagText}>خاوەن</Text>
                </View>

                <View style={styles.adminEmailMeta}>
                  <Text style={styles.adminEmailText}>{OWNER_EMAIL}</Text>
                  <Text style={styles.adminRoleLabel}>بەڕێوەبەری سەرەکی</Text>
                </View>

                <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
              </View>

              {/* Added Admin Items */}
              {adminEmails.map((email) => (
                <View key={email} style={styles.adminItemRow}>
                  <Pressable
                    onPress={() => handleRemove(email)}
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.removeBtnText}>سڕینەوە</Text>
                  </Pressable>

                  <View style={styles.adminEmailMeta}>
                    <Text style={styles.adminEmailText}>{email}</Text>
                    <Text style={styles.adminRoleLabel}>بەڕێوەبەری نرخەکان</Text>
                  </View>

                  <Ionicons name="person-circle-outline" size={22} color="#3B50C8" />
                </View>
              ))}
            </ScrollView>
          </View>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
    gap: 16,
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
  headerTitleMeta: {
    alignItems: 'flex-end',
  },
  ownerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 4,
  },
  ownerBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },

  /* Add Section */
  addSection: {
    gap: 8,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    backgroundColor: '#3B50C8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },

  /* List Section */
  listSection: {
    gap: 8,
    flex: 1,
  },
  adminList: {
    marginTop: 4,
  },
  ownerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8,
  },
  ownerRoleTag: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerRoleTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adminItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  adminEmailMeta: {
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 10,
  },
  adminEmailText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  adminRoleLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.75,
  },
});
