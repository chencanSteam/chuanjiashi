interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
  className?: string;
}

const gradients = [
  ['#1B5E4B', '#4CA88E'],
  ['#2D7A66', '#6B8E7B'],
  ['#C27BA0', '#D8A6C2'],
  ['#D4A373', '#E6C89C'],
  ['#6B7B8E', '#9CA8B8'],
  ['#5E4B1B', '#A88E4C'],
];

export default function Avatar({ name, size = 40, src, className = '' }: AvatarProps) {
  const initial = name ? name.charAt(0) : '?';
  const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % gradients.length;
  const [from, to] = gradients[idx];

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.4,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{ ...baseStyle, objectFit: 'cover' }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ ...baseStyle, background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initial}
    </div>
  );
}
