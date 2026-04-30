import {
  View, Text, StyleSheet, Modal, ScrollView,
  TextInput as RNTextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import {
  Gauge, CalendarDays, DollarSign, Wrench,
  Building2, FileText, CheckCircle2,
} from 'lucide-react-native';
import { Divider } from '@/components/ui/Divider';
import { Button } from '@/components/ui/Button';
import { SheetHandle, SheetHeader } from '@/components/ui/SheetHeader';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import type { ServiceType, Vehicle, OdometerUnit } from '@/types/database';
import { vehicleDisplayName } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogServicePayload {
  vehicle_id: string;
  service_type_id: string;
  performed_at: string;
  odometer_at_service: number;
  notes: string;
  cost: number | null;
  shop_name: string;
}

interface LogServiceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: LogServicePayload) => Promise<boolean>;
  vehicle: Vehicle | null;
  serviceType: ServiceType | null;
  /** Pre-filled odometer in the user's display unit */
  currentOdometer: number;
  /** User's preferred display unit (from profile.distance_unit) */
  unit: OdometerUnit;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Loose date validation: YYYY-MM-DD
function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

// ─── Form field row ───────────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        {icon}
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: Space.xs + 1 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  required: { color: Colors.danger },
});

// ─── Text input ───────────────────────────────────────────────────────────────

