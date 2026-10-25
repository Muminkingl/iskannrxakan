import type { Session } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';

import { AuthScreen } from '@/components/auth/auth-screen';
import { HomeScreen } from '@/components/home-screen';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { fetchAccountState, type AccountState } from '@/lib/auth-roles';
import { completeOnboarding, hasCompletedOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';
import { IskanLogo } from '@/components/common/iskan-logo';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ deleted_email?: string }>();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [deletedAccountEmail, setDeletedAccountEmail] = useState<string | null>(
    params.deleted_email || null
  );

  useEffect(() => {
    if (params.deleted_email) {
      setDeletedAccountEmail(params.deleted_email);
    }
  }, [params.deleted_email]);

  useEffect(() => {
    let active = true;
    void SplashScreen.hideAsync().catch(() => undefined);
    void hasCompletedOnboarding().then((completed) => {
      if (active) setOnboardingCompleted(completed);
    }).catch(() => {
      // Blocked browser storage or a device storage error must not prevent entry.
      if (active) setOnboardingCompleted(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let checkedUserId: string | null = null;
    let latestSession: Session | null = null;
    let checkId = 0;
    let authEventId = 0;
    const pendingEvents = new Set<ReturnType<typeof setTimeout>>();

    // Verify every session before rendering HomeScreen. Auth providers emit
    // SIGNED_IN as soon as a token is stored, so skipping this check for a
    // fresh sign-in briefly showed HomeScreen for deleted accounts.
    const checkAndSetSession = async (incomingSession: Session | null) => {
      if (!active) return;
      latestSession = incomingSession;
      if (!incomingSession) {
        ++checkId;
        checkedUserId = null;
        setSession(null);
        setAccountState(null);
        setIsCheckingSession(false);
        return;
      }

      // getSession() and SIGNED_IN can arrive together. Avoid running the
      // account RPC twice for the same user during that handoff.
      if (checkedUserId === incomingSession.user.id) {
        // Refresh the token only for an account whose gate already finished.
        setSession((current) => current?.user.id === incomingSession.user.id ? incomingSession : current);
        return;
      }
      checkedUserId = incomingSession.user.id;
      const requestId = ++checkId;
      const isCurrent = () => active && requestId === checkId;

      // Keep the protected screen unmounted while the account check runs.
      setIsCheckingSession(true);
      setSession(null);
      setAccountState(null);

      const email = incomingSession.user?.email?.toLowerCase().trim();
      const loadedAccountState = await fetchAccountState().catch(() => null);
      if (!isCurrent()) return;

      // Keep a compatibility fallback for a partially deployed backend. The
      // normal path is the single account-state RPC above.
      if (!loadedAccountState && email) {
        try {
          const { data: isDeleted } = await supabase
            .from('deleted_accounts')
            .select('email')
            .eq('email', email)
            .maybeSingle();

          if (!isCurrent()) return;
          if (isDeleted) {
            setDeletedAccountEmail(email);
            await supabase.auth.signOut({ scope: 'local' });
            if (!isCurrent()) return;
            setSession(null);
            setAccountState(null);
            checkedUserId = null;
            setIsCheckingSession(false);
            return;
          }
        } catch (e) {
          console.error('Error checking deleted account:', e);
        }
      }

      if (!isCurrent()) return;
      if (loadedAccountState?.isDeleted && email) {
        setDeletedAccountEmail(email);
        await supabase.auth.signOut({ scope: 'local' });
        if (!isCurrent()) return;
        setSession(null);
        setAccountState(null);
        checkedUserId = null;
        setIsCheckingSession(false);
        return;
      }

      setDeletedAccountEmail(null);
      setAccountState(loadedAccountState);
      setSession(latestSession);
      setIsCheckingSession(false);
    };

    // Initial load — run the same deleted-account gate as a fresh sign-in.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active && authEventId === 0) void checkAndSetSession(error ? null : data.session);
    }).catch(() => {
      if (active && authEventId === 0) void checkAndSetSession(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) return;
      const eventId = ++authEventId;
      // Supabase auth listeners run under its session lock. Start database work
      // after that callback returns so an account check cannot deadlock startup.
      const timer = setTimeout(() => {
        pendingEvents.delete(timer);
        if (active && eventId === authEventId) void checkAndSetSession(nextSession);
      }, 0);
      pendingEvents.add(timer);
    });

    return () => {
      active = false;
      ++checkId;
      pendingEvents.forEach(clearTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);


  if (onboardingCompleted === null) return <LoadingScreen />;
  if (!onboardingCompleted && !deletedAccountEmail) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setOnboardingCompleted(true);
          void completeOnboarding().catch(() => {
            console.warn('Could not save onboarding completion.');
          });
        }}
      />
    );
  }

  if (isCheckingSession) return <LoadingScreen />;
  if (session) return <HomeScreen session={session} initialAccountState={accountState} />;

  return (
    <AuthScreen
      deletedAccountEmail={deletedAccountEmail}
      onClearDeletedError={() => setDeletedAccountEmail(null)}
    />
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View entering={FadeIn.duration(260)} style={styles.loadingCenter}>
        <IskanLogo size={80} />
        <Text style={styles.loadingName}>Iskan Nrxakan</Text>
        <Text style={styles.loadingTagline}>Clear rates. Every day.</Text>
        <ActivityIndicator color="#3B50C8" size="small" style={styles.loader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  loadingCenter: { alignItems: 'center' },
  loadingMark: { width: 92, height: 92 },
  loadingName: { color: '#3B50C8', fontSize: 20, fontWeight: '600', letterSpacing: 0, marginTop: 14 },
  loadingTagline: { color: '#94A3B8', fontSize: 13, marginTop: 5 },
  loader: { marginTop: 34 },
});
