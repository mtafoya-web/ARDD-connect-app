import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: ErrorStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
      }}
    >
      <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
      <Text
        selectable
        style={{
          fontSize: 15,
          fontFamily: Fonts.medium,
          color: Colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            backgroundColor: Colors.primaryLight,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: Fonts.semiBold,
              color: Colors.primary,
            }}
          >
            Try again
          </Text>
        </Pressable>
      )}
    </View>
  );
}
