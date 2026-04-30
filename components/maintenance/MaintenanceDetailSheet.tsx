import {
  View, Text, StyleSheet, Modal, ScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import {
  Gauge, CalendarDays, Milestone, Clock,
  Info, CheckCircle2, SlidersHorizontal,
} from 'lucide-react-native';
import { Divider } from '@/components/ui/Divider';
import { Button } from '@/components/ui/Button';
import { SheetHandle, SheetHeader } from '@/components/ui/SheetHeader';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import { fromKm } from '@/utils/units';
import type { MaintenanceCardData, ServiceLog, OdometerUnit } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntervalPatch {
  /** Display-unit distance value (miles when unit='mi', km when unit='km') */
  intervalDist: number | null;
  interval_months: number | null;
}

export interface LastServicePatch {
  performed_at: string;
  /** Odometer in the user's display unit — caller converts to km */
  odometer_at_service: number;
  notes: string;
}

interface MaintenanceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  card: MaintenanceCardData | null;
  /** Called when interval settings are saved */
  onSaveInterval: (serviceTypeId: string, patch: IntervalPatch) => Promise<boolean>;
  /** Called when the last service entry is edited */
  onSaveLastService: (log: ServiceLog, patch: LastServicePatch) => Promise<boolean>;
  /** User's preferred display unit — all DB values are in km */
  unit: OdometerUnit;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateISO(s: string | Date | null | undefined): string {
  if (!s) return '';
  const d = typeof s === 'string' ? s : s.toISOString().split('T')[0];
  return d.split('T')[0];
}

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

function fmtNum(n: number) { return n.toLocaleString(); }

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  label: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});

// ─── Read-only stat row ───────────────────────────────────────────────────────

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.valueWrap}>
        <Text style={statStyles.value}>{value}</Text>
        {sub && <Text style={statStyles.sub}>{sub}</Text>}
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    gap: Space.base,
  },
  label: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  valueWrap: { alignItems: 'flex-end', gap: 2 },
  value: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: 'right',
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});

// ─── Labelled input ───────────────────────────────────────────────────────────

function LabelledInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  hasError,
  errorText,
  suffix,
  multiline,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: RNTextInput['props']['keyboardType'];
  hasError?: boolean;
  errorText?: string;
  suffix?: string;
  multiline?: boolean;
}) {
  return (
    <View style={inputStyles.wrap}>
      <View style={inputStyles.labelRow}>
        {icon}
        <Text style={inputStyles.label}>{label}</Text>
      </View>
      <View style={inputStyles.inputRow}>
        <RNTextInput
          style={[
            inputStyles.input,
            multiline && inputStyles.multiline,
            hasError && inputStyles.inputError,
            suffix ? { paddingRight: 44 } : undefined,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDisabled}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          selectionColor={Colors.accent}
        />
        {suffix && !multiline && (
          <Text style={inputStyles.suffix}>{suffix}</Text>
        )}
      </View>
      {hasError && errorText && (
        <Text style={inputStyles.errorText}>{errorText}</Text>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrap: { gap: Space.xs },
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
  inputRow: { position: 'relative' },
  input: {
    height: 46,
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
    height: 80,
    paddingTop: Space.md,
  },
  inputError: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerBg,
  },
  suffix: {
    position: 'absolute',
    right: Space.base,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 46,
  },
  errorText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
});

// ─── Success flash ────────────────────────────────────────────────────────────

function SavedBanner() {
  return (
    <View style={bannerStyles.wrap}>
      <CheckCircle2 size={14} color={Colors.good} strokeWidth={2} />
      <Text style={bannerStyles.text}>Changes saved</Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    paddingVertical: Space.sm,
    backgroundColor: Colors.goodBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
  },
  text: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.good,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function MaintenanceDetailSheet({
  visible,
  onClose,
  card,
  onSaveInterval,
  onSaveLastService,
  unit,
}: MaintenanceDetailSheetProps) {
  // Interval fields
  const [intervalDist, setIntervalDist]   = useState('');
  const [intervalMo, setIntervalMo]   = useState('');
  // Last service fields
  const [lastDate, setLastDate]       = useState('');
  const [lastOdo, setLastOdo]         = useState('');
  const [lastNotes, setLastNotes]     = useState('');

  // UI state
  const [savingInterval, setSavingInterval] = useState(false);
  const [savingService,  setSavingService]  = useState(false);
  const [savedInterval,  setSavedInterval]  = useState(false);
  const [savedService,   setSavedService]   = useState(false);

  // Validation
  const [distError, setDistError]   = useState<string | null>(null);
  const [moError, setMoError]   = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [odoError,  setOdoError]  = useState<string | null>(null);

  // Populate from card when sheet opens.
  // intervalKm is stored canonically; convert to the display unit for editing.
  // lastLog.odometer_km_at_service is canonical; convert to display unit for editing.
  useEffect(() => {
    if (!visible || !card) return;
    // Convert canonical km interval to display unit for the input field
    setIntervalDist(
      card.intervalKm !== null
        ? String(fromKm(card.intervalKm, unit))
        : ''
    );
    setIntervalMo(card.intervalMonths !== null ? String(card.intervalMonths) : '');
    setLastDate(card.lastLog ? toDateISO(card.lastLog.performed_at) : '');
    // Convert canonical km odometer to display unit for the input field
    setLastOdo(
      card.lastLog
        ? String(fromKm(
            card.lastLog.odometer_km_at_service ?? card.lastLog.odometer_at_service,
            unit,
          ))
        : ''
    );
    setLastNotes(card.lastLog?.notes ?? '');
    setSavingInterval(false);
    setSavingService(false);
    setSavedInterval(false);
    setSavedService(false);
    setDistError(null);
    setMoError(null);
    setDateError(null);
    setOdoError(null);
  }, [visible, card?.serviceType.id, unit]);

  if (!card) return null;

  const { serviceType, lastLog, nextDueKm, nextDueDate, kmSinceService } = card;
  const hasLastLog = lastLog !== null;

  // ── Save interval ──────────────────────────────────────────────────────────
  async function handleSaveInterval() {
    let ok = true;

    const miles = intervalDist.trim() ? parseInt(intervalDist.replace(/[,\s]/g, ''), 10) : null;
    if (intervalDist.trim() && (isNaN(miles!) || miles! <= 0)) {
      setDistError('Enter a whole number greater than 0'); ok = false;
    } else {
      setDistError(null);
    }

    const months = intervalMo.trim() ? parseInt(intervalMo.replace(/\s/g, ''), 10) : null;
    if (intervalMo.trim() && (isNaN(months!) || months! <= 0)) {
      setMoError('Enter a whole number greater than 0'); ok = false;
    } else {
      setMoError(null);
    }

    if (!ok) return;

    setSavingInterval(true);
    const saved = await onSaveInterval(serviceType.id, {
      intervalDist:    miles,
      interval_months: months,
    });
    setSavingInterval(false);
    if (saved) {
      setSavedInterval(true);
      setTimeout(() => setSavedInterval(false), 2500);
    }
  }

  // ── Save last service ──────────────────────────────────────────────────────
  async function handleSaveLastService() {
    if (!hasLastLog) return;
    let ok = true;

    if (!lastDate.trim() || !isValidDate(lastDate)) {
      setDateError('Enter a valid date (YYYY-MM-DD)'); ok = false;
    } else { setDateError(null); }

    const odo = parseInt(lastOdo.replace(/[,\s]/g, ''), 10);
    if (!lastOdo.trim() || isNaN(odo) || odo < 0) {
      setOdoError('Enter a valid odometer reading'); ok = false;
    } else { setOdoError(null); }

    if (!ok) return;

    setSavingService(true);
    const saved = await onSaveLastService(lastLog!, {
      performed_at:        lastDate,
      odometer_at_service: odo,
      notes:               lastNotes.trim(),
    });
    setSavingService(false);
    if (saved) {
      setSavedService(true);
      setTimeout(() => setSavedService(false), 2500);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <SheetHandle />
            <SheetHeader
              title={serviceType.name}
              subtitle="Interval & service details"
              icon={<SlidersHorizontal size={17} color={Colors.accent} strokeWidth={1.75} />}
              onClose={onClose}
            />
            <Divider />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* ── Status snapshot — values converted from canonical km to display unit ── */}
              <View style={styles.snapshotCard}>
                {nextDueKm !== null && (
                  <StatRow
                    label="Next due"
                    value={`${fmtNum(fromKm(nextDueKm, unit))} ${unit}`}
                    sub={nextDueDate
                      ? nextDueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : undefined}
                  />
                )}
                {kmSinceService !== null && (
                  <StatRow
                    label={`${unit === 'km' ? 'Km' : 'Miles'} since last service`}
                    value={`${fmtNum(fromKm(kmSinceService, unit))} ${unit}`}
                  />
                )}
                {!nextDueKm && !kmSinceService && (
                  <Text style={styles.noDataNote}>No service history recorded yet.</Text>
                )}
              </View>

              {/* ── Interval settings ── */}
              <SectionHeader label="Service Interval" />

              {/* Disclaimer */}
              <View style={styles.infoBox}>
                <Info size={13} color={Colors.textMuted} strokeWidth={2} style={{ marginTop: 1 }} />
                <Text style={styles.infoText}>
                  Defaults are based on general maintenance guidelines and may vary by vehicle, manufacturer recommendation, and driving conditions.
                </Text>
              </View>

              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <LabelledInput
                    label={`Distance (${unit})`}
                    icon={<Milestone size={13} color={Colors.textMuted} strokeWidth={2} />}
                    value={intervalDist}
                    onChangeText={t => { setIntervalDist(t); setDistError(null); }}
                    placeholder="e.g. 5000"
                    keyboardType="numeric"
                    hasError={!!distError}
                    errorText={distError ?? undefined}
                    suffix={unit}
                  />
                </View>
                <View style={styles.flex1}>
                  <LabelledInput
                    label="Time (months)"
                    icon={<Clock size={13} color={Colors.textMuted} strokeWidth={2} />}
                    value={intervalMo}
                    onChangeText={t => { setIntervalMo(t); setMoError(null); }}
                    placeholder="e.g. 12"
                    keyboardType="numeric"
                    hasError={!!moError}
                    errorText={moError ?? undefined}
                    suffix="mo"
                  />
                </View>
              </View>

              {savedInterval && <SavedBanner />}

              <Button
                label={savingInterval ? 'Saving…' : 'Save Interval'}
                onPress={handleSaveInterval}
                loading={savingInterval}
                variant="secondary"
              />

              {/* ── Last service ── */}
              <SectionHeader label="Last Service" />

              {hasLastLog ? (
                <>
                  <View style={styles.row2}>
                    <View style={styles.flex1}>
                      <LabelledInput
                        label="Date"
                        icon={<CalendarDays size={13} color={Colors.textMuted} strokeWidth={2} />}
                        value={lastDate}
                        onChangeText={t => { setLastDate(t); setDateError(null); }}
                        placeholder="YYYY-MM-DD"
                        hasError={!!dateError}
                        errorText={dateError ?? undefined}
                      />
                    </View>
                    <View style={styles.flex1}>
                      <LabelledInput
                        label={`Odometer (${unit})`}
                        icon={<Gauge size={13} color={Colors.textMuted} strokeWidth={2} />}
                        value={lastOdo}
                        onChangeText={t => { setLastOdo(t); setOdoError(null); }}
                        placeholder="e.g. 45000"
                        keyboardType="numeric"
                        hasError={!!odoError}
                        errorText={odoError ?? undefined}
                        suffix={unit}
                      />
                    </View>
                  </View>

                  <LabelledInput
                    label="Notes"
                    value={lastNotes}
                    onChangeText={setLastNotes}
                    placeholder="Oil brand, filter model, observations…"
                    multiline
                  />

                  {savedService && <SavedBanner />}

                  <Button
                    label={savingService ? 'Saving…' : 'Save Last Service'}
                    onPress={handleSaveLastService}
                    loading={savingService}
                    variant="secondary"
                  />
                </>
              ) : (
                <View style={styles.noLastServiceBox}>
                  <Text style={styles.noLastServiceText}>
                    No service history yet. Log the first service from the maintenance card to start tracking.
                  </Text>
                </View>
              )}

            </ScrollView>
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
  // ── Scroll content
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.base,
    paddingBottom: Space.xxxxl,
    gap: Space.base,
  },

  // ── Snapshot card
  snapshotCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.lg,
    paddingHorizontal: Space.base,
    paddingBottom: Space.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  noDataNote: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingVertical: Space.base,
    textAlign: 'center',
  },

  // ── Info box
  infoBox: {
    flexDirection: 'row',
    gap: Space.sm,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  infoText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.6,
  },

  // ── Layout
  row2: { flexDirection: 'row', gap: Space.md },
  flex1: { flex: 1 },

  // ── No last service
  noLastServiceBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Space.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  noLastServiceText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: FontSize.sm * 1.6,
    textAlign: 'center',
  },
});
