import { useEffect, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase, OAUTH_REDIRECT } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Rendered inside <AuthProvider> so it can read session state.
// Rules:
//   • While loading  → show spinner (splash equivalent post-font-load)
//   • No session     → redirect to /(auth) if not already there
//   • Session active → redirect to /(tabs) if sitting in auth group
//
// We track whether the initial redirect has been issued with a ref so
// subsequent renders triggered by navigation don't cause double-redirects.

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!session && !inAuth) {
      hasRedirected.current = true;
      router.replace('/(auth)');
    } else if (session && inAuth) {
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  useFrameworkReady();

  // ── OAuth deep-link handler ────────────────────────────────────────────────
  // maybeCompleteAuthSession() must be called once per app start so that
  // expo-web-browser can dismiss the in-app browser tab on Android after the
  // OAuth redirect fires.
  //
  // Foreground OAuth (the normal path): openAuthSessionAsync in signInWithGoogle()
  // intercepts the redirect before it ever reaches the OS URL dispatcher, so
  // signInWithGoogle() calls exchangeCodeForSession() itself. No listener needed.
  //
  // Cold-start OAuth (app was killed while the browser was open): the OS
  // delivers the callback URL as the launch URL, which getInitialURL() captures.
  // This is the only case where _layout.tsx needs to exchange the code.
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    Linking.getInitialURL().then((url) => {
      if (url?.includes(OAUTH_REDIRECT)) {
        supabase.auth.exchangeCodeForSession(url).then(({ error }) => {
          if (error) console.warn('[OAuth] exchangeCodeForSession (cold-start):', error.message);
        });
      }
    }).catch((e) => console.warn('[OAuth] getInitialURL error:', e));
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Keep splash visible while fonts load
  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <AuthGate />
      <StatusBar style="dark" backgroundColor="transparent" translucent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
});
