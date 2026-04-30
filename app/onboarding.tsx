import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Car, ChevronRight, ChevronLeft, Check,
  Gauge, Settings, Fuel,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { UnitToggle } from '@/components/ui/UnitToggle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceTypes } from '@/hooks/useServiceData';
import { useAuth } from '@/providers/AuthProvider';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import { COLOR_SWATCHES, DRIVETRAIN_OPTIONS, isLightColor } from '@/constants/vehicles';
import type { OdometerUnit } from '@/types/database';

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identity',  label: 'Vehicle',    icon: Car      },
  { id: 'details',   label: 'Details',    icon: Settings },
  { id: 'odometer',  label: 'Odometer',   icon: Gauge    },
] as const;

type StepId = typeof STEPS[number]['id'];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — identity
  nickname: string;
  year: string;
  make: string;
  model: string;
  // Step 2 — details (optional)
  engine: string;
  drivetrain: string;
  color: string;
  // Step 3 — odometer
  odometer: string;
  unit: OdometerUnit;
}

const CURRENT_YEAR = new Date().getFullYear();

function makeInitial(unit: OdometerUnit): FormState {
  return {
    nickname: '',
    year: String(CURRENT_YEAR),
    make: '',
    model: '',
    engine: '',
    drivetrain: '',
    color: '#3D6898',
    odometer: '',
    unit,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldErrors {
  year?: string;
  make?: string;
  model?: string;
  odometer?: string;
}

function validateStep(step: number, form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 0) {
    const y = parseInt(form.year, 10);
    if (!form.year.trim() || isNaN(y) || y < 1886 || y > CURRENT_YEAR + 2) {
      errors.year = `Enter a year between 1886 and ${CURRENT_YEAR + 2}.`;
    }
    if (!form.make.trim()) errors.make = 'Make is required.';
    if (!form.model.trim()) errors.model = 'Model is required.';
  }
  if (step === 2) {
    const odo = parseInt(form.odometer.replace(/[,\s]/g, ''), 10);
    if (!form.odometer.trim() || isNaN(odo) || odo < 0) {
      errors.odometer = 'Enter a valid odometer reading (0 or more).';
    }
  }
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { distanceUnit } = useAuth();
  const { addVehicle, vehicles } = useVehicles();
  const { serviceTypes } = useServiceTypes();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => makeInitial(distanceUnit));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const stepErrors = validateStep(2, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setSaving(true);
    setSaveError(null);
    const odometer = parseInt(form.odometer.replace(/[,\s]/g, ''), 10);
    const year = parseInt(form.year, 10);

    const vehicle = await addVehicle({
      make:             form.make.trim(),
      model:            form.model.trim(),
      year,
      nickname:         form.nickname.trim(),
      current_odometer: odometer,
      odometer_unit:    form.unit,
      color:            form.color,
      engine:           form.engine.trim(),
      drivetrain:       form.drivetrain.trim(),
    });

    setSaving(false);
    if (vehicle) {
      setDone(true);
    } else {
      setSaveError('Something went wrong adding your vehicle. Please try again.');
    }
  };

  // ── Done screen ─────────────────────────────────────────────────────────────

  if (done) {
    const label = form.nickname.trim() || `${form.year} ${form.make} ${form.model}`;
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Check size={36} color={Colors.good} strokeWidth={2} />
          </View>
          <Text style={styles.doneTitle}>All set!</Text>
          <Text style={styles.doneBody}>
            <Text style={styles.doneBold}>{label}</Text>
            {' '}has been added. We've set up your maintenance schedule — you're ready to start tracking.
          </Text>

          {/* Maintenance preview chips */}
          <View style={styles.serviceChips}>
            {serviceTypes.filter(s => s.is_default).map(s => (
              <View key={s.id} style={styles.chip}>
                <Check size={11} color={Colors.good} strokeWidth={2.5} />
                <Text style={styles.chipLabel}>{s.name}</Text>
              </View>
            ))}
          </View>

          <Button
            label="Go to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            size="lg"
            style={styles.doneBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  const isLastStep = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity
              style={styles.headerBack}
              onPress={goBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <ChevronLeft size={20} color={Colors.textSub} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBack} />
          )}

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add Your Vehicle</Text>
            <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length}</Text>
          </View>

          {/* Skip (only step 2 — details — is skippable) */}
          {step === 1 ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => setStep(2)}
              activeOpacity={0.7}
            >
              <Text style={styles.skipLabel}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBack} />
          )}
        </View>

        {/* ── Step indicator ── */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => {
            const active   = i === step;
            const complete = i < step;
            return (
              <View key={s.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    active   && styles.stepDotActive,
                    complete && styles.stepDotComplete,
                  ]}
                >
                  {complete
                    ? <Check size={11} color={Colors.white} strokeWidth={2.5} />
                    : <Text style={[styles.stepNum, (active || complete) && styles.stepNumActive]}>
                        {i + 1}
                      </Text>
                  }
                </View>
                <Text style={[styles.stepLabel, (active || complete) && styles.stepLabelActive]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
          {/* connector lines */}
          <View style={[styles.stepLine, styles.stepLine1, step > 0 && styles.stepLineActive]} />
          <View style={[styles.stepLine, styles.stepLine2, step > 1 && styles.stepLineActive]} />
        </View>

        {/* ── Step content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Step 0: Identity ── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <StepHeader
                icon={<Car size={22} color={Colors.accent} strokeWidth={1.75} />}
                title="Tell us about your vehicle"
                sub="Make and model are required. Everything else is optional."
              />

              <TextInput
                label="Nickname (optional)"
                value={form.nickname}
                onChangeText={v => patch('nickname', v)}
                placeholder="e.g. Daily Driver, Work Truck"
                autoCapitalize="words"
                returnKeyType="next"
              />

              <View style={styles.row2}>
                <View style={styles.yearCol}>
                  <TextInput
                    label="Year *"
                    value={form.year}
                    onChangeText={v => patch('year', v)}
                    placeholder={String(CURRENT_YEAR)}
                    keyboardType="numeric"
                    returnKeyType="next"
                    error={errors.year}
                  />
                </View>
                <View style={styles.flex1}>
                  <TextInput
                    label="Make *"
                    value={form.make}
                    onChangeText={v => patch('make', v)}
                    placeholder="Toyota"
                    autoCapitalize="words"
                    returnKeyType="next"
                    error={errors.make}
                  />
                </View>
              </View>

              <TextInput
                label="Model *"
                value={form.model}
                onChangeText={v => patch('model', v)}
                placeholder="Camry"
                autoCapitalize="words"
                returnKeyType="done"
                error={errors.model}
              />
            </View>
          )}

          {/* ── Step 1: Details (optional) ── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <StepHeader
                icon={<Settings size={22} color={Colors.accent} strokeWidth={1.75} />}
                title="Optional details"
                sub="These help personalise your maintenance schedule. You can fill them in later."
              />

              <TextInput
                label="Engine"
                value={form.engine}
                onChangeText={v => patch('engine', v)}
                placeholder="e.g. 2.5L 4-cylinder, 3.5L V6"
                autoCapitalize="none"
                returnKeyType="next"
              />

              {/* Drivetrain selector */}
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
                      onPress={() => patch('drivetrain', form.drivetrain === opt ? '' : opt)}
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
                        onPress={() => patch('color', hex)}
                        activeOpacity={0.8}
                      >
                        {selected && (
                          <Check
                            size={14}
                            color={isLight ? Colors.text : Colors.white}
                            strokeWidth={2.5}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ── Step 2: Odometer ── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <StepHeader
                icon={<Gauge size={22} color={Colors.accent} strokeWidth={1.75} />}
                title="Current odometer reading"
                sub={`Enter the ${form.unit === 'km' ? 'kilometers' : 'mileage'} shown on your dashboard right now.`}
              />

              {/* Unit toggle */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <UnitToggle value={form.unit} onChange={u => patch('unit', u)} />
              </View>

              <TextInput
                label={`Current odometer (${form.unit}) *`}
                value={form.odometer}
                onChangeText={v => patch('odometer', v.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 45000"
                keyboardType="numeric"
                returnKeyType="done"
                error={errors.odometer}
                hint="Enter 0 if you don't know the exact reading."
              />

              {/* Preview card */}
              {form.odometer !== '' && !errors.odometer && (
                <Card style={styles.previewCard} elevation="xs">
                  <View style={styles.previewRow}>
                    <View style={styles.previewIcon}>
                      <Gauge size={18} color={Colors.accent} strokeWidth={1.75} />
                    </View>
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewName}>
                        {form.nickname.trim() || `${form.year} ${form.make} ${form.model}`}
                      </Text>
                      <Text style={styles.previewOdo}>
                        {parseInt(form.odometer.replace(/[,\s]/g, ''), 10).toLocaleString()} {form.unit}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              {/* What happens next info box */}
              <Card style={styles.infoCard} elevation="none">
                <Text style={styles.infoTitle}>What happens next</Text>
                <View style={styles.infoList}>
                  {[
                    `We'll set up ${serviceTypes.filter(s => s.is_default).length || 5} default maintenance schedules`,
                    'Intervals are based on industry standards',
                    'You can customise any interval later',
                  ].map((line, i) => (
                    <View key={i} style={styles.infoRow}>
                      <View style={styles.infoDot} />
                      <Text style={styles.infoText}>{line}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          )}

        </ScrollView>

        {/* ── Footer CTA ── */}
        <View style={styles.footer}>
          {saveError && isLastStep && (
            <ErrorBanner message={saveError} style={styles.saveError} />
          )}
          {isLastStep ? (
            <Button
              label="Add Vehicle"
              onPress={handleSave}
              loading={saving}
              size="lg"
            />
          ) : (
            <Button
              label="Continue"
              onPress={goNext}
              size="lg"
            />
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function StepHeader({
  icon, title, sub,
}: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <View style={styles.stepHeaderWrap}>
      <View style={styles.stepHeaderIcon}>{icon}</View>
      <Text style={styles.stepHeaderTitle}>{title}</Text>
      <Text style={styles.stepHeaderSub}>{sub}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  kav:  { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  skipBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.accent,
  },

  // ── Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.xxl,
    paddingBottom: Space.base,
    position: 'relative',
    gap: 0,
  },
  stepItem: {
    alignItems: 'center',
    gap: Space.xs,
    width: 70,
    zIndex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  stepDotComplete: {
    backgroundColor: Colors.good,
    borderColor: Colors.good,
  },
  stepNum: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  stepNumActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontFamily: Font.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  stepLabelActive: {
    color: Colors.text,
    fontFamily: Font.medium,
  },
  // connector lines positioned behind the dots
  stepLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: Colors.border,
    top: 13,
    zIndex: 0,
    width: 70,
  },
  stepLine1: { left: '50%', marginLeft: -35 },
  stepLine2: { right: '50%', marginRight: -35 },
  stepLineActive: { backgroundColor: Colors.good },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Space.base,
    paddingBottom: Space.xxl,
  },

  // ── Step content
  stepContent: {
    gap: Space.base,
  },

  // ── Step header
  stepHeaderWrap: {
    gap: Space.xs,
    marginBottom: Space.xs,
  },
  stepHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  stepHeaderTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  stepHeaderSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textSub,
    lineHeight: FontSize.sm * 1.5,
  },

  // ── Layout helpers
  row2: {
    flexDirection: 'row',
    gap: Space.md,
    alignItems: 'flex-start',
  },
  yearCol: { width: 80 },
  flex1:  { flex: 1 },

  // ── Field block (label + control)
  fieldBlock: {
    gap: Space.sm,
  },
  fieldLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },

  // ── Drivetrain option chips
  optionRow: {
    flexDirection: 'row',
    gap: Space.sm - 2,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
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
  optionLabelActive: {
    color: Colors.accentText,
  },

  // ── Color swatches
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
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

  // ── Odometer preview card
  previewCard: {
    marginTop: Space.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: { flex: 1, gap: 2 },
  previewName: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  previewOdo: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.5,
  },

  // ── Info card
  infoCard: {
    backgroundColor: Colors.bgSecondary,
    borderColor: Colors.borderSubtle,
  },
  infoTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSub,
    marginBottom: Space.sm,
  },
  infoList: { gap: Space.xs + 1 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    flexShrink: 0,
  },
  infoText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textSub,
    flex: 1,
  },

  // ── Footer
  footer: {
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: Space.sm,
  },
  saveError: { marginBottom: 0 },

  // ── Done screen
  doneWrap: {
    flex: 1,
    paddingHorizontal: Space.xl,
    paddingTop: Space.xxxxl,
    alignItems: 'center',
    gap: Space.xl,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.goodBg,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  doneTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xxl,
    color: Colors.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  doneBody: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.6,
  },
  doneBold: {
    fontFamily: Font.semiBold,
    color: Colors.text,
  },
  doneBtn: { width: '100%', marginTop: Space.sm },
  serviceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Space.sm - 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Space.md - 1,
    paddingVertical: Space.xs + 1,
    borderRadius: Radius.full,
    backgroundColor: Colors.goodBg,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
  },
  chipLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.goodText,
  },
});
