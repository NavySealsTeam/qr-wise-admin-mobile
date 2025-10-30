import { router, useLocalSearchParams } from 'expo-router';
import { doc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/context/AuthUserContext';
import { useSnackbar } from '~/context/SnackbarContext';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { db } from '~/lib/firebase';

export default function UpdateInfoScreen() {
  const { updateWithMeta } = useFirestoreWrite();
  const { getStore, updateUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { id, value, label, label2, key, collection } = useLocalSearchParams<{
    id: string;
    value: string;
    label: string;
    label2: string;
    key: string;
    collection: string;
  }>();

  const [input, setInput] = useState<string>(value || '');
  const [loading, setLoading] = useState<boolean>(false);

  const onPressSave = async () => {
    setLoading(true);

    const ref = doc(db, collection, id);
    await updateWithMeta(ref, {
      [key]: input,
    });

    if (collection === 'managers-pin') {
      updateUser({ [key]: input });
    }
    if (collection === 'stores') {
      getStore(id);
    }

    showSnackbar({ message: 'Changes successfully saved!', type: 'success' });
    setLoading(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            enableOnAndroid
            extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
            keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center justify-between px-4 py-1">
              <TouchableOpacity onPress={() => router.back()} className="size-10 items-center justify-center">
                <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <Path
                    d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
                    fill="#22262F"
                  />
                  <Path
                    d="M21.8332 15.9998H10.1665M10.1665 15.9998L15.9998 21.8332M10.1665 15.9998L15.9998 10.1665"
                    stroke="#CECFD2"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Text />
              <View className="size-10" />
            </View>
            <View className="mt-5 gap-4 px-4">
              <Text className="font-OnestSemiBold text-2xl text-default-tertiary">Update {label}</Text>
              <View className="gap-1.5">
                <Text className="font-OnestMedium text-sm text-default-secondary">{label2 || label}</Text>
                {key === 'phone' ? (
                  <View>
                    <Input
                      className="pl-11"
                      defaultValue="9175553474"
                      value={input}
                      onChangeText={setInput}
                      inputMode="numeric"
                      maxLength={10}
                    />
                    <View className="absolute bottom-0 left-3 top-[13px]">
                      <Text className="text-base text-default-tertiary">+63</Text>
                    </View>
                  </View>
                ) : (
                  <Input
                    value={input}
                    onChangeText={setInput}
                    keyboardType={key === 'email' ? 'email-address' : 'default'}
                  />
                )}
              </View>
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
        <Button
          onPress={onPressSave}
          className="mx-4 mb-10 h-14 bg-[#78B300]"
          disabled={input.trim().length === 0 || loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-OnestSemiBold text-white">Save</Text>
          )}
        </Button>
      </SafeAreaView>
    </View>
  );
}
