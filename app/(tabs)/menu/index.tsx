import { useState } from 'react';
import {
  Keyboard,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Overview from './components/Overview';

type Tab = 'OVERVIEW' | 'GROUP' | 'PAIRING' | 'ADD_ONS' | 'UPSELL';

const TABS = {
  OVERVIEW: 'Overview',
  GROUP: 'Group',
  PAIRING: 'Pairing',
  ADD_ONS: 'Add-Ons',
  UPSELL: 'Upsell',
} as Record<string, string>;

export default function MenuScreen() {
  const [tab, setTab] = useState<Tab>('OVERVIEW');

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-1">
          <Text className="font-OnestSemiBold text-2xl text-default-primary">
            Menu
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 140,
              paddingHorizontal: 16,
              gap: 20,
            }}
            enableOnAndroid
            extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
            keyboardShouldPersistTaps="handled">
            {/* <View className="mt-5 flex-row items-center justify-between rounded-lg border border-[#22262F]">
              {Object.keys(TABS).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTab(key as Tab)}
                  className={cn(
                    'h-9 w-1/5 items-center justify-center',
                    tab === key &&
                      'rounded-lg border border-[#373A41] bg-[#13161B]',
                  )}>
                  <Text
                    className={cn(
                      'font-OnestSemiBold text-default-tertiary',
                      tab === 'OVERVIEW' && 'text-default-secondary',
                    )}>
                    {TABS[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View> */}
            {tab === 'OVERVIEW' && <Overview />}
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}
