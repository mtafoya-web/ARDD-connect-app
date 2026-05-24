import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const bgColor = isPrimary
    ? Colors.primary
    : isSecondary
    ? Colors.primaryLight
    : 'transparent';

  const textColor = isPrimary
    ? Colors.white
    : isSecondary
    ? Colors.primary
    : isOutline
    ? Colors.textPrimary
    : Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bgColor,
        borderRadius: 12,
        borderCurve: 'continuous',
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        borderWidth: isOutline ? 1 : 0,
        borderColor: Colors.border,
        width: fullWidth ? '100%' : undefined,
      })}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text
            style={{
              color: textColor,
              fontSize: 15,
              fontFamily: Fonts.semiBold,
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
