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
  const { isPremium, openPlanModal } = usePlan();
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
          <Text style={[styles.headerTitleCurr, { color: colors.textPrimary }]} numberOfLines={1}>{t('currencyLabel')}</Text>
          <Text style={[styles.headerSubCurr, { color: colors.textSecondary }]} numberOfLines={1}>{t('currencySub')}</Text>
        </View>

        <View style={styles.colBuyHeader}>
          <Text style={styles.headerTitleBuy} numberOfLines={1}>{t('buyLabel')}</Text>
          <Text style={styles.headerSubBuy} numberOfLines={1}>{t('buySub')}</Text>
        </View>

        <View style={[styles.colSellHeader, isEnglish && styles.alignRight]}>
          <Text style={styles.headerTitleSell} numberOfLines={1}>{t('sellLabel')}</Text>
          <Text style={styles.headerSubSell} numberOfLines={1}>{t('sellSub')}</Text>
        </View>
      </View>

      {/* Currency Rows */}
      <View style={styles.tableBody}>
        {rates.map((rate) => (
          <Pressable
            key={rate.id}
            onPress={!isPremium ? openPlanModal : undefined}
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
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  ellipsizeMode="tail"
                  style={[styles.currencyNameKurdish, { color: colors.textPrimary }, isEnglish && styles.textLeft]}
                >
                  {getCurrencyName(rate.code, rate.nameKurdish, language)}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.currencyCodeSub, { color: colors.textSecondary }, isEnglish && styles.textLeft]}
                >
                  {rate.unitLabel}
                </Text>
              </View>
            </View>

            {/* BUY */}
            <View style={styles.colBuy}>
              {isPremium ? (
                <View style={[styles.buyPill, isDark && { backgroundColor: '#0F1950', borderColor: '#1E3A8A' }]}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.buyPriceText, isDark && { color: '#93C5FD' }]}
                  >
                    {rate.buyRate}
                  </Text>
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
              {isPremium ? (
                <View style={[styles.sellPill, isDark && { backgroundColor: '#3B0A0A', borderColor: '#7F1D1D' }]}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.sellPriceText, isDark && { color: '#FCA5A5' }]}
                  >
                    {rate.sellRate}
                  </Text>
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
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  colSellHeader: { flex: 1.1, alignItems: 'flex-start' },
  headerTitleSell: { color: '#DC2626', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  headerSubSell: { color: '#EF4444', fontSize: 9, fontWeight: '700', marginTop: 1 },
  colBuyHeader: { flex: 1.1, alignItems: 'center' },
  headerTitleBuy: { color: '#2563EB', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  headerSubBuy: { color: '#3B82F6', fontSize: 9, fontWeight: '700', marginTop: 1 },
  colCurrencyHeader: { flex: 1.4, alignItems: 'flex-end' },
  headerTitleCurr: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  headerSubCurr: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  tableBody: { gap: 0 },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  colSell: { flex: 1.1, alignItems: 'flex-start', justifyContent: 'center' },
  sellPill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 7,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellPriceText: { color: '#DC2626', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  colBuy: { flex: 1.1, alignItems: 'center', justifyContent: 'center' },
  buyPill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 7,
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyPriceText: { color: '#2563EB', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  colCurrency: { flex: 1.4, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  currencyMetaRight: { alignItems: 'flex-end', flex: 1, overflow: 'hidden' },
  currencyNameKurdish: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  currencyCodeSub: { fontSize: 10, fontWeight: '500', marginTop: 1, textAlign: 'right', color: '#94A3B8' },
  flagContainer: { width: 24, alignItems: 'center', justifyContent: 'center' },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 7,
    width: '95%',
  },
  lockedPillText: {
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
