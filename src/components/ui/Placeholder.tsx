import { User } from 'lucide-react';

interface PlaceholderProps {
  width?: number | string;
  height?: number | string;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export default function Placeholder({ width = '100%', height = '100%', icon, label, className = '' }: PlaceholderProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #e8f3ee, #c8ddd4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1B5E4B',
        gap: 6,
        overflow: 'hidden',
      }}
    >
      {icon || <User size={32} />}
      {label && <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>}
    </div>
  );
}
