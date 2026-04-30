import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// ─── Client singleton ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Don't try to parse auth tokens from URL on mobile
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
// Wiring checklist (nothing in this file needs to change):
//   1. Supabase dashboard → Authentication → Providers → Google → enable,
//      paste Client ID + Secret from Google Cloud Console.
//   2. Add the redirect URI shown in the dashboard to the Google OAuth app's
//      "Authorised redirect URIs" list.
//   3. In app.json add a scheme, e.g. "scheme": "autotrack"
//   4. In this file, set OAUTH_REDIRECT to `autotrack://auth/callback`
//   5. In app/_layout.tsx, add a Linking listener that calls
//      supabase.auth.exchangeCodeForSession(url) when the deep-link fires.
//
// Until the Supabase Google provider is enabled, signInWithGoogle() will
// return a descriptive error string that the UI surfaces gracefully.

const OAUTH_REDIRECT: string | undefined = undefined;
// const OAUTH_REDIRECT = 'autotrack://auth/callback';

export async function signInWithGoogle(): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: OAUTH_REDIRECT,
      skipBrowserRedirect: false,
    },
  });
  return { error: normaliseAuthError(error) };
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
