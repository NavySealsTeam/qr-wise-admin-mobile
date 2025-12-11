import { format, isToday, isYesterday } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useNotificationsQuery } from '~/hooks/useNotificationsQuery';

function formatMonthDay(ms: number) {
  const d = new Date(ms);
  if (isToday(d)) {
    return 'Today';
  }

  if (isYesterday(d)) {
    return 'Yesterday';
  }

  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function groupByDate(notifications: any[]): Record<string, any[]> {
  return notifications.reduce(
    (acc: Record<string, any[]>, n) => {
      const dateKey = formatMonthDay(n.timestamp);

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(n);

      return acc;
    },
    {} as Record<string, any[]>,
  );
}

export default function NotificationsScreen() {
  const { data: notifications, refetch } = useNotificationsQuery('notifications');

  useFocusEffect(
    useCallback(() => {
      refetch?.();
    }, []),
  );

  const grouped = groupByDate(notifications || []);
  const groupsArray = Object.entries(grouped).map(([date, items]) => ({
    date,
    items,
  }));

  return (
    <View className="flex-1 bg-[#0C0E12]">
      <SafeAreaView className="flex-1">
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: 120,
            paddingHorizontal: 16,
            gap: 16,
          }}>
          <Text className="font-OnestSemiBold text-2xl text-default-tertiary">Notifications</Text>
          {groupsArray.map((group) => (
            <View className="gap-2" key={group.date}>
              <Text className="font-OnestSemiBold text-base text-default-primary">{group.date}</Text>
              {(group.items || []).map((notification: any, index: number) => {
                if (notification.type === 'stock-low') {
                  return (
                    <View key={index} className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
                      <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <Rect width="28" height="28" rx="14" fill="#373A41" />
                        <Path
                          d="M13.9995 12V14.6667M13.9995 17.3334H14.0062M13.0764 8.59451L7.59313 18.0656C7.289 18.5909 7.13693 18.8536 7.1594 19.0692C7.17901 19.2572 7.27752 19.4281 7.43043 19.5392C7.60573 19.6667 7.90924 19.6667 8.51625 19.6667H19.4828C20.0898 19.6667 20.3933 19.6667 20.5686 19.5392C20.7215 19.4281 20.82 19.2572 20.8396 19.0692C20.8621 18.8536 20.71 18.5909 20.4059 18.0656L14.9226 8.59451C14.6196 8.07107 14.4681 7.80935 14.2704 7.72145C14.0979 7.64477 13.9011 7.64477 13.7286 7.72145C13.531 7.80935 13.3794 8.07107 13.0764 8.59451Z"
                          stroke="#CECFD2"
                          strokeWidth="1.37255"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <View className="flex-1 gap-1">
                        <Text className="font-OnestSemiBold text-base text-default-primary">
                          {notification.menuItemName} is low in stock
                        </Text>
                        <Text className="font-OnestRegular text-sm text-default-secondary">
                          Stock for {notification.menuItemName} is below 2 units. Restock soon to avoid missing sales.
                        </Text>
                        <Text className="font-OnestRegular text-xs text-default-tertiary">
                          {format(notification.timestamp, 'p')}
                        </Text>
                      </View>
                    </View>
                  );
                }

                if (notification.type === 'stock-unavailable') {
                  return (
                    <View key={index} className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
                      <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <Rect width="28" height="28" rx="14" fill="#373A41" />
                        <Path
                          d="M19.3332 13.9607V10.5333C19.3332 9.41315 19.3332 8.85309 19.1152 8.42527C18.9234 8.04895 18.6175 7.74299 18.2412 7.55124C17.8133 7.33325 17.2533 7.33325 16.1332 7.33325H11.8665C10.7464 7.33325 10.1863 7.33325 9.75852 7.55124C9.3822 7.74299 9.07624 8.04895 8.88449 8.42527C8.6665 8.85309 8.6665 9.41315 8.6665 10.5333L8.6665 17.4666C8.6665 18.5867 8.6665 19.1467 8.88449 19.5746C9.07624 19.9509 9.3822 20.2569 9.75852 20.4486C10.1863 20.6666 10.7464 20.6666 11.8665 20.6666H15.3332M15.3332 13.3333H11.3332M12.6665 15.9999H11.3332M16.6665 10.6666L11.3332 10.6666M15.9998 17.3333H19.9998"
                          stroke="#CECFD2"
                          strokeWidth="1.37255"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <View className="flex-1 gap-1">
                        <Text className="font-OnestSemiBold text-base text-default-primary">
                          {notification.menuItemName} marked as unavailable
                        </Text>
                        <Text className="font-OnestRegular text-sm text-default-secondary">
                          This item is out of stock. Tap to restock or mark as available.
                        </Text>
                        <Text className="font-OnestRegular text-xs text-default-tertiary">
                          {format(notification.timestamp, 'p')}
                        </Text>
                      </View>
                    </View>
                  );
                }

                return null;
              })}
            </View>
          ))}

          {/* <View className="gap-2">
            <Text className="font-OnestSemiBold text-base text-default-primary">Yesterday</Text>
            <TouchableOpacity className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
              <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <Rect width="28" height="28" rx="14" fill="#373A41" />
                <Path
                  d="M13.9995 12V14.6667M13.9995 17.3334H14.0062M13.0764 8.59451L7.59313 18.0656C7.289 18.5909 7.13693 18.8536 7.1594 19.0692C7.17901 19.2572 7.27752 19.4281 7.43043 19.5392C7.60573 19.6667 7.90924 19.6667 8.51625 19.6667H19.4828C20.0898 19.6667 20.3933 19.6667 20.5686 19.5392C20.7215 19.4281 20.82 19.2572 20.8396 19.0692C20.8621 18.8536 20.71 18.5909 20.4059 18.0656L14.9226 8.59451C14.6196 8.07107 14.4681 7.80935 14.2704 7.72145C14.0979 7.64477 13.9011 7.64477 13.7286 7.72145C13.531 7.80935 13.3794 8.07107 13.0764 8.59451Z"
                  stroke="#CECFD2"
                  strokeWidth="1.37255"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View className="flex-1 gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">Beef Tapa is low in stock</Text>
                <Text className="font-OnestRegular text-sm text-default-secondary">
                  Stock for Beef Tapa is below 10 units. Restock soon to avoid missing sales.
                </Text>
                <Text className="font-OnestRegular text-xs text-default-tertiary">9:07 PM</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
              <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <Rect width="28" height="28" rx="14" fill="#373A41" />
                <Path
                  d="M20 20H9.06667C8.6933 20 8.50661 20 8.36401 19.9273C8.23856 19.8634 8.13658 19.7614 8.07266 19.636C8 19.4934 8 19.3067 8 18.9333L8 8M19.3333 11.3333L16.7208 14.1218C16.6217 14.2274 16.5722 14.2803 16.5125 14.3076C16.4598 14.3317 16.4017 14.3416 16.344 14.3364C16.2786 14.3305 16.2143 14.2972 16.0858 14.2304L13.9142 13.1029C13.7857 13.0362 13.7214 13.0028 13.656 12.9969C13.5983 12.9917 13.5402 13.0016 13.4875 13.0257C13.4278 13.053 13.3783 13.1059 13.2792 13.2116L10.6667 16"
                  stroke="#CECFD2"
                  strokeWidth="1.37255"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View className="flex-1 gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">
                  Your sales today reached ₱34,291.20!
                </Text>
                <Text className="font-OnestRegular text-sm text-default-secondary">
                  That’s 12% more than yesterday. Tap to learn more.
                </Text>
                <Text className="font-OnestRegular text-xs text-default-tertiary">8:00 PM</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            <Text className="font-OnestSemiBold text-base text-default-primary">July 18</Text>
            <TouchableOpacity className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
              <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <Rect width="28" height="28" rx="14" fill="#373A41" />
                <Path
                  d="M18.3335 16.6667C19.6222 16.6667 20.6668 14.7266 20.6668 12.3333C20.6668 9.9401 19.6222 8 18.3335 8M18.3335 16.6667C17.0448 16.6667 16.0002 14.7266 16.0002 12.3333C16.0002 9.9401 17.0448 8 18.3335 8M18.3335 16.6667L9.62919 15.0841C9.01086 14.9716 8.7017 14.9154 8.45171 14.7926C7.94314 14.5428 7.5644 14.089 7.40959 13.544C7.3335 13.276 7.3335 12.9618 7.3335 12.3333C7.3335 11.7049 7.3335 11.3906 7.40959 11.1227C7.5644 10.5777 7.94314 10.1238 8.45171 9.87403C8.7017 9.75124 9.01086 9.69502 9.62919 9.5826L18.3335 8M9.3335 15.3333L9.59607 19.0093C9.621 19.3584 9.63347 19.533 9.70941 19.6653C9.77628 19.7817 9.87676 19.8753 9.99769 19.9337C10.135 20 10.31 20 10.66 20H11.8483C12.2484 20 12.4484 20 12.5965 19.9202C12.7266 19.8501 12.8297 19.7387 12.8896 19.6037C12.9578 19.4499 12.9425 19.2504 12.9118 18.8515L12.6668 15.6667"
                  stroke="#CECFD2"
                  strokeWidth="1.37255"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View className="flex-1 gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">
                  Loca’s Ube Cheesecake is today’s top seller!
                </Text>
                <Text className="font-OnestRegular text-sm text-default-secondary">
                  Loca’s Ube Cheesecake sold 24 units today. Tap to see full product movement.
                </Text>
                <Text className="font-OnestRegular text-xs text-default-tertiary">8:00 PM</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            <Text className="font-OnestSemiBold text-base text-default-primary">July 17</Text>
            <TouchableOpacity className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
              <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <Rect width="28" height="28" rx="14" fill="#373A41" />
                <Path
                  d="M19.3332 12.9999V10.5333C19.3332 9.41315 19.3332 8.85309 19.1152 8.42527C18.9234 8.04895 18.6175 7.74299 18.2412 7.55124C17.8133 7.33325 17.2533 7.33325 16.1332 7.33325H11.8665C10.7464 7.33325 10.1863 7.33325 9.75852 7.55124C9.3822 7.74299 9.07624 8.04895 8.88449 8.42527C8.6665 8.85309 8.6665 9.41315 8.6665 10.5333L8.6665 17.4666C8.6665 18.5867 8.6665 19.1467 8.88449 19.5746C9.07624 19.9509 9.3822 20.2569 9.75852 20.4486C10.1863 20.6666 10.7464 20.6666 11.8665 20.6666H13.9998M15.3332 13.3333H11.3332M12.6665 15.9999H11.3332M16.6665 10.6666L11.3332 10.6666M17.9998 19.9999V15.9999M15.9998 17.9999H19.9998"
                  stroke="#CECFD2"
                  strokeWidth="1.37255"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View className="flex-1 gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">Truffle Fries added to menu</Text>
                <Text className="font-OnestRegular text-sm text-default-secondary">Tap to see how it’s performing</Text>
                <Text className="font-OnestRegular text-xs text-default-tertiary">11:00 PM</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row gap-3 rounded-xl border border-[#22262F] bg-[#13161B] p-3">
              <Svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <Rect width="28" height="28" rx="14" fill="#373A41" />
                <Path
                  d="M19.3332 13.9607V10.5333C19.3332 9.41315 19.3332 8.85309 19.1152 8.42527C18.9234 8.04895 18.6175 7.74299 18.2412 7.55124C17.8133 7.33325 17.2533 7.33325 16.1332 7.33325H11.8665C10.7464 7.33325 10.1863 7.33325 9.75852 7.55124C9.3822 7.74299 9.07624 8.04895 8.88449 8.42527C8.6665 8.85309 8.6665 9.41315 8.6665 10.5333L8.6665 17.4666C8.6665 18.5867 8.6665 19.1467 8.88449 19.5746C9.07624 19.9509 9.3822 20.2569 9.75852 20.4486C10.1863 20.6666 10.7464 20.6666 11.8665 20.6666H15.3332M15.3332 13.3333H11.3332M12.6665 15.9999H11.3332M16.6665 10.6666L11.3332 10.6666M15.9998 17.3333H19.9998"
                  stroke="#CECFD2"
                  strokeWidth="1.37255"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View className="flex-1 gap-1">
                <Text className="font-OnestSemiBold text-base text-default-primary">
                  Crispy Pork Belly marked as unavailable
                </Text>
                <Text className="font-OnestRegular text-sm text-default-secondary">
                  This item is out of stock. Tap to restock or mark as available.
                </Text>
                <Text className="font-OnestRegular text-xs text-default-tertiary">8:00 PM</Text>
              </View>
            </TouchableOpacity>
          </View> */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
