import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
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
import OTPTextInput from 'react-native-otp-textinput';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/context/AuthUserContext';
import { useSnackbar } from '~/context/SnackbarContext';
import { useFirestoreWrite } from '~/hooks/useFirestoreWrite';
import { db } from '~/lib/firebase';
import { generateOTP } from '~/lib/utils';

export default function LoginScreen() {
  const { updateWithMeta } = useFirestoreWrite();
  const { loginUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const otpInput = useRef<OTPTextInput>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const onPressSendOTP = async () => {
    setLoading(true);

    const q = query(collection(db, 'managers-pin'), where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setPhoneNumber('');
      setLoading(false);
      showSnackbar({
        message: 'Invalid phone number! Please try again.',
        type: 'error',
      });
      return;
    }

    try {
      const otp = generateOTP();
      await updateWithMeta(querySnapshot.docs[0].ref, {
        otp,
        otpCreatedAt: Timestamp.now(),
      });

      const apiKey = process.env.EXPO_PUBLIC_SEMAPHORE_API_KEY;
      const sendername = 'PUNCHED';
      const number = `0${phoneNumber}`;
      const message = encodeURIComponent(`Your verification code is ${otp}`);
      const res = await fetch(
        `https://api.semaphore.co/api/v4/messages?apikey=${apiKey}&number=${number}&message=${message}&sendername=${sendername}`,
        { method: 'POST' },
      );
      const json = await res.json();
      console.log('[handleSendMessage] SMS sent:', json);
      setCooldown(30);
      showSnackbar({ message: 'OTP sent successfully', type: 'success' });
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      showSnackbar({ message: 'Failed to send OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = async (otp: string) => {
    if (otp.length === 6) {
      setLoading(true);
      try {
        const res = await fetch('https://admin.qrwise.com/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber, otp }),
        });
        if (!res.ok) throw new Error('Login failed');

        const { token, user } = await res.json();
        const auth = getAuth();
        await signInWithCustomToken(auth, token);
        await loginUser(user);
        router.replace('/dashboard');
      } catch (error) {
        console.error('Verification failed:', error);
        showSnackbar({ message: 'Invalid OTP. Try again.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCellTextChange = async (text: string, i: number) => {
    if (i === 0) {
      const clippedText = await Clipboard.getStringAsync();
      if (clippedText.slice(0, 1) === text) {
        otpInput.current?.setValue(clippedText, true);
      }
    }
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
            {step === 'phone' ? (
              <View className="mt-10 px-4">
                <Text className="font-OnestSemiBold text-[36px] text-white">Enter your{'\n'}phone number</Text>
                <View className="mt-6">
                  <Input
                    autoFocus
                    className="pl-14"
                    defaultValue="9175553474"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    inputMode="numeric"
                    maxLength={10}
                    onSubmitEditing={onPressSendOTP}
                    returnKeyType="done"
                  />
                  <View className="ios:top-[11px] absolute bottom-0 left-3 top-2.5">
                    <Text className="text-[16px] text-default-tertiary">+63</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="mt-10 px-4">
                <Text className="font-OnestSemiBold text-[36px] text-white">Enter the{'\n'}verification code</Text>
                <Text className="mt-2 text-default-secondary">We sent a code to +63 {phoneNumber}</Text>
                <View className="mt-8 flex-1 gap-4 px-4">
                  <OTPTextInput
                    ref={otpInput}
                    autoFocus
                    inputCount={6}
                    textInputStyle={{
                      borderWidth: 1,
                      borderRadius: 6,
                      // @ts-ignore
                      color: '#FFFFFF',
                    }}
                    placeholder="0"
                    placeholderTextColor="#373A41"
                    offTintColor="#373A41"
                    tintColor="#C2F93A"
                    handleTextChange={handleTextChange}
                    handleCellTextChange={handleCellTextChange}
                    disabled={loading}
                  />
                  {loading ? (
                    <Text className="text-center font-OnestSemiBold text-default-secondary">Verifying...</Text>
                  ) : (
                    <TouchableOpacity onPress={onPressSendOTP} disabled={cooldown > 0}>
                      <Text className="text-center font-OnestSemiBold text-default-secondary">
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
        {step === 'phone' && (
          <Button
            disabled={loading}
            onPress={onPressSendOTP}
            variant="outline"
            className="mx-4 mb-10 h-14 bg-[#0C0E12]">
            {loading ? <ActivityIndicator /> : <Text className="font-OnestSemiBold text-default-secondary">Next</Text>}
          </Button>
        )}
      </SafeAreaView>
    </View>
  );
}
