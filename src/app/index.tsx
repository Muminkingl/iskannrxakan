import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { Session } from '@supabase/supabase-js';

import { AuthScreen } from '@/components/auth/auth-screen';
import { HomeScreen } from '@/components/home-screen';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { supabase } from '@/lib/supabase';

const brandMark = require('@/assets/images/nrxiskan_4k.png');

type Step = 'loading' | 'onboarding' | 'auth';

export default function EntryScreen() {
  const [step, setStep] = useState<Step>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hide();
      setStep('onboarding');
    }, 900);

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (step === 'loading') return <LoadingScreen />;
  if (session) return <HomeScreen session={session} />;
  if (step === 'onboarding') return <OnboardingFlow onComplete={() => setStep('auth')} />;

  return <AuthScreen />;
}

function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View entering={FadeIn.duration(260)} style={styles.loadingCenter}>
        <Image source={brandMark} contentFit="contain" style={styles.loadingMark} />
        <Text style={styles.loadingName}>Iskan Nrxakan</Text>
        <Text style={styles.loadingTagline}>Know the rate before you trade.</Text>
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