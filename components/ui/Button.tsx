import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const HEIGHT: Record<Size, number>    = { sm: 36, md: 44, lg: 50 };
const H_PAD:  Record<Size, number>    = { sm: Space.md, md: Space.lg, lg: Space.xl };
const FONT:   Record<Size, number>    = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.base };
const RADIUS: Record<Size, number>    = { sm: Radius.sm, md: Radius.md, lg: Radius.lg };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        {
          height: HEIGHT[size],
          paddingHorizontal: H_PAD[size],
          borderRadius: RADIUS[size],
        },
        variant === 'primary' && styles.primaryShadow,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.accent}
        />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`${variant}Label` as keyof typeof styles],
            { fontSize: FONT[size] },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.42,
  },
  primaryShadow: {
    ...Shadow.sm,
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
  },

  // ── variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
  },
  ghost: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },

  // ── labels
  label: {
    fontFamily: Font.semiBold,
    letterSpacing: 0.1,
  },
  primaryLabel: {
    color: Colors.white,
  },
  secondaryLabel: {
    color: Colors.accentText,
  },
  ghostLabel: {
    color: Colors.textSub,
  },
  dangerLabel: {
    color: Colors.dangerText,
  },
} as any);
