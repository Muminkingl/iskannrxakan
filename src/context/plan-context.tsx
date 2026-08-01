import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserRole } from '@/lib/auth-roles';
import {
  N8N_WEBHOOK_URL,
  N8N_AUTH_HEADER_NAME,
  N8N_AUTH_HEADER_VALUE,
} from '@/constants/config';
import { generateUserCode } from '@/utils/user-code';

type PaymentSubmitResult = 'submitted' | 'already_pending' | 'error';

interface PlanContextType {
  isVip: boolean;
  vipExpiresAt: string | null;
  daysRemaining: number;
  isPlanModalOpen: boolean;
  pendingPaymentExists: boolean;
  openPlanModal: () => void;
  closePlanModal: () => void;
  toggleVip: () => void;
  activate30DaysVip: (targetEmail?: string) => Promise<boolean>;
  submitPaymentRequest: (transactionRef?: string) => Promise<PaymentSubmitResult>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({
  children,
  session,
  dbAdmins = [],
}: {
  children: React.ReactNode;
  session: Session | null;
  dbAdmins?: string[];
}) {
  const [isVip, setIsVip] = useState(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [pendingPaymentExists, setPendingPaymentExists] = useState(false);

  const userEmail = session?.user?.email;
  const userId = session?.user?.id;
  const userRole = getUserRole(userEmail, dbAdmins);
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  // ─── Single source of truth: user_subscriptions only ──────────────────────
  const checkSubscriptionStatus = async () => {
    if (!userEmail) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('vip_expires_at, is_vip')
        .eq('email', userEmail.trim().toLowerCase())
        .maybeSingle();

      if (!error && data?.vip_expires_at) {
        const expiresDate = new Date(data.vip_expires_at);
        const now = new Date();
        const diffDays = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          setIsVip(true);
          setVipExpiresAt(data.vip_expires_at);
          setDaysRemaining(diffDays);
          return;
        }
      }

      // Check for pending payment requests
      await checkPendingPayment();

      // Default: Free Tier
      setIsVip(false);
      setVipExpiresAt(null);
      setDaysRemaining(0);

      // Auto-open modal on first load for free-tier users
      if (!hasAutoOpened) {
        setHasAutoOpened(true);
        setTimeout(() => setIsPlanModalOpen(true), 600);
      }
    } catch (err) {
      console.log('Error checking subscription status:', err);
      setIsVip(false);
    }
  };

  // ─── On session start ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !userEmail) {
      setIsVip(false);
      return;
    }

    if (isOwnerOrAdmin) {
      setIsVip(true);
      setVipExpiresAt(null);
      setDaysRemaining(999);
      return;
    }

    checkSubscriptionStatus();
  }, [session, userEmail, isOwnerOrAdmin]);

  // ─── Re-check on app foreground (fixes stale cache bug) ───────────────────
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    if (!userEmail || isOwnerOrAdmin) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkSubscriptionStatus();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [userEmail, isOwnerOrAdmin]);

  // ─── Periodic re-check every 3 minutes (catches mid-session admin approval) ─
  useEffect(() => {
    if (!userEmail || isOwnerOrAdmin) return;

    const intervalId = setInterval(() => {
      checkSubscriptionStatus();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(intervalId);
  }, [userEmail, isOwnerOrAdmin]);

  const checkPendingPayment = async () => {
    if (!userEmail) return;
    try {
      const { data } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('email', userEmail.trim().toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      setPendingPaymentExists(!!data);
    } catch {
      setPendingPaymentExists(false);
    }
  };

  const submitPaymentRequest = async (transactionRef?: string): Promise<PaymentSubmitResult> => {
    if (!userEmail || !userId) return 'error';

    const cleanEmail = userEmail.trim().toLowerCase();

    try {
      // Anti-spam: Check for existing pending request
      const { data: existing } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('email', cleanEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        setPendingPaymentExists(true);
        return 'already_pending';
      }

      const userCode = generateUserCode(cleanEmail);

      const { error: insertError } = await supabase.from('payment_requests').insert({
        code: userCode,
        email: cleanEmail,
        user_id: userId,
        status: 'pending',
        transaction_ref: userCode,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.log('Error inserting payment_request:', insertError.message);
        return 'error';
      }

      setPendingPaymentExists(true);

      // Fire n8n webhook notification
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [N8N_AUTH_HEADER_NAME]: N8N_AUTH_HEADER_VALUE,
          },
          body: JSON.stringify({ record: { code: userCode } }),
        });
      } catch (webhookErr) {
        console.log('n8n webhook error (non-blocking):', webhookErr);
      }

      return 'submitted';
    } catch (err) {
      console.log('Error in submitPaymentRequest:', err);
      return 'error';
    }
  };

  const activate30DaysVip = async (targetEmail?: string): Promise<boolean> => {
    const emailToActivate = targetEmail || userEmail;
    if (!emailToActivate) return false;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30);
    const expiresIso = expiresDate.toISOString();

    try {
      // Single source of truth: user_subscriptions only
      const { error } = await supabase.from('user_subscriptions').upsert(
        {
          email: emailToActivate.trim().toLowerCase(),
          is_vip: true,
          vip_expires_at: expiresIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      if (error) {
        console.log('Error upserting user_subscriptions:', error.message);
        return false;
      }

      // If activating for the currently logged-in user, update state instantly
      if (!targetEmail || targetEmail.trim().toLowerCase() === userEmail?.trim().toLowerCase()) {
        setIsVip(true);
        setVipExpiresAt(expiresIso);
        setDaysRemaining(30);
        setPendingPaymentExists(false);
      }

      return true;
    } catch (err) {
      console.log('Error in activate30DaysVip:', err);
      return false;
    }
  };

  const openPlanModal = () => setIsPlanModalOpen(true);
  const closePlanModal = () => setIsPlanModalOpen(false);
  const toggleVip = () => setIsVip((prev) => !prev);
  const refreshSubscriptionStatus = async () => {
    if (!isOwnerOrAdmin) await checkSubscriptionStatus();
  };

  return (
    <PlanContext.Provider
      value={{
        isVip,
        vipExpiresAt,
        daysRemaining,
        isPlanModalOpen,
        pendingPaymentExists,
        openPlanModal,
        closePlanModal,
        toggleVip,
        activate30DaysVip,
        submitPaymentRequest,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
