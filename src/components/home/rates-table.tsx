import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FlagIcon } from '@/components/common/flag-icon';
import { getCurrencyName } from '@/constants/translations';
import { useLanguage } from '@/context/language-context';
import { usePlan } from '@/context/plan-context';
import { useTheme } from '@/context/theme-context';
import type { RateItem } from '@/types/market';

interface RatesTableProps {
  rates: RateItem[];
}

export function RatesTable({ rates }: RatesTableProps) {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { isVip, openPlanModal } = usePlan();
  const isEnglish = language === 'english';

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
      {/* Table Header Row */}
      <View
        style={[
          styles.tableHeaderRow,
          { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderColor },
          isEnglish && styles.rowLtr,
        ]}
      >
        <View style={[styles.colCurrencyHeader, isEnglish && styles.alignLeft]}>
          <Text style={[styles.headerTitleCurr, { color: colors.textPrimary }]}>{t('currencyLabel')}</Text>
          <Text style={[styles.headerSubCurr, { color: colors.textSecondary }]}>{t('currencySub')}</Text>
        </View>

        <View style={styles.colBuyHeader}>
          <Text style={styles.headerTitleBuy}>{t('buyLabel')}</Text>
          <Text style={styles.headerSubBuy}>{t('buySub')}</Text>
        </View>

        <View style={[styles.colSellHeader, isEnglish && styles.alignRight]}>
          <Text style={styles.headerTitleSell}>{t('sellLabel')}</Text>
          <Text style={styles.headerSubSell}>{t('sellSub')}</Text>
        </View>
      </View>

      {/* Currency Rows */}
      <View style={styles.tableBody}>
        {rates.map((rate) => (
          <Pressable
            key={rate.id}
            onPress={!isVip ? openPlanModal : undefined}
            style={[styles.tableRow, { borderBottomColor: colors.borderColor }, isEnglish && styles.rowLtr]}
          >
            {/* CURRENCY */}
            <View style={[styles.colCurrency, isEnglish && styles.rowLtr]}>
              <View style={styles.flagContainer}>
                <FlagIcon code={rate.flagCode} size={18} />
              </View>
              <View style={[styles.currencyMetaRight, isEnglish && styles.alignLeft]}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.currencyNameKurdish, { color: colors.textPrimary }, isEnglish && styles.textLeft]}
                >
                  {getCurrencyName(rate.code, rate.nameKurdish, language)}
                </Text>
                <Text style={[styles.currencyCodeSub, { color: colors.textSecondary }, isEnglish && styles.textLeft]}>
                  {rate.unitLabel}
                </Text>
              </View>
            </View>

            {/* BUY */}
            <View style={styles.colBuy}>
              {isVip ? (
                <View style={[styles.buyPill, isDark && { backgroundColor: '#0F1950', borderColor: '#1E3A8A' }]}>
                  <Text style={[styles.buyPriceText, isDark && { color: '#93C5FD' }]}>{rate.buyRate}</Text>
                </View>
              ) : (
                <View style={styles.lockedPill}>
                  <Ionicons name="lock-closed" size={12} color="#0EA5E9" style={{ marginRight: 2 }} />
                  <Text style={styles.lockedPillText}>••••••</Text>
                </View>
              )}
            </View>

            {/* SELL */}
            <View style={[styles.colSell, isEnglish && styles.alignRight]}>
              {isVip ? (
                <View style={[styles.sellPill, isDark && { backgroundColor: '#3B0A0A', borderColor: '#7F1D1D' }]}>
                  <Text style={[styles.sellPriceText, isDark && { color: '#FCA5A5' }]}>{rate.sellRate}</Text>
                </View>
              ) : (
                <View style={styles.lockedPill}>
                  <Ionicons name="lock-closed" size={12} color="#0EA5E9" style={{ marginRight: 2 }} />
                  <Text style={styles.lockedPillText}>••••••</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLtr: {
    flexDirection: 'row',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  textLeft: {
    textAlign: 'left',
  },
  colSellHeader: { flex: 1, alignItems: 'flex-start' },
  headerTitleSell: { color: '#DC2626', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  headerSubSell: { color: '#EF4444', fontSize: 10, fontWeight: '700', marginTop: 1 },
  colBuyHeader: { flex: 1, alignItems: 'center' },
  headerTitleBuy: { color: '#2563EB', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  headerSubBuy: { color: '#3B82F6', fontSize: 10, fontWeight: '700', marginTop: 1 },
  colCurrencyHeader: { flex: 1.4, alignItems: 'flex-end' },
  headerTitleCurr: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  headerSubCurr: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  tableBody: { gap: 0 },
  tableRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  colSell: { flex: 1, alignItems: 'flex-start' },
  sellPill: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 82, alignItems: 'center' },
  sellPriceText: { color: '#DC2626', fontSize: 14, fontWeight: '900' },
  colBuy: { flex: 1, alignItems: 'center' },
  buyPill: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 82, alignItems: 'center' },
  buyPriceText: { color: '#2563EB', fontSize: 14, fontWeight: '900' },
  colCurrency: { flex: 1.6, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  currencyMetaRight: { alignItems: 'flex-end', flex: 1 },
  currencyNameKurdish: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  currencyCodeSub: { fontSize: 10, fontWeight: '500', marginTop: 2, textAlign: 'right', color: '#94A3B8' },
  flagContainer: { width: 28, alignItems: 'center', justifyContent: 'center' },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 82,
  },
  lockedPillText: {
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