function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  style,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  hasError,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: RNTextInput['props']['keyboardType'];
  multiline?: boolean;
  style?: object;
  autoFocus?: boolean;
  returnKeyType?: RNTextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  hasError?: boolean;
}) {
  return (
    <RNTextInput
      style={[
        inputStyles.base,
        multiline && inputStyles.multiline,
        hasError && inputStyles.error,
        style,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textDisabled}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      autoFocus={autoFocus}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      selectionColor={Colors.accent}
    />
  );
}

const inputStyles = StyleSheet.create({
  base: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.base,
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  multiline: {
    height: 88,
    paddingTop: Space.md,
  },
  error: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerBg,
  },
});

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessView({
  serviceTypeName,
  vehicleName,
  onDone,
}: {
  serviceTypeName: string;
  vehicleName: string;
  onDone: () => void;
}) {
  return (
    <View style={successStyles.wrap}>
      <View style={successStyles.iconRing}>
        <CheckCircle2 size={40} color={Colors.good} strokeWidth={1.5} />
      </View>
      <Text style={successStyles.title}>Service Logged</Text>
      <Text style={successStyles.body}>
        <Text style={successStyles.highlight}>{serviceTypeName}</Text>
        {' '}recorded for{' '}
        <Text style={successStyles.highlight}>{vehicleName}</Text>.
        {'\n'}Your maintenance status has been updated.
      </Text>
      <TouchableOpacity style={successStyles.btn} onPress={onDone} activeOpacity={0.8}>
        <Text style={successStyles.btnLabel}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const successStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: Space.xxl,
    paddingTop: Space.xxl,
    paddingBottom: Space.xxxl,
    gap: Space.base,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.goodBg,
    borderWidth: 1.5,
    borderColor: Colors.goodBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.55,
  },
  highlight: {
    fontFamily: Font.semiBold,
    color: Colors.text,
  },
  btn: {
    marginTop: Space.sm,
    paddingHorizontal: Space.xxl,
    paddingVertical: Space.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  btnLabel: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.white,
    letterSpacing: 0.1,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function LogServiceSheet({
  visible,
  onClose,
  onSave,
  vehicle,
  serviceType,
  currentOdometer,
  unit,
}: LogServiceSheetProps) {
  const [odometer, setOdometer]     = useState('');
  const [date, setDate]             = useState('');
  const [cost, setCost]             = useState('');
  const [shop, setShop]             = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Inline validation errors
  const [odoError, setOdoError]   = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Reset form when sheet opens for a new service type
  useEffect(() => {
    if (visible) {
      setOdometer(currentOdometer > 0 ? String(currentOdometer) : '');
      setDate(todayISO());
      setCost('');
      setShop('');
      setNotes('');
      setOdoError(null);
      setDateError(null);
      setSaving(false);
      setShowSuccess(false);
    }
  }, [visible, serviceType?.id]);

  const vehicleName = vehicle ? vehicleDisplayName(vehicle) : '';

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    let ok = true;

    const parsed = parseInt(odometer.replace(/[,\s]/g, ''), 10);
    if (!odometer.trim() || isNaN(parsed) || parsed < 0) {
      setOdoError('Enter a valid odometer reading');
      ok = false;
    } else {
      setOdoError(null);
    }

    if (!date.trim() || !isValidDate(date)) {
      setDateError('Enter a valid date (YYYY-MM-DD)');
      ok = false;
    } else {
      setDateError(null);
    }

    return ok;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!vehicle || !serviceType) return;
    if (!validate()) return;

    const miles = parseInt(odometer.replace(/[,\s]/g, ''), 10);
    const costVal = cost.trim() ? parseFloat(cost.replace(/[,$\s]/g, '')) : null;

    setSaving(true);
    const ok = await onSave({
      vehicle_id:          vehicle.id,
      service_type_id:     serviceType.id,
      performed_at:        date,
      odometer_at_service: miles,
      notes:               notes.trim(),
      cost:                costVal !== null && !isNaN(costVal) ? costVal : null,
      shop_name:           shop.trim(),
    });
    setSaving(false);

    if (ok) setShowSuccess(true);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <View style={styles.scrim}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <SheetHandle />

            {showSuccess ? (
              <SuccessView
                serviceTypeName={serviceType?.name ?? 'Service'}
                vehicleName={vehicleName}
                onDone={onClose}
              />
            ) : (
              <>
                <SheetHeader
                  title={serviceType?.name ?? 'Log Service'}
                  subtitle={vehicle ? vehicleDisplayName(vehicle) : undefined}
                  icon={<Wrench size={17} color={Colors.accent} strokeWidth={1.75} />}
                  onClose={onClose}
                />

                <Divider />

                {/* ── Form ── */}
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >

                  {/* Top row: odometer + date */}
                  <View style={styles.row2}>
                    <View style={styles.flex1}>
                      <FieldRow
                        icon={<Gauge size={13} color={Colors.textMuted} strokeWidth={2} />}
                        label={`Odometer (${unit})`}
                        required
                      >
                        <FormInput
                          value={odometer}
                          onChangeText={t => { setOdometer(t); setOdoError(null); }}
                          placeholder="e.g. 45000"
                          keyboardType="numeric"
                          hasError={!!odoError}
                          autoFocus
                          returnKeyType="next"
                        />
                        {odoError && <Text style={styles.errorText}>{odoError}</Text>}
                      </FieldRow>
                    </View>

                    <View style={styles.flex1}>
                      <FieldRow
                        icon={<CalendarDays size={13} color={Colors.textMuted} strokeWidth={2} />}
                        label="Date"
                        required
                      >
                        <FormInput
                          value={date}
                          onChangeText={t => { setDate(t); setDateError(null); }}
                          placeholder="YYYY-MM-DD"
                          hasError={!!dateError}
                          returnKeyType="next"
                        />
                        {dateError && <Text style={styles.errorText}>{dateError}</Text>}
                      </FieldRow>
                    </View>
                  </View>

                  {/* Second row: cost + shop */}
                  <View style={styles.row2}>
                    <View style={styles.flex1}>
                      <FieldRow
                        icon={<DollarSign size={13} color={Colors.textMuted} strokeWidth={2} />}
                        label="Cost (optional)"
                      >
                        <FormInput
                          value={cost}
                          onChangeText={setCost}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          returnKeyType="next"
                        />
                      </FieldRow>
                    </View>

                    <View style={styles.flex1}>
                      <FieldRow
                        icon={<Building2 size={13} color={Colors.textMuted} strokeWidth={2} />}
                        label="Shop (optional)"
                      >
                        <FormInput
                          value={shop}
                          onChangeText={setShop}
                          placeholder="e.g. Jiffy Lube"
                          returnKeyType="next"
                        />
                      </FieldRow>
                    </View>
                  </View>

                  {/* Notes */}
                  <FieldRow
                    icon={<FileText size={13} color={Colors.textMuted} strokeWidth={2} />}
                    label="Notes (optional)"
                  >
                    <FormInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Oil brand, filter model, observations…"
                      multiline
                    />
                  </FieldRow>

                </ScrollView>

                {/* ── Footer ── */}
                <View style={styles.footer}>
                  {saving ? (
                    <View style={styles.savingRow}>
                      <ActivityIndicator color={Colors.accent} size="small" />
                      <Text style={styles.savingLabel}>Saving…</Text>
                    </View>
                  ) : (
                    <Button
                      label="Save Service Log"
                      onPress={handleSave}
                      size="lg"
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: Colors.scrim,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Space.md,
    maxHeight: '92%',
    ...Shadow.md,
  },
  // ── Form
  formScroll: { maxHeight: 420 },
  formContent: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.base,
    paddingBottom: Space.lg,
    gap: Space.base,
  },
  row2: {
    flexDirection: 'row',
    gap: Space.md,
  },
  flex1: { flex: 1 },
  errorText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 2,
  },

  // ── Footer
  footer: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
    paddingBottom: Space.xxxxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingVertical: Space.base,
  },
  savingLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
});
