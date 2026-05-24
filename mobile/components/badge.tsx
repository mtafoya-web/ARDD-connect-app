import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'outline' | 'accent';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'primary', size = 'sm' }: BadgeProps) {
  const isSmall = size === 'sm';
  const styles = {
    primary: {
      bg: Colors.primaryLight,
      text: Colors.primary,
      border: 'transparent',
    },
    outline: {
      bg: Colors.white,
      text: Colors.textSecondary,
      border: Colors.border,
    },
    accent: {
      bg: Colors.primary,
      text: Colors.white,
      border: 'transparent',
    },
  };

  const s = styles[variant];

  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: s.border !== 'transparent' ? 1 : 0,
        borderRadius: 20,
        paddingHorizontal: isSmall ? 10 : 14,
        paddingVertical: isSmall ? 4 : 6,
        borderCurve: 'continuous',
      }}
    >
      <Text
        style={{
          color: s.text,
          fontSize: isSmall ? 11 : 12,
          fontFamily: Fonts.medium,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
