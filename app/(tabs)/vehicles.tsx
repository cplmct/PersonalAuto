import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus, Car, Trash2, Pencil, Star,
  Gauge, Check,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Divider } from '@/components/ui/Divider';
import { SheetHandle, SheetHeader } from '@/components/ui/SheetHeader';
import { UnitToggle } from '@/components/ui/UnitToggle';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/providers/AuthProvider';
import { fromKm } from '@/utils/units';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import { COLOR_SWATCHES, DRIVETRAIN_OPTIONS, isLightColor } from '@/constants/vehicles';
import type { Vehicle, OdometerUnit } from '@/types/database';
import { vehicleDisplayName, vehicleYearMakeModel } from '@/types/database';

// ─── Edit form state ──────────────────────────────────────────────────────────

interface EditForm {
  nickname: string;
  year: string;
  make: string;
  model: string;
  engine: string;
  drivetrain: string;
  color: string;
  odometer: string;
  unit: OdometerUnit;
}

const CURRENT_YEAR = new Date().getFullYear();

function vehicleToForm(v: Vehicle, displayUnit: OdometerUnit): EditForm {
  return {
    nickname:  v.nickname ?? '',
    year:      String(v.year),
    make:      v.make,
    model:     v.model,
    engine:    v.engine ?? '',
    drivetrain: v.drivetrain ?? '',
    color:     v.color || COLOR_SWATCHES[0].hex,
    odometer:  String(fromKm(v.odometer_km, displayUnit)),
    unit:      displayUnit,
  };
}

