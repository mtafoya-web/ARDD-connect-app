import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    '#8B2252', '#2D5A27', '#1E40AF', '#B45309',
    '#6B21A8', '#0F766E', '#9D174D', '#4338CA',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = 44, backgroundColor }: AvatarProps) {
  const bg = backgroundColor || getColorFromName(name);
  const fontSize = size * 0.38;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: Colors.white,
          fontSize,
          fontFamily: Fonts.semiBold,
          letterSpacing: 0.5,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
