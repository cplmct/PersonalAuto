import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, OdometerUnit } from '@/types/database';

// Re-export Profile so callers import from one place
export type { Profile };

const PROFILE_FIELDS = 'id, display_name, avatar_url, distance_unit, preferred_vehicle_id, created_at, updated_at';

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Derived from profile.distance_unit. Defaults to 'km' before profile loads. */
  distanceUnit: OdometerUnit;
  /** True while the initial session check is in flight */
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  // Cancels in-flight fetches when the session changes (e.g. rapid sign-out).
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  // Relies on the database trigger (handle_new_user) to have already created
  // the row on sign-up. A client-side insert fallback is included only for
  // edge cases where the trigger was skipped (e.g. admin-created users).
  async function fetchProfile(userId: string): Promise<void> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .maybeSingle();

    if (controller.signal.aborted) return;

    if (data) {
      setProfile(data as Profile);
      return;
    }

    if (error) {
      // Transient network/RLS error — do not attempt a write. The profile
      // remains null; the UI can surface a retry through refreshProfile().
      console.warn('[AuthProvider] profile fetch error:', error.message);
      return;
    }

    // Row genuinely absent (trigger was skipped). Insert a minimal row.
    // Only sets id and timestamps; column defaults supply distance_unit='km'.
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select(PROFILE_FIELDS)
      .maybeSingle();

    if (controller.signal.aborted) return;

    if (insertError) {
      console.warn('[AuthProvider] profile insert error:', insertError.message);
      return;
    }

    if (inserted) setProfile(inserted as Profile);
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSession(initial);
      if (initial?.user) {
        fetchProfile(initial.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // IMPORTANT: this callback must NOT be async — awaiting Supabase methods
    // inside onAuthStateChange can deadlock the GoTrue client.
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
      abortRef.current?.abort();
    };
  }, []);

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function signOut(): Promise<void> {
    setProfile(null);
    await supabase.auth.signOut();
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  async function refreshProfile(): Promise<void> {
    if (session?.user) await fetchProfile(session.user.id);
  }

  // ── Update distance unit ───────────────────────────────────────────────────
  async function updateDistanceUnit(unit: OdometerUnit): Promise<void> {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ distance_unit: unit, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select(PROFILE_FIELDS)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }

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
