// ─── Surface & Background ────────────────────────────────────────────────────
// Page backgrounds use F7F8FA (off-white warm-cool neutral).
// Cards sit on pure white. Secondary wells use F2F4F7.
// Borders are always single-pixel, never doubled.
export const Colors = {
  // Backgrounds
  bg: '#F7F8FA',
  bgSecondary: '#F2F4F7',

  // Surfaces
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F2F4F7',

  // Borders
  border: '#E4E8EF',
  borderSubtle: '#EDF0F4',
  borderFocus: '#93B0D8',

  // Text — charcoal scale
  text: '#1B2330',          // primary: near-black charcoal
  textSub: '#52637A',       // secondary: medium slate
  textMuted: '#8895A7',     // tertiary: light slate
  textDisabled: '#B8C2CE',  // disabled state
  textInverse: '#FFFFFF',

  // Accent — muted steel-blue
  accent: '#3D6898',
  accentHover: '#355C88',
  accentLight: '#EBF1FA',
  accentMid: '#C3D4EC',
  accentText: '#2D5080',

  // Status — good (green)
  good: '#1F6B4A',
  goodBg: '#EBF7F2',
  goodBorder: '#A8D9C3',
  goodText: '#185840',

  // Status — due soon (amber)
  warn: '#8A5800',
  warnBg: '#FFF8EC',
  warnBorder: '#F5D98A',
  warnText: '#7A4E00',

  // Status — overdue (red)
  danger: '#C0392B',
  dangerBg: '#FEF0EF',
  dangerBorder: '#F2B3AE',
  dangerText: '#A32E22',

  // Neutral (unknown/no data)
  neutral: '#52637A',
  neutralBg: '#F2F4F7',
  neutralBorder: '#D4DAE3',

  // Absolute
  white: '#FFFFFF',
  black: '#000000',

  // Overlays & shadows
  shadowColor: '#1B2330',
  scrim: 'rgba(27, 35, 48, 0.45)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
// Three weights max: Regular (400), SemiBold (600), Bold (700).
// Medium (500) used only for labels and captions.
// Line-height: body = 1.5×, headings = 1.2×, captions = 1.4×.
export const Font = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const FontSize = {
  xs: 11,   // badge label, fine print
  sm: 13,   // caption, helper, sub-label
  base: 15, // body, list item
  md: 17,   // section heading, strong body
  lg: 20,   // screen title
  xl: 24,   // display secondary
  xxl: 30,  // display primary
  xxxl: 38, // hero / splash
} as const;

export const LineHeight = {
  tight: 1.2,  // headings
  body: 1.5,   // body copy
  loose: 1.6,  // captions / small text
} as const;

// ─── Spacing — 8-pt grid ─────────────────────────────────────────────────────
// All margin, padding, and gap values are multiples of 4 or 8.
export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 56,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
} as const;

// ─── Shadows — always subtle, never dramatic ─────────────────────────────────
// iOS uses shadowColor/shadowOffset/shadowOpacity/shadowRadius.
// Android uses elevation. Both are set together.
export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
export const TabBar = {
  background: Colors.surface,
  border: Colors.border,
  active: Colors.accent,
  inactive: Colors.textMuted,
  labelSize: 11,
  labelFont: Font.medium,
} as const;

// ─── Badge configs — used by StatusBadge ─────────────────────────────────────
export const BadgeConfig = {
  good: {
    label: 'Good',
    bg: Colors.goodBg,
    text: Colors.good,
    border: Colors.goodBorder,
    dot: Colors.good,
  },
  due_soon: {
    label: 'Due Soon',
    bg: Colors.warnBg,
    text: Colors.warn,
    border: Colors.warnBorder,
    dot: Colors.warn,
  },
  overdue: {
    label: 'Overdue',
    bg: Colors.dangerBg,
    text: Colors.danger,
    border: Colors.dangerBorder,
    dot: Colors.danger,
  },
  unknown: {
    label: 'No Data',
    bg: Colors.neutralBg,
    text: Colors.neutral,
    border: Colors.neutralBorder,
    dot: Colors.neutral,
  },
} as const;

// ─── Legacy aliases — keeps existing imports working during migration ─────────
// These map old names (Colors.*, Typography.*, Spacing.*, etc.) to new tokens.
export const Typography = {
  regular: Font.regular,
  medium: Font.medium,
  semiBold: Font.semiBold,
  bold: Font.bold,
  xs: FontSize.xs,
  sm: FontSize.sm,
  base: FontSize.base,
  md: FontSize.md,
  lg: FontSize.lg,
  xl: FontSize.xl,
  xxl: FontSize.xxl,
  xxxl: FontSize.xxxl,
  lineHeightBody: LineHeight.body,
  lineHeightHeading: LineHeight.tight,
} as const;

export const Spacing = {
  xs: Space.xs,
  sm: Space.sm,
  md: Space.md,
  base: Space.base,
  lg: Space.lg,
  xl: Space.xl,
  xxl: Space.xxl,
  xxxl: Space.xxxl,
  xxxxl: Space.xxxxl,
} as const;

export const Radii = {
  sm: Radius.sm,
  md: Radius.md,
  lg: Radius.lg,
  xl: Radius.xl,
  full: Radius.full,
} as const;

export const Shadows = {
  card: Shadow.sm,
  subtle: Shadow.xs,
} as const;
