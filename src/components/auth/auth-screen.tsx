import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { IskanLogo } from '@/components/common/iskan-logo';

WebBrowser.maybeCompleteAuthSession();

const googleLogo = { uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' };

export function AuthScreen() {
  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.authPage}>
      <View style={styles.authIntro}>
        <View style={styles.logoWrapper}>
          <IskanLogo size={60} />
        </View>
        <Text style={styles.authTitle}>Welcome to Iskan Nrxakan</Text>
        <Text style={styles.authDescription}>
          Sign in to view today&apos;s exchange rates and manage your activation.
        </Text>
      </View>

      <View style={styles.loginPanel}>
        <Text style={styles.loginLabel}>CONTINUE WITH</Text>

        <GoogleSignInButton />

        <Pressable disabled style={[styles.appleButton, styles.providerDisabled]}>
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
          <Text style={styles.appleText}>Apple sign-in coming soon</Text>
        </Pressable>

        <Text style={styles.legal}>
          Your account is only used to protect your activation and rate access.
        </Text>
      </View>

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
      <Pressable
        disabled={!request || !nonce || isSigningIn}
        onPress={handleGoogleSignIn}
        style={({ pressed }) => [
          styles.googleButton,
          (!request || !nonce || isSigningIn) && styles.providerDisabled,
          pressed && styles.pressed,
        ]}
      >
        {isSigningIn ? (
          <ActivityIndicator color="#4F55C7" size="small" />
        ) : (
          <Image source={googleLogo} contentFit="contain" style={styles.providerIcon} />
        )}
        <Text style={styles.googleText}>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</Text>
      </Pressable>
      {errorMessage ? <Text selectable style={styles.authError}>{errorMessage}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  authPage: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  authIntro: {
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 16,
  },
  authTitle: {
    color: '#3B50C8',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  authDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  loginPanel: {
    marginTop: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 8px 24px rgba(50, 50, 90, 0.06)',
  },
  loginLabel: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '800',
    marginBottom: 18,
  },
  googleButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  providerIcon: {
    width: 20,
    height: 20,
  },
  googleText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  appleButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#3B50C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  appleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  legal: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 20,
  },
  authFooter: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },
  providerDisabled: {
    opacity: 0.58,
  },
  authError: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
