import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';

// SVG-free Google "G" rendered with styled text — avoids an SVG dep.
// Replace with an actual SVG asset if design requires pixel-perfect branding.
function GoogleMark() {
  return (
    <View style={styles.mark}>
      <Text style={styles.markG}>G</Text>
    </View>
  );
}

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
  label = 'Continue with Google',
}: GoogleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.78}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textSub} />
      ) : (
        <>
          <GoogleMark />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md - 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    ...Shadow.xs,
  },
  disabled: {
    opacity: 0.48,
  },
  mark: {
    width: 20,
    height: 20,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Approximates the Google "G" color in the right weight
  markG: {
    fontFamily: Font.bold,
    fontSize: FontSize.base,
    color: '#4285F4',
    lineHeight: FontSize.base * 1.2,
  },
  label: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
    letterSpacing: 0.1,
  },
});
