import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FlagIcon } from '@/components/common/flag-icon';
import { CURRENCY_SORT_ORDER } from '@/constants/market-data';
import { usePlan } from '@/context/plan-context';
import { supabase } from '@/lib/supabase';
import type { RateItem } from '@/types/market';

type PaymentRequest = {
  id: string;
  email: string | null;
  code: string | null;
  user_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  transaction_ref: string | null;
  created_at: string;
};

type ActiveVipUser = {
  id: string;
  email: string;
  vip_expires_at: string | null;
  expires_at?: string | null;
  updated_at?: string;
};

export function AdminRatesScreen() {
  const { activate30DaysVip } = usePlan();
  const [ratesList, setRatesList] = useState<RateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRate, setEditingRate] = useState<RateItem | null>(null);
  const [buyInput, setBuyInput] = useState('');
  const [sellInput, setSellInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentLoadError, setPaymentLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // VIP Grant state
  const [vipEmail, setVipEmail] = useState('');
  const [isGrantingVip, setIsGrantingVip] = useState(false);

  // Payment Requests & Active VIP Users state
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [activeVipUsers, setActiveVipUsers] = useState<ActiveVipUser[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [vipSearch, setVipSearch] = useState('');
  const [vipShowCount, setVipShowCount] = useState(15);

  const paymentChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch payment requests & active VIP users
  const fetchPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPaymentRequests((data || []) as PaymentRequest[]);
      setPaymentLoadError(false);
    } catch (error) {
      console.warn('Could not load activation requests:', error);
      setPaymentLoadError(true);
    }
  };

  const fetchActiveVipUsers = async () => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('is_vip', true)
      .order('updated_at', { ascending: false });

    let list = data || [];
    if (!list.length) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (subData) list = subData;
    }

    const now = new Date();
    const valid = list.filter((u: any) => {
      const exp = u.vip_expires_at || u.expires_at;
      return exp && new Date(exp) > now;
    });
    setActiveVipUsers(valid as ActiveVipUser[]);
  };

  const handleGrant30DaysVip = async () => {
    if (!vipEmail.trim()) {
      Alert.alert('Email Required', 'Please enter a valid user email.');
      return;
    }
    setIsGrantingVip(true);
    const success = await activate30DaysVip(vipEmail.trim());
    setIsGrantingVip(false);

    if (success) {
      setToastMessage(`✅ ئەکاونتی ${vipEmail.trim()} بۆ ٣٠ ڕۆژ چالاککرا`);
      setTimeout(() => setToastMessage(null), 3000);
      setVipEmail('');
      fetchActiveVipUsers();
    } else {
      Alert.alert('Error', 'Could not grant VIP access. Check database connection.');
    }
  };

  const handleApprovePayment = async (req: PaymentRequest) => {
    const targetEmail = req.email || req.code;
    if (!targetEmail) {
      Alert.alert('Error', 'No email or code found on request.');
      return;
    }
    setProcessingId(req.id);
    const success = await activate30DaysVip(targetEmail);
    if (success) {
      await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);

      setPaymentRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r))
      );
      setToastMessage(`✅ ئەکاونتی ${targetEmail} پەسەندکرا`);
      setTimeout(() => setToastMessage(null), 3000);
      fetchActiveVipUsers();
    } else {
      Alert.alert('Error', 'Could not approve. Check DB connection.');
    }
    setProcessingId(null);
  };

  const handleRejectPayment = async (req: PaymentRequest) => {
    setProcessingId(req.id);
    await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', req.id);

    setPaymentRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'rejected' } : r))
    );
    setProcessingId(null);
  };

  const handleRevokeVip = async (email: string) => {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();

    // Cross-platform confirmation warning (works on Web & Mobile)
    const performRevoke = async () => {
      const pastIso = new Date(Date.now() - 1000).toISOString();

      // Instantly remove from UI local state
      setActiveVipUsers((prev) => prev.filter((u) => u.email?.trim().toLowerCase() !== cleanEmail));

      try {
        await supabase
          .from('user_subscriptions')
          .update({ is_vip: false, vip_expires_at: pastIso })
          .eq('email', cleanEmail);

        await supabase
          .from('subscriptions')
          .update({ is_vip: false, vip_expires_at: pastIso, expires_at: pastIso })
          .eq('email', cleanEmail);

        setToastMessage(`ئەکاونتی ${cleanEmail} لە VIP لابدرا`);
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.log('Error revoking VIP:', err);
      } finally {
        fetchActiveVipUsers();
      }
    };

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(`دڵنیایت لە لابردنی ئەکاونتی VIP بۆ ${cleanEmail}؟`);
      if (ok) performRevoke();
    } else {
      Alert.alert(
        'لابردنی ئەڵماس (VIP)',
        `دڵنیایت لە لابردنی ئەکاونتی VIP بۆ ${cleanEmail}؟`,
        [
          { text: 'پاشگەزبوونەوە', style: 'cancel' },
          { text: 'لابردن', style: 'destructive', onPress: performRevoke },
        ]
      );
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchRatesFromDb();
    fetchPaymentRequests();
    fetchActiveVipUsers();

    const channel = supabase
      .channel('admin_rates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rates' },
        () => fetchRatesFromDb()
      )
      .subscribe();

    const paymentChannel = supabase
      .channel('admin_payment_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_requests' },
        () => fetchPaymentRequests()
      )
      .subscribe();

    paymentChannelRef.current = paymentChannel;

    // Realtime is best-effort on mobile networks. Refresh periodically so an
    // approved or newly submitted request still appears if the channel drops.
    const refreshTimer = setInterval(() => {
      void fetchPaymentRequests();
      void fetchActiveVipUsers();
    }, 30_000);

    return () => {
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
      supabase.removeChannel(paymentChannel);
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

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'currency' | 'gold'>('all');

  const filteredRates = ratesList.filter(
    (r) =>
      r.code !== 'USD' &&
      (selectedCategory === 'all' || r.category === selectedCategory) &&
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

    const isGold = editingRate.category === 'gold';
    const singleVal = parseFloat(sellInput.replace(/,/g, '')) || parseFloat(buyInput.replace(/,/g, '')) || 0;

    const numericBuy = isGold ? singleVal : (parseFloat(buyInput.replace(/,/g, '')) || 0);
    const numericSell = isGold ? singleVal : (parseFloat(sellInput.replace(/,/g, '')) || 0);

    try {
      const { error: updateErr } = await supabase
        .from('rates')
        .update({
          buy_rate: numericBuy,
          sell_rate: numericSell,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRate.id);

      if (updateErr) console.log('Error updating rate in DB:', updateErr.message);

      await supabase.from('rate_history').insert({
        rate_id: editingRate.id,
        base_currency_code: editingRate.code,
        quote_currency_code: editingRate.code === 'XAU' ? 'USD' : 'IQD',
        buy_rate: numericBuy,
        sell_rate: numericSell,
      });

      setRatesList((prev) =>
        prev.map((r) =>
          r.id === editingRate.id
            ? { ...r, buyRate: numericBuy.toLocaleString(), sellRate: numericSell.toLocaleString() }
            : r
        )
      );

      const updatedCode = editingRate.code;
      setEditingRate(null);

      setToastMessage(`نرخی (${updatedCode}) لە بنکەی دراو پاشەکەوتکرا!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.log('Error in handleSaveRate:', err);
    }
  };

  const pendingCount = paymentRequests.filter((r) => r.status === 'pending').length;

  // Filtered + paginated VIP users — client-side only, no extra DB calls
  const filteredVipUsers = vipSearch.trim()
    ? activeVipUsers.filter((u) =>
        u.email.toLowerCase().includes(vipSearch.trim().toLowerCase())
      )
    : activeVipUsers;
  const visibleVipUsers = filteredVipUsers.slice(0, vipShowCount);
  const hasMoreVip = filteredVipUsers.length > vipShowCount;

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

      {/* ─── SECTION 1: PENDING ACTIVATION REQUESTS ───────────────────── */}
      <View style={styles.lightSectionCard}>
        <View style={styles.lightSectionHeader}>
          {pendingCount > 0 && (
            <View style={styles.pendingBadgeCircle}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
          <Text style={styles.lightSectionTitle}>داواکارییەکانی چالاککردن</Text>
          <Ionicons name="key-outline" size={20} color="#3B82F6" />
        </View>

        {paymentLoadError ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>داواکارییەکان بارنەکران</Text>
            <Pressable onPress={() => void fetchPaymentRequests()} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreText}>دووبارە هەوڵدانەوە</Text>
            </Pressable>
          </View>
        ) : paymentRequests.filter((r) => r.status === 'pending').length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>هیچ داواکارییەکی نوێ نییە</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {paymentRequests
              .filter((r) => r.status === 'pending')
              .map((req) => {
                const displayEmail = req.email || 'بەکارهێنەر';
                const displayCode = req.code || req.transaction_ref;
                return (
                  <View key={req.id} style={styles.itemRowCard}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowDate}>
                        {new Date(req.created_at).toLocaleDateString('ckb-IQ', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.rowEmail} numberOfLines={1}>{displayEmail}</Text>
                    </View>

                    {displayCode ? (
                      <Text style={styles.rowRef}>کۆدی ناسێنەر: {displayCode}</Text>
                    ) : null}

                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => handleRejectPayment(req)}
                        disabled={processingId === req.id}
                        style={({ pressed }) => [styles.declineBtn, pressed && styles.pressed]}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.declineBtnText}>ڕەتکردنەوە</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleApprovePayment(req)}
                        disabled={processingId === req.id}
                        style={({ pressed }) => [styles.approveBtn, pressed && styles.pressed]}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>
                          {processingId === req.id ? '...' : 'پەسەندکردن'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
          </View>
        )}
      </View>

      {/* ─── SECTION 2: ACTIVE VIP USERS LIST ─────────────────────────── */}
      <View style={styles.lightSectionCard}>
        <View style={styles.lightSectionHeader}>
          <View style={styles.activeCountBadge}>
            <Text style={styles.activeCountText}>{filteredVipUsers.length}/{activeVipUsers.length}</Text>
          </View>
          <Text style={styles.lightSectionTitle}>لیستی ئەکاونتە چالاکەکان (VIP Users)</Text>
          <Ionicons name="diamond-outline" size={20} color="#0284C7" />
        </View>

        {/* Search Bar */}
        {activeVipUsers.length > 0 && (
          <View style={styles.vipSearchBox}>
            <Ionicons name="search" size={16} color="#94A3B8" />
            <TextInput
              value={vipSearch}
              onChangeText={(text) => { setVipSearch(text); setVipShowCount(15); }}
              placeholder="گەڕان بە ئیمەیڵ..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.vipSearchInput}
            />
            {vipSearch.length > 0 && (
              <Pressable onPress={() => { setVipSearch(''); setVipShowCount(15); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        )}

        {activeVipUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>هیچ ئەکاونتێکی چالاک دیاری نەکراوە</Text>
          </View>
        ) : filteredVipUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>ئیمەیڵێک نەدۆزرایەوە</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {visibleVipUsers.map((user) => {
              const expIso = user.vip_expires_at || user.expires_at;
              const daysLeft = expIso
                ? Math.ceil((new Date(expIso).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <View key={user.id || user.email} style={styles.vipUserRowCard}>
                  <Pressable
                    onPress={() => handleRevokeVip(user.email)}
                    style={({ pressed }) => [styles.revokeBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    <Text style={styles.revokeBtnText}>لابردن</Text>
                  </Pressable>

                  <View style={styles.vipUserMeta}>
                    <Text style={styles.vipUserEmail} numberOfLines={1}>{user.email}</Text>
                    <Text style={styles.vipUserDays}>
                      {daysLeft > 300 ? 'دەستگەیشتنی بەردەوام' : `ماوە: ${daysLeft} ڕۆژ`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Load More button — no extra DB call, just reveals next batch */}
            {hasMoreVip && (
              <Pressable
                onPress={() => setVipShowCount((c) => c + 15)}
                style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-down" size={16} color="#3B50C8" />
                <Text style={styles.loadMoreText}>
                  نیشاندانی زیاتر ({filteredVipUsers.length - vipShowCount} ئەکاونتی تر)
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ─── SECTION 3: MANUAL VIP GRANT ─────────────────────────────── */}
      <View style={styles.lightSectionCard}>
        <View style={styles.lightSectionHeader}>
          <Text style={styles.lightSectionTitle}>بەخشینی ڕاستەوخۆی ئەڵماس (٣٠ ڕۆژ)</Text>
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
        </View>
        <Text style={styles.lightSectionSub}>ئیمەیڵی بەکارهێنەر بنووسە بۆ چالاكکردنی ئەڵماس بۆ ٣٠ ڕۆژ</Text>

        <View style={styles.grantInputRow}>
          <TextInput
            style={styles.grantInput}
            placeholder="ئیمەیڵی بەکارهێنەر..."
            placeholderTextColor="#94A3B8"
            value={vipEmail}
            onChangeText={setVipEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable
            onPress={handleGrant30DaysVip}
            disabled={isGrantingVip}
            style={({ pressed }) => [styles.grantBtn, pressed && styles.pressed]}
          >
            <Text style={styles.grantBtnText}>{isGrantingVip ? '...' : 'بەخشین'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.categoryTabRow}>
        <Pressable
          onPress={() => setSelectedCategory('all')}
          style={({ pressed }) => [
            styles.categoryTab,
            selectedCategory === 'all' && styles.categoryTabActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.categoryTabText, selectedCategory === 'all' && styles.categoryTabTextActive]}>
            سەرجەم ({ratesList.filter((r) => r.code !== 'USD').length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedCategory('currency')}
          style={({ pressed }) => [
            styles.categoryTab,
            selectedCategory === 'currency' && styles.categoryTabActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="cash-outline" size={14} color={selectedCategory === 'currency' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.categoryTabText, selectedCategory === 'currency' && styles.categoryTabTextActive]}>
            دراوەکان
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedCategory('gold')}
          style={({ pressed }) => [
            styles.categoryTab,
            selectedCategory === 'gold' && styles.categoryTabActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="diamond-outline" size={14} color={selectedCategory === 'gold' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.categoryTabText, selectedCategory === 'gold' && styles.categoryTabTextActive]}>
            زێڕ ({ratesList.filter((r) => r.category === 'gold').length})
          </Text>
        </Pressable>
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
              <View style={styles.rateIdentityRow}>
                <FlagIcon code={item.flagCode} size={24} />

                <View style={styles.itemMetaRight}>
                  <Text style={styles.itemCodeText} numberOfLines={1}>{item.code}</Text>
                  <Text style={styles.itemNameText} numberOfLines={1} ellipsizeMode="tail">
                    {item.nameKurdish}
                  </Text>
                </View>

                <View style={styles.editPillBtn}>
                  <Ionicons name="create-outline" size={16} color="#3B50C8" />
                  <Text style={styles.editBtnText}>دەستکاری</Text>
                </View>
              </View>

              <View style={styles.ratesValuesBlock}>
                {item.category === 'gold' ? (
                  <View style={styles.goldPricePill}>
                    <Text style={styles.goldPriceLabel}>نرخ:</Text>
                    <Text style={styles.goldPriceValue} numberOfLines={1}>
                      {item.code === 'XAU' ? `$${item.sellRate}` : `${item.sellRate} د.ع`}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.rateValuePill}>
                      <Text style={styles.rateValueLabel} numberOfLines={1}>کڕین:</Text>
                      <Text style={styles.rateValueText} numberOfLines={1}>{item.buyRate}</Text>
                    </View>
                    <View style={styles.rateValuePillSell}>
                      <Text style={styles.rateValueLabelSell} numberOfLines={1}>فڕۆشتن:</Text>
                      <Text style={styles.rateValueTextSell} numberOfLines={1}>{item.sellRate}</Text>
                    </View>
                  </>
                )}
              </View>
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
              {editingRate?.category === 'gold' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {editingRate.code === 'XAU' ? 'نرخی ئۆنسە بە دۆلار ($ USD)' : 'نرخی زێڕ بە دینار (IQD Price)'}
                  </Text>
                  <TextInput
                    value={sellInput}
                    onChangeText={(val) => {
                      setSellInput(val);
                      setBuyInput(val);
                    }}
                    keyboardType="numeric"
                    style={styles.textInput}
                    placeholder={editingRate.code === 'XAU' ? '4094' : '628000'}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>نرخی کڕین (Buy Rate)</Text>
                    <TextInput
                      value={buyInput}
                      onChangeText={setBuyInput}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>نرخی فڕۆشتن (Sell Rate)</Text>
                    <TextInput
                      value={sellInput}
                      onChangeText={setSellInput}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </>
              )}
            </View>

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
  categoryTabRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginVertical: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  singleGoldPricePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  singleGoldPriceText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '800',
  },
  container: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 10,
    paddingBottom: 24,
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

  // ─── Light Theme Card Components ─────────────────────────────────────────
  lightSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lightSectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightSectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  lightSectionSub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'right',
  },
  pendingBadgeCircle: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  activeCountBadge: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  cardsList: {
    gap: 8,
  },
  vipSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  vipSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'right',
    paddingVertical: 0,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    marginTop: 4,
  },
  loadMoreText: {
    color: '#3B50C8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  itemRowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  rowApproved: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  rowRejected: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rowTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowEmail: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  rowDate: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 8,
  },
  rowRef: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillApproved: {
    backgroundColor: '#DCFCE7',
  },
  pillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  // Active VIP Users Row
  vipUserRowCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vipUserMeta: {
    alignItems: 'flex-end',
    flex: 1,
  },
  vipUserEmail: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  vipUserDays: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  revokeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  // Manual VIP Grant
  grantInputRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  grantInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
    textAlign: 'right',
  },
  grantBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Search & Rates List
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
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  rateIdentityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
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
    width: '100%',
    gap: 8,
  },
  goldPricePill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goldPriceLabel: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  goldPriceValue: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
  },
  rateValuePill: {
    flex: 1,
    minWidth: 0,
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
    flex: 1,
    minWidth: 0,
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
    minWidth: 0,
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
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
