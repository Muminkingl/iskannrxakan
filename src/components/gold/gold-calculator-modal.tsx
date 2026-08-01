import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';

interface GoldCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GoldCalculatorModal({ visible, onClose }: GoldCalculatorModalProps) {
  const { t, language } = useLanguage();
  const isEnglish = language === 'english';

  const [unitMode, setUnitMode] = useState<'mithqal' | 'gram'>('mithqal');
  const [quantityText, setQuantityText] = useState('');

  const count = parseFloat(quantityText) || 0;

  // Rates per Mithqal in IQD
  const price18 = 746000;
  const price21 = 870000;
  const price22 = 910000;
  const price24 = 994000;

  const multiplier = unitMode === 'mithqal' ? count : count / 5;
  const currencyUnit = isEnglish ? 'IQD' : 'د.ع';

  const results = [
    { key: 'gold18', label: t('gold18'), price: price18 },
    { key: 'gold21', label: t('gold21'), price: price21 },
    { key: 'gold22', label: t('gold22'), price: price22 },
    { key: 'gold24', label: t('gold24'), price: price24 },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header Title */}
          <Text style={styles.modalTitle}>{t('goldCalcTitle')}</Text>

          {/* Unit Toggle Buttons (Mithqal vs Gram) */}
          <View style={[styles.toggleRow, isEnglish ? styles.rowLtr : styles.rowRtl]}>
            <Pressable
              onPress={() => setUnitMode('gram')}
              style={[styles.toggleBtn, unitMode === 'gram' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, unitMode === 'gram' && styles.toggleTextActive]}>
                {t('goldCalcGram')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setUnitMode('mithqal')}
              style={[styles.toggleBtn, unitMode === 'mithqal' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, unitMode === 'mithqal' && styles.toggleTextActive]}>
                {t('goldCalcMithqal')}
              </Text>
            </Pressable>
          </View>

          {/* Input Box */}
          <View style={[styles.inputBox, isEnglish ? styles.rowLtr : styles.rowRtl]}>
            <TextInput
              style={[styles.textInput, isEnglish ? styles.textLeft : styles.textRight]}
              keyboardType="numeric"
              placeholder={unitMode === 'mithqal' ? t('goldCalcInputMithqal') : t('goldCalcInputGram')}
              placeholderTextColor="#94A3B8"
              value={quantityText}
              onChangeText={setQuantityText}
            />
            <View style={styles.inputIconBadge}>
              <Ionicons name="calculator-outline" size={18} color="#4F55C7" />
            </View>
          </View>

          {/* Karat Breakdown Results */}
          <View style={styles.resultsList}>
            {results.map((item) => (
              <View key={item.key} style={[styles.resultRow, isEnglish ? styles.rowLtr : styles.rowRtl]}>
                <Text style={styles.resultLabel}>{item.label}</Text>
                <Text style={styles.resultValue}>
                  {Math.round(multiplier * item.price).toLocaleString()} {currencyUnit}
                </Text>
              </View>
            ))}
          </View>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.closeBtnText}>{t('closeBtn')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  },
  modalTitle: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  toggleRow: {
    gap: 10,
  },
  rowLtr: {
    flexDirection: 'row',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B50C8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#3B50C8',
  },
  toggleText: {
    color: '#3B50C8',
    fontSize: 15,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B50C8',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    padding: 0,
  },
  inputIconBadge: {
    marginHorizontal: 4,
  },
  resultsList: {
    gap: 12,
    paddingVertical: 4,
  },
  resultRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  resultLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#3B50C8',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
