import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GoldCalculatorModal } from '@/components/gold/gold-calculator-modal';
import { GOLD_RATES } from '@/constants/market-data';

export function GoldScreen() {
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Notice Info Card */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>تێبینی</Text>
        <Text style={styles.noticeText}>
          نرخ بەردەوام لە گۆڕاندایە ئۆنسەیەک ئاڵتوون $4,094 یەک ئۆنسە = 31.100 گرام ئاڵتوون یەک مسقاڵ = 5 گرام ئاڵتوون
        </Text>
      </View>

      {/* Golden CTA Banner */}
      <View style={styles.goldenBanner}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        <Text style={styles.bannerText}>
          کلیک بکه و ئه‌پی بازاری زێڕ دابگره بۆ بینینی نرخی زێڕ...
        </Text>
        <View style={styles.goldBadgeIcon}>
          <Text style={styles.goldBadgeLetter}>G</Text>
        </View>
      </View>

      {/* Section Title Header */}
      <View style={styles.sectionHeaderRow}>
        <Pressable
          onPress={() => setIsCalcModalOpen(true)}
          style={({ pressed }) => [styles.calcTriggerBtn, pressed && styles.pressed]}
        >
          <Ionicons name="calculator" size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.sectionTitle}>فڕۆشتنی زێڕ</Text>
      </View>

      {/* Karats List */}
      <View style={styles.karatList}>
        {GOLD_RATES.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.karatCard}>
              <Pressable
                onPress={() => toggleExpand(item.id)}
                style={({ pressed }) => [styles.karatHeader, pressed && styles.pressed]}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#3B50C8"
                />

                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>{item.priceFormatted}</Text>
                </View>

                {item.unitKurdish ? (
                  <Text style={styles.unitText}>{item.unitKurdish}</Text>
                ) : null}

                <Text style={styles.karatTitle}>{item.karatKurdish}</Text>
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedDetails}>
                  <Text style={styles.expandedText}>
                    تێبینی: نرخ بە پێی تێپەڕبوونی کات دەگۆڕێت و لە کاتی مامەڵەکردن ڕاستەوخۆ دیاری دەکرێت.
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Gold Calculator Modal */}
      <GoldCalculatorModal
        visible={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 14,
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noticeTitle: {
    color: '#3B50C8',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 4,
  },
  noticeText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '500',
  },
  goldenBanner: {
    backgroundColor: '#D97706',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  goldBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadgeLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  calcTriggerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
  },
  karatList: {
    gap: 10,
  },
  karatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  karatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pricePill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pricePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  unitText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  karatTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  expandedDetails: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  expandedText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.8,
  },
});