function validateEditForm(f: EditForm): string | null {
  if (!f.make.trim()) return 'Make is required.';
  if (!f.model.trim()) return 'Model is required.';
  const y = parseInt(f.year, 10);
  if (isNaN(y) || y < 1886 || y > CURRENT_YEAR + 2)
    return `Year must be between 1886 and ${CURRENT_YEAR + 2}.`;
  const odo = parseInt(f.odometer.replace(/[,\s]/g, ''), 10);
  if (isNaN(odo) || odo < 0) return 'Odometer must be 0 or more.';
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VehiclesScreen() {
  const { distanceUnit } = useAuth();
  const { vehicles, loading, updateVehicle, deleteVehicle, setPrimary } = useVehicles();

  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patchForm = <K extends keyof EditForm>(key: K, val: EditForm[K]) => {
    setForm(p => p ? { ...p, [key]: val } : p);
    setFormError(null);
  };

  const openEdit = (v: Vehicle) => {
    setEditTarget(v);
    setForm(vehicleToForm(v, distanceUnit));
    setFormError(null);
  };

  const closeEdit = () => {
    setEditTarget(null);
    setForm(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!editTarget || !form) return;
    const err = validateEditForm(form);
    if (err) { setFormError(err); return; }

    setSaving(true);
    await updateVehicle(editTarget.id, {
      make:             form.make.trim(),
      model:            form.model.trim(),
      year:             parseInt(form.year, 10),
      nickname:         form.nickname.trim(),
      engine:           form.engine.trim(),
      drivetrain:       form.drivetrain.trim(),
      color:            form.color,
      current_odometer: parseInt(form.odometer.replace(/[,\s]/g, ''), 10),
      odometer_unit:    form.unit,
    });
    setSaving(false);
    closeEdit();
  };

  const handleDelete = (v: Vehicle) => {
    Alert.alert(
      'Remove Vehicle',
      `Remove ${v.nickname || `${v.year} ${v.make} ${v.model}`}?\n\nAll service history for this vehicle will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteVehicle(v.id) },
      ],
    );
  };

  const handleSetPrimary = async (v: Vehicle) => {
    if (v.is_primary) return;
    await setPrimary(v.id);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Vehicles</Text>
          <Text style={styles.headerSub}>
            {vehicles.length === 0
              ? 'No vehicles yet'
              : `${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''} on your account`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/onboarding')}
          activeOpacity={0.8}
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <Plus size={17} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.length === 0 && !loading ? (
          <EmptyState onAdd={() => router.push('/onboarding')} />
        ) : (
          <View style={styles.list}>
            {vehicles.map((v, idx) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                displayUnit={distanceUnit}
                onEdit={() => openEdit(v)}
                onDelete={() => handleDelete(v)}
                onSetPrimary={() => handleSetPrimary(v)}
                showDivider={idx < vehicles.length - 1}
              />
            ))}
          </View>
        )}

        {/* Hint when multiple vehicles exist */}
        {vehicles.length > 1 && (
          <Text style={styles.hint}>
            Tap a vehicle to view its details. Use the star to set your primary vehicle.
          </Text>
        )}
      </ScrollView>

      {/* ── Edit bottom sheet ── */}
      <Modal
        visible={editTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View style={styles.scrim}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetWrap}
          >
            <View style={styles.sheet}>
              <SheetHandle />
              <SheetHeader
                title="Edit Vehicle"
                subtitle={editTarget ? vehicleDisplayName(editTarget) : undefined}
                onClose={closeEdit}
              />
              <Divider />

              {/* Form fields */}
              {form && (
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Identity row */}
                  <View style={styles.fieldRow}>
                    <View style={styles.yearCol}>
                      <TextInput
                        label="Year"
                        value={form.year}
                        onChangeText={v => patchForm('year', v)}
                        keyboardType="numeric"
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <TextInput
                        label="Make"
                        value={form.make}
                        onChangeText={v => patchForm('make', v)}
                        placeholder="Toyota"
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <TextInput
                    label="Model"
                    value={form.model}
                    onChangeText={v => patchForm('model', v)}
                    placeholder="Camry"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />

                  <TextInput
                    label="Nickname (optional)"
                    value={form.nickname}
                    onChangeText={v => patchForm('nickname', v)}
                    placeholder="e.g. Daily Driver"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />

                  <TextInput
                    label="Engine (optional)"
                    value={form.engine}
                    onChangeText={v => patchForm('engine', v)}
                    placeholder="e.g. 2.5L 4-cylinder"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />

                  {/* Drivetrain chips */}
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Drivetrain</Text>
                    <View style={styles.optionRow}>
                      {DRIVETRAIN_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.optionChip,
                            form.drivetrain === opt && styles.optionChipActive,
                          ]}
                          onPress={() => patchForm('drivetrain', form.drivetrain === opt ? '' : opt)}
                          activeOpacity={0.75}
                        >
                          <Text style={[
                            styles.optionLabel,
                            form.drivetrain === opt && styles.optionLabelActive,
                          ]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Odometer + unit */}
                  <View style={styles.fieldRow}>
                    <View style={styles.flex1}>
                      <TextInput
                        label={`Odometer (${form.unit})`}
                        value={form.odometer}
                        onChangeText={v => patchForm('odometer', v.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>
                    <View style={styles.unitToggleWrap}>
                      <UnitToggle
                        value={form.unit}
                        onChange={u => patchForm('unit', u)}
                      />
                    </View>
                  </View>

                  {/* Color swatches */}
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Color</Text>
                    <View style={styles.swatchGrid}>
                      {COLOR_SWATCHES.map(({ hex, label }) => {
                        const selected = form.color === hex;
                        const isLight = isLightColor(hex);
                        return (
                          <TouchableOpacity
                            key={hex}
                            style={[
                              styles.swatch,
                              { backgroundColor: hex },
                              isLight && styles.swatchLight,
                              selected && styles.swatchSelected,
                            ]}
                            onPress={() => patchForm('color', hex)}
                            activeOpacity={0.8}
                          >
                            {selected && (
                              <Check
                                size={13}
                                color={isLight ? Colors.text : Colors.white}
                                strokeWidth={2.5}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {formError && (
                    <View style={styles.errBox}>
                      <Text style={styles.errText}>{formError}</Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* Sheet footer */}
              <View style={styles.sheetFooter}>
                <Button
                  label="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                  size="lg"
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── VehicleCard ──────────────────────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: Vehicle;
  displayUnit: OdometerUnit;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  showDivider: boolean;
}

function VehicleCard({ vehicle, displayUnit, onEdit, onDelete, onSetPrimary, showDivider }: VehicleCardProps) {
  const name  = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const sub   = vehicle.nickname ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null;
  const color = vehicle.color || Colors.accent;
  const isLight = isLightColor(color);
  const iconBg = color + '18';
  const iconBorder = color + '35';

  return (
    <View>
      <View style={styles.cardRow}>

        {/* Color icon */}
        <View style={[styles.vehicleIcon, { backgroundColor: iconBg, borderColor: iconBorder }]}>
          <Car size={20} color={color === '#F9FAFB' || color === '#E5E7EB' ? Colors.textSub : color} strokeWidth={1.6} />
        </View>

        {/* Info */}
        <View style={styles.vehicleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.vehicleName} numberOfLines={1}>{name}</Text>
            {vehicle.is_primary && <PrimaryBadge />}
          </View>
          {sub && <Text style={styles.vehicleSub} numberOfLines={1}>{sub}</Text>}
          <View style={styles.metaRow}>
            <Gauge size={11} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.vehicleOdo}>
              {fromKm(vehicle.odometer_km, displayUnit).toLocaleString()} {displayUnit}
            </Text>
            {vehicle.engine ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.vehicleEngine} numberOfLines={1}>{vehicle.engine}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Star / primary toggle */}
          <TouchableOpacity
            style={[styles.actionBtn, vehicle.is_primary && styles.actionBtnPrimary]}
            onPress={onSetPrimary}
            activeOpacity={0.7}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Star
              size={14}
              color={vehicle.is_primary ? Colors.accent : Colors.textMuted}
              strokeWidth={vehicle.is_primary ? 0 : 1.75}
              fill={vehicle.is_primary ? Colors.accent : 'none'}
            />
          </TouchableOpacity>

          {/* Edit */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onEdit}
            activeOpacity={0.7}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Pencil size={14} color={Colors.textSub} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={onDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Trash2 size={14} color={Colors.danger} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      {showDivider && (
        <Divider style={styles.rowDivider} />
      )}
    </View>
  );
}

// ─── PrimaryBadge ─────────────────────────────────────────────────────────────

function PrimaryBadge() {
  return (
    <View style={styles.primaryBadge}>
      <Star size={9} color={Colors.accent} strokeWidth={0} fill={Colors.accent} />
      <Text style={styles.primaryLabel}>Primary</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Car size={32} color={Colors.accent} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>No vehicles yet</Text>
      <Text style={styles.emptyBody}>
        Add your first vehicle to begin tracking maintenance schedules.
      </Text>
      <Button
        label="Add Vehicle"
        onPress={onAdd}
        variant="primary"
        size="md"
        fullWidth={false}
        style={styles.emptyBtn}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.base,
  },
  headerText: { gap: 2, flex: 1 },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
    flexShrink: 0,
  },

  // ── List
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Space.base,
    paddingTop: Space.xs,
    paddingBottom: Space.xxxxl,
    gap: Space.base,
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    ...Shadow.sm,
  },

  // ── Vehicle card row
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.base,
    paddingVertical: Space.md,
    gap: Space.md,
    minHeight: 68,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vehicleInfo: { flex: 1, gap: 3, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm - 2,
    flexWrap: 'nowrap',
  },
  vehicleName: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
    flexShrink: 1,
  },
  vehicleSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
  },
  vehicleOdo: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.textSub,
  },
  metaDot: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  vehicleEngine: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 1,
  },

  // ── Action buttons
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs + 1,
    flexShrink: 0,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },
  actionBtnDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },

  // ── Primary badge
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    flexShrink: 0,
  },
  primaryLabel: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    color: Colors.accentText,
    letterSpacing: 0.1,
  },

  rowDivider: {
    marginHorizontal: Space.base,
  },

  // ── Hint
  hint: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Space.xl,
    lineHeight: FontSize.xs * 1.6,
  },

  // ── Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Space.xxxxl,
    gap: Space.base,
    paddingHorizontal: Space.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  emptyTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  emptyBody: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  emptyBtn: { marginTop: Space.sm },

  // ── Edit sheet
  scrim: {
    flex: 1,
    backgroundColor: Colors.scrim,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Space.md,
    maxHeight: '92%',
  },
  formScroll: { maxHeight: 420 },
  formContent: {
    paddingHorizontal: Space.xl,
    paddingVertical: Space.base,
    gap: Space.base,
    paddingBottom: Space.lg,
  },

  sheetFooter: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
    paddingBottom: Space.xxxxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },

  // ── Form
  fieldRow: { flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' },
  yearCol: { width: 80 },
  flex1: { flex: 1 },

  fieldBlock: { gap: Space.sm },
  fieldLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },

  optionRow: { flexDirection: 'row', gap: Space.sm - 2, flexWrap: 'wrap' },
  optionChip: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },
  optionLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  optionLabelActive: { color: Colors.accentText },

  unitToggleWrap: {
    alignSelf: 'flex-end',
    marginBottom: 2,
  },

  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLight: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: Colors.text,
  },

  errBox: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.md,
    padding: Space.md,
  },
  errText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.dangerText,
  },
});
