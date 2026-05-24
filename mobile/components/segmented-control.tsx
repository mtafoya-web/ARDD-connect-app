import { View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface SegmentedControlProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  icons?: React.ReactNode[];
}

export function SegmentedControl({ tabs, activeIndex, onTabPress, icons }: SegmentedControlProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.inputBg,
        borderRadius: 10,
        borderCurve: 'continuous',
        padding: 3,
        gap: 2,
        alignSelf: 'flex-start',
      }}
    >
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabPress(i)}
            style={{
              backgroundColor: active ? Colors.primary : 'transparent',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderCurve: 'continuous',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {icons?.[i]}
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 13,
                color: active ? Colors.white : Colors.textSecondary,
              }}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
