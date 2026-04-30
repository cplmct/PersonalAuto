import { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  hint?: string;
}

export function PasswordInput({ label, error, hint, style, onFocus, onBlur, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      )}

      <View style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
        hasError && styles.inputWrapError,
      ]}>
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={!visible}
          placeholderTextColor={Colors.textDisabled}
          selectionColor={Colors.accent}
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={e => { setFocused(true); onFocus?.(e); }}
          onBlur={e => { setFocused(false); onBlur?.(e); }}
          {...props}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setVisible(v => !v)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {visible
            ? <EyeOff size={17} color={Colors.textMuted} strokeWidth={1.75} />
            : <Eye size={17} color={Colors.textMuted} strokeWidth={1.75} />
          }
        </TouchableOpacity>
      </View>

      {hasError && <Text style={styles.error}>{error}</Text>}
      {hint && !hasError && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Space.xs,
  },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  labelFocused: {
    color: Colors.accentText,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingLeft: Space.base,
    paddingRight: Space.sm,
  },
  inputWrapFocused: {
    borderColor: Colors.borderFocus,
  },
  inputWrapError: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerBg,
  },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.text,
    height: '100%',
  },
  toggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  hint: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.5,
  },
});
