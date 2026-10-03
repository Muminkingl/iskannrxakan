import type { Session } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';

import { AuthScreen } from '@/components/auth/auth-screen';
import { HomeScreen } from '@/components/home-screen';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { supabase } from '@/lib/supabase';
import { IskanLogo } from '@/components/common/iskan-logo';

// Persisted flag — once set, onboarding never shows again (even after sign out)
const ONBOARDING_DONE_KEY = 'onboarding_done';

type Step = 'loading' | 'onboarding' | 'auth';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ deleted_email?: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [deletedAccountEmail, setDeletedAccountEmail] = useState<string | null>(
    params.deleted_email || null
  );

  useEffect(() => {
    if (params.deleted_email) {
      setDeletedAccountEmail(params.deleted_email);
      setStep('auth');
    }
  }, [params.deleted_email]);

  useEffect(() => {
    void SplashScreen.hideAsync();

    const timer = setTimeout(async () => {
      // If still no session after loading, decide: onboarding or auth
      // Check if user has already seen onboarding (skipped or completed)
      const done = await SecureStore.getItemAsync(ONBOARDING_DONE_KEY);
      setStep((prev) => {
        if (prev !== 'loading') return prev; // session already set
        return done ? 'auth' : 'onboarding'; // skip if seen before
      });
    }, 800);

    // Verify every session before rendering HomeScreen. Auth providers emit
    // SIGNED_IN as soon as a token is stored, so skipping this check for a
    // fresh sign-in briefly showed HomeScreen for deleted accounts.
    const checkAndSetSession = async (incomingSession: Session | null) => {
      if (!incomingSession) {
        setSession(null);
        setStep('auth');
        return;
      }

      // Keep the protected screen unmounted while the account check runs.
      setStep('loading');

      // If user has a valid session, onboarding is definitely completed
      void SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1');

      const email = incomingSession.user?.email?.toLowerCase().trim();
      if (email) {
        try {
          const { data: isDeleted } = await supabase
            .from('deleted_accounts')
            .select('email')
            .eq('email', email)
            .maybeSingle();

          if (isDeleted) {
            setDeletedAccountEmail(email);
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
            setStep('auth');
            return;
          }
        } catch (e) {
          console.error('Error checking deleted account:', e);
        }
      }

      setDeletedAccountEmail(null);
      setSession(incomingSession);
      setStep('auth');
    };

    // Initial load — run the same deleted-account gate as a fresh sign-in.
    supabase.auth.getSession().then(({ data }) => {
      void checkAndSetSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_IN') {
        void checkAndSetSession(nextSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setStep('auth');
      } else if (event === 'TOKEN_REFRESHED' && nextSession) {
        setSession(nextSession);
        setStep('auth');
      }
    });

    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);


  if (step === 'loading') return <LoadingScreen />;
  if (session) return <HomeScreen session={session} />;
  if (step === 'onboarding' && !deletedAccountEmail) {
    return (
      <OnboardingFlow
        onComplete={() => {
          // Persist the flag so onboarding never appears again
          void SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1');
          setStep('auth');
        }}
      />
    );
  }

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
