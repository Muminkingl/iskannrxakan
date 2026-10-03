import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import { supabase } from '@/lib/supabase';
import { IskanLogo } from '@/components/common/iskan-logo';

WebBrowser.maybeCompleteAuthSession();

const isTransientNetworkError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return /network|fetch failed|connection|timeout|timed out|offline/.test(message);
};

const friendlySignInError = (provider: 'Apple' | 'Google', error: unknown) => {
  if (isTransientNetworkError(error)) {
    return `Couldn’t complete ${provider} sign-in. Check your internet connection and try again.`;
  }
  return `${provider} sign-in couldn’t be completed. Please try again.`;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface AuthScreenProps {
  deletedAccountEmail?: string | null;
  onClearDeletedError?: () => void;
}

export function AuthScreen({ deletedAccountEmail, onClearDeletedError }: AuthScreenProps) {
  const [blockedEmail, setBlockedEmail] = useState<string | null>(deletedAccountEmail || null);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [appleSignInError, setAppleSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (deletedAccountEmail) {
      setBlockedEmail(deletedAccountEmail);
    }
  }, [deletedAccountEmail]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleSignInAvailable)
      .catch(() => setIsAppleSignInAvailable(false));
  }, []);

  const activeBlockedEmail = blockedEmail || deletedAccountEmail;

  useEffect(() => {
    if (activeBlockedEmail) {
      Alert.alert(
        'هەژمارەکە سڕدراوەتەوە | Account Deleted',
        `ئەم هەژمارە (${activeBlockedEmail}) بە یەکجاری سڕدراوەتەوە و چیتر ناتوانیت پێی بچیتە ژوورەوە.\n\nThis account has been permanently deleted and cannot be used.`
      );
    }
  }, [activeBlockedEmail]);

  const handleBlockedAccount = (email: string) => {
    setBlockedEmail(email);
  };

  const handleAppleSignIn = async () => {
    if (isAppleSigningIn) return;
    setAppleSignInError(null);
    setIsAppleSigningIn(true);

    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        nonce: hashedNonce,
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token. Please try again.');
      }

      let result = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      // Apple occasionally loses the first token exchange on iOS. Retry the
      // network exchange once, without reopening Apple's native sign-in sheet.
      if (result.error && isTransientNetworkError(result.error)) {
        await wait(500);
        result = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });
      }

      const { data, error } = result;

      if (error) throw error;

      // ── Check deleted accounts ───────────────────────────────────────────
      const email = data.user.email?.toLowerCase().trim();
      if (email) {
        const { data: deletedAccount } = await supabase
          .from('deleted_accounts')
          .select('email')
          .eq('email', email)
          .maybeSingle();

        if (deletedAccount) {
          await supabase.auth.signOut({ scope: 'local' });
          handleBlockedAccount(email);
          return;
        }
      }

      // ── Save full name in background (non-blocking) ──────────────────────
      // This was causing the 4-second delay before. Fire-and-forget here so
      // the app transitions to HomeScreen immediately after sign-in.
      if (credential.fullName) {
        const givenName = credential.fullName.givenName?.trim() || null;
        const middleName = credential.fullName.middleName?.trim() || null;
        const familyName = credential.fullName.familyName?.trim() || null;
        const fullName = [givenName, middleName, familyName].filter(Boolean).join(' ');

        if (fullName) {
          // Fire-and-forget — do NOT await this
          supabase.auth.updateUser({
            data: { full_name: fullName, given_name: givenName, family_name: familyName },
          }).catch((e: unknown) => {
            console.warn('Could not save Apple name (non-critical):', e);
          });
        }
      }
    } catch (error: unknown) {
      const errorCode = (error as { code?: string } | null)?.code;
      if (errorCode !== 'ERR_REQUEST_CANCELED') {
        setAppleSignInError(friendlySignInError('Apple', error));
      }
    } finally {
      setIsAppleSigningIn(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.authPage}>
      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <View style={styles.authIntro}>
        <View style={styles.logoWrapper}>
          <IskanLogo size={64} />
        </View>
        <Text style={styles.authTitle} numberOfLines={1} adjustsFontSizeToFit>
          Iskan Nrxakan
        </Text>
        <Text style={styles.authDescription}>
          Live exchange rates & gold prices for Iraq and Erbil
        </Text>
      </View>

      {/* ── Login Panel ───────────────────────────────────────────────── */}
      <View style={styles.loginPanel}>
        {/* Deleted account banner */}
        {activeBlockedEmail ? (
          <View style={styles.deletedBanner}>
            <View style={styles.deletedBadgeHeader}>
              <Ionicons name="close-circle" size={20} color="#DC2626" />
              <Text style={styles.deletedBannerTitle}>Account Deleted</Text>
            </View>
            <Text style={styles.deletedEmailText}>{activeBlockedEmail}</Text>
            <Text style={styles.deletedBannerSub}>
              This account was permanently deleted and cannot be signed into.
            </Text>
          </View>
        ) : null}

        <Text style={styles.dividerLabel}>SIGN IN WITH</Text>

        {/* Google */}
        <GoogleSignInButton onBlockedAccount={handleBlockedAccount} />

        {/* Divider — only shown when Apple is also available */}
        {Platform.OS === 'ios' && isAppleSignInAvailable && (
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>
        )}

        {/* Apple */}
        {Platform.OS === 'ios' && isAppleSignInAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={[styles.appleButton, isAppleSigningIn && styles.providerDisabled]}
            onPress={() => void handleAppleSignIn()}
          />
        )}

        {appleSignInError ? (
          <Text selectable style={styles.authError}>{appleSignInError}</Text>
        ) : null}

        <Text style={styles.legal}>
          Your account is only used to protect your activation and rate access.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Google Sign-In Button ────────────────────────────────────────────────────

