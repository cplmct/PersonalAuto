import { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.textDisabled}
        selectionColor={Colors.accent}
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
      {hint && !hasError && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  input: {
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.base,
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerBg,
  },
  errorText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  hintText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.5,
  },
});
