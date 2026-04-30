import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Space } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: 'none' | 'xs' | 'sm' | 'md';
}

export function Card({ children, style, padding = Space.base, elevation = 'sm' }: CardProps) {
  return (
    <View style={[styles.card, Shadow[elevation], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
});
