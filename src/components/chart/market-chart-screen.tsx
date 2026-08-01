import { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '@/context/language-context';
import { useTheme } from '@/context/theme-context';
import { supabase } from '@/lib/supabase';

type Timeframe = '7d' | '1m' | '1y' | 'custom';

interface HistoryPoint {
  created_at: string;
  sell_rate: number;
  buy_rate: number;
}

export interface CurrencyPairOption {
  id: string;
  label: string;
  baseCurrencyCode: string;
}

const DEFAULT_PAIRS: CurrencyPairOption[] = [
  { id: 'try_iqd', label: 'TRY / IQD', baseCurrencyCode: 'TRY' },
  { id: 'eur_iqd', label: 'EUR / IQD', baseCurrencyCode: 'EUR' },
  { id: 'gold_24', label: 'Gold 24K', baseCurrencyCode: 'G24' },
];

const EXTRA_PAIRS: CurrencyPairOption[] = [
  { id: 'gbp_iqd', label: 'GBP / IQD', baseCurrencyCode: 'GBP' },
  { id: 'sar_iqd', label: 'SAR / IQD', baseCurrencyCode: 'SAR' },
  { id: 'aed_iqd', label: 'AED / IQD', baseCurrencyCode: 'AED' },
  { id: 'gold_21', label: 'Gold 21K', baseCurrencyCode: 'G21' },
  { id: 'jod_iqd', label: 'JOD / IQD', baseCurrencyCode: 'JOD' },
  { id: 'chf_iqd', label: 'CHF / IQD', baseCurrencyCode: 'CHF' },
];

const ALL_PAIRS = [...DEFAULT_PAIRS, ...EXTRA_PAIRS];

function timeframeToDate(tf: Timeframe, startDate: string): Date {
  const now = new Date();
  if (tf === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (tf === '1m') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (tf === '1y') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return new Date(startDate);
}

function buildSvgPath(points: number[], width: number, height: number, fill: boolean): string {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 10;
  const W = width;
  const H = height - pad * 2;

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = pad + H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  if (fill) {
    const lastX = ((points.length - 1) / (points.length - 1)) * W;
    return `M ${coords[0]} L ${coords.join(' L ')} L ${lastX},${height} L 0,${height} Z`;
  }

  return `M ${coords[0]} L ${coords.join(' L ')}`;
}

// Client-side cache for chart query data (5-minute TTL) to prevent DB spam / ddos
const chartCache = new Map<string, { timestamp: number; payload: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function MarketChartScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isEnglish = language === 'english';

  const [chartWidth, setChartWidth] = useState(300);

  const handleChartLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  const [selectedPairId, setSelectedPairId] = useState('try_iqd');
  const [customPair, setCustomPair] = useState<CurrencyPairOption | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-27');
  const [pairPickerVisible, setPairPickerVisible] = useState(false);

  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [currentRate, setCurrentRate] = useState<string>('—');
  const [high, setHigh] = useState<string>('—');
  const [low, setLow] = useState<string>('—');
  const [avg, setAvg] = useState<string>('—');
  const [change, setChange] = useState<string>('—');
  const [isPositive, setIsPositive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPair = ALL_PAIRS.find((p) => p.id === selectedPairId) || customPair;

  const applyCalculatedData = (typed: HistoryPoint[]) => {
    setHistoryPoints(typed);
    const sells = typed.map((d) => Number(d.sell_rate));
    const highVal = Math.max(...sells);
    const lowVal = Math.min(...sells);
    const avgVal = sells.reduce((a, b) => a + b, 0) / sells.length;
    const latest = sells[sells.length - 1];
    const first = sells[0];
    const diff = latest - first;
    const pct = ((diff / first) * 100).toFixed(2);
    const sign = diff >= 0 ? '+' : '';

    setCurrentRate(latest.toLocaleString());
    setHigh(highVal.toLocaleString());
    setLow(lowVal.toLocaleString());
    setAvg(Math.round(avgVal).toLocaleString());
    setChange(`${sign}${Math.round(diff).toLocaleString()} (${sign}${pct}%)`);
    setIsPositive(diff >= 0);
  };

  const fetchHistory = useCallback(async () => {
    if (!selectedPair) return;

    const cacheKey = `${selectedPair.baseCurrencyCode}_${timeframe}_${startDate}_${endDate}`;
    const cached = chartCache.get(cacheKey);

    // Check if valid cache entry exists within 5-min TTL
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      if (cached.payload.historyPoints) {
        applyCalculatedData(cached.payload.historyPoints);
      } else {
        setCurrentRate(cached.payload.currentRate);
        setHigh(cached.payload.high);
        setLow(cached.payload.low);
        setAvg(cached.payload.avg);
        setChange(cached.payload.change);
        setIsPositive(cached.payload.isPositive);
        setHistoryPoints(cached.payload.historyPointsFallback || []);
      }
      return;
    }

    setIsLoading(true);

    try {
      const since = timeframeToDate(timeframe, startDate).toISOString();
      const until = timeframe === 'custom' ? new Date(endDate).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .from('rate_history')
        .select('created_at, sell_rate, buy_rate')
        .eq('base_currency_code', selectedPair.baseCurrencyCode)
        .gte('created_at', since)
        .lte('created_at', until)
        .order('created_at', { ascending: true });

      if (error) {
        console.log('fetchHistory error:', error.message);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const typed = data as HistoryPoint[];
        applyCalculatedData(typed);
        chartCache.set(cacheKey, {
          timestamp: Date.now(),
          payload: { historyPoints: typed },
        });
      } else {
        // No data yet — fetch current rate from rates table as single point
        const { data: rateData } = await supabase
          .from('rates')
          .select('sell_rate, buy_rate')
          .eq('base_currency_code', selectedPair.baseCurrencyCode)
          .single();

        if (rateData) {
          const sell = Number(rateData.sell_rate);
          const fallbackPoints = [{ created_at: new Date().toISOString(), sell_rate: sell, buy_rate: Number(rateData.buy_rate) }];
          setCurrentRate(sell.toLocaleString());
          setHigh(sell.toLocaleString());
          setLow(sell.toLocaleString());
          setAvg(sell.toLocaleString());
          setChange('—');
          setIsPositive(true);
          setHistoryPoints(fallbackPoints);

          chartCache.set(cacheKey, {
            timestamp: Date.now(),
            payload: {
              currentRate: sell.toLocaleString(),
              high: sell.toLocaleString(),
              low: sell.toLocaleString(),
              avg: sell.toLocaleString(),
              change: '—',
              isPositive: true,
              historyPointsFallback: fallbackPoints,
            },
          });
        } else {
          setHistoryPoints([]);
          setCurrentRate('—');
          setHigh('—');
          setLow('—');
          setAvg('—');
          setChange('—');
        }
      }
    } catch (err) {
      console.log('fetchHistory err:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPairId, timeframe, startDate, endDate, customPair]);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel(`chart_history_${selectedPairId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rate_history' }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHistory]);

  const customTabLabel = customPair ? customPair.label : t('chartCustom');
  const isCustomTabActive = !!customPair && selectedPairId === customPair.id;

  const sellPoints = historyPoints.map((d) => Number(d.sell_rate));
  const svgFillPath = buildSvgPath(sellPoints, chartWidth, 160, true);
  const svgLinePath = buildSvgPath(sellPoints, chartWidth, 160, false);
  const hasData = sellPoints.length >= 2;

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={[styles.headerBlock, isEnglish && styles.alignLeft]}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }, isEnglish && styles.textLeft]}>
          {t('chartTitle')}
        </Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }, isEnglish && styles.textLeft]}>
          {t('chartSub')}
        </Text>
      </View>

      {/* Currency Pair Tabs */}
      <View style={styles.pairTabsRow}>
        {DEFAULT_PAIRS.map((pair) => {
          const isSelected = pair.id === selectedPairId;
          return (
            <Pressable
              key={pair.id}
              onPress={() => setSelectedPairId(pair.id)}
              style={({ pressed }) => [
                styles.pairTab,
                isSelected && styles.pairTabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.pairTabText, isSelected && styles.pairTabTextActive]}>
                {pair.label}
              </Text>
            </Pressable>
          );
        })}

        {/* 4th Tab: Custom Pair Picker Button */}
        <Pressable
          onPress={() => setPairPickerVisible(true)}
          style={({ pressed }) => [
            styles.pairTab,
            styles.customPairTab,
            isCustomTabActive && styles.pairTabActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-down"
            size={14}
            color={isCustomTabActive ? '#FFFFFF' : '#3B50C8'}
          />
          <Text style={[styles.pairTabText, isCustomTabActive && styles.pairTabTextActive]}>
            {customTabLabel}
          </Text>
        </Pressable>
      </View>

      {/* Main Chart Spotlight Card */}
      <View style={styles.chartCard}>
        {/* Price Row */}
        <View style={styles.priceRow}>
          {change !== '—' && (
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={isPositive ? '#166534' : '#991B1B'}
              />
              <Text style={[styles.changeText, { color: isPositive ? '#166534' : '#991B1B' }]}>
                {change}
              </Text>
            </View>
          )}

          <View style={[styles.priceMetaRight, isEnglish && styles.alignLeft]}>
            <Text style={[styles.currentPriceText, isEnglish && styles.textLeft]}>{currentRate}</Text>
            <Text style={[styles.currentPriceLabel, isEnglish && styles.textLeft]}>
              {selectedPair?.label ?? '—'} · {t('chartLiveRateLabel')}
            </Text>
          </View>
        </View>

        {/* Real SVG Chart */}
        <View style={styles.svgContainer} onLayout={handleChartLayout}>
          {isLoading ? (
            <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>{t('chartLoading')}</Text>
            </View>
          ) : hasData ? (
            <Svg width={chartWidth} height={160} viewBox={`0 0 ${chartWidth} 160`}>
              <Defs>
                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={isPositive ? '#3B50C8' : '#DC2626'} stopOpacity="0.3" />
                  <Stop offset="100%" stopColor={isPositive ? '#3B50C8' : '#DC2626'} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Gradient Area */}
              <Path d={svgFillPath} fill="url(#chartGradient)" />

              {/* Main Line */}
              <Path
                d={svgLinePath}
                fill="none"
                stroke={isPositive ? '#3B50C8' : '#DC2626'}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
          ) : (
            <View style={styles.noDataOverlay}>
              <Ionicons name="analytics-outline" size={32} color="#CBD5E1" />
              <Text style={styles.noDataText}>{t('chartNoData')}</Text>
            </View>
          )}
        </View>

        {/* Timeframe Selector Pills */}
        <View style={styles.timeframeRow}>
          {(['7d', '1m', '1y', 'custom'] as Timeframe[]).map((tf) => {
            const isSelected = tf === timeframe;
            const labels: Record<Timeframe, string> = {
              '7d': t('chart7d'),
              '1m': t('chart1m'),
              '1y': t('chart1y'),
              custom: t('chartCustom'),
            };

            return (
              <Pressable
                key={tf}
                onPress={() => setTimeframe(tf)}
                style={({ pressed }) => [
                  styles.tfPill,
                  isSelected && styles.tfPillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tfText, isSelected && styles.tfTextActive]}>
                  {labels[tf]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Date Range Selector Card */}
        {timeframe === 'custom' && (
          <View style={styles.customDateCard}>
            <View style={styles.customDateHeader}>
              <Ionicons name="calendar-outline" size={16} color="#3B50C8" />
              <Text style={styles.customDateTitle}>{t('chartCustomTitle')}</Text>
            </View>

            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputBox}>
                <Text style={styles.dateInputLabel}>{t('chartDateTo')}</Text>
                <View style={styles.dateInputPill}>
                  <Ionicons name="calendar" size={14} color="#64748B" />
                  <Text style={styles.dateInputText}>{endDate}</Text>
                </View>
              </View>

              <Text style={styles.dateArrow}>←</Text>

              <View style={styles.dateInputBox}>
                <Text style={styles.dateInputLabel}>{t('chartDateFrom')}</Text>
                <View style={styles.dateInputPill}>
                  <Ionicons name="calendar" size={14} color="#64748B" />
                  <Text style={styles.dateInputText}>{startDate}</Text>
                </View>
              </View>
            </View>

            <View style={styles.presetsRow}>
              <Pressable
                onPress={() => { setStartDate('2026-07-20'); setEndDate('2026-07-27'); }}
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>{t('chartPresetLastWeek')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setStartDate('2026-06-27'); setEndDate('2026-07-27'); }}
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>{t('chartPresetLastMonth')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setStartDate('2026-01-01'); setEndDate('2026-07-27'); }}
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>{t('chartPresetThisYear')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Summary Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('chartStatHigh')}</Text>
          <Text style={[styles.statValue, { color: '#16A34A' }]}>{high}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('chartStatLow')}</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{low}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('chartStatAvg')}</Text>
          <Text style={styles.statValue}>{avg}</Text>
        </View>
      </View>

      {/* Custom Currency Pair Selector Modal */}
      <Modal
        visible={pairPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPairPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setPairPickerVisible(false)} />

          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeader}>
              <Pressable
                hitSlop={12}
                onPress={() => setPairPickerVisible(false)}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
              <Text style={styles.pickerTitle}>{t('chartPickerTitle')}</Text>
            </View>

            <ScrollView style={styles.pairList} showsVerticalScrollIndicator={false}>
              {EXTRA_PAIRS.map((item) => {
                const isSelected = selectedPairId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setCustomPair(item);
                      setSelectedPairId(item.id);
                      setPairPickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.pairItemRow,
                      isSelected && styles.pairItemActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3B50C8" />}
                    <Text style={styles.pairItemLabel}>{item.label}</Text>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 10,
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  textLeft: {
    textAlign: 'left',
  },
  headerBlock: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  screenTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  screenSub: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 2,
  },

  /* Pair Tabs */
  pairTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pairTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customPairTab: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  pairTabActive: {
    backgroundColor: '#3B50C8',
    borderColor: '#3B50C8',
  },
  pairTabText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  pairTabTextActive: {
    color: '#FFFFFF',
  },

  /* Chart Card */
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    boxShadow: '0 4px 18px rgba(50, 50, 90, 0.05)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  priceMetaRight: {
    alignItems: 'flex-end',
  },
  currentPriceText: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  currentPriceLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  /* SVG Container */
  svgContainer: {
    minHeight: 160,
    overflow: 'hidden',
    borderRadius: 10,
  },
  loadingOverlay: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  noDataOverlay: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  noDataText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  /* Timeframe Row */
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
  },
  tfPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tfPillActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  tfText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tfTextActive: {
    color: '#3B50C8',
    fontWeight: '900',
  },

  /* Custom Date Card */
  customDateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  customDateHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  customDateTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateInputBox: {
    flex: 1,
    gap: 4,
  },
  dateInputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  dateInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInputText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  dateArrow: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  presetPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetText: {
    color: '#3B50C8',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
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
    maxHeight: '50%',
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
  pairList: {
    marginTop: 4,
  },
  pairItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pairItemActive: {
    backgroundColor: '#EEF2FF',
  },
  pairItemLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },

  pressed: {
    opacity: 0.75,
  },
});
