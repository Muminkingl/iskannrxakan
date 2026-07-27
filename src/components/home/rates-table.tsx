import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RateItem } from '@/types/market';

interface RatesTableProps {
  rates: RateItem[];
}

export function RatesTable({ rates }: RatesTableProps) {
  return (
    <View style={styles.detailedSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleText}>نرخی زۆرترینی بازاڕ</Text>
        <Text style={styles.buySellHeaderLabel}>کڕین / فڕۆشتن</Text>
      </View>

      {rates.map((rate) => (
        <View key={rate.id} style={styles.rateCardRow}>
          {/* Buy / Sell Boxes */}
          <View style={styles.ratePricesGroup}>
            <View style={styles.buyBadge}>
              <Text style={styles.buyText}>{rate.buyRate} د.ع</Text>
            </View>
            <View style={styles.sellBadge}>
              <Text style={styles.sellText}>{rate.sellRate} د.ع</Text>
            </View>
          </View>

          {/* Currency Name & Unit */}
          <View style={styles.rateMetaGroup}>
            <View style={styles.rateNameRow}>
              <Text style={styles.rateNameKurdish}>{rate.nameKurdish}</Text>
              {rate.category === 'gold' ? (
                <Ionicons name="diamond" size={16} color="#D97706" />
              ) : (
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>{rate.code}</Text>
                </View>
              )}
            </View>
            <Text style={styles.rateUnitText}>{rate.unitLabel}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  detailedSection: {
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitleText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },
  buySellHeaderLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  rateCardRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratePricesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sellBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sellText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rateMetaGroup: {
    alignItems: 'flex-end',
  },
  rateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateNameKurdish: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  codePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codePillText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
  rateUnitText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
