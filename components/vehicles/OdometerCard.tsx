import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gauge, Pencil, Car } from 'lucide-react-native';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import { fromKm } from '@/utils/units';
import type { Vehicle, OdometerUnit } from '@/types/database';
import { vehicleDisplayName, vehicleYearMakeModel } from '@/types/database';

interface OdometerCardProps {
  vehicle: Vehicle;
  /** User's preferred display unit (from profile.distance_unit) */
  unit: OdometerUnit;
  onUpdateOdometer?: () => void;
}

export function OdometerCard({ vehicle, unit, onUpdateOdometer }: OdometerCardProps) {
  const displayName = vehicleDisplayName(vehicle);
  const sub = vehicle.nickname ? vehicleYearMakeModel(vehicle) : null;

  // Derive a tint from the vehicle's color (or fall back to accent)
  const accentColor = vehicle.color || Colors.accent;
  const isLightColor = accentColor === '#F9FAFB' || accentColor === '#E5E7EB';
  const iconFg = isLightColor ? Colors.textSub : accentColor;

  return (
    <View style={styles.card}>
      {/* Top: vehicle identity row */}
      <View style={styles.identityRow}>
        {/* Color-tinted vehicle icon */}
        <View style={[
          styles.vehicleIcon,
          {
            backgroundColor: accentColor + '18',
            borderColor: accentColor + '35',
          },
        ]}>
          <Car size={18} color={iconFg} strokeWidth={1.6} />
        </View>

        <View style={styles.identityText}>
          <Text style={styles.vehicleName} numberOfLines={1}>{displayName}</Text>
          {sub && <Text style={styles.vehicleSub} numberOfLines={1}>{sub}</Text>}
        </View>

        {/* Update odometer button */}
        {onUpdateOdometer && (
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={onUpdateOdometer}
            activeOpacity={0.72}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Pencil size={13} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.updateLabel}>Update</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom: odometer reading */}
      <View style={styles.odoRow}>
        <View style={styles.odoIconWrap}>
          <Gauge size={16} color={Colors.accent} strokeWidth={1.75} />
        </View>
        <View style={styles.odoInfo}>
          <Text style={styles.odoLabel}>Current odometer</Text>
          <View style={styles.odoValueRow}>
            {/* Convert canonical km to display unit */}
            <Text style={styles.odoValue}>{fromKm(vehicle.odometer_km, unit).toLocaleString()}</Text>
            <Text style={styles.odoUnit}> {unit}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Space.base,
    paddingTop: Space.base,
    paddingBottom: Space.md,
    gap: Space.base,
    ...Shadow.sm,
  },

  // ── Identity row
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  vehicleName: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
    lineHeight: FontSize.base * 1.25,
  },
  vehicleSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Space.md - 1,
    paddingVertical: Space.xs + 1,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    flexShrink: 0,
  },
  updateLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.accentText,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSubtle,
  },

  // ── Odometer reading
  odoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  odoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  odoInfo: {
    flex: 1,
    gap: 1,
  },
  odoLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  odoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  odoValue: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.8,
    lineHeight: FontSize.xl * 1.1,
  },
  odoUnit: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginLeft: 3,
  },
});
