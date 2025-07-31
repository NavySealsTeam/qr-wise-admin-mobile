import { Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import Logo from '~/components/icons/Logo';
import { useAuth } from '~/context/AuthUserContext';

export default function SwitchBranch() {
  const { toggleSheet } = useAuth();

  return (
    <View className="px-6 py-3 pb-20">
      <TouchableOpacity
        onPress={toggleSheet}
        className="my-2 h-[5px] w-20 self-center rounded-full bg-[#FFFFFF]"
      />
      <View className="mt-1">
        <Text className="font-OnestSemiBold text-xl text-[#FFFFFF]">
          Switch branch
        </Text>
        <View className="mt-5">
          <TouchableOpacity
            onPress={toggleSheet}
            className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="rounded-full border border-white">
                <Logo />
              </View>
              <Text className="font-OnestMedium text-base text-white">
                Punched Coffee CBP
              </Text>
            </View>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z"
                fill="#9CDF03"
              />
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.0965 7.39016L9.9365 14.3002L8.0365 12.2702C7.6865 11.9402 7.1365 11.9202 6.7365 12.2002C6.3465 12.4902 6.2365 13.0002 6.4765 13.4102L8.7265 17.0702C8.9465 17.4102 9.3265 17.6202 9.7565 17.6202C10.1665 17.6202 10.5565 17.4102 10.7765 17.0702C11.1365 16.6002 18.0065 8.41016 18.0065 8.41016C18.9065 7.49016 17.8165 6.68016 17.0965 7.38016V7.39016Z"
                fill="#E6FF93"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
