import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// ─── Client singleton ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Shared result type ───────────────────────────────────────────────────────

export interface AuthResult {
  error: string | null;
}

// ─── Email / password ─────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: normaliseAuthError(error) };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: normaliseAuthError(error) };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
//
// Setup checklist:
//   1. Supabase dashboard → Authentication → Providers → Google → Enable.
//      Paste your Google Cloud Console OAuth Client ID and Client Secret.
//
//   2. In Supabase dashboard → Authentication → URL Configuration, add:
//        autotrack://auth/callback
//      to the "Redirect URLs" allow-list.
//
//   3. In Google Cloud Console → OAuth 2.0 Client → "Authorised redirect URIs",
//      add the Supabase callback URL shown in the Supabase dashboard, e.g.:
//        https://<your-project-ref>.supabase.co/auth/v1/callback
//      NOT the app scheme — Google redirects to Supabase, which then redirects
//      to the app scheme.
//
// Flow:
//   signInWithGoogle() → gets OAuth URL from Supabase → opens it in an
//   in-app browser via expo-web-browser → browser redirects to
//   autotrack://auth/callback?code=... → openAuthSessionAsync intercepts it →
//   we call exchangeCodeForSession(url) → onAuthStateChange fires → AuthGate
//   navigates to /(tabs).

import * as WebBrowser from 'expo-web-browser';

// Required so the in-app browser session can be dismissed on Android when
// the redirect back to the app fires.
WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT = 'autotrack://auth/callback';

export async function signInWithGoogle(): Promise<AuthResult> {
  // 1. Ask Supabase for the Google OAuth URL (PKCE flow).
  const { data, error: urlError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: OAUTH_REDIRECT,
      skipBrowserRedirect: true, // We open the browser ourselves below.
    },
  });

  if (urlError || !data.url) {
    return { error: normaliseAuthError(urlError) ?? 'Could not start Google sign-in.' };
  }

  // 2. Open the OAuth URL in an in-app browser tab and wait for the redirect.
  const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);

  if (result.type !== 'success') {
    // User cancelled or browser failed — not an error worth surfacing.
    return { error: null };
  }

  // 3. Exchange the authorization code in the redirect URL for a session.
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
  return { error: normaliseAuthError(sessionError) };
}

// ─── Error normalisation ──────────────────────────────────────────────────────
// Converts Supabase AuthError objects into readable strings, or null on success.

function normaliseAuthError(error: { message: string } | null): string | null {
  if (!error) return null;
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid login'))
    return 'Incorrect email or password. Please try again.';
  if (msg.includes('email not confirmed'))
    return 'Check your inbox — you need to confirm your email before signing in.';
  if (msg.includes('user already registered') || msg.includes('already registered'))
    return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('password should be'))
    return 'Password must be at least 6 characters.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Check your connection and try again.';

  // Pass through anything else unchanged
  return error.message;
}
