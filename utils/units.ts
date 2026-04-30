import type { OdometerUnit } from '@/types/database';

// ─── Conversion constants ─────────────────────────────────────────────────────
// All odometer values and maintenance intervals are stored in the database as
// kilometers (the canonical unit). Conversion to the user's preferred display
// unit happens only at the boundary between storage and UI.

const KM_PER_MILE = 1.60934;
const MILES_PER_KM = 1 / KM_PER_MILE;

// ─── To canonical (km) ───────────────────────────────────────────────────────
// Call these when WRITING to the database.

/** Convert a display-unit value to canonical km for storage. */
export function toKm(value: number, fromUnit: OdometerUnit): number {
  if (fromUnit === 'km') return Math.round(value);
  return Math.round(value * KM_PER_MILE);
}

// ─── From canonical (km) ─────────────────────────────────────────────────────
// Call these when READING from the database for display.

/** Convert a canonical km value to the user's display unit. */
export function fromKm(valueKm: number, toUnit: OdometerUnit): number {
  if (toUnit === 'km') return Math.round(valueKm);
  return Math.round(valueKm * MILES_PER_KM);
}

/** Format a canonical km value as a localised string with the unit abbreviation.
 *  e.g. fromKmDisplay(8047, 'mi') → "5,000 mi"
 */
export function fromKmDisplay(valueKm: number, toUnit: OdometerUnit): string {
  return `${fromKm(valueKm, toUnit).toLocaleString()} ${toUnit}`;
}

// ─── Interval helpers ─────────────────────────────────────────────────────────

/** Return the effective distance interval in canonical km.
 *  Prefers the km column when present; falls back to miles conversion.
 */
export function effectiveIntervalKm(
  intervalKm: number | null | undefined,
  intervalMiles: number | null | undefined,
): number | null {
  if (intervalKm != null) return intervalKm;
  if (intervalMiles != null) return Math.round(intervalMiles * KM_PER_MILE);
  return null;
}
