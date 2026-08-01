import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CalculatorModal({ visible, onClose }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isNewNumber, setIsNewNumber] = useState(true);

  const formatNumber = (numStr: string) => {
    if (numStr === 'Error' || numStr === 'Infinity' || numStr === 'NaN') return numStr;
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleDigit = (digit: string) => {
    if (isNewNumber) {
      setDisplay(digit === '.' ? '0.' : digit);
      setIsNewNumber(false);
    } else {
      if (digit === '.' && display.includes('.')) return;
      if (display === '0' && digit !== '.') {
        setDisplay(digit);
      } else {
        setDisplay(display + digit);
      }
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display.replace(/,/g, ''));
    if (isNaN(current)) return;

    if (prevValue !== null && operator && !isNewNumber) {
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(result);
      setEquation(`${formatNumber(String(result))} ${op}`);
    } else {
      setPrevValue(current);
      setEquation(`${formatNumber(display)} ${op}`);
    }

    setOperator(op);
    setIsNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      case '%':
        return (a * b) / 100;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (prevValue === null || operator === null) return;
    const current = parseFloat(display.replace(/,/g, ''));
    if (isNaN(current)) return;

    const result = calculate(prevValue, current, operator);
    setEquation(`${formatNumber(String(prevValue))} ${operator} ${formatNumber(display)} =`);
    setDisplay(String(result));
    setPrevValue(null);
    setOperator(null);
    setIsNewNumber(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperator(null);
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    if (isNewNumber || display.length <= 1) {
      setDisplay('0');
      setIsNewNumber(true);
    } else {
      setDisplay(display.slice(0, -1));
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
            <Text style={styles.modalTitle}>حاسیبە</Text>
          </View>

          {/* Calculator Screen Display */}
          <View style={styles.screenDisplay}>
            <Text style={styles.equationText}>{equation}</Text>
            <Text style={styles.resultText} numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(display)}
            </Text>
          </View>

          {/* Keypad Grid */}
          <View style={styles.keypad}>
            {/* Row 1 */}
            <View style={styles.keyRow}>
              <Pressable onPress={handleClear} style={({ pressed }) => [styles.keyBtn, styles.clearBtn, pressed && styles.pressed]}>
                <Text style={styles.clearBtnText}>C</Text>
              </Pressable>
              <Pressable onPress={handleDelete} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Ionicons name="backspace-outline" size={20} color="#3B50C8" />
              </Pressable>
              <Pressable onPress={() => handleOperator('%')} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionBtnText}>%</Text>
              </Pressable>
              <Pressable onPress={() => handleOperator('÷')} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionBtnText}>÷</Text>
              </Pressable>
            </View>

            {/* Row 2 */}
            <View style={styles.keyRow}>
              <Pressable onPress={() => handleDigit('7')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>7</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('8')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>8</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('9')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>9</Text>
              </Pressable>
              <Pressable onPress={() => handleOperator('×')} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionBtnText}>×</Text>
              </Pressable>
            </View>

            {/* Row 3 */}
            <View style={styles.keyRow}>
              <Pressable onPress={() => handleDigit('4')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>4</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('5')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>5</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('6')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>6</Text>
              </Pressable>
              <Pressable onPress={() => handleOperator('-')} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionBtnText}>-</Text>
              </Pressable>
            </View>

            {/* Row 4 */}
            <View style={styles.keyRow}>
              <Pressable onPress={() => handleDigit('1')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>1</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('2')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>2</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('3')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>3</Text>
              </Pressable>
              <Pressable onPress={() => handleOperator('+')} style={({ pressed }) => [styles.keyBtn, styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionBtnText}>+</Text>
              </Pressable>
            </View>

            {/* Row 5 */}
            <View style={styles.keyRow}>
              <Pressable onPress={() => handleDigit('00')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>00</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('0')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>0</Text>
              </Pressable>
              <Pressable onPress={() => handleDigit('.')} style={({ pressed }) => [styles.keyBtn, pressed && styles.pressed]}>
                <Text style={styles.numBtnText}>.</Text>
              </Pressable>
              <Pressable onPress={handleEquals} style={({ pressed }) => [styles.keyBtn, styles.equalsBtn, pressed && styles.pressed]}>
                <Text style={styles.equalsBtnText}>=</Text>
              </Pressable>
            </View>
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
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  screenDisplay: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 80,
  },
  equationText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultText: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
  },
  keypad: {
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
  },
  numBtnText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  clearBtnText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: '900',
  },
  actionBtn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  actionBtnText: {
    color: '#3B50C8',
    fontSize: 20,
    fontWeight: '900',
  },
  equalsBtn: {
    backgroundColor: '#3B50C8',
    borderColor: '#3B50C8',
  },
  equalsBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
