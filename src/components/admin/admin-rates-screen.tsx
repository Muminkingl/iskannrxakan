import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FlagIcon } from '@/components/common/flag-icon';
import { CURRENCY_SORT_ORDER } from '@/constants/market-data';
import { supabase } from '@/lib/supabase';
import type { RateItem } from '@/types/market';

export function AdminRatesScreen() {
  const [ratesList, setRatesList] = useState<RateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRate, setEditingRate] = useState<RateItem | null>(null);
  const [buyInput, setBuyInput] = useState('');
  const [sellInput, setSellInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch rates from Supabase DB and subscribe to Realtime WebSocket
  useEffect(() => {
    fetchRatesFromDb();

    const channel = supabase
      .channel('admin_rates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rates' },
        () => {
          fetchRatesFromDb();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRatesFromDb = async () => {
    try {
      const { data, error } = await supabase.from('rates').select('*');
      if (error) {
        console.log('Error fetching rates:', error.message);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const sortedData = [...data].sort((a, b) => {
          const indexA = CURRENCY_SORT_ORDER.indexOf(a.base_currency_code);
          const indexB = CURRENCY_SORT_ORDER.indexOf(b.base_currency_code);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });

        const mapped: RateItem[] = sortedData.map((row) => ({
          id: row.id,
          code: row.base_currency_code,
          nameKurdish: row.base_currency_name,
          unitLabel: row.unit_label || row.base_currency_code,
          flagCode: row.base_flag_emoji || 'US',
          iconName: 'cash-outline',
          buyRate: Number(row.buy_rate).toLocaleString(),
          sellRate: Number(row.sell_rate).toLocaleString(),
          category: (row.category || 'currency') as 'currency' | 'gold',
        }));
        setRatesList(mapped);
      }
    } catch (err) {
      console.log('Error in fetchRatesFromDb:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRates = ratesList.filter(
    (r) =>
      r.code !== 'USD' &&
      (r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nameKurdish.includes(searchQuery))
  );

  const handleOpenEdit = (item: RateItem) => {
    setEditingRate(item);
    setBuyInput(item.buyRate.replace(/,/g, ''));
    setSellInput(item.sellRate.replace(/,/g, ''));
  };

  const handleSaveRate = async () => {
    if (!editingRate) return;

    const numericBuy = parseFloat(buyInput.replace(/,/g, '')) || 0;
    const numericSell = parseFloat(sellInput.replace(/,/g, '')) || 0;

    try {
      // 1. Update rates table in Supabase DB
      const { error: updateErr } = await supabase
        .from('rates')
        .update({
          buy_rate: numericBuy,
          sell_rate: numericSell,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRate.id);

      if (updateErr) {
        console.log('Error updating rate in DB:', updateErr.message);
      }

      // 2. Insert historical log entry in rate_history table for chart analytics
      const { error: historyErr } = await supabase.from('rate_history').insert({
        rate_id: editingRate.id,
        base_currency_code: editingRate.code,
        quote_currency_code: 'IQD',
        buy_rate: numericBuy,
        sell_rate: numericSell,
      });

      if (historyErr) {
        console.log('Error logging rate_history:', historyErr.message);
      }

      // Update local state instantly
      setRatesList((prev) =>
        prev.map((r) =>
          r.id === editingRate.id
            ? { ...r, buyRate: numericBuy.toLocaleString(), sellRate: numericSell.toLocaleString() }
            : r
        )
      );

      const updatedCode = editingRate.code;
      setEditingRate(null);

      // Show toast
      setToastMessage(`نرخی (${updatedCode}) لە بنکەی دراو پاشەکەوتکرا!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.log('Error in handleSaveRate:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#166534" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Screen Title Block */}
      <View style={styles.headerBlock}>
        <Text style={styles.screenTitle}>بەڕێوەبردنی نرخەکان</Text>
        <Text style={styles.screenSub}>گۆڕانکاری ڕاستەوخۆ لە نرخەکانی بازاڕی دراو و زێڕ</Text>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="گەڕان بۆ دراو یان زێڕ..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
      </View>

      {/* Loading Indicator or List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>لە بارکردنی نرخەکانی بنکەدایە...</Text>
        </View>
      ) : (
        <View style={styles.ratesListGroup}>
          {filteredRates.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpenEdit(item)}
              style={({ pressed }) => [styles.rateCardRow, pressed && styles.pressed]}
            >
              <View style={styles.editPillBtn}>
                <Ionicons name="create-outline" size={16} color="#3B50C8" />
                <Text style={styles.editBtnText}>دەستکاری</Text>
              </View>

              <View style={styles.ratesValuesBlock}>
                <View style={styles.rateValuePill}>
                  <Text style={styles.rateValueLabel}>کڕین:</Text>
                  <Text style={styles.rateValueText}>{item.buyRate}</Text>
                </View>
                <View style={styles.rateValuePillSell}>
                  <Text style={styles.rateValueLabelSell}>فڕۆشتن:</Text>
                  <Text style={styles.rateValueTextSell}>{item.sellRate}</Text>
                </View>
              </View>

              <View style={styles.itemMetaRight}>
                <Text style={styles.itemCodeText}>{item.code}</Text>
                <Text style={styles.itemNameText}>{item.nameKurdish}</Text>
              </View>

              <FlagIcon code={item.flagCode} size={24} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Quick Rate Edit Modal */}
      <Modal
        visible={!!editingRate}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRate(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setEditingRate(null)} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Pressable
                hitSlop={12}
                onPress={() => setEditingRate(null)}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
              <View style={styles.modalHeaderMeta}>
                <Text style={styles.modalTitle}>دەستکاری نرخ - {editingRate?.code}</Text>
                <Text style={styles.modalSub}>{editingRate?.nameKurdish}</Text>
              </View>
            </View>

            <View style={styles.inputsStack}>
              {/* Buy Rate Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نرخی کڕین (Buy Rate)</Text>
                <TextInput
                  value={buyInput}
                  onChangeText={setBuyInput}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>

              {/* Sell Rate Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نرخی فڕۆشتن (Sell Rate)</Text>
                <TextInput
                  value={sellInput}
                  onChangeText={setSellInput}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Save Action Button */}
            <Pressable
              onPress={handleSaveRate}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>پاشەکەوتکردنی نرخ بە ڕاستەوخۆ</Text>
            </Pressable>
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
  toastBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },
  headerBlock: {
    alignItems: 'flex-end',
  },
  adminBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 6,
  },
  adminBadgeText: {
    color: '#3B50C8',
    fontSize: 11,
    fontWeight: '800',
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
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  ratesListGroup: {
    gap: 10,
  },
  rateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editBtnText: {
    color: '#3B50C8',
    fontSize: 12,
    fontWeight: '800',
  },
  ratesValuesBlock: {
    flexDirection: 'row',
    gap: 8,
  },
  rateValuePill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
  },
  rateValueLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  rateValueText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  rateValuePillSell: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
  },
  rateValueLabelSell: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  rateValueTextSell: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  itemMetaRight: {
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 8,
  },
  itemCodeText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  itemNameText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Modal */
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
  modalHeader: {
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
  modalHeaderMeta: {
    alignItems: 'flex-end',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  inputsStack: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  saveBtn: {
    backgroundColor: '#3B50C8',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.75,
  },
});
