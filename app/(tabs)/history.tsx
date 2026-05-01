import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, History, SlidersHorizontal } from 'lucide-react-native';
import { ServiceIcon } from '@/components/maintenance/ServiceIcon';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceLogs, useServiceTypes } from '@/hooks/useServiceData';
import { useAuth } from '@/providers/AuthProvider';
import { fromKm } from '@/utils/units';
import { VehicleSelector } from '@/components/vehicles/VehicleSelector';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import type { ServiceLog } from '@/types/database';
import { vehicleDisplayName } from '@/types/database';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtNum(n: number) { return n.toLocaleString(); }

// ─── History row ─────────────────────────────────────────────────────────────

function HistoryRow({
  log,
  unit,
  onDelete,
}: {
  log: ServiceLog;
  unit: import('@/types/database').OdometerUnit;
  onDelete: () => void;
}) {
  return (
    <View style={rowStyles.card}>
      {/* Left accent line */}
      <View style={rowStyles.accent} />

      <View style={rowStyles.body}>
        {/* Top row: icon + name + cost */}
        <View style={rowStyles.topRow}>
          <View style={rowStyles.iconWrap}>
            <ServiceIcon iconName={log.service_type?.icon_name} color={Colors.accent} size={15} />
          </View>
          <Text style={rowStyles.name} numberOfLines={1}>
            {log.service_type?.name ?? 'Service'}
          </Text>
          {log.cost !== null && (
            <Text style={rowStyles.cost}>${Number(log.cost).toFixed(2)}</Text>
          )}
          <TouchableOpacity
            style={rowStyles.deleteBtn}
            onPress={onDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Trash2 size={13} color={Colors.danger} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Meta row: odometer · date — convert canonical km to display unit */}
        <View style={rowStyles.metaRow}>
          <Text style={rowStyles.metaChip}>
            {fmtNum(fromKm(log.odometer_km_at_service ?? log.odometer_at_service, unit))} {unit}
          </Text>
          <View style={rowStyles.metaDot} />
          <Text style={rowStyles.metaDate}>{fmtDate(log.performed_at)}</Text>
          {log.shop_name ? (
            <>
              <View style={rowStyles.metaDot} />
              <Text style={rowStyles.metaShop} numberOfLines={1}>{log.shop_name}</Text>
            </>
          ) : null}
        </View>

        {/* Notes */}
        {!!log.notes && (
          <Text style={rowStyles.notes} numberOfLines={2}>{log.notes}</Text>
        )}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    ...Shadow.xs,
  },
  accent: {
    width: 3,
    backgroundColor: Colors.accentMid,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    paddingVertical: Space.md,
    paddingHorizontal: Space.base,
    gap: Space.xs + 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  cost: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text,
    flexShrink: 0,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexWrap: 'wrap',
  },
  metaChip: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.textSub,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textDisabled,
  },
  metaDate: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaShop: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  notes: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: FontSize.xs * 1.6,
  },
});

// ─── Section header (month group) ────────────────────────────────────────────

function MonthHeader({ label }: { label: string }) {
  return (
    <View style={groupStyles.wrap}>
      <Text style={groupStyles.label}>{label}</Text>
      <View style={groupStyles.line} />
    </View>
  );
}

const groupStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  label: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconWrap}>
        <History size={28} color={Colors.accent} strokeWidth={1.5} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.body}>{body}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: Space.xxxxl,
    paddingHorizontal: Space.xxl,
    gap: Space.base,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  title: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: FontSize.base,
    color: Colors.textSub,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.55,
  },
});

// ─── Group logs by month ──────────────────────────────────────────────────────

