import { router, useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { XIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Keyboard,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/context/AuthUserContext';
import { getRandomPrompts } from '~/lib/constants';
import { cn } from '~/lib/utils';

export default function AICopyScreen() {
  const { isPremiumUser, setIsPremiumUser } = useAuth();
  const player = useVideoPlayer(require('~/assets/videos/chat.mp4'), (player) => {
    player.muted = true;
    player.loop = true;
    player.play();
  });

  const [appState, setAppState] = useState(AppState.currentState);
  const [selectedPackage, setSelectedPackage] = useState<'weekly' | 'yearly' | 'monthly'>('yearly');
  const [askQuestionModal, setAskQuestionModal] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const questionRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      player.play();

      return () => {
        setAskQuestionModal(false);
        setQuestion('');
        if (player) {
          player.pause();
        }
      };
    }, [appState]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (askQuestionModal) {
      setTimeout(() => {
        questionRef.current?.focus();
      }, 50);
    }
  }, [askQuestionModal]);

  const handleSubmitQuestion = (question: string) => {
    router.push(`/ai-insights-webview?question=${question}`);
  };

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-1">
          <View className="size-10" />
          <Text className="font-OnestSemiBold text-base text-default-primary">Wise AI</Text>
          <View className="size-10" />
        </View>
        <View className="flex-1">
          <VideoView style={{ flex: 1 }} player={player} nativeControls={false} contentFit="cover" />
        </View>
        {isPremiumUser ? (
          <View className="absolute bottom-[100px] left-0 right-0 p-5">
            <View className="rounded-xl bg-[#13161B] px-4 py-[14px]">
              <View className="flex-row items-center justify-between">
                <Text className="font-OnestSemiBold text-sm text-default-primary">Suggested questions</Text>
              </View>
              <View className="mt-2.5 gap-2">
                {getRandomPrompts(4).map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSubmitQuestion(prompt)}
                    className="w-fit flex-row justify-between gap-1 rounded-md bg-[#22262F] p-2.5">
                    <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <Path
                        d="M3.405 9.30769C2.31125 8.93394 2.27813 7.42269 3.30563 6.97957L3.40563 6.94207L4.88063 6.43769C5.2189 6.3221 5.52844 6.13531 5.78839 5.88992C6.04834 5.64453 6.25263 5.34625 6.3875 5.01519L6.43812 4.87957L6.94188 3.40457C7.31563 2.31082 8.82687 2.27769 9.27 3.30457L9.3075 3.40457L9.81188 4.87957C9.92739 5.21795 10.1141 5.52762 10.3595 5.78768C10.6049 6.04774 10.9033 6.25213 11.2344 6.38707L11.3694 6.43769L12.845 6.94144C13.9388 7.31519 13.9719 8.82644 12.945 9.26894L12.845 9.30769L11.37 9.81144C11.0316 9.92696 10.7219 10.1137 10.4619 10.3591C10.2018 10.6045 9.99743 10.9028 9.8625 11.2339L9.81188 11.3689L9.30812 12.8439C8.93437 13.9383 7.42312 13.9714 6.98062 12.9439L6.94188 12.8439L6.43812 11.3689C6.32254 11.0307 6.13575 10.7211 5.89036 10.4612C5.64497 10.2012 5.34668 9.99694 5.01562 9.86207L4.88063 9.81144L3.405 9.30769ZM1.25 3.12457C1.25 3.00764 1.2828 2.89306 1.34467 2.79385C1.40654 2.69463 1.495 2.61476 1.6 2.56332L1.67313 2.53332L2.31438 2.31457L2.53313 1.67269C2.57293 1.55552 2.64663 1.4528 2.74488 1.37755C2.84313 1.3023 2.96151 1.25792 3.08501 1.25002C3.20851 1.24212 3.33158 1.27106 3.43862 1.33318C3.54565 1.3953 3.63184 1.48779 3.68625 1.59894L3.71625 1.67269L3.935 2.31394L4.57687 2.53269C4.69402 2.57257 4.79669 2.64633 4.87187 2.74461C4.94705 2.8429 4.99137 2.9613 4.9992 3.08479C5.00703 3.20829 4.97803 3.33133 4.91586 3.43833C4.8537 3.54533 4.76117 3.63146 4.65 3.68582L4.57687 3.71582L3.93563 3.93457L3.71688 4.57644C3.67707 4.69362 3.60337 4.79634 3.50512 4.87159C3.40687 4.94683 3.28849 4.99122 3.16499 4.99912C3.04149 5.00701 2.91842 4.97807 2.81138 4.91595C2.70435 4.85384 2.61816 4.76134 2.56375 4.65019L2.53375 4.57644L2.315 3.93519L1.67313 3.71644C1.54964 3.6743 1.44244 3.59456 1.36656 3.48842C1.29068 3.38228 1.24992 3.25504 1.25 3.12457Z"
                        fill="#ACBDCC"
                      />
                    </Svg>
                    <View className="flex-1">
                      <Text className="font-OnestMedium text-sm text-[#ECECED]">{prompt}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setAskQuestionModal(true)}
              className="mt-6 flex-row items-center justify-between rounded-full border border-[#ACBDCC] bg-[#13161B] p-2.5">
              <View className="flex-row items-center gap-2.5">
                <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <G clipPath="url(#clip0_1606_12141)">
                    <Path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.625 2.0625C7.7632 2.0625 6.90984 2.23224 6.11364 2.56204C5.31744 2.89184 4.594 3.37523 3.98461 3.98461C3.37523 4.594 2.89184 5.31744 2.56204 6.11364C2.23224 6.90984 2.0625 7.7632 2.0625 8.625C2.0625 9.4868 2.23224 10.3402 2.56204 11.1364C2.89184 11.9326 3.37523 12.656 3.98461 13.2654C4.594 13.8748 5.31744 14.3582 6.11364 14.688C6.90984 15.0178 7.7632 15.1875 8.625 15.1875C10.3655 15.1875 12.0347 14.4961 13.2654 13.2654C14.4961 12.0347 15.1875 10.3655 15.1875 8.625C15.1875 6.88452 14.4961 5.21532 13.2654 3.98461C12.0347 2.7539 10.3655 2.0625 8.625 2.0625ZM0.9375 8.625C0.9375 4.38 4.38 0.9375 8.625 0.9375C12.87 0.9375 16.3125 4.38 16.3125 8.625C16.3125 10.545 15.6083 12.3015 14.4443 13.6485L16.8975 16.1025C16.9528 16.154 16.9971 16.2161 17.0278 16.2851C17.0586 16.3541 17.0751 16.4286 17.0764 16.5041C17.0778 16.5796 17.0639 16.6547 17.0356 16.7247C17.0073 16.7947 16.9652 16.8584 16.9118 16.9118C16.8584 16.9652 16.7947 17.0073 16.7247 17.0356C16.6547 17.0639 16.5796 17.0778 16.5041 17.0764C16.4286 17.0751 16.3541 17.0586 16.2851 17.0278C16.2161 16.9971 16.154 16.9528 16.1025 16.8975L13.6485 14.4443C12.2541 15.6524 10.47 16.3159 8.625 16.3125C4.38 16.3125 0.9375 12.87 0.9375 8.625Z"
                      fill="#838B91"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_1606_12141">
                      <Rect width="18" height="18" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>
                <Text className="font-OnestMedium text-default-secondary">Ask anything</Text>
              </View>
              <View>
                <Svg width="33" height="33" viewBox="0 0 33 33" fill="none">
                  <Rect width="33" height="33" rx="16.5" fill="#86E7F1" />
                  <Path
                    d="M17 22V10M17 10L21.5 14.5M17 10L12.5 14.5"
                    stroke="#162736"
                    strokeWidth="1.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="absolute bottom-[100px] left-0 right-0 p-5">
            <View className="mb-[300px]">
              <Image source={require('~/assets/images/ai-card2.png')} className="absolute left-0 h-[300px] w-[400px]" />
              <Image
                source={require('~/assets/images/ai-card1.png')}
                className="absolute right-0 h-[200px] w-[300px]"
              />
            </View>
            <View className="mb-12 gap-4">
              <Text className="font-OnestSemiBold text-3xl text-white">
                Let AI help you{'\n'}understand your business
              </Text>
              <Text className="font-OnestMedium text-sm text-default-secondary">
                Gain valuable insights from your data with the power of AI. Track trends, spot opportunities, and make
                smarter decisions — all in one intuitive dashboard.
              </Text>
            </View>
            <View className="mb-12 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPackage('weekly')}
                className={cn(
                  'flex-1 gap-2 rounded-xl border border-[#22262F] bg-[#0c0e12] p-3',
                  selectedPackage === 'weekly' && 'border-[#C2F93A]',
                )}>
                <Text className="font-OnestMedium text-xs text-default-secondary">Weekly</Text>
                <Text className="font-OnestSemiBold text-2xl text-default-primary">₱499</Text>
                <Text className="font-OnestRegular text-xs text-default-secondary">Per week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPackage('yearly')}
                className={cn(
                  'flex-1 gap-2 rounded-xl border border-[#22262F] bg-[#0c0e12] p-3',
                  selectedPackage === 'yearly' && 'border-[#C2F93A]',
                )}>
                <Text className="font-OnestMedium text-xs text-default-secondary">Annual</Text>
                <Text className="font-OnestSemiBold text-2xl text-default-primary">₱7,999</Text>
                <Text className="font-OnestRegular text-xs text-default-secondary">Per year</Text>
                <View className="absolute -top-3 self-center rounded-md bg-[#9CDF03] px-2.5 py-0.5">
                  <Text className="font-OnestSemiBold text-xs text-[#0C0C0D]">Best Deal</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPackage('monthly')}
                className={cn(
                  'flex-1 gap-2 rounded-xl border border-[#22262F] bg-[#0c0e12] p-3',
                  selectedPackage === 'monthly' && 'border-[#C2F93A]',
                )}>
                <Text className="font-OnestMedium text-xs text-default-secondary">Monthly</Text>
                <Text className="font-OnestSemiBold text-2xl text-default-primary">₱2,499</Text>
                <Text className="font-OnestRegular text-xs text-default-secondary">Per month</Text>
              </TouchableOpacity>
            </View>
            <Text className="mb-6 text-center font-OnestMedium text-default-secondary">
              Try 7 days for free. Cancel Anytime
            </Text>
            <Button onPress={() => setIsPremiumUser(true)} className="bg-[#9CDF03]">
              <Text className="font-OnestSemiBold text-[#0C0C0D]">Try AI Wise</Text>
            </Button>
          </View>
        )}
      </SafeAreaView>
      <Modal
        presentationStyle="pageSheet"
        animationType="slide"
        visible={askQuestionModal}
        onRequestClose={() => setAskQuestionModal(false)}
        backdropColor="transparent">
        <View className="flex-1 rounded-t-2xl bg-[#13161B] p-5">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 32 }}
              enableOnAndroid
              extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
              keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => setAskQuestionModal(false)}>
                <XIcon color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                ref={questionRef}
                className="mt-5 border-b border-[#22262F] pb-3 font-OnestSemiBold text-xl text-white"
                placeholder="Ask anything..."
                placeholderTextColor="#94979C"
                value={question}
                onChangeText={setQuestion}
                onSubmitEditing={() => handleSubmitQuestion(question)}
                returnKeyType="done"
              />
            </KeyboardAwareScrollView>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
  );
}
