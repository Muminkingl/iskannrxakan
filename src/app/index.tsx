import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { HomeScreen } from '@/components/home-screen';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Step = 'loading' | 'onboarding' | 'auth';

const brandMark = require('@/assets/images/nrxiskan_4k.png');
const googleLogo = { uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' };
const appleLogo = { uri: 'https://cdn.simpleicons.org/apple/ffffff' };
const onboardingSlides = [
  {
    illustration: { uri: 'https://cdn.jsdelivr.net/npm/undraw-svg@1.0.0/svgs/digital-currency.svg' },
    kicker: 'ERBIL CURRENCY MARKET',
    title: 'The rate you need,\\nwithout the noise.',
    description: 'Follow the local market with clear buy and sell prices, updated by your Chya Exchange team.',
  },
  {
    illustration: { uri: 'https://cdn.jsdelivr.net/npm/undraw-svg@1.0.0/svgs/online-banking.svg' },
    kicker: 'CLEAR AT A GLANCE',
    title: 'One trusted place\\nfor every exchange.',
    description: 'Compare the prices that matter to you without switching between calls, chats, and screenshots.',
  },
  {
    illustration: { uri: 'https://cdn.jsdelivr.net/npm/undraw-svg@1.0.0/svgs/personal-finance.svg' },
    kicker: 'READY WHEN YOU ARE',
    title: 'Make your next move\\nwith confidence.',
    description: 'Your personal access keeps the latest local rates ready whenever you need them.',
  },
] as const;

export default function EntryScreen() {
  const [step, setStep] = useState<Step>('loading');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const { width } = useWindowDimensions();

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.scroll, width >= 700 && styles.wide]}>
        {step === 'onboarding' ? <Onboarding step={onboardingStep} onSkip={() => setStep('auth')} onContinue={() => { if (onboardingStep === onboardingSlides.length - 1) { setStep('auth'); } else { setOnboardingStep((value) => value + 1); } }} /> : <Auth />}
      </ScrollView>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View entering={FadeIn.duration(260)} style={styles.loadingCenter}>
        <Image source={brandMark} contentFit="contain" style={styles.loadingMark} />
        <Text style={styles.loadingName}>CHYA EXCHANGE</Text>
        <Text style={styles.loadingTagline}>Clear rates. Every day.</Text>
        <ActivityIndicator color="#4F55C7" size="small" style={styles.loader} />
      </Animated.View>
    </View>
  );
}

