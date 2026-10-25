import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { PREMIUM_ENTITLEMENT_ID } from '@/constants/config';
import { fetchAccountState, type AccountState } from '@/lib/auth-roles';
import {
  buyApplePremium, canUseApplePurchases, disconnectApplePurchases, hasApplePremium,
  loadApplePurchases, logApplePurchaseError, observeApplePurchases, restoreApplePurchases, syncApplePremium,
} from '@/lib/purchases';
import { supabase } from '@/lib/supabase';
import { generateUserCode } from '@/utils/user-code';

type PurchaseResult = 'activated' | 'cancelled' | 'pending_confirmation' | 'pending_approval';
type RestoreResult = 'restored' | 'nothing_to_restore' | 'pending_confirmation';
type BillingStatus = 'unavailable' | 'loading' | 'ready' | 'error';

interface PlanContextType {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  daysRemaining: number;
  isPlanModalOpen: boolean;
  userCode: string;
  billingStatus: BillingStatus;
  purchasePackage: PurchasesPackage | null;
  isBillingBusy: boolean;
  hasStorePremium: boolean;
  needsPurchaseConfirmation: boolean;
  openPlanModal: () => void;
  closePlanModal: () => void;
  purchasePremium: () => Promise<PurchaseResult>;
  restorePurchases: () => Promise<RestoreResult>;
  activate30DaysPremium: (targetEmail: string) => Promise<boolean>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children, session, userRole = 'user', initialState = null }: {
  children: React.ReactNode;
  session: Session | null;
  userRole?: AccountState['role'];
  initialState?: AccountState | null;
}) {
  const [accountState, setAccountState] = useState(initialState);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus>('unavailable');
  const [purchasePackage, setPurchasePackage] = useState<PurchasesPackage | null>(null);
  const [storeInfo, setStoreInfo] = useState<CustomerInfo | null>(null);
  const [isBillingBusy, setIsBillingBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const billingBusy = useRef(false);
  const mounted = useRef(true);
  const accountRefreshId = useRef(0);
  const userId = session?.user.id;
  const userEmail = session?.user.email;
  const effectiveRole = accountState?.role ?? userRole;
  const isAdmin = effectiveRole === 'owner' || effectiveRole === 'admin';

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!userId) return null;
    const refreshId = ++accountRefreshId.current;
    const state = await fetchAccountState().catch(() => null);
    if (state && mounted.current && refreshId === accountRefreshId.current) {
      setAccountState(state);
      setNow(Date.now());
    }
    return state;
  }, [userId]);

  const syncStore = useCallback(async () => {
    await syncApplePremium();
    const state = await refreshAccount();
    if (!state) throw new Error('Could not load confirmed Premium access');
    return state;
  }, [refreshAccount]);

  const refreshBilling = useCallback(async () => {
    if (!userId || !canUseApplePurchases()) return;
    setBillingStatus('loading');
    try {
      const { customerInfo, purchasePackage: nextPackage } = await loadApplePurchases(userId);
      if (!mounted.current) return;
      if (customerInfo) setStoreInfo(customerInfo);
      setPurchasePackage(nextPackage);
      setBillingStatus(nextPackage ? 'ready' : 'error');
      if (customerInfo?.entitlements.all[PREMIUM_ENTITLEMENT_ID]) {
        // Failure leaves the existing server-confirmed access intact. A
        // completed purchase can be retried without charging the customer again.
        await syncStore().catch(() => undefined);
      }
    } catch (error) {
      logApplePurchaseError('initialization', error);
      if (mounted.current) {
        setPurchasePackage(null);
        setBillingStatus('error');
      }
    }
  }, [userId, syncStore]);

  useEffect(() => {
    void refreshAccount();
    void refreshBilling();
    if (!userId || !canUseApplePurchases()) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void observeApplePurchases(userId, (info) => {
      if (cancelled) return;
      setStoreInfo(info);
      if (info.entitlements.all[PREMIUM_ENTITLEMENT_ID]) {
        void syncStore().catch(() => undefined);
      }
    }).then((removeListener) => {
      if (cancelled) removeListener();
      else unsubscribe = removeListener;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      unsubscribe?.();
      void disconnectApplePurchases(userId).catch(() => undefined);
    };
  }, [userId, refreshAccount, refreshBilling, syncStore]);

  useEffect(() => {
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshAccount();
        void refreshBilling();
      }
    });
    const refreshTimer = setInterval(() => { void refreshAccount(); }, 3 * 60 * 1000);
    const expiryTimer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => {
      foreground.remove();
      clearInterval(refreshTimer);
      clearInterval(expiryTimer);
    };
  }, [refreshAccount, refreshBilling]);

  const purchasePremium = async (): Promise<PurchaseResult> => {
    if (!userId || !purchasePackage || billingBusy.current) throw new Error('Purchase unavailable');
    billingBusy.current = true;
    setIsBillingBusy(true);
    try {
      // Confirm that the verification backend is ready before charging. It can
      // also discover an existing purchase that has not reached this device yet.
      const existing = await syncStore();
      if (existing.storePremiumActive) return 'activated';
      const info = await buyApplePremium(userId, purchasePackage);
      if (mounted.current) setStoreInfo(info);
      if (!hasApplePremium(info)) return 'pending_approval';
      try {
        const state = await syncStore();
        return state.storePremiumActive ? 'activated' : 'pending_confirmation';
      } catch {
        return 'pending_confirmation';
      }
    } catch (error) {
      const purchaseError = error as { code?: string; userCancelled?: boolean };
      if (purchaseError.userCancelled || purchaseError.code === '1') return 'cancelled';
      if (purchaseError.code === '20') return 'pending_approval';
      throw error;
    } finally {
      billingBusy.current = false;
      if (mounted.current) setIsBillingBusy(false);
    }
  };

  const restorePurchases = async (): Promise<RestoreResult> => {
    if (!userId || billingBusy.current) throw new Error('Restore unavailable');
    billingBusy.current = true;
    setIsBillingBusy(true);
    try {
      const info = await restoreApplePurchases(userId);
      if (mounted.current) setStoreInfo(info);
      try {
        const state = await syncStore();
        if (state.storePremiumActive) return 'restored';
        return hasApplePremium(info) ? 'pending_confirmation' : 'nothing_to_restore';
      } catch {
        if (hasApplePremium(info)) return 'pending_confirmation';
        throw new Error('Could not confirm restored purchases');
      }
    } finally {
      billingBusy.current = false;
      if (mounted.current) setIsBillingBusy(false);
    }
  };

  const activate30DaysPremium = async (targetEmail: string): Promise<boolean> => {
    if (!isAdmin || !targetEmail.trim()) return false;
    const email = targetEmail.trim().toLowerCase();
    const { data: current, error: readError } = await supabase.from('user_subscriptions')
      .select('vip_expires_at').eq('email', email).maybeSingle();
    if (readError) return false;
    const existingExpiry = current?.vip_expires_at ? Date.parse(current.vip_expires_at) : 0;
    const expiry = new Date(Math.max(Date.now(), existingExpiry || 0) + 30 * 86400000).toISOString();
    const { error } = await supabase.from('user_subscriptions').upsert({
      email, is_vip: true, vip_expires_at: expiry, updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });
    return !error;
  };

  const premiumExpiresAt = isAdmin ? null : accountState?.vipExpiresAt ?? null;
  const isPremium = !!session && !accountState?.isDeleted && (isAdmin || (
    accountState?.isVip === true &&
    (premiumExpiresAt === null || Date.parse(premiumExpiresAt) > now)
  ));
  const daysRemaining = isAdmin || (isPremium && !premiumExpiresAt) ? 999 :
    isPremium && premiumExpiresAt ? Math.max(0, Math.ceil((Date.parse(premiumExpiresAt) - now) / 86400000)) : 0;
  const hasStorePremium = !!(storeInfo && hasApplePremium(storeInfo)) || accountState?.storePremiumActive === true;

  return (
    <PlanContext.Provider value={{
      isPremium, premiumExpiresAt, daysRemaining, isPlanModalOpen,
      userCode: accountState?.activationCode || generateUserCode(userEmail || userId),
      billingStatus, purchasePackage, isBillingBusy, hasStorePremium,
      needsPurchaseConfirmation: hasStorePremium && !accountState?.storePremiumActive,
      openPlanModal: () => setIsPlanModalOpen(true),
      closePlanModal: () => setIsPlanModalOpen(false),
      purchasePremium, restorePurchases, activate30DaysPremium,
      refreshSubscriptionStatus: async () => { await refreshBilling(); await refreshAccount(); },
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used within a PlanProvider');
  return context;
}
