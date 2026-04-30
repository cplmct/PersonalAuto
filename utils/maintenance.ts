import { effectiveIntervalKm } from '@/utils/units';
import type {
  MaintenanceCardData,
  ServiceLog,
  ServiceType,
  VehicleServiceInterval,
} from '@/types/database';

// ─── Configurable threshold ───────────────────────────────────────────────────
// "Due Soon" fires when the vehicle is within this fraction of completing the
// service interval on either axis. 0.15 = last 15% of km OR last 15% of months.
export const DUE_SOON_THRESHOLD = 0.15;

// ─── Status computation ───────────────────────────────────────────────────────
// All distance comparisons use canonical km values.
// The mileage axis and calendar axis are evaluated independently;
// the worst result wins.
//
//   overdue  — current km >= next due km, OR today >= next due date
//   due_soon — within DUE_SOON_THRESHOLD of the interval on either axis
//   good     — both axes comfortably within the interval
//   unknown  — no service history to compute from

export function computeMaintenanceStatus(data: MaintenanceCardData): MaintenanceCardData['status'] {
  const { lastLog, intervalKm, kmSinceService, nextDueDate } = data;

  if (!lastLog) return 'unknown';

  const now = Date.now();
  let distanceStatus:  'good' | 'due_soon' | 'overdue' | null = null;
  let calendarStatus: 'good' | 'due_soon' | 'overdue' | null = null;

  // ── Distance axis (canonical km) ───────────────────────────────────────────
  if (intervalKm !== null && intervalKm > 0 && kmSinceService !== null) {
    const pct = kmSinceService / intervalKm;
    if (pct >= 1)                            distanceStatus = 'overdue';
    else if (pct >= 1 - DUE_SOON_THRESHOLD)  distanceStatus = 'due_soon';
    else                                     distanceStatus = 'good';
  }

  // ── Calendar axis ─────────────────────────────────────────────────────────
  if (nextDueDate !== null) {
    const dueMs   = nextDueDate.getTime();
    const startMs = new Date(lastLog.performed_at).getTime();
    const totalMs = dueMs - startMs;

    if (now >= dueMs) {
      calendarStatus = 'overdue';
    } else if (totalMs > 0) {
      const elapsed = now - startMs;
      const pct = elapsed / totalMs;
      calendarStatus = pct >= 1 - DUE_SOON_THRESHOLD ? 'due_soon' : 'good';
    } else {
      calendarStatus = 'good';
    }
  }

  const statuses = [distanceStatus, calendarStatus].filter(
    (s): s is 'good' | 'due_soon' | 'overdue' => s !== null
  );
  if (statuses.length === 0)             return 'unknown';
  if (statuses.includes('overdue'))      return 'overdue';
  if (statuses.includes('due_soon'))     return 'due_soon';
  return 'good';
}

// ─── Card data builder ────────────────────────────────────────────────────────
// All distance values are in canonical km. The UI layer converts to the
// user's display unit via fromKm() / fromKmDisplay() from utils/units.ts.

export function buildMaintenanceCardData(
  serviceType: ServiceType,
  logs: ServiceLog[],
  /** Current vehicle odometer in canonical km */
  currentOdometerKm: number,
  intervalOverride?: VehicleServiceInterval,
): MaintenanceCardData {
  // Most recent log for this service type
  const typeLogs = logs.filter(l => l.service_type_id === serviceType.id);
  const lastLog = typeLogs.sort(
    (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  )[0] ?? null;

  // Effective km interval: override > service_type default_interval_km > miles conversion
  const intervalKm = intervalOverride
    ? effectiveIntervalKm(intervalOverride.interval_km, intervalOverride.interval_miles)
    : effectiveIntervalKm(serviceType.default_interval_km, serviceType.default_interval_miles);

  const intervalMonths =
    intervalOverride?.interval_months ?? serviceType.default_interval_months ?? null;

  // ── Distance calculations (canonical km) ──────────────────────────────────
  // Use odometer_km_at_service when available; fall back to odometer_at_service
  // (which may be in miles for legacy rows — best effort).
  const logOdometerKm =
    lastLog !== null
      ? (lastLog.odometer_km_at_service ?? lastLog.odometer_at_service)
      : null;

  const kmSinceService = lastLog !== null && logOdometerKm !== null
    ? currentOdometerKm - logOdometerKm
    : null;

  const nextDueKm =
    lastLog !== null && logOdometerKm !== null && intervalKm !== null
      ? logOdometerKm + intervalKm
      : null;

  const kmUntilDue =
    nextDueKm !== null && kmSinceService !== null
      ? intervalKm! - kmSinceService
      : null;

  // ── Calendar ─────────────────────────────────────────────────────────────
  // Real calendar addition (not 30-day approximation) to avoid drift.
  let nextDueDate: Date | null = null;
  if (lastLog !== null && intervalMonths !== null && intervalMonths > 0) {
    const d = new Date(lastLog.performed_at);
    d.setMonth(d.getMonth() + intervalMonths);
    nextDueDate = d;
  }

  // Calendar-aware months since service
  let monthsSinceService: number | null = null;
  if (lastLog !== null) {
    const performed = new Date(lastLog.performed_at);
    const now = new Date();
    monthsSinceService =
      (now.getFullYear() - performed.getFullYear()) * 12 +
      (now.getMonth() - performed.getMonth());
  }

  const partial: MaintenanceCardData = {
    serviceType,
    lastLog,
    status: 'unknown',
    intervalKm,
    intervalMonths,
    kmSinceService,
    kmUntilDue,
    nextDueKm,
    nextDueDate,
    monthsSinceService,
  };

  return { ...partial, status: computeMaintenanceStatus(partial) };
}
