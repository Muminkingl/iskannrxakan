import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CurrencyCalculator() {
  const [inputText, setInputText] = useState('0');
  const [isUsdToIqd, setIsUsdToIqd] = useState(true);

  const ratePerDollar = 1502.0;

  const handleKeyPress = (val: string) => {
    if (val === 'C') {
      setInputText('0');
      return;
    }
    if (val === 'X') {
      if (inputText.length <= 1) {
        setInputText('0');
      } else {
        setInputText(inputText.slice(0, -1));
      }
      return;
    }
    if (val === '.') {
      if (inputText.includes('.')) return;
      setInputText(inputText + '.');
      return;
    }

    if (inputText === '0') {
      if (val === '0' || val === '00' || val === '000') return;
      setInputText(val);
    } else {
      setInputText(inputText + val);
    }
  };

  const numericValue = parseFloat(inputText) || 0;
  const convertedResult = isUsdToIqd
    ? numericValue * ratePerDollar
    : numericValue / ratePerDollar;

  return (
    <View style={styles.container}>
      {/* Top Rate Banner */}
      <View style={styles.headlineBanner}>
        <Text style={styles.headlineText}>
          1 دۆلاری ئه‌مریکی = 1502.00 دیناری عێراقی
        </Text>
      </View>

      {/* Main Conversion Cards Box */}
      <View style={styles.conversionCard}>
        {/* Top Currency Input Display */}
        <View style={styles.currencyRow}>
          <View style={styles.calcIconBadge}>
            <Ionicons name="calculator-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.currencyMeta}>
            <View style={styles.flagPill}>
              <Text style={styles.flagPillText}>US</Text>
            </View>
            <Text style={styles.currencyNameText}>
              {isUsdToIqd ? 'دۆلاری ئه‌مریکی' : 'دیناری عێراقی'}
            </Text>
          </View>
        </View>

        <Text style={styles.bigAmountDisplay}>
          {isUsdToIqd ? `$ ${inputText}` : `${inputText} د.ع`}
        </Text>

        {/* Swap Button */}
        <View style={styles.swapDividerRow}>
          <Pressable
            onPress={() => setIsUsdToIqd(!isUsdToIqd)}
            style={({ pressed }) => [styles.swapCircleBtn, pressed && styles.pressed]}
          >
            <Ionicons name="swap-vertical" size={22} color="#3B50C8" />
          </Pressable>
        </View>

        {/* Bottom Currency Output Display */}
        <View style={styles.currencyRow}>
          <View style={styles.currencyMeta}>
            <View style={styles.flagPillIq}>
              <Text style={styles.flagPillIqText}>IQ</Text>
            </View>
            <Text style={styles.currencyNameText}>
              {isUsdToIqd ? 'دیناری عێراقی' : 'دۆلاری ئه‌مریکی'}
            </Text>
          </View>
        </View>

        <Text style={styles.bigResultDisplay}>
          {isUsdToIqd
            ? `${Math.round(convertedResult).toLocaleString()} د.ع`
            : `$ ${convertedResult.toFixed(2)}`}
        </Text>
      </View>

      {/* Onscreen Keypad Grid */}
      <View style={styles.keypadGrid}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="1" onPress={() => handleKeyPress('1')} />
          <KeypadButton label="2" onPress={() => handleKeyPress('2')} />
          <KeypadButton label="3" onPress={() => handleKeyPress('3')} />
          <KeypadButton label="X" variant="orange" onPress={() => handleKeyPress('X')} />
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="4" onPress={() => handleKeyPress('4')} />
          <KeypadButton label="5" onPress={() => handleKeyPress('5')} />
          <KeypadButton label="6" onPress={() => handleKeyPress('6')} />
          <KeypadButton label="C" variant="red" onPress={() => handleKeyPress('C')} />
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="7" onPress={() => handleKeyPress('7')} />
          <KeypadButton label="8" onPress={() => handleKeyPress('8')} />
          <KeypadButton label="9" onPress={() => handleKeyPress('9')} />
          <KeypadButton label="." onPress={() => handleKeyPress('.')} />
        </View>

        {/* Row 4 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="0" onPress={() => handleKeyPress('0')} />
          <KeypadButton label="00" onPress={() => handleKeyPress('00')} />
          <KeypadButton label="000" flexTwo onPress={() => handleKeyPress('000')} />
        </View>
      </View>
    </View>
  );
}

interface KeypadButtonProps {
  label: string;
  variant?: 'default' | 'orange' | 'red';
  flexTwo?: boolean;
  onPress: () => void;
}

function KeypadButton({ label, variant = 'default', flexTwo = false, onPress }: KeypadButtonProps) {
  const getStyle = () => {
    if (variant === 'orange') return styles.btnOrange;
    if (variant === 'red') return styles.btnRed;
    return styles.btnDefault;
  };

  const getTextStyle = () => {
    if (variant === 'orange' || variant === 'red') return styles.btnTextWhite;
    return styles.btnTextDefault;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.keypadBtn,
        getStyle(),
        flexTwo && styles.btnFlexTwo,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.keypadBtnText, getTextStyle()]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 14,
  },
  headlineBanner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  headlineText: {
    color: '#3B50C8',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  conversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 16px rgba(50, 50, 90, 0.04)',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4F55C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  flagPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flagPillText: {
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '800',
  },
  flagPillIq: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flagPillIqText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '800',
  },
  currencyNameText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  bigAmountDisplay: {
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 10,
  },
  swapDividerRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  swapCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigResultDisplay: {
    color: '#1E293B',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },

  /* Keypad Grid */
  keypadGrid: {
    marginTop: 6,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keypadBtn: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnFlexTwo: {
    flex: 2.1,
  },
  btnDefault: {
    backgroundColor: '#F1F3F9',
    borderColor: '#E2E8F0',
  },
  btnOrange: {
    backgroundColor: '#F97316',
    borderColor: '#EA580C',
  },
  btnRed: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  keypadBtnText: {
    fontSize: 22,
    fontWeight: '800',
  },
  btnTextDefault: {
    color: '#0F172A',
  },
  btnTextWhite: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
