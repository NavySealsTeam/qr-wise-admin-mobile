import { format, isToday } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import DailyWeatherForecast, {
  WeatherType,
} from '~/components/WeatherForecast';
import { useAuth } from '~/context/AuthUserContext';
import { getTimeOfDay } from '~/lib/utils';
import ModeOfTransactions from './components/ModeOfTransactions';
import Orders from './components/Orders';
import ProductMovement from './components/ProductMovement';
import TotalSales from './components/TotalSales';
import TotalTransactionsAndCustomers from './components/TotalTransactionsAndCustomers';

export default function DashboardScreen() {
  const { user, store, toggleSheet } = useAuth();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const defaultStyles = useDefaultStyles('dark');
  const dateRef = useRef(null);
  const [date, setDate] = useState<Date>(new Date());
  const [weatherData, setWeatherData] = useState<WeatherType | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      fetchWeather();
    }, []),
  );

  const fetchWeather = async () => {
    try {
      const res = await fetch('https://admin.qrwise.com/api/weather');
      if (!res.ok) throw new Error('Failed to fetch weather');

      const data = await res.json();
      setWeatherData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Simulate fetch or refetch here
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-1">
          <View className="w-32">
            <Text className="font-OnestSemiBold text-base text-default-primary">
              {isToday(date) ? format(date, 'EEE, MMM d') : ''}
            </Text>
          </View>
          <DropdownMenu>
            <DropdownMenuTrigger ref={dateRef} asChild>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">
                  {isToday(date) ? 'Today' : format(date, 'EEE, MMM d')}
                </Text>
                <ChevronDownIcon color="#CECFD2" size="18" />
              </TouchableOpacity>
            </DropdownMenuTrigger>
            <DropdownMenuContent insets={contentInsets} className="mt-1 p-0">
              <DateTimePicker
                mode="single"
                maxDate={new Date()}
                showOutsideDays
                date={date}
                onChange={({ date }) => {
                  if (date) {
                    setDate(date as Date);
                    // @ts-ignore
                    dateRef.current?.close();
                  }
                }}
                styles={{ ...defaultStyles }}
                className="bg-[#13161B]"
                components={{
                  IconPrev: <ArrowLeftIcon color="#CECFD2" />,
                  IconNext: <ArrowRightIcon color="#CECFD2" />,
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
          <View className="w-32 flex-row items-center justify-end gap-3">
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <Path
                  d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z"
                  fill="#22262F"
                />
                <Path
                  d="M13.795 23.5C14.3826 24.0186 15.1544 24.3333 15.9998 24.3333C16.8452 24.3333 17.6171 24.0186 18.2047 23.5M20.9998 12.6666C20.9998 11.3405 20.473 10.0688 19.5353 9.13109C18.5977 8.19341 17.3259 7.66663 15.9998 7.66663C14.6737 7.66663 13.402 8.19341 12.4643 9.13109C11.5266 10.0688 10.9998 11.3405 10.9998 12.6666C10.9998 15.2418 10.3502 17.0049 9.62453 18.1711C9.01242 19.1549 8.70636 19.6467 8.71758 19.7839C8.73001 19.9359 8.7622 19.9938 8.88463 20.0846C8.99519 20.1666 9.49364 20.1666 10.4905 20.1666H21.5091C22.506 20.1666 23.0044 20.1666 23.115 20.0846C23.2374 19.9938 23.2696 19.9359 23.282 19.7839C23.2933 19.6467 22.9872 19.1549 22.3751 18.1711C21.6494 17.0049 20.9998 15.2418 20.9998 12.6666Z"
                  stroke="#CECFD2"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleSheet}
              className="overflow-hidden rounded-full border border-white">
              {store?.name.toLowerCase().includes('mabuhay') ? (
                <Image
                  source={require('~/assets/images/punched-mabuhay.png')}
                  className="size-10"
                />
              ) : (
                <Image
                  source={require('~/assets/images/punched-johndorf.png')}
                  className="size-10"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: 140,
            paddingHorizontal: 16,
            gap: 16,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View className="flex-row items-center justify-between">
            <Text className="font-OnestSemiBold text-2xl text-default-primary">
              Good {getTimeOfDay()},{'\n'}
              {(user?.name || '')?.split(' ')[0]}
            </Text>
            {weatherData && (
              <DailyWeatherForecast dailyData={[weatherData.daily?.[0]]} />
            )}
          </View>
          <TotalSales date={date} refreshing={refreshing} />
          <TotalTransactionsAndCustomers date={date} refreshing={refreshing} />
          <ModeOfTransactions date={date} refreshing={refreshing} />
          <Orders date={date} refreshing={refreshing} />
          <ProductMovement date={date} refreshing={refreshing} />
        </ScrollView>
        {/* <FloatingMenu /> */}
      </SafeAreaView>
    </View>
  );
}