function GoogleSignInButton({
  onBlockedAccount,
}: {
  onBlockedAccount: (email: string) => void;
}) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setErrorMessage(null);
    setIsSigningIn(true);

    try {
      const redirectUri = makeRedirectUri({
        scheme: 'iskannrxakan',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
          // ── FIX: force account picker every time ──────────────────────
          // Without this, iOS Safari reuses its saved session and always
          // picks the previously used Google account — even after you delete
          // it and reinstall the app.
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) {
        setErrorMessage(friendlySignInError('Google', error));
        setIsSigningIn(false);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success' && result.url) {
          const urlStr = result.url;

          // deleted_email redirect from auth callback
          if (urlStr.includes('deleted_email=')) {
            const match = urlStr.match(/deleted_email=([^&#]+)/);
            if (match) {
              onBlockedAccount(decodeURIComponent(match[1]));
              return;
            }
          }

          const hashIdx = urlStr.indexOf('#');
          const qIdx = urlStr.indexOf('?');
          let paramStr = '';
          if (hashIdx !== -1) paramStr = urlStr.substring(hashIdx + 1);
          else if (qIdx !== -1) paramStr = urlStr.substring(qIdx + 1);

          const params = new URLSearchParams(paramStr);
          const errorParam = params.get('error');
          const errorDesc = params.get('error_description');

          if (errorParam || errorDesc) {
            const friendlyMessage = 'Google sign-in could not be completed. Please try again.';
            setErrorMessage(friendlyMessage);
            Alert.alert('Authentication Notice', friendlyMessage);
            return;
          }

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setErrorMessage(friendlySignInError('Google', sessionError));
              return;
            }

            // Check if this account is deleted
            const userEmail = sessionData?.user?.email?.toLowerCase().trim();
            if (userEmail) {
              const { data: isDeleted } = await supabase
                .from('deleted_accounts')
                .select('email')
                .eq('email', userEmail)
                .maybeSingle();

              if (isDeleted) {
                await supabase.auth.signOut({ scope: 'local' });
                onBlockedAccount(userEmail);
                return;
              }
            }
          }
        }
      }
    } catch (e: unknown) {
      setErrorMessage(friendlySignInError('Google', e));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <Pressable
        disabled={isSigningIn}
        onPress={handleGoogleSignIn}
        style={({ pressed }) => [
          styles.googleButton,
          isSigningIn && styles.providerDisabled,
          pressed && styles.pressed,
        ]}
      >
        {isSigningIn ? (
          <ActivityIndicator color="#4F55C7" size="small" />
        ) : (
          <View style={styles.googleIconCircle}>
            <GoogleGIcon />
          </View>
        )}
        <Text style={styles.googleText}>
          {isSigningIn ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </Pressable>
      {errorMessage ? (
        <Text selectable style={styles.authError}>{errorMessage}</Text>
      ) : null}
    </>
  );
}

function GoogleGIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" accessibilityLabel="Google">
      <Defs>
        <ClipPath id="googleGClip">
          <Path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#googleGClip)">
        <Path fill="#FBBC05" d="M0 37V11l17 13z" />
        <Path fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z" />
        <Path fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z" />
        <Path fill="#4285F4" d="M48 48L17 24l-4-3 35-10z" />
      </G>
    </Svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  authPage: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  authIntro: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrapper: {
    marginBottom: 14,
  },
  authTitle: {
    color: '#1E293B',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  authDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  loginPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    gap: 0,
  },
  deletedBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 4,
  },
  deletedBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  deletedBannerTitle: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  deletedEmailText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  deletedBannerSub: {
    color: '#7F1D1D',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  dividerLabel: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
    marginBottom: 14,
  },
  // ── Google button ────────────────────────────────────────────────────────
  googleButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  // ── OR divider ───────────────────────────────────────────────────────────
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Apple button ─────────────────────────────────────────────────────────
  appleButton: {
    height: 52,
    width: '100%',
    borderRadius: 12,
  },
  // ── Shared ───────────────────────────────────────────────────────────────
  legal: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 18,
  },
  providerDisabled: {
    opacity: 0.5,
  },
  authError: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 10,
  },
  pressed: {
    opacity: 0.75,
  },
});
