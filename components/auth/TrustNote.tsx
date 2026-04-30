import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface TrustNoteProps {
  variant?: 'inline' | 'card';
}

export function TrustNote({ variant = 'inline' }: TrustNoteProps) {
  if (variant === 'card') {
    return (
      <View style={styles.card}>
        <View style={styles.cardIconWrap}>
          <Lock size={14} color={Colors.good} strokeWidth={2} />
        </View>
        <Text style={styles.cardText}>
          <Text style={styles.cardBold}>Your records stay with you.  </Text>
          Vehicle history is saved to your account so you can restore it on any device. We never sell or share your data.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <Lock size={12} color={Colors.textMuted} strokeWidth={2} />
      <Text style={styles.inlineText}>
        Vehicle records are saved to your account for cross-device restore. Your data is never sold.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Inline variant — sits at the bottom of auth screens
  inline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.sm - 1,
    paddingHorizontal: Space.xs,
  },
  inlineText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.65,
  },

  // Card variant — welcome screen feature strip
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.md,
    backgroundColor: Colors.goodBg,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
    borderRadius: Radius.md,
    padding: Space.md,
  },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.goodText,
    lineHeight: FontSize.xs * 1.65,
  },
  cardBold: {
    fontFamily: Font.semiBold,
  },
});
