import { StyleSheet, Text, View } from 'react-native';

import type { BorsaItem } from '@/types/market';

interface RegionalBorsaCardProps {
  items: BorsaItem[];
}

export function RegionalBorsaCard({ items }: RegionalBorsaCardProps) {
  return (
    <View style={styles.borsaList}>
      {items.map((item) => (
        <View key={item.id} style={styles.borsaCard}>
          <View style={[styles.priceTagPill, { backgroundColor: item.pillColor }]}>
            <Text style={styles.priceTagText}>{item.price}</Text>
          </View>
          <Text style={styles.borsaUnitText}>100$</Text>
          <View style={styles.borsaTitleRow}>
            <Text style={styles.borsaNameText}>{item.nameKurdish}</Text>
            <View style={styles.flagTag}>
              <Text style={styles.flagTagText}>{item.flagCode}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  borsaList: {
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  borsaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceTagPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  borsaUnitText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  borsaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  borsaNameText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  flagTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  flagTagText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '800',
  },
});
