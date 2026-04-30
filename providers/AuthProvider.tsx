import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, OdometerUnit } from '@/types/database';

// Re-export Profile so callers import from one place
export type { Profile };

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Current Supabase session — null when signed out */
  session: Session | null;
  /** Convenience shorthand for session.user */
  user: User | null;
  /** Public profile row from profiles table */
  profile: Profile | null;
  /**
   * The user's preferred distance display unit, derived from profile.distance_unit.
   * Defaults to 'mi' before profile loads. Use this everywhere distances are shown.
   */
  distanceUnit: OdometerUnit;
  /** True while the initial session check is in flight */
  loading: boolean;
  signOut: () => Promise<void>;
  /** Force-refresh the profile from the database (e.g. after editing settings) */
  refreshProfile: () => Promise<void>;
  /** Persist a new distance_unit preference to the profile row */
  updateDistanceUnit: (unit: OdometerUnit) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  distanceUnit: 'km',
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateDistanceUnit: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref used to cancel stale profile fetches if the session changes rapidly
  const fetchAbortRef = useRef<AbortController | null>(null);

  // ── Fetch profile for a given user id ──────────────────────────────────────
  async function fetchProfile(userId: string): Promise<void> {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, distance_unit, preferred_vehicle_id, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (controller.signal.aborted) return;

    if (!error && data) {
      setProfile(data as Profile);
    } else {
      // Profile row missing — create a minimal one so the app doesn't break.
      const { data: upserted } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: '',
          avatar_url: '',
          distance_unit: 'km',
          preferred_vehicle_id: null,
          updated_at: new Date().toISOString(),
        })
        .select('id, display_name, avatar_url, distance_unit, preferred_vehicle_id, created_at, updated_at')
        .maybeSingle();

      if (!controller.signal.aborted && upserted) {
        setProfile(upserted as Profile);
      }
    }
  }

  // ── Bootstrap: restore persisted session on mount ─────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // IMPORTANT: onAuthStateChange callback must NOT be async.
    // Calling supabase methods inside an async callback can deadlock the
    // GoTrue client. Use an immediately-invoked async IIFE instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        (async () => {
          await fetchProfile(newSession.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      fetchAbortRef.current?.abort();
    };
  }, []);

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function signOut(): Promise<void> {
    setProfile(null);
    await supabase.auth.signOut();
  }

  // ── Exposed refresh for profile editing ───────────────────────────────────
  async function refreshProfile(): Promise<void> {
    if (session?.user) await fetchProfile(session.user.id);
  }

  // ── Update distance unit preference ───────────────────────────────────────
  async function updateDistanceUnit(unit: OdometerUnit): Promise<void> {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ distance_unit: unit, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select('id, display_name, avatar_url, distance_unit, preferred_vehicle_id, created_at, updated_at')
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }

  // Derived: distanceUnit falls back to 'km' until profile is loaded
  const distanceUnit: OdometerUnit = profile?.distance_unit ?? 'km';

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        distanceUnit,
        loading,
        signOut,
        refreshProfile,
        updateDistanceUnit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
