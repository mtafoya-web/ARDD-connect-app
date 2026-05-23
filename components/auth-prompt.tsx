import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Button } from './button';

interface AuthPromptProps {
  message?: string;
}

export function AuthPrompt({
  message = 'Sign in to access this feature',
}: AuthPromptProps) {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 20,
      }}
    >
      <Ionicons name="lock-closed-outline" size={48} color={Colors.textTertiary} />
      <Text
        style={{
          fontSize: 16,
          fontFamily: Fonts.medium,
          color: Colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      <Button title="Sign in" onPress={() => router.push('/login')} />
    </View>
  );
}
