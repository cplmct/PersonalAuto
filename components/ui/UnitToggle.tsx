import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import type { OdometerUnit } from '@/types/database';

interface UnitToggleProps {
  value: OdometerUnit;
  onChange: (unit: OdometerUnit) => void;
  disabled?: boolean;
}

export function UnitToggle({ value, onChange, disabled }: UnitToggleProps) {
  return (
    <View style={styles.toggle}>
      {(['mi', 'km'] as OdometerUnit[]).map(u => (
        <TouchableOpacity
          key={u}
          style={[styles.btn, value === u && styles.btnActive]}
          onPress={() => onChange(u)}
          activeOpacity={0.75}
          disabled={disabled}
        >
          <Text style={[styles.label, value === u && styles.labelActive]}>{u}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 2,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs + 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  btnActive: {
    backgroundColor: Colors.surface,
    ...Shadow.xs,
  },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  labelActive: { color: Colors.text },
});
