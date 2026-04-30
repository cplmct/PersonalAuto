import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleDashed, PenLine, SlidersHorizontal } from 'lucide-react-native';
import { ServiceIcon } from '@/components/maintenance/ServiceIcon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Font, FontSize, Space, Radius, BadgeConfig } from '@/constants/theme';
import { fromKm } from '@/utils/units';
import type { MaintenanceCardData, OdometerUnit } from '@/types/database';

interface MaintenanceCardProps {
  data: MaintenanceCardData;
  /** User's preferred display unit — distances are stored in km internally */
  unit: OdometerUnit;
  onLogService?: () => void;
  onEdit?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) { return n.toLocaleString(); }

function fmtDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Progress bar: 0–1 clamped ─────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
    flex: 1,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function MaintenanceCard({ data, unit, onLogService, onEdit }: MaintenanceCardProps) {
  const {
    serviceType,
    lastLog,
    status,
    kmSinceService,
    kmUntilDue,
    intervalKm,
    intervalMonths,
    nextDueKm,
    nextDueDate,
  } = data;

  const cfg       = BadgeConfig[status as keyof typeof BadgeConfig] ?? BadgeConfig.unknown;
  const isOverdue = status === 'overdue';
  const isDueSoon = status === 'due_soon';
  const isUnknown = status === 'unknown';
  const hasHistory = lastLog !== null;
  const isOverDue = typeof kmUntilDue === 'number' && kmUntilDue < 0;

  // Distance progress 0→1 within the interval (canonical km ratio; unit-agnostic)
  const progressPct =
    intervalKm !== null && intervalKm > 0 && kmSinceService !== null
      ? kmSinceService / intervalKm
      : null;

  // Human-readable progress note — convert km to display unit
  let progressNote: string | null = null;
  if (hasHistory && kmUntilDue !== null && intervalKm) {
    const displayAbs = fmtNum(fromKm(Math.abs(kmUntilDue), unit));
    progressNote = isOverDue
      ? `${displayAbs} ${unit} overdue`
      : `${displayAbs} ${unit} left`;
  }

  // "Next due" secondary line — show date if available
  let nextDueDateLabel: string | null = null;
  if (nextDueDate !== null) {
    const now = new Date();
    if (nextDueDate <= now) {
      const msAgo = now.getTime() - nextDueDate.getTime();
      const daysAgo = Math.floor(msAgo / (1000 * 60 * 60 * 24));
      if (daysAgo < 30) nextDueDateLabel = `${daysAgo}d overdue`;
      else {
        const moAgo = Math.floor(daysAgo / 30);
        nextDueDateLabel = `${moAgo} mo overdue`;
      }
    } else {
      nextDueDateLabel = fmtDateShort(nextDueDate);
    }
  }

  return (
    <View style={[
      styles.card,
      isOverdue && styles.cardOverdue,
      isDueSoon && styles.cardDueSoon,
    ]}>
      {/* Left accent strip — color-coded by status */}
      <View style={[styles.accent, { backgroundColor: cfg.dot }]} />

      <View style={styles.inner}>

        {/* ── Row 1: icon · name · interval · badge ── */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <ServiceIcon iconName={serviceType.icon_name} color={cfg.dot} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.name}>{serviceType.name}</Text>
            {(intervalKm || intervalMonths) && (
              <Text style={styles.intervalLabel}>
                {intervalKm ? `Every ${fmtNum(fromKm(intervalKm, unit))} ${unit}` : ''}
                {intervalKm && intervalMonths ? ' · ' : ''}
                {intervalMonths ? `${intervalMonths} mo` : ''}
              </Text>
            )}
          </View>

          <View style={styles.topRowRight}>
            <StatusBadge status={status} />
            {onEdit && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={onEdit}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                activeOpacity={0.7}
              >
                <SlidersHorizontal size={13} color={Colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Row 2: progress bar (mileage axis only, when history exists) ── */}
        {hasHistory && progressPct !== null && (
          <View style={styles.progressRow}>
            <ProgressBar pct={progressPct} color={cfg.dot} />
            {progressNote !== null && (
              <Text style={[
                styles.progressNote,
                isOverdue ? styles.progressNoteDanger : isDueSoon ? styles.progressNoteWarn : styles.progressNoteGood,
              ]}>
                {progressNote}
              </Text>
            )}
          </View>
        )}

        {/* ── Row 3: stats grid ── */}
        <View style={styles.statsGrid}>

          {/* Left cell: last service */}
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Last service</Text>
            {hasHistory ? (
              <>
                <Text style={styles.statValue}>
                  {fmtDate(lastLog!.performed_at)}
                </Text>
                <Text style={styles.statSub}>
                  {fmtNum(fromKm(lastLog!.odometer_km_at_service ?? lastLog!.odometer_at_service, unit))} {unit}
                </Text>
              </>
            ) : (
              <View style={styles.noDataRow}>
                <CircleDashed size={11} color={Colors.textDisabled} strokeWidth={1.5} />
                <Text style={styles.noDataText}>None recorded</Text>
              </View>
            )}
          </View>

          <View style={styles.statDivider} />

          {/* Right cell: next due */}
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Next due</Text>
            {nextDueKm !== null ? (
              <>
                <Text style={[
                  styles.statValue,
                  isOverdue && styles.statValueDanger,
                  isDueSoon && styles.statValueWarn,
                ]}>
                  {fmtNum(fromKm(nextDueKm, unit))} {unit}
                </Text>
                {nextDueDateLabel !== null && (
                  <Text style={[
                    styles.statSub,
                    isOverdue && styles.statSubDanger,
                    isDueSoon && styles.statSubWarn,
                  ]}>
                    {nextDueDateLabel}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.noDataRow}>
                <CircleDashed size={11} color={Colors.textDisabled} strokeWidth={1.5} />
                <Text style={styles.noDataText}>Log service first</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Row 4: Log Service action ── */}
        {onLogService && (
          <TouchableOpacity
            style={[styles.action, isUnknown && styles.actionProminent]}
            onPress={onLogService}
            activeOpacity={0.72}
          >
            <PenLine
              size={13}
              color={isUnknown ? Colors.white : Colors.accent}
              strokeWidth={2}
            />
            <Text style={[styles.actionLabel, isUnknown && styles.actionLabelProminent]}>
              {hasHistory ? 'Log Service' : 'Record First Service'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardOverdue: { borderColor: Colors.dangerBorder },
  cardDueSoon: { borderColor: Colors.warnBorder },

  accent: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },

  inner: {
    flex: 1,
    padding: Space.base,
    gap: Space.md,
  },

  // ── Row 1
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.md - 1,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexShrink: 0,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  titleBlock: { flex: 1, gap: 3 },
  name: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
    lineHeight: FontSize.base * 1.2,
  },
  intervalLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // ── Row 2: progress bar
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  progressNote: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    flexShrink: 0,
    minWidth: 84,
    textAlign: 'right',
  },
  progressNoteDanger: { color: Colors.danger },
  progressNoteWarn:   { color: Colors.warn },
  progressNoteGood:   { color: Colors.textMuted },

  // ── Row 3: stats grid
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    paddingVertical: Space.md - 1,
    paddingHorizontal: Space.base,
  },
  statCell: { flex: 1, gap: 2 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Space.base,
    alignSelf: 'stretch',
  },
  statLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  statValue: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: FontSize.sm * 1.3,
  },
  statValueDanger: { color: Colors.danger },
  statValueWarn:   { color: Colors.warn },
  statSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  statSubDanger: { color: Colors.dangerText },
  statSubWarn:   { color: Colors.warnText },

  noDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  noDataText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    fontStyle: 'italic',
  },

  // ── Row 4: action
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs + 1,
    paddingVertical: Space.sm + 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
  },
  actionProminent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionLabel: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    color: Colors.accentText,
    letterSpacing: 0.1,
  },
  actionLabelProminent: { color: Colors.white },
});
