import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CircleCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { TrustNote } from '@/components/auth/TrustNote';
import { FormErrorBanner } from '@/components/auth/FormErrorBanner';
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

function validateConfirm(pw: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.';
  if (pw !== confirm) return 'Passwords do not match.';
  return null;
}

// Returns 0–4 strength score plus display metadata
function getPasswordStrength(v: string): { score: number; label: string; color: string } {
  if (v.length === 0) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (v.length >= 8)              score++;
  if (v.length >= 12)             score++;
  if (/[A-Z]/.test(v))            score++;
  if (/[0-9!@#$%^&*]/.test(v))   score++;
  const levels = [
    { label: 'Too short', color: Colors.danger },
    { label: 'Weak',      color: Colors.danger },
    { label: 'Fair',      color: Colors.warn   },
    { label: 'Good',      color: Colors.good   },
    { label: 'Strong',    color: Colors.good   },
  ];
  return { score, ...levels[score] };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  // After a successful signUp() Supabase sends a confirmation email.
  // We flip to the success view and let the user follow that link.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError]         = useState<string | null>(null);

  const emailError    = submitted ? validateEmail(email)               : null;
  const passwordError = submitted ? validatePassword(password)         : null;
  const confirmError  = submitted ? validateConfirm(password, confirm) : null;
  const strength      = getPasswordStrength(password);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    setSubmitted(true);
    setAuthError(null);

    if (validateEmail(email) || validatePassword(password) || validateConfirm(password, confirm)) return;

    setLoading(true);
    const { error } = await signUpWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      // "already registered" — send them to sign-in with a helpful message
      if (error.toLowerCase().includes('already exists')) {
        setAuthError(error);
      } else {
        setAuthError(error);
      }
    } else {
      // Supabase email-confirmation flow: user must click the link in their
      // inbox before signInWithPassword works. Show a confirmation screen.
      setAwaitingConfirmation(true);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setAuthError(error);
  };

  const resetForm = () => {
    setAwaitingConfirmation(false);
    setSubmitted(false);
    setEmail('');
    setPassword('');
    setConfirm('');
    setAuthError(null);
  };

  // ── Confirmation screen ──────────────────────────────────────────────────────

  if (awaitingConfirmation) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.confirmWrap}>
          <View style={styles.confirmIcon}>
            <CircleCheck size={38} color={Colors.good} strokeWidth={1.5} />
          </View>
          <Text style={styles.confirmTitle}>Check your inbox</Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.confirmEmail}>{email.trim().toLowerCase()}</Text>
            {'\n\n'}
            Open that link to activate your account, then sign in here.
          </Text>
          <Button
            label="Go to Sign In"
            onPress={() => router.replace('/(auth)/sign-in')}
            variant="primary"
            size="lg"
            style={styles.confirmBtn}
          />
          <TouchableOpacity onPress={resetForm} activeOpacity={0.75}>
            <Text style={styles.confirmAlt}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start tracking your vehicle maintenance</Text>
          </View>

          {/* Google */}
          <GoogleButton
            onPress={handleGoogle}
            loading={googleLoading}
            label="Sign up with Google"
          />

          <AuthDivider label="or sign up with email" />

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

            {/* Password + strength meter */}
            <View style={styles.passwordBlock}>
              <PasswordInput
                label="Password"
                value={password}
                onChangeText={v => { setPassword(v); setAuthError(null); }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                returnKeyType="next"
                error={passwordError ?? undefined}
              />
              {password.length > 0 && !passwordError && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[0, 1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: i < strength.score ? strength.color : Colors.border },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label !== '' && (
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <PasswordInput
              label="Confirm Password"
              value={confirm}
              onChangeText={v => { setConfirm(v); setAuthError(null); }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              error={confirmError ?? undefined}
            />

            <Button
              label="Create Account"
              onPress={handleSignUp}
              loading={loading}
              disabled={googleLoading}
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          <TrustNote variant="inline" />

          {/* Switch to sign-in */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?  </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-in')}
              activeOpacity={0.75}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

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
  passwordBlock: { gap: Space.sm },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    minWidth: 46,
    textAlign: 'right',
  },
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

  // ── Confirmation screen ──
  confirmWrap: {
    flex: 1,
    paddingHorizontal: Space.xl,
    paddingTop: Space.xxxxl,
    alignItems: 'center',
    gap: Space.xl,
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.goodBg,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  confirmTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  confirmBody: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.6,
  },
  confirmEmail: {
    fontFamily: Font.semiBold,
    color: Colors.text,
  },
  confirmBtn: { width: '100%', marginTop: Space.sm },
  confirmAlt: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
