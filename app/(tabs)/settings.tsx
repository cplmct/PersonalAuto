import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Shield, LogOut, ChevronRight, Info,
  Moon, HelpCircle, FileText, Trash2, Database, Ruler,
} from 'lucide-react-native';
import { Divider } from '@/components/ui/Divider';
import { UnitToggle } from '@/components/ui/UnitToggle';
import { useAuth } from '@/providers/AuthProvider';
import { Colors, Font, FontSize, Space, Radius, Shadow } from '@/constants/theme';
import type { OdometerUnit } from '@/types/database';
import { useState } from 'react';

// ─── Settings Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, profile, distanceUnit, signOut, updateDistanceUnit } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [unitSaving, setUnitSaving] = useState(false);

  const handleUnitChange = async (unit: OdometerUnit) => {
    if (unit === distanceUnit || unitSaving) return;
    setUnitSaving(true);
    await updateDistanceUnit(unit);
    setUnitSaving(false);
  };

  const email = user?.email ?? '';
  const displayName =
    profile?.display_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    email.split('@')[0] ||
    '';

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : email.slice(0, 2).toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'You can sign back in at any time. Your data will be waiting.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This would permanently remove your account and all vehicle history. This action cannot be undone.\n\nAccount deletion is not yet available in this version.',
      [{ text: 'OK', style: 'cancel' }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
            {memberSince && (
              <Text style={styles.profileSince}>Member since {memberSince}</Text>
            )}
          </View>
        </View>

        {/* ── Account section ── */}
        <SectionLabel label="Account" />
        <SettingsGroup>
          <SettingsRow
            icon={<User size={15} color={Colors.accent} strokeWidth={1.75} />}
            iconBg={Colors.accentLight}
            iconBorder={Colors.accentMid}
            label="Email Address"
            value={email}
          />
          <Divider />
          <SettingsRow
            icon={<Database size={15} color={Colors.accent} strokeWidth={1.75} />}
            iconBg={Colors.accentLight}
            iconBorder={Colors.accentMid}
            label="Sync Status"
            value="Active"
          />
        </SettingsGroup>

        {/* ── Data statement ── */}
        <View style={styles.dataNote}>
          <Shield size={13} color={Colors.good} strokeWidth={2} style={{ marginTop: 1 }} />
          <Text style={styles.dataNoteText}>
            Your vehicle records and service history are stored securely to your account, keeping your data safe and accessible across all your devices.
          </Text>
        </View>

        {/* ── Appearance section ── */}
        <SectionLabel label="Appearance" />
        <SettingsGroup>
          <SettingsRow
            icon={<Moon size={15} color={Colors.textMuted} strokeWidth={1.75} />}
            iconBg={Colors.bgSecondary}
            iconBorder={Colors.border}
            label="Theme"
            value="Light"
            badge="Coming Soon"
          />
          <Divider />
          <DistanceUnitRow
            unit={distanceUnit}
            saving={unitSaving}
            onChange={handleUnitChange}
          />
        </SettingsGroup>

        {/* ── Help & Privacy section ── */}
        <SectionLabel label="Help &amp; Privacy" />
        <SettingsGroup>
          <SettingsRow
            icon={<Shield size={15} color={Colors.good} strokeWidth={1.75} />}
            iconBg={Colors.goodBg}
            iconBorder={Colors.goodBorder}
            label="Privacy Policy"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<HelpCircle size={15} color={Colors.textMuted} strokeWidth={1.75} />}
            iconBg={Colors.bgSecondary}
            iconBorder={Colors.border}
            label="Help &amp; Support"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<FileText size={15} color={Colors.textMuted} strokeWidth={1.75} />}
            iconBg={Colors.bgSecondary}
            iconBorder={Colors.border}
            label="Terms of Service"
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon={<Info size={15} color={Colors.textMuted} strokeWidth={1.75} />}
            iconBg={Colors.bgSecondary}
            iconBorder={Colors.border}
            label="About"
            value="Version 1.0.0"
          />
        </SettingsGroup>

        {/* ── Session section ── */}
        <SectionLabel label="Session" />
        <SettingsGroup>
          <SettingsRow
            icon={
              signingOut
                ? <ActivityIndicator size="small" color={Colors.danger} />
                : <LogOut size={15} color={Colors.danger} strokeWidth={1.75} />
            }
            iconBg={Colors.dangerBg}
            iconBorder={Colors.dangerBorder}
            label={signingOut ? 'Signing out…' : 'Sign Out'}
            labelColor={Colors.danger}
            onPress={signingOut ? undefined : handleSignOut}
          />
        </SettingsGroup>

        {/* ── Danger zone ── */}
        <SectionLabel label="Danger Zone" />
        <SettingsGroup>
          <SettingsRow
            icon={<Trash2 size={15} color={Colors.danger} strokeWidth={1.75} />}
            iconBg={Colors.dangerBg}
            iconBorder={Colors.dangerBorder}
            label="Delete Account"
            labelColor={Colors.danger}
            sublabel="Permanently remove your account and all data"
            onPress={handleDeleteAccount}
          />
        </SettingsGroup>

        {/* ── Footer note ── */}
        <Text style={styles.footer}>
          We never sell or share your data with third parties.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Distance unit row ────────────────────────────────────────────────────────

