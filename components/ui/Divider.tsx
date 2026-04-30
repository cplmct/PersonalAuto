import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

interface DividerProps {
  style?: ViewStyle;
  spacing?: number;
  color?: string;
}

export function Divider({ style, spacing = 0, color }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        { marginVertical: spacing, backgroundColor: color ?? Colors.borderSubtle },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
