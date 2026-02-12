import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '~/lib/utils';
import { ChatSession } from '~/types/chat';
import {
  MaritesNewChatIcon,
  MaritesPlansCreditsIcon,
  MaritesQRWiseIcon,
  MaritesSearchIcon,
  MaritesTurnProIcon,
} from './icons/icons';

function Divider() {
  return <View className="my-3 h-px bg-[rgba(255,255,255,0.08)]" />;
}

function DrawerItem({ icon, label, onPress }: { icon?: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center py-2.5">
      {icon && <View className="mr-3">{icon}</View>}
      <Text className="font-OnestRegular text-sm text-white">{label}</Text>
    </TouchableOpacity>
  );
}

export default function AIDrawerContent({
  onNewChat,
  onSearchChats,
  onPlans,
  chats,
  selectedChatId,
  onSelectChat,
  onLoadMoreChats,
  hasMoreChats,
  loadingChats,
}: {
  onNewChat?: () => void;
  onSearchChats?: () => void;
  onPlans?: () => void;
  chats?: ChatSession[];
  selectedChatId?: string;
  onSelectChat?: (chat: ChatSession) => void;
  onLoadMoreChats?: () => void;
  hasMoreChats?: boolean;
  loadingChats?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const list = chats ?? [];

  const inFlightRef = useRef(false);
  const lastCallAtRef = useRef(0);

  const handleScroll = React.useCallback(
    (e: any) => {
      if (!hasMoreChats) return;
      if (loadingChats) return;
      if (!onLoadMoreChats) return;

      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;

      // how close to bottom before loading
      const paddingToBottom = 120;
      const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (!isNearBottom) return;

      // ✅ spam guards
      if (inFlightRef.current) return;
      const now = Date.now();
      if (now - lastCallAtRef.current < 800) return;

      lastCallAtRef.current = now;
      inFlightRef.current = true;

      onLoadMoreChats();

      setTimeout(() => {
        inFlightRef.current = false;
      }, 400);
    },
    [hasMoreChats, loadingChats, onLoadMoreChats],
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 8 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18 + insets.bottom }}
        scrollEventThrottle={16}
        onScroll={handleScroll}>
        <MaritesQRWiseIcon size="24" />

        {/* Top actions */}
        <View className="mt-5 gap-4">
          <DrawerItem icon={<MaritesNewChatIcon />} label="New Chat" onPress={onNewChat} />
          <DrawerItem icon={<MaritesSearchIcon />} label="Search Chats" onPress={onSearchChats} />
        </View>

        <Divider />

        <DrawerItem icon={<MaritesPlansCreditsIcon />} label="Plans & Credits" onPress={onPlans} />

        <Divider />

        {/* Chats */}
        <Text className="mb-3 mt-4 font-OnestRegular text-xs text-[#D7D7D7]">Your chats</Text>

        {list.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelectChat?.(c)}
            className={cn('mb-1.5 rounded-[12px] px-3 py-2.5', c.id === selectedChatId ? 'bg-white/5' : 'transparent')}>
            <Text className="font-OnestRegular text-sm text-white">{c.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingChats && (
        <View className="mt-3 flex-row items-center justify-center py-2">
          <Text className="text-xs text-white/60">Loading more chats…</Text>
        </View>
      )}

      {/* Bottom cards */}
      <View style={{ marginTop: 16, gap: 12 }}>
        <View className="flex-row items-center justify-between rounded-2xl bg-[#0D0D0D] px-2 py-2.5">
          <View className="flex-row items-center gap-2.5">
            <MaritesTurnProIcon />
            <Text className="text-sm text-white">Turn Pro</Text>
          </View>
          <TouchableOpacity>
            <LinearGradient
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              colors={['#00FFFF', '#8349FF']}
              style={{ height: 38, alignItems: 'center', justifyContent: 'center', width: 78, borderRadius: 10 }}>
              <Text className="font-OnestMedium text-sm text-white">Upgrade</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View className="gap-2.5 rounded-2xl bg-[#0D0D0D] px-3 py-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="font-OnestRegular text-sm text-white">Credits</Text>
            <Text className="font-OnestRegular text-sm text-[#FFFFFFB2]">5 left</Text>
          </View>
          <View className="h-2 rounded-full bg-[#2B2B2B]">
            <View className="h-2 rounded-full bg-[#8349FF]" style={{ width: '22%' }} />
          </View>
          <Text className="font-OnestRegular text-xs text-white/70">
            Monthly credits reset on the 1st of every month.
          </Text>
        </View>
      </View>
    </View>
  );
}
