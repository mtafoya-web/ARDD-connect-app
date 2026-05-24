import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  error,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 13,
          fontFamily: Fonts.semiBold,
          color: Colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.inputBg,
          borderRadius: 10,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: error
            ? Colors.error
            : focused
            ? Colors.primary
            : Colors.inputBorder,
          paddingHorizontal: 14,
          minHeight: multiline ? 80 : 48,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 15,
            fontFamily: Fonts.regular,
            color: Colors.textPrimary,
            paddingVertical: multiline ? 12 : 0,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text
          style={{
            fontSize: 12,
            fontFamily: Fonts.regular,
            color: Colors.error,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