interface DistanceUnitRowProps {
  unit: OdometerUnit;
  saving: boolean;
  onChange: (unit: OdometerUnit) => void;
}

function DistanceUnitRow({ unit, saving, onChange }: DistanceUnitRowProps) {
  return (
    <View style={unitRowStyles.row}>
      <View style={[unitRowStyles.iconWrap, { backgroundColor: Colors.accentLight, borderColor: Colors.accentMid }]}>
        <Ruler size={15} color={Colors.accent} strokeWidth={1.75} />
      </View>

      <View style={unitRowStyles.content}>
        <Text style={unitRowStyles.label}>Distance Unit</Text>
        <Text style={unitRowStyles.sub}>
          {unit === 'km' ? 'Kilometers' : 'Miles'} — used across the whole app
        </Text>
      </View>

      <View style={unitRowStyles.right}>
        {saving && <ActivityIndicator size="small" color={Colors.accent} />}
        <UnitToggle value={unit} onChange={onChange} disabled={saving} />
      </View>
    </View>
  );
}

const unitRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.base,
    paddingVertical: Space.md,
    minHeight: 54,
    gap: Space.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 2 },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexShrink: 0,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={sectionStyles.label}>{label}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: Space.xs,
    marginTop: Space.xs,
    marginBottom: -Space.xs + 2,
  },
});

// ─── Settings group ───────────────────────────────────────────────────────────

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={groupStyles.card}>{children}</View>;
}

const groupStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    ...Shadow.xs,
  },
});

// ─── Settings row ─────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  label: string;
  labelColor?: string;
  sublabel?: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
}

function SettingsRow({
  icon, iconBg, iconBorder,
  label, labelColor, sublabel, value, badge, onPress,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg, borderColor: iconBorder }]}>
        {icon}
      </View>

      <View style={rowStyles.content}>
        <Text
          style={[rowStyles.label, labelColor ? { color: labelColor } : undefined]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={rowStyles.sublabel} numberOfLines={1}>{sublabel}</Text>
        )}
      </View>

      <View style={rowStyles.right}>
        {value && !badge && (
          <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
        )}
        {badge && (
          <View style={rowStyles.badge}>
            <Text style={rowStyles.badgeText}>{badge}</Text>
          </View>
        )}
        {onPress && (
          <ChevronRight
            size={14}
            color={labelColor ?? Colors.textDisabled}
            strokeWidth={2}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.base,
    paddingVertical: Space.md,
    minHeight: 54,
    gap: Space.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 2 },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  sublabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: FontSize.xs * 1.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexShrink: 0,
  },
  value: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    maxWidth: 160,
  },
  badge: {
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: Space.base,
    paddingTop: Space.md,
    paddingBottom: Space.base,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: Colors.text,
    letterSpacing: -0.4,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Space.base,
    paddingBottom: 100,
    gap: Space.base,
  },

  // ── Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Space.base,
    ...Shadow.xs,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accentMid,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
    color: Colors.accentText,
    letterSpacing: 0.5,
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  profileEmail: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    color: Colors.textSub,
  },
  profileSince: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // ── Data note
  dataNote: {
    flexDirection: 'row',
    gap: Space.sm,
    backgroundColor: Colors.goodBg,
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.goodBorder,
  },
  dataNoteText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.goodText,
    lineHeight: FontSize.xs * 1.65,
  },

  // ── Footer
  footer: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingBottom: Space.sm,
  },
});
