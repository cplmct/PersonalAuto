import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Modal, TextInput as RNTextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Gauge } from 'lucide-react-native';
import { VehicleSelector } from '@/components/vehicles/VehicleSelector';
import { OdometerCard } from '@/components/vehicles/OdometerCard';
import { MaintenanceCard } from '@/components/maintenance/MaintenanceCard';
import { LogServiceSheet, type LogServicePayload } from '@/components/maintenance/LogServiceSheet';
import { MaintenanceDetailSheet, type IntervalPatch, type LastServicePatch } from '@/components/maintenance/MaintenanceDetailSheet';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SheetHandle, SheetHeader } from '@/components/ui/SheetHeader';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceTypes, useServiceLogs, useVehicleIntervals, useMaintenanceCards } from '@/hooks/useServiceData';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Colors, Font, FontSize, Space, Radius, Shadow, BadgeConfig } from '@/constants/theme';
import { fromKm, toKm } from '@/utils/units';
import type { ServiceLog } from '@/types/database';
import { vehicleDisplayName } from '@/types/database';
import { router } from 'expo-router';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user, profile, distanceUnit } = useAuth();
  const { vehicles, loading: vehiclesLoading, refetch: refetchVehicles, updateVehicle } = useVehicles();
  const { serviceTypes, error: typesError } = useServiceTypes();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showOdoModal, setShowOdoModal]           = useState(false);
  const [showLogSheet, setShowLogSheet]           = useState(false);
  const [logServiceTypeId, setLogServiceTypeId]   = useState<string | null>(null);
  const [showDetailSheet, setShowDetailSheet]     = useState(false);
  const [detailServiceTypeId, setDetailServiceTypeId] = useState<string | null>(null);

  // Odometer modal form
  const [newOdometer, setNewOdometer] = useState('');
  const [savingOdo, setSavingOdo]     = useState(false);

  // Redirect to onboarding once, when vehicles finish loading empty
  const onboardingRedirected = useRef(false);
  useEffect(() => {
    if (vehiclesLoading || onboardingRedirected.current) return;
    if (vehicles.length === 0) {
      onboardingRedirected.current = true;
      router.push('/onboarding');
    }
  }, [vehicles, vehiclesLoading]);

  // preferred_vehicle_id takes precedence over the first vehicle if set
  const preferredId = profile?.preferred_vehicle_id ?? null;
  const activeVehicleId =
    selectedVehicleId ??
    (preferredId && vehicles.find(v => v.id === preferredId) ? preferredId : null) ??
    vehicles.find(v => v.is_primary)?.id ??
    vehicles[0]?.id ??
    null;
  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) ?? null;

  // distanceUnit from user profile is the single source of truth for display
  const unit = distanceUnit;

  const { logs, refetch: refetchLogs, addLog, error: logsError } = useServiceLogs(activeVehicleId);
  const { intervals, refetch: refetchIntervals, error: intervalsError, updateInterval } = useVehicleIntervals(activeVehicleId);
  const maintenanceCards = useMaintenanceCards(
    activeVehicleId,
    activeVehicle?.odometer_km ?? 0,  // canonical km for interval math
    serviceTypes,
    logs,
    intervals,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchVehicles(), refetchLogs(), refetchIntervals()]);
    setRefreshing(false);
  }, [refetchVehicles, refetchLogs, refetchIntervals]);

  // ── Odometer modal ─────────────────────────────────────────────────────────
  const openOdoModal = () => {
    // Pre-fill in display unit, converted from canonical km
    const displayVal = activeVehicle
      ? String(fromKm(activeVehicle.odometer_km, unit))
      : '';
    setNewOdometer(displayVal);
    setShowOdoModal(true);
  };
  const saveOdometer = async () => {
    if (!activeVehicleId) return;
    const val = parseInt(newOdometer.replace(/[,\s]/g, ''), 10);
    if (isNaN(val) || val < 0) return;
    setSavingOdo(true);
    // Pass odometer_unit so updateVehicle can derive odometer_km canonically
    await updateVehicle(activeVehicleId, {
      current_odometer: val,
      odometer_unit: unit,
    });
    setSavingOdo(false);
    setShowOdoModal(false);
  };

  // ── Log service sheet ──────────────────────────────────────────────────────
  const openLogSheet = (serviceTypeId: string) => {
    setLogServiceTypeId(serviceTypeId);
    setShowLogSheet(true);
  };

  const handleSaveLog = async (payload: LogServicePayload): Promise<boolean> => {
    // Pass display unit so addLog converts odometer_at_service to canonical km
    const result = await addLog(payload, unit);
    if (result) await refetchLogs();
    return result !== null;
  };

  // ── Detail / edit sheet ────────────────────────────────────────────────────
  const openDetailSheet = (serviceTypeId: string) => {
    setDetailServiceTypeId(serviceTypeId);
    setShowDetailSheet(true);
  };

  const handleSaveInterval = async (serviceTypeId: string, patch: IntervalPatch): Promise<boolean> => {
    return updateInterval(serviceTypeId, patch, unit);
  };

  const handleSaveLastService = async (
    log: ServiceLog,
    patch: LastServicePatch,
  ): Promise<boolean> => {
    const { error: err } = await supabase
      .from('service_logs')
      .update({
        performed_at:           patch.performed_at,
        odometer_at_service:    patch.odometer_at_service,
        odometer_km_at_service: toKm(patch.odometer_at_service, unit),
        notes:                  patch.notes,
      })
      .eq('id', log.id);
    if (!err) await refetchLogs();
    return !err;
  };

  const detailCard = detailServiceTypeId
    ? maintenanceCards.find(c => c.serviceType.id === detailServiceTypeId) ?? null
    : null;

  // ── Derived counts ─────────────────────────────────────────────────────────
  const { overdueCount, dueSoonCount, goodCount, unknownCount } = useMemo(() => ({
    overdueCount: maintenanceCards.filter(c => c.status === 'overdue').length,
    dueSoonCount: maintenanceCards.filter(c => c.status === 'due_soon').length,
    goodCount:    maintenanceCards.filter(c => c.status === 'good').length,
    unknownCount: maintenanceCards.filter(c => c.status === 'unknown').length,
  }), [maintenanceCards]);

  const firstName =
    profile?.display_name?.split(' ')[0] ||
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  const greeting = firstName ? `Hi, ${firstName}` : 'Dashboard';

  const statusLabel =
    overdueCount > 0  ? `${overdueCount} service${overdueCount > 1 ? 's' : ''} overdue`
    : dueSoonCount > 0 ? `${dueSoonCount} service${dueSoonCount > 1 ? 's' : ''} due soon`
    : goodCount > 0   ? 'All services up to date'
    : 'No service history yet';

  const statusColor =
    overdueCount > 0  ? Colors.danger
    : dueSoonCount > 0 ? Colors.warn
    : Colors.textMuted;

  const logSheetServiceType = serviceTypes.find(s => s.id === logServiceTypeId) ?? null;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (vehiclesLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Fixed header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={[styles.statusLine, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.alertBtn,
            overdueCount > 0 && styles.alertBtnDanger,
            dueSoonCount > 0 && overdueCount === 0 && styles.alertBtnWarn,
          ]}
          activeOpacity={0.8}
        >
          <Bell
            size={17}
            color={overdueCount > 0 ? Colors.danger : dueSoonCount > 0 ? Colors.warn : Colors.textMuted}
            strokeWidth={1.75}
          />
          {(overdueCount + dueSoonCount) > 0 && (
            <View style={[
              styles.alertDot,
              overdueCount > 0 ? styles.alertDotDanger : styles.alertDotWarn,
            ]} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Error banner ── */}
      {(logsError || intervalsError || typesError) && (
        <ErrorBanner
          message={logsError ?? intervalsError ?? typesError ?? ''}
          style={styles.errorBannerOuter}
        />
      )}

      {/* ── Vehicle selector strip ── */}
      <VehicleSelector
        vehicles={vehicles}
        selectedId={activeVehicleId}
        onSelect={id => setSelectedVehicleId(id)}
        onAddVehicle={() => router.push('/onboarding')}
      />

      {/* ── Main scroll ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {activeVehicle ? (
          <>
            {/* ── Odometer hero card ── */}
            <OdometerCard vehicle={activeVehicle} unit={unit} onUpdateOdometer={openOdoModal} />

            {/* ── Status summary row ── */}
            {maintenanceCards.length > 0 && (
              <View style={styles.pillRow}>
                <StatusPill count={goodCount}    label="Good"     cfg={BadgeConfig.good}     />
                <StatusPill count={dueSoonCount} label="Due Soon" cfg={BadgeConfig.due_soon}  />
                <StatusPill count={overdueCount} label="Overdue"  cfg={BadgeConfig.overdue}   />
                {unknownCount > 0 && (
                  <StatusPill count={unknownCount} label="No Data" cfg={BadgeConfig.unknown} />
                )}
              </View>
            )}

            {/* ── Section heading ── */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Maintenance</Text>
              <Text style={styles.sectionCount}>{maintenanceCards.length} items tracked</Text>
            </View>

            {/* ── Maintenance cards ── */}
            <View style={styles.cardStack}>
              {maintenanceCards.map(card => (
                <MaintenanceCard
                  key={card.serviceType.id}
                  data={card}
                  unit={unit}
                  onLogService={() => openLogSheet(card.serviceType.id)}
                  onEdit={() => openDetailSheet(card.serviceType.id)}
                />
              ))}
            </View>
          </>
        ) : (
          /* ── Empty state (vehicle selected but no data yet) ── */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No vehicle selected</Text>
              <Text style={styles.emptyBody}>
                Add your first vehicle to start tracking maintenance intervals.
              </Text>
              <Button
                label="Add Vehicle"
                onPress={() => router.push('/onboarding')}
                variant="primary"
                style={styles.emptyBtn}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════════
          UPDATE ODOMETER MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showOdoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOdoModal(false)}
      >
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={() => setShowOdoModal(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.centeredSheet}>
                <SheetHandle />
                <SheetHeader
                  title="Update Odometer"
                  subtitle={activeVehicle ? vehicleDisplayName(activeVehicle) : undefined}
                  icon={<Gauge size={18} color={Colors.accent} strokeWidth={1.75} />}
                  onClose={() => setShowOdoModal(false)}
                />
                <Divider />

                <View style={styles.modalBody}>
                  <Text style={styles.fieldLabel}>Current reading ({unit})</Text>
                  <View style={styles.odoInputRow}>
                    <RNTextInput
                      style={styles.odoInput}
                      value={newOdometer}
                      onChangeText={setNewOdometer}
                      keyboardType="numeric"
                      placeholder="e.g. 45000"
                      placeholderTextColor={Colors.textDisabled}
                      autoFocus
                      selectionColor={Colors.accent}
                    />
                    <Text style={styles.odoInputUnit}>{unit}</Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <Button label="Save" onPress={saveOdometer} loading={savingOdo} size="lg" />
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* ── Log Service Sheet ── */}
      <LogServiceSheet
        visible={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        onSave={handleSaveLog}
        vehicle={activeVehicle}
        serviceType={logSheetServiceType}
        currentOdometer={activeVehicle ? fromKm(activeVehicle.odometer_km, unit) : 0}
        unit={unit}
      />

      {/* ── Maintenance Detail / Edit Sheet ── */}
      <MaintenanceDetailSheet
        visible={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        card={detailCard}
        onSaveInterval={handleSaveInterval}
        onSaveLastService={handleSaveLastService}
        unit={unit}
      />

    </SafeAreaView>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({
  count, label, cfg,
}: {
  count: number;
  label: string;
  cfg: { bg: string; text: string; border: string; dot: string };
}) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[pillStyles.count, { color: cfg.text }]}>{count}</Text>
      <Text style={[pillStyles.label, { color: cfg.text }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space.sm + 3,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 1,
  },
  count: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * 1.1,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    letterSpacing: 0.1,
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Error banner outer spacing
  errorBannerOuter: {
    marginHorizontal: Space.base,
    marginTop: Space.xs,
  },

  // ── Fixed header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
  },
  headerLeft: { gap: 2, flex: 1 },
  greeting: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: FontSize.xl * 1.15,
  },
  statusLine: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  alertBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertBtnDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  alertBtnWarn: {
    backgroundColor: Colors.warnBg,
    borderColor: Colors.warnBorder,
  },
  alertDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },
  alertDotDanger: { backgroundColor: Colors.danger },
  alertDotWarn:   { backgroundColor: Colors.warn },

  // ── Scroll
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: Space.base,
    paddingTop: Space.xs,
    paddingBottom: 100,
    gap: Space.base,
  },

  // ── Status pills
  pillRow: {
    flexDirection: 'row',
    gap: Space.sm - 2,
  },

  // ── Section heading
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -Space.xs,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // ── Card stack
  cardStack: {
    gap: Space.md,
  },

  // ── Empty
  emptyWrap: { marginTop: Space.xxl },
  emptyCard: {
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Space.xxl,
    ...Shadow.sm,
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

  // ── Shared modal primitives
  scrim: {
    flex: 1,
    backgroundColor: Colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
  },

  // ── Centered (odometer) sheet
  centeredSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    ...Shadow.md,
  },
  modalBody: {
    paddingHorizontal: Space.xl,
    paddingVertical: Space.base,
    gap: Space.sm,
  },
  modalFooter: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.sm,
    paddingBottom: Space.xl,
  },

  fieldLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  odoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginTop: Space.xs,
  },
  odoInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: Space.base,
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  odoInputUnit: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingRight: Space.base,
  },

});
