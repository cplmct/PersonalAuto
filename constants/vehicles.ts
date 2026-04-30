export const COLOR_SWATCHES = [
  { hex: '#1B2330', label: 'Black'  },
  { hex: '#6B7280', label: 'Gray'   },
  { hex: '#F9FAFB', label: 'White'  },
  { hex: '#E5E7EB', label: 'Silver' },
  { hex: '#3D6898', label: 'Blue'   },
  { hex: '#2E7D5E', label: 'Green'  },
  { hex: '#C0392B', label: 'Red'    },
  { hex: '#8A5800', label: 'Brown'  },
] as const;

export const DRIVETRAIN_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD'] as const;

export function isLightColor(hex: string): boolean {
  return hex === '#F9FAFB' || hex === '#E5E7EB';
}
