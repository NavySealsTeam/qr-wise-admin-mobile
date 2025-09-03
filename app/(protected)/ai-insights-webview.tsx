import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';

export default function AIInsightsScreen() {
  const { question } = useLocalSearchParams<{ question: string }>();
  const uri = `https://qrwise-agent-339386749222.asia-southeast1.run.app/?prompt=${question}&device=mobile`;

  return (
    <SafeAreaView className="flex-1 bg-[#0C0E12]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="size-10 items-center justify-center">
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
        <Text className="font-OnestSemiBold text-base text-white">Wise AI</Text>
        <View className="size-10" />
      </View>
      <WebView
        source={{ uri }}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            className="flex-1 items-center justify-center bg-[#0C0E12]"
            style={{ ...StyleSheet.absoluteFillObject }}>
            <LottieView
              autoPlay
              style={{ width: 200, height: 200 }}
              source={require('~/assets/lottie/espresso-shot-animation.json')}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
