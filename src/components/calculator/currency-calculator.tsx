import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FlagIcon } from '@/components/common/flag-icon';
import { getCurrencyName } from '@/constants/translations';
import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/context/theme-context';
import { supabase } from '@/lib/supabase';

export interface CurrencyOption {
  code: string;
  nameKurdish: string;
  flagCode: string;
  rateInIqd: number; // Conversion rate relative to 1 unit in IQD
}

export const INITIAL_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', nameKurdish: 'دۆلاری ئەمریکی', flagCode: 'US', rateInIqd: 1503 },
  { code: 'IQD', nameKurdish: 'دیناری عێراقی', flagCode: 'IQ', rateInIqd: 1 },
  { code: 'EUR', nameKurdish: 'یۆرۆی ئەوروپی', flagCode: 'EU', rateInIqd: 1628 },
  { code: 'GBP', nameKurdish: 'پاوەندی بەریتانی', flagCode: 'GB', rateInIqd: 1912 },
  { code: 'TRY', nameKurdish: 'لیرەی تورکی', flagCode: 'TR', rateInIqd: 45.2 },
  { code: 'AED', nameKurdish: 'درهمی ئیماراتی', flagCode: 'AE', rateInIqd: 409.2 },
  { code: 'SAR', nameKurdish: 'ڕیاڵی سعودی', flagCode: 'SA', rateInIqd: 400.8 },
  { code: 'JOD', nameKurdish: 'دیناری ئوردنی', flagCode: 'JO', rateInIqd: 2119.7 },
  { code: 'CHF', nameKurdish: 'فرانکی سویسری', flagCode: 'CH', rateInIqd: 1682 },
  { code: 'SEK', nameKurdish: 'کرۆنی سویدی', flagCode: 'SE', rateInIqd: 142.5 },
  { code: 'NOK', nameKurdish: 'کرۆنی نەرویجی', flagCode: 'NO', rateInIqd: 138.6 },
  { code: 'DKK', nameKurdish: 'کرۆنی دانیمارکی', flagCode: 'DK', rateInIqd: 218.4 },
  { code: 'CAD', nameKurdish: 'دۆلاری کەنەدی', flagCode: 'CA', rateInIqd: 1092.3 },
  { code: 'AUD', nameKurdish: 'دۆلاری ئوسترالی', flagCode: 'AU', rateInIqd: 981.5 },
];

