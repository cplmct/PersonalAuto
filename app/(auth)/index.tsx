import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { TrustNote } from '@/components/auth/TrustNote';
import { FormErrorBanner } from '@/components/auth/FormErrorBanner';
import { signInWithGoogle } from '@/lib/supabase';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

const FEATURES = [
  'Track oil, brakes, fluids & more',
  'Multi-vehicle support',
  'Full service history log',
] as const;

export default function WelcomeScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    const { error } = await signInWithGoogle();
    if (error) setGoogleError('Google sign-in is not available right now. Use email instead.');
    setGoogleLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >

        {/* ── Brand ── */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Car size={32} color={Colors.accent} strokeWidth={1.6} />
          </View>
          <Text style={styles.appName}>AutoTrack</Text>
          <Text style={styles.tagline}>
            Know exactly when your car{'\n'}needs its next service.
          </Text>
        </View>

        {/* ── Feature list ── */}
        <View style={styles.features}>
          {FEATURES.map((label, i) => (
            <View key={i} style={styles.featureRow}>
              <CheckCircle size={16} color={Colors.good} strokeWidth={2} />
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Trust card ── */}
        <TrustNote variant="card" />

        {/* ── CTAs ── */}
        <View style={styles.actions}>
          {googleError && <FormErrorBanner message={googleError} />}

          <GoogleButton
            onPress={handleGoogle}
            loading={googleLoading}
          />

          <AuthDivider />

          <Button
            label="Create Account"
            onPress={() => router.push('/(auth)/sign-up')}
            variant="primary"
            size="lg"
          />
          <Button
            label="Sign In with Email"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="ghost"
            size="lg"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Space.xl,
    paddingTop: Platform.OS === 'ios' ? Space.xxl : Space.xl,
    paddingBottom: Space.xxxl,
    gap: Space.xxl,
    justifyContent: 'center',
  },

  // ── Brand
  brand: {
    alignItems: 'center',
    gap: Space.md,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  appName: {
    fontFamily: Font.bold,
    fontSize: FontSize.xxxl,
    color: Colors.text,
    letterSpacing: -1.5,
  },
  tagline: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },

  // ── Features
  features: {
    gap: Space.md - 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  featureText: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
  },

  // ── Actions
  actions: {
    gap: Space.md,
  },
});
