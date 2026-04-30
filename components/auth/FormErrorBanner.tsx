import { View, Text, StyleSheet } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface FormErrorBannerProps {
  message: string;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  return (
    <View style={styles.banner}>
      <CircleAlert size={15} color={Colors.danger} strokeWidth={2} />
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
    padding: Space.md,
  },
  text: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.dangerText,
    lineHeight: FontSize.sm * 1.5,
  },
});