function groupByMonth(logs: ServiceLog[]): { label: string; entries: ServiceLog[] }[] {
  const map = new Map<string, ServiceLog[]>();
  for (const log of logs) {
    const key = new Date(log.performed_at).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { distanceUnit } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { serviceTypes } = useServiceTypes();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filterTypeId, setFilterTypeId]           = useState<string | null>(null);
  const [refreshing, setRefreshing]               = useState(false);
  const [showTypeFilter, setShowTypeFilter]        = useState(false);

  const activeVehicleId = selectedVehicleId ?? vehicles[0]?.id ?? null;
  const activeVehicle   = vehicles.find(v => v.id === activeVehicleId) ?? null;
  // Use profile distanceUnit as the single source of truth for display
  const unit = distanceUnit;

  const { logs, loading: logsLoading, refetch, deleteLog } = useServiceLogs(activeVehicleId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const confirmDelete = (log: ServiceLog) => {
    Alert.alert(
      'Delete Record',
      `Remove this ${log.service_type?.name ?? 'service'} record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
      ],
    );
  };

  // Filter by service type
  const filtered = filterTypeId
    ? logs.filter(l => l.service_type_id === filterTypeId)
    : logs;

  // Which active service types actually have logs for this vehicle.
  // is_active check ensures deactivated types don't reappear in the filter
  // if historical logs still reference them.
  const presentTypeIds = new Set(logs.map(l => l.service_type_id));
  const filterableTypes = serviceTypes.filter(st => st.is_active && presentTypeIds.has(st.id));

  const groups = groupByMonth(filtered);

  // ─── Counts for summary bar ───────────────────────────────────────────────
  const totalCost = filtered.reduce((acc, l) => acc + (l.cost ?? 0), 0);
  const hasCost   = filtered.some(l => l.cost !== null);

  const isLoading = vehiclesLoading || logsLoading;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>History</Text>
          {activeVehicle && (
            <Text style={styles.vehicleName}>
              {vehicleDisplayName(activeVehicle)}
            </Text>
          )}
        </View>
        {filterableTypes.length > 1 && (
          <TouchableOpacity
            style={[styles.filterToggle, showTypeFilter && styles.filterToggleActive]}
            onPress={() => setShowTypeFilter(v => !v)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal
              size={15}
              color={showTypeFilter ? Colors.accentText : Colors.textMuted}
              strokeWidth={2}
            />
            {filterTypeId && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Vehicle selector ── */}
      <VehicleSelector
        vehicles={vehicles}
        selectedId={activeVehicleId}
        onSelect={id => { setSelectedVehicleId(id); setFilterTypeId(null); }}
        onAddVehicle={() => router.push('/onboarding')}
      />

      {/* ── Service type filter chips (collapsible) ── */}
      {showTypeFilter && filterableTypes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilterRow}
          style={styles.typeFilterScroll}
        >
          <TouchableOpacity
            style={[styles.typeChip, !filterTypeId && styles.typeChipActive]}
            onPress={() => setFilterTypeId(null)}
            activeOpacity={0.75}
          >
            <Text style={[styles.typeChipLabel, !filterTypeId && styles.typeChipLabelActive]}>
              All
            </Text>
          </TouchableOpacity>
          {filterableTypes.map(st => {
            const active = filterTypeId === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setFilterTypeId(active ? null : st.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.typeChipLabel, active && styles.typeChipLabelActive]}>
                  {st.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : !activeVehicle ? (
          <EmptyState
            title="No vehicle selected"
            body="Add a vehicle to start tracking your service history."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filterTypeId ? 'No records for this service' : 'No history yet'}
            body={filterTypeId
              ? 'Try removing the filter to see all records.'
              : 'Log your first service from the Dashboard to see it here.'}
          />
        ) : (
          <>
            {/* ── Summary bar ── */}
            <View style={styles.summaryBar}>
              <SummaryChip value={String(filtered.length)} label={filtered.length === 1 ? 'record' : 'records'} />
              {hasCost && (
                <SummaryChip value={`$${totalCost.toFixed(0)}`} label="total spent" />
              )}
            </View>

            {/* ── Grouped entries ── */}
            {groups.map(group => (
              <View key={group.label} style={styles.group}>
                <MonthHeader label={group.label} />
                <View style={styles.groupRows}>
                  {group.entries.map(log => (
                    <HistoryRow
                      key={log.id}
                      log={log}
                      unit={unit}
                      onDelete={() => confirmDelete(log)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Summary chip ─────────────────────────────────────────────────────────────

function SummaryChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={summaryStyles.chip}>
      <Text style={summaryStyles.value}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs + 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  label: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
  },
  headerLeft: { gap: 2, flex: 1 },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.4,
    lineHeight: FontSize.xl * 1.15,
  },
  vehicleName: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  filterToggle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  filterToggleActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },

  // ── Service type filter
  typeFilterScroll: { flexGrow: 0 },
  typeFilterRow: {
    paddingHorizontal: Space.base,
    paddingBottom: Space.sm,
    gap: Space.xs + 1,
    alignItems: 'center',
  },
  typeChip: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs + 1,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },
  typeChipLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  typeChipLabelActive: { color: Colors.accentText },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Space.base,
    paddingTop: Space.xs,
    paddingBottom: 100,
    gap: Space.base,
  },

  loadingWrap: {
    paddingTop: Space.xxxxl,
    alignItems: 'center',
  },

  // ── Summary bar
  summaryBar: {
    flexDirection: 'row',
    gap: Space.sm,
  },

  // ── Groups
  group: { gap: Space.sm },
  groupRows: { gap: Space.sm },
});
