import { Droplets, Disc, Wrench, Zap, Wind, RotateCw, Eye, Gauge } from 'lucide-react-native';

interface ServiceIconProps {
  iconName?: string | null;
  color: string;
  size?: number;
}

export function ServiceIcon({ iconName, color, size = 17 }: ServiceIconProps) {
  const props = { size, color, strokeWidth: 1.75 };
  switch (iconName) {
    case 'droplets':  return <Droplets {...props} />;
    case 'disc':      return <Disc {...props} />;
    case 'zap':       return <Zap {...props} />;
    case 'wind':      return <Wind {...props} />;
    case 'rotate-cw': return <RotateCw {...props} />;
    case 'eye':       return <Eye {...props} />;
    case 'gauge':     return <Gauge {...props} />;
    default:          return <Wrench {...props} />;
  }
}