function Onboarding({ step, onContinue, onSkip }: { step: number; onContinue: () => void; onSkip: () => void }) {
  const slide = onboardingSlides[step];
  const isLastSlide = step === onboardingSlides.length - 1;

  return (
    <Animated.View entering={FadeInDown.duration(380)} key={step} style={styles.page}>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / onboardingSlides.length) * 100}%` }]} /></View>
      <View style={styles.brandHeader}><Image source={brandMark} contentFit="contain" style={styles.headerMark} /><Text style={styles.headerName}>CHYA EXCHANGE</Text></View>
      <View style={styles.illustrationFrame}><Image source={slide.illustration} contentFit="contain" style={styles.illustration} /></View>
      <View style={styles.copy}><Text style={styles.kicker}>{slide.kicker}</Text><Text style={styles.title}>{slide.title.replace('\\n', '\n')}</Text><Text style={styles.description}>{slide.description}</Text></View>
      <View style={styles.dots}>{onboardingSlides.map((_, index) => <View key={index} style={[styles.dot, index === step && styles.dotActive]} />)}</View>
      <View style={styles.bottomRow}><Pressable hitSlop={10} onPress={onSkip}><Text style={styles.skip}>Skip</Text></Pressable><Pressable onPress={onContinue} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}><Text style={styles.nextText}>{isLastSlide ? 'Get started' : 'Continue'}</Text><Text style={styles.nextArrow}>{'>'}</Text></Pressable></View>
    </Animated.View>
  );
}

function Auth() {
  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.authPage}>
      <View style={styles.authSoftShape} />
      <View style={styles.authTop} />
      <View style={styles.authIntro}><Text style={styles.authTitle}>Welcome to Chya</Text><Text style={styles.authDescription}>Sign in to view today&apos;s exchange rates and manage your activation.</Text></View>
      <View style={styles.loginPanel}>
        <Text style={styles.loginLabel}>CONTINUE WITH</Text>
        <GoogleSignInButton />
        <Pressable disabled style={[styles.appleButton, styles.providerDisabled]}><Image source={appleLogo} contentFit="contain" style={styles.providerIcon} /><Text style={styles.appleText}>Apple sign-in coming soon</Text></Pressable>
        <Text style={styles.legal}>Your account is only used to protect your activation and rate access.</Text>
      </View>
      <Text style={styles.authFooter}>Chya Exchange - Erbil</Text>
    </Animated.View>
  );
}

function GoogleSignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nonce, setNonce] = useState<{ plain: string; hashed: string } | null>(null);

  useEffect(() => {
    const plain = Crypto.randomUUID();
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, plain, { encoding: Crypto.CryptoEncoding.HEX }).then((hashed) => {
      setNonce({ plain, hashed });
    });
  }, []);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    extraParams: nonce ? { nonce: nonce.hashed } : undefined,
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.params.id_token;
    if (!idToken) {
      setErrorMessage('Google did not return an ID token. Please try again.');
      setIsSigningIn(false);
      return;
    }

    const finishSignIn = async () => {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: nonce?.plain });
      if (error) {
        setErrorMessage(error.message);
      }
      setIsSigningIn(false);
    };

    void finishSignIn();
  }, [nonce?.plain, response]);

  const handleGoogleSignIn = async () => {
    if (!request || !nonce || isSigningIn) return;
    setErrorMessage(null);
    setIsSigningIn(true);
    const result = await promptAsync();
    if (result.type !== 'success') {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <Pressable disabled={!request || !nonce || isSigningIn} onPress={handleGoogleSignIn} style={({ pressed }) => [styles.googleButton, (!request || !nonce || isSigningIn) && styles.providerDisabled, pressed && styles.pressed]}>
        {isSigningIn ? <ActivityIndicator color="#4F55C7" size="small" /> : <Image source={googleLogo} contentFit="contain" style={styles.providerIcon} />}
        <Text style={styles.googleText}>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</Text>
      </Pressable>
      {errorMessage ? <Text selectable style={styles.authError}>{errorMessage}</Text> : null}
    </>
  );
}

function SignedInScreen({ session }: { session: Session }) {
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  };

  return (
    <View style={styles.signedInRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Image source={brandMark} contentFit="contain" style={styles.signedInMark} />
      <Text style={styles.signedInTitle}>You&apos;re signed in</Text>
      <Text selectable style={styles.signedInEmail}>{session.user.email ?? 'Google account connected'}</Text>
      <Text style={styles.signedInDescription}>Your Chya account is ready. The exchange dashboard is the next part of the foundation.</Text>
      <Pressable onPress={signOut} style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}><Text style={styles.signOutText}>Sign out</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' }, scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24 }, wide: { width: 560, alignSelf: 'center' },
  loadingRoot: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, loadingCenter: { alignItems: 'center' }, loadingMark: { width: 92, height: 92 }, loadingName: { color: '#4F55C7', fontSize: 14, letterSpacing: 2.2, fontWeight: '900', marginTop: 16 }, loadingTagline: { color: '#7C7C87', fontSize: 12, marginTop: 6 }, loader: { marginTop: 34 },
  page: { flex: 1, minHeight: 690 }, progressTrack: { height: 2, backgroundColor: '#ECECF2', marginHorizontal: -28 }, progressFill: { width: '33%', height: '100%', backgroundColor: '#4F55C7' }, brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 18 }, headerMark: { width: 29, height: 29 }, headerName: { color: '#4F55C7', fontWeight: '900', letterSpacing: 1.5, fontSize: 12 },
  illustrationFrame: { height: 326, alignItems: 'center', justifyContent: 'center', paddingTop: 14 }, illustration: { width: '100%', height: '100%' }, copy: { alignItems: 'center', paddingHorizontal: 8 }, kicker: { color: '#FF9B1A', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 }, title: { color: '#4F55C7', textAlign: 'center', fontSize: 27, lineHeight: 34, letterSpacing: -0.45, fontWeight: '800', marginTop: 11 }, description: { color: '#6D6D78', textAlign: 'center', fontSize: 14, lineHeight: 22, fontWeight: '400', marginTop: 13, maxWidth: 340 }, dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 26 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#C9C9D0' }, dotActive: { width: 7, height: 7, backgroundColor: '#FF9B1A' }, bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 24 }, skip: { color: '#4F55C7', fontSize: 14, fontWeight: '700' }, nextButton: { height: 50, minWidth: 146, paddingHorizontal: 19, borderRadius: 6, backgroundColor: '#4F55C7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, nextText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }, nextArrow: { color: '#FFFFFF', fontSize: 27, lineHeight: 28, fontWeight: '300' }, pressed: { opacity: 0.76 },
  authPage: { flex: 1, minHeight: 690, paddingTop: 10, overflow: 'hidden' }, authSoftShape: { position: 'absolute', width: 460, height: 350, borderRadius: 230, backgroundColor: '#F3F3FB', top: -210, left: -95 }, authTop: { height: 28 }, authIntro: { marginTop: 78, alignItems: 'center' }, authTitle: { color: '#454AA9', fontSize: 29, fontWeight: '800', letterSpacing: -0.4 }, authDescription: { color: '#777783', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 310 }, loginPanel: { marginTop: 44, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E9F0', borderRadius: 10, padding: 20, boxShadow: '0 9px 24px rgba(67, 70, 130, 0.06)' }, loginLabel: { color: '#9898A3', textAlign: 'center', fontSize: 10, letterSpacing: 1.4, fontWeight: '800', marginBottom: 17 }, googleButton: { height: 53, borderRadius: 5, borderWidth: 1, borderColor: '#DBDBE3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 }, providerIcon: { width: 20, height: 20 }, googleText: { color: '#30303A', fontSize: 15, fontWeight: '700' }, appleButton: { height: 53, borderRadius: 5, backgroundColor: '#4F55C7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 11 }, appleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, legal: { color: '#93939E', textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 20, paddingHorizontal: 12 }, authFooter: { color: '#898993', textAlign: 'center', fontSize: 12, marginTop: 'auto', paddingTop: 28 }, providerDisabled: { opacity: 0.58 }, authError: { color: '#B42318', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 12 }, signedInRoot: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }, signedInMark: { width: 88, height: 88 }, signedInTitle: { color: '#454AA9', fontSize: 28, fontWeight: '800', marginTop: 18 }, signedInEmail: { color: '#4F55C7', fontSize: 14, fontWeight: '700', marginTop: 10 }, signedInDescription: { color: '#777783', textAlign: 'center', fontSize: 14, lineHeight: 22, marginTop: 16, maxWidth: 320 }, signOutButton: { marginTop: 30, borderWidth: 1, borderColor: '#D7D8E8', borderRadius: 6, paddingHorizontal: 22, paddingVertical: 13 }, signOutText: { color: '#4F55C7', fontSize: 14, fontWeight: '800' },
});