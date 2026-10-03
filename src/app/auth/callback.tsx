import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();

  useEffect(() => {
    const handleCallback = async () => {
      let detectedDeletedEmail: string | null = null;
      try {
        if (url) {
          const hashIdx = url.indexOf('#');
          const qIdx = url.indexOf('?');
          let paramStr = '';

          if (hashIdx !== -1) {
            paramStr = url.substring(hashIdx + 1);
          } else if (qIdx !== -1) {
            paramStr = url.substring(qIdx + 1);
          }

          const params = new URLSearchParams(paramStr);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            const email = sessionData?.user?.email?.toLowerCase().trim();
            if (email) {
              const { data: isDeleted } = await supabase
                .from('deleted_accounts')
                .select('email')
                .eq('email', email)
                .maybeSingle();

              if (isDeleted) {
                detectedDeletedEmail = email;
                await supabase.auth.signOut();
              }
            }
          }
        }
      } catch (e) {
        console.error('Auth callback error:', e);
      } finally {
        setTimeout(() => {
          try {
            if (detectedDeletedEmail) {
              router.replace({
                pathname: '/',
                params: { deleted_email: detectedDeletedEmail },
              });
            } else {
              router.replace('/');
            }
          } catch {
            // fallback
          }
        }, 150);
      }
    };

    void handleCallback();
  }, [url, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B50C8" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
});
