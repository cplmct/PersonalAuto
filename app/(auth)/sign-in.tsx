import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { TrustNote } from '@/components/auth/TrustNote';
import { FormErrorBanner } from '@/components/auth/FormErrorBanner';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return 'Password is required.';
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Field errors only appear after the first submit attempt
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError]         = useState<string | null>(null);

  const emailError    = submitted ? validateEmail(email)       : null;
  const passwordError = submitted ? validatePassword(password) : null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignIn = async () => {
    setSubmitted(true);
    setAuthError(null);

    // Run validation before hitting the network
    if (validateEmail(email) || validatePassword(password)) return;

    setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      setAuthError(error);
    }
    // On success the AuthProvider picks up the new session via onAuthStateChange
    // and the AuthGate in _layout.tsx redirects to /(tabs) automatically.
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setAuthError(error);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ArrowLeft size={18} color={Colors.textSub} strokeWidth={2} />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your AutoTrack account</Text>
          </View>

          {/* Google */}
          <GoogleButton
            onPress={handleGoogle}
            loading={googleLoading}
            label="Sign in with Google"
          />

          <AuthDivider label="or sign in with email" />

          {/* Form */}
          <View style={styles.form}>
            {authError && <FormErrorBanner message={authError} />}

            <TextInput
              label="Email"
              value={email}
              onChangeText={v => { setEmail(v); setAuthError(null); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              error={emailError ?? undefined}
            />

            <PasswordInput
              label="Password"
              value={password}
              onChangeText={v => { setPassword(v); setAuthError(null); }}
              placeholder="Your password"
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              error={passwordError ?? undefined}
            />

            <Button
              label="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={googleLoading}
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          {/* Switch to sign-up */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?  </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-up')}
              activeOpacity={0.75}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>

          <TrustNote variant="inline" />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Space.xl,
    paddingTop: Space.base,
    paddingBottom: Space.xxxxl,
    gap: Space.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: Space.xs + 1 },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize.xxl,
    color: Colors.text,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
  },
  form: { gap: Space.base },
  submitBtn: { marginTop: Space.xs },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
  },
  footerLink: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.accent,
  },
});
