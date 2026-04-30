import { View, Text, StyleSheet } from 'react-native';
import { BadgeConfig, Font, FontSize, Space, Radius } from '@/constants/theme';
import type { ServiceStatus } from '@/types/database';

interface StatusBadgeProps {
  status: ServiceStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = BadgeConfig[status];
  const isSmall = size === 'sm';
  // Only show status dot for actionable states — omit for 'good' to reduce noise
  const showDot = status !== 'good';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          paddingHorizontal: isSmall ? Space.sm - 1 : Space.sm + 1,
          paddingVertical: isSmall ? 2 : 3,
        },
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      )}
      <Text
        style={[
          styles.label,
          { color: cfg.text, fontSize: isSmall ? FontSize.xs - 1 : FontSize.xs },
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    flexShrink: 0,
  },
  label: {
    fontFamily: Font.semiBold,
    letterSpacing: 0.2,
  },
});
