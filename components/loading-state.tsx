import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
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
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text
        style={{
          fontSize: 14,
          fontFamily: Fonts.regular,
          color: Colors.textSecondary,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
