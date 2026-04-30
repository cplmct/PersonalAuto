import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius } from '@/constants/theme';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

export function SheetHandle() {
  return <View style={handleStyles.handle} />;
}

export function SheetHeader({ title, subtitle, icon, onClose }: SheetHeaderProps) {
  return (
    <View style={styles.header}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        activeOpacity={0.7}
      >
        <X size={17} color={Colors.textSub} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const handleStyles = StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Space.md,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.xl,
    paddingBottom: Space.base,
    gap: Space.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