export function CurrencyCalculator() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isEnglish = language === 'english';
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(INITIAL_CURRENCIES);
  const [inputText, setInputText] = useState('100');
  const [fromCurrency, setFromCurrency] = useState<CurrencyOption>(INITIAL_CURRENCIES[0]); // USD
  const [toCurrency, setToCurrency] = useState<CurrencyOption>(INITIAL_CURRENCIES[1]); // IQD

  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'from' | 'to'>('from');

  // Fetch live rates from DB & subscribe to Realtime
  useEffect(() => {
    fetchRatesFromDb();

    const channel = supabase
      .channel('calc_rates_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rates' }, () => {
        fetchRatesFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRatesFromDb = async () => {
    try {
      const { data, error } = await supabase.from('rates').select('*');
      if (error || !data || data.length === 0) return;

      const usdRow = data.find((r) => r.base_currency_code === 'USD');
      const usdSellInIqd = usdRow ? Number(usdRow.sell_rate) / 100 : 1503;

      const updated: CurrencyOption[] = INITIAL_CURRENCIES.map((c) => {
        if (c.code === 'IQD') return c;
        const row = data.find((r) => r.base_currency_code === c.code);
        if (!row) return c;

        const sell = Number(row.sell_rate);

        if (c.code === 'USD') {
          return { ...c, rateInIqd: sell / 100 };
        }
        if (row.quote_currency_code === 'IQD' && sell > 1000) {
          return { ...c, rateInIqd: sell / 100 };
        }
        // If rate is in USD (e.g., EUR 113.9 = $1.139)
        return { ...c, rateInIqd: (sell / 100) * usdSellInIqd };
      });

      setCurrencies(updated);

      // Refresh currently selected from/to
      setFromCurrency((prev) => updated.find((u) => u.code === prev.code) || prev);
      setToCurrency((prev) => updated.find((u) => u.code === prev.code) || prev);
    } catch (err) {
      console.log('Error fetching calc rates:', err);
    }
  };

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

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const openPicker = (target: 'from' | 'to') => {
    setSelectingTarget(target);
    setPickerModalVisible(true);
  };

  const handleSelectCurrency = (curr: CurrencyOption) => {
    if (selectingTarget === 'from') {
      setFromCurrency(curr);
    } else {
      setToCurrency(curr);
    }
    setPickerModalVisible(false);
  };

  // Convert: (InputAmount * fromRateInIqd) / toRateInIqd
  const numericInput = parseFloat(inputText) || 0;
  const rawResult = (numericInput * fromCurrency.rateInIqd) / toCurrency.rateInIqd;

  // Format result
  const formattedResult =
    toCurrency.code === 'IQD'
      ? Math.round(rawResult).toLocaleString()
      : rawResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Rate ratio text e.g. "1 USD = 1,503 IQD"
  const ratioValue = fromCurrency.rateInIqd / toCurrency.rateInIqd;
  const formattedRatio =
    toCurrency.code === 'IQD'
      ? Math.round(ratioValue).toLocaleString()
      : ratioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <View style={styles.container}>
      {/* Sleek Live Exchange Header Badge */}
      <View style={[styles.rateHeaderCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }, isEnglish && styles.rowLtr]}>
        <View style={[styles.liveIndicator, isEnglish && styles.rowLtr]}>
          <View style={styles.greenDot} />
          <Text style={[styles.liveText, { color: colors.textSecondary }]}>{t('calcLiveRate')}</Text>
        </View>

        <Text style={[styles.ratePillText, { color: colors.textPrimary }]}>
          1 {fromCurrency.code} = {formattedRatio} {toCurrency.code}
        </Text>
      </View>

      {/* Main Conversion Card */}
      <View style={[styles.conversionCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
        {/* FROM Currency Row */}
        <View style={styles.currencyBlock}>
          <Text style={[styles.blockLabel, isEnglish && styles.textLeft]}>{t('calcFrom')}</Text>
          <View style={styles.rowContent}>
            <Pressable
              onPress={() => openPicker('from')}
              style={({ pressed }) => [styles.currencyDropdown, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-down" size={16} color="#3B50C8" />
              <Text style={styles.currencyCode}>{fromCurrency.code}</Text>
              <Text style={styles.currencyName}>
                {getCurrencyName(fromCurrency.code, fromCurrency.nameKurdish, language)}
              </Text>
              <FlagIcon code={fromCurrency.flagCode} size={22} />
            </Pressable>
          </View>
          <Text style={styles.bigAmountDisplay} numberOfLines={1} adjustsFontSizeToFit>
            {inputText}
          </Text>
        </View>

        {/* Swap Button Divider */}
        <View style={styles.swapDividerRow}>
          <View style={styles.dividerLine} />
          <Pressable
            onPress={handleSwap}
            style={({ pressed }) => [styles.swapCircleBtn, pressed && styles.pressed]}
          >
            <Ionicons name="swap-vertical" size={20} color="#3B50C8" />
          </Pressable>
          <View style={styles.dividerLine} />
        </View>

        {/* TO Currency Row */}
        <View style={styles.currencyBlock}>
          <Text style={[styles.blockLabel, isEnglish && styles.textLeft]}>{t('calcTo')}</Text>
          <View style={styles.rowContent}>
            <Pressable
              onPress={() => openPicker('to')}
              style={({ pressed }) => [styles.currencyDropdown, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-down" size={16} color="#3B50C8" />
              <Text style={styles.currencyCode}>{toCurrency.code}</Text>
              <Text style={styles.currencyName}>
                {getCurrencyName(toCurrency.code, toCurrency.nameKurdish, language)}
              </Text>
              <FlagIcon code={toCurrency.flagCode} size={22} />
            </Pressable>
          </View>
          <Text style={styles.bigResultDisplay} numberOfLines={1} adjustsFontSizeToFit>
            {formattedResult}
          </Text>
        </View>
      </View>

      {/* Onscreen Keypad Grid */}
      <View style={styles.keypadGrid}>
        <View style={styles.keypadRow}>
          <KeypadButton label="1" onPress={() => handleKeyPress('1')} />
          <KeypadButton label="2" onPress={() => handleKeyPress('2')} />
          <KeypadButton label="3" onPress={() => handleKeyPress('3')} />
          <KeypadButton label="X" variant="orange" onPress={() => handleKeyPress('X')} />
        </View>

        <View style={styles.keypadRow}>
          <KeypadButton label="4" onPress={() => handleKeyPress('4')} />
          <KeypadButton label="5" onPress={() => handleKeyPress('5')} />
          <KeypadButton label="6" onPress={() => handleKeyPress('6')} />
          <KeypadButton label="C" variant="red" onPress={() => handleKeyPress('C')} />
        </View>

        <View style={styles.keypadRow}>
          <KeypadButton label="7" onPress={() => handleKeyPress('7')} />
          <KeypadButton label="8" onPress={() => handleKeyPress('8')} />
          <KeypadButton label="9" onPress={() => handleKeyPress('9')} />
          <KeypadButton label="." onPress={() => handleKeyPress('.')} />
        </View>

        <View style={styles.keypadRow}>
          <KeypadButton label="0" onPress={() => handleKeyPress('0')} />
          <KeypadButton label="00" onPress={() => handleKeyPress('00')} />
          <KeypadButton label="000" flexTwo onPress={() => handleKeyPress('000')} />
        </View>
      </View>

      {/* Currency Selector Dropdown Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setPickerModalVisible(false)} />

          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeader}>
              <Pressable
                hitSlop={12}
                onPress={() => setPickerModalVisible(false)}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
              <Text style={styles.pickerTitle}>
                {selectingTarget === 'from' ? t('calcPickerFrom') : t('calcPickerTo')}
              </Text>
            </View>

            <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
              {currencies.map((item) => {
                const isSelected =
                  selectingTarget === 'from'
                    ? item.code === fromCurrency.code
                    : item.code === toCurrency.code;

                return (
                  <Pressable
                    key={item.code}
                    onPress={() => handleSelectCurrency(item)}
                    style={({ pressed }) => [
                      styles.currencyItemRow,
                      isSelected && styles.currencyItemActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3B50C8" />}

                    <View style={styles.currencyItemMeta}>
                      <Text style={styles.itemCodeText}>{item.code}</Text>
                      <Text style={styles.itemNameText}>
                        {getCurrencyName(item.code, item.nameKurdish, language)}
                      </Text>
                    </View>

                    <FlagIcon code={item.flagCode} size={26} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  rowLtr: {
    flexDirection: 'row',
  },
  textLeft: {
    textAlign: 'left',
  },
  rateHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  liveText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  ratePillText: {
    color: '#3B50C8',
    fontSize: 14,
    fontWeight: '900',
  },

  /* Conversion Card */
  conversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 18px rgba(50, 50, 90, 0.05)',
  },
  currencyBlock: {
    gap: 6,
  },
  blockLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  currencyCode: {
    color: '#3B50C8',
    fontSize: 13,
    fontWeight: '900',
  },
  currencyName: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  bigAmountDisplay: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 6,
  },
  swapDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  swapCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigResultDisplay: {
    color: '#3B50C8',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 6,
  },

  /* Keypad Grid */
  keypadGrid: {
    marginTop: 2,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keypadBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnFlexTwo: {
    flex: 2.1,
  },
  btnDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
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
    fontSize: 20,
    fontWeight: '800',
  },
  btnTextDefault: {
    color: '#0F172A',
  },
  btnTextWhite: {
    color: '#FFFFFF',
  },

  /* Modal Picker */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  pickerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  closeBtn: {
    padding: 4,
  },
  pickerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  currencyList: {
    marginTop: 4,
  },
  currencyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  currencyItemActive: {
    backgroundColor: '#EEF2FF',
  },
  currencyItemMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemCodeText: {
    color: '#3B50C8',
    fontSize: 14,
    fontWeight: '900',
  },
  itemNameText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.75,
  },
});
