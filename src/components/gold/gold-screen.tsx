import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GoldCalculatorModal } from '@/components/gold/gold-calculator-modal';
import { GOLD_RATES as INITIAL_GOLD_RATES } from '@/constants/market-data';
import { useLanguage } from '@/context/language-context';
import { usePlan } from '@/context/plan-context';
import { useRates } from '@/context/rates-context';
import { useTheme } from '@/context/theme-context';
import type { GoldItem } from '@/types/market';

export function GoldScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { isPremium, openPlanModal } = usePlan();
  const { rates } = useRates();
  const isEnglish = language === 'english';

  const [goldRates, setGoldRates] = useState<GoldItem[]>(INITIAL_GOLD_RATES);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  useEffect(() => {
    const byCode = new Map(rates.map((rate) => [rate.code, rate]));
    const updated = INITIAL_GOLD_RATES.map((item) => {
      const codeById: Record<string, string> = {
        g24: 'G24',
        g22: 'G22',
        g21: 'G21',
        g18: 'G18',
        ounce: 'XAU',
      };
      const rate = byCode.get(codeById[item.id]);
      if (!rate) return item;
      const value = Number(rate.sellRate.replace(/,/g, ''));
      return {
        ...item,
        price: value,
        priceFormatted: item.id === 'ounce' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} د.ع`,
      };
    });
    setGoldRates(updated);
  }, [rates]);

  const getKaratTitle = (item: GoldItem) => {
    if (isEnglish) {
      if (item.id === 'g24') return '24K Gold';
      if (item.id === 'g22') return '22K Gold';
      if (item.id === 'g21') return '21K Gold';
      if (item.id === 'g18') return '18K Gold';
      if (item.id === 'ounce') return '1 Gold Ounce';
    }
    return item.karatKurdish;
  };

  const getUnitText = (item: GoldItem) => {
    if (isEnglish && item.unitKurdish) {
      if (item.unitKurdish.includes('مسقاڵ') || item.unitKurdish.includes('میسقاڵ')) return '1 Mithqal';
      return item.unitKurdish;
    }
    return item.unitKurdish;
  };

  const getPriceFormatted = (item: GoldItem) => {
    if (isEnglish) {
      return item.priceFormatted.replace('د.ع', 'IQD');
    }
    return item.priceFormatted;
  };

  return (
    <View style={styles.container}>
      {/* Notice Info Card */}
      <View style={[styles.noticeCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
        <View style={[styles.noticeHeaderRow, isEnglish && styles.rowLtr]}>
          <Ionicons name="sparkles" size={16} color="#D97706" />
          <Text style={styles.noticeTitle}>{t('goldNoticeTitle')}</Text>
        </View>
        <Text style={[styles.noticeText, { color: colors.textSecondary }, isEnglish && styles.textLeft]}>
          {t('goldNoticeText')}
        </Text>
      </View>

      {/* Section Title Header */}
      <View style={[styles.sectionHeaderRow, isEnglish && styles.rowLtr]}>
        <Pressable
          onPress={() => {
            if (!isPremium) {
              openPlanModal();
            } else {
              setIsCalcModalOpen(true);
            }
          }}
          style={({ pressed }) => [styles.calcTriggerBtn, { backgroundColor: colors.primaryAccent }, pressed && styles.pressed]}
        >
          <Ionicons name="calculator" size={18} color="#FFFFFF" />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('goldTitle')}</Text>
      </View>

      {/* Karats List */}
      <View style={styles.karatList}>
        {goldRates.map((item) => (
          <Pressable
            key={item.id}
            onPress={!isPremium ? openPlanModal : undefined}
            style={[styles.karatCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}
          >
            <View style={[styles.karatCardInner, isEnglish ? styles.rowLtr : styles.rowRtl]}>
              {/* Text / Title Group */}
              <View style={[styles.karatInfoGroup, isEnglish ? styles.rowLtr : styles.rowRtl]}>
                <Text style={[styles.karatTitle, { color: colors.textPrimary }]}>
                  {getKaratTitle(item)}
                </Text>
                {item.unitKurdish ? (
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                    {getUnitText(item)}
                  </Text>
                ) : null}
              </View>

              {/* Price Pill */}
              {isPremium ? (
                <View style={[styles.pricePill, { backgroundColor: colors.bgPrimary, borderColor: colors.borderColor }]}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.pricePillText, { color: colors.textPrimary }]}
                  >
                    {getPriceFormatted(item)}
                  </Text>
                </View>
              ) : (
                <View style={styles.lockedGoldPill}>
                  <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.lockedGoldText}>••••••••</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Gold Calculator Modal */}
      <GoldCalculatorModal
        visible={isCalcModalOpen}
        onClose={() => setIsCalcModalOpen(false)}
        goldRates={goldRates}
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  noticeHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
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
  noticeTitle: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '800',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    fontWeight: '500',
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  karatList: {
    gap: 10,
  },
  karatCard: {
    borderRadius: 14,
    borderWidth: 1,
    boxShadow: '0 2px 8px rgba(50, 50, 90, 0.04)',
  },
  karatCardInner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pricePill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pricePillText: {
    fontSize: 15,
    fontWeight: '900',
  },
  karatInfoGroup: {
    alignItems: 'center',
    gap: 8,
  },
  karatTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  lockedGoldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  lockedGoldText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
