import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Car, Plus } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import type { Vehicle } from '@/types/database';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddVehicle: () => void;
}

export function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
  onAddVehicle,
}: VehicleSelectorProps) {
  if (vehicles.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyTrigger}
        onPress={onAddVehicle}
        activeOpacity={0.75}
      >
        <View style={styles.emptyIcon}>
          <Plus size={13} color={Colors.accent} strokeWidth={2.5} />
        </View>
        <Text style={styles.emptyLabel}>Add your first vehicle</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {vehicles.map(vehicle => {
        const active = vehicle.id === selectedId;
        const label = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        return (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(vehicle.id)}
            activeOpacity={0.75}
          >
            {/* Color dot */}
            <View
              style={[
                styles.colorDot,
                { backgroundColor: vehicle.color || Colors.accent },
                active && styles.colorDotActive,
              ]}
            />
            <Text
              style={[styles.chipLabel, active && styles.chipLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {vehicle.is_primary && (
              <View style={[styles.primaryDot, active && styles.primaryDotActive]} />
            )}
          </TouchableOpacity>
        );
      })}

      {/* Add vehicle button */}
      <TouchableOpacity
        style={styles.addChip}
        onPress={onAddVehicle}
        activeOpacity={0.75}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Plus size={14} color={Colors.textMuted} strokeWidth={2.5} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    paddingHorizontal: Space.base,
    paddingBottom: Space.base,
    gap: Space.sm - 2,
    alignItems: 'center',
    flexDirection: 'row',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs + 1,
    paddingHorizontal: Space.md - 1,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.xs,
    maxWidth: 200,
  },
  chipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },

  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  colorDotActive: {
    // slightly larger when active for emphasis
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  chipLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
    maxWidth: 140,
    flexShrink: 1,
  },
  chipLabelActive: {
    color: Colors.accentText,
  },

  // Tiny accent dot marking the primary vehicle
  primaryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    opacity: 0.5,
    flexShrink: 0,
  },
  primaryDotActive: {
    opacity: 1,
  },

  addChip: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xs,
    flexShrink: 0,
  },

  emptyTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginHorizontal: Space.base,
    marginBottom: Space.base,
    paddingHorizontal: Space.base,
    paddingVertical: Space.md - 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.accentText,
  },
});
