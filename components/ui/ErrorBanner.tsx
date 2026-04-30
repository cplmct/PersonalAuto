import { View, Text, StyleSheet } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface ErrorBannerProps {
  message: string;
  style?: object;
}

export function ErrorBanner({ message, style }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <View style={[styles.banner, style]}>
      <CircleAlert size={14} color={Colors.danger} strokeWidth={2} style={{ flexShrink: 0 }} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.sm,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Space.base,
    paddingVertical: Space.sm + 2,
  },
  text: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.dangerText,
    lineHeight: FontSize.sm * 1.5,
  },
});
