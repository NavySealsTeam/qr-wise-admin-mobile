import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { ChatMessage } from '~/types/chat';
import ChatMarkdown from './CharMarkdown';

// Replace with your real components
const SalesChart = () => <View className="h-[180px] rounded-[12px] bg-white/10" />;

type Msg = ChatMessage;

const MessageRow = memo(function MessageRow({ msg, handleRetry }: { msg: Msg; handleRetry: (id: string) => void }) {
  return (
    <View className="w-full">
      {msg.role === 'user' ? (
        <View className="max-w-[80%] self-end rounded-[10px] border border-[#4D4D4D1A] bg-[#BEBEBE33] px-4 py-2.5">
          <Text className="text-[14px] font-normal leading-[21px] text-white">{msg.content}</Text>
        </View>
      ) : (
        <View className="max-w-[90%] flex-col gap-3 self-start">
          {msg.chartType === 'monthly-sales' && <SalesChart />}

          <ChatMarkdown content={msg.content} />

          {msg.status === 'error' && (
            <View className="flex-row items-center gap-2">
              <Text className="text-[12px] text-[#FF8A8A]">Generation failed.</Text>

              <TouchableOpacity
                onPress={() => handleRetry(msg.id)}
                activeOpacity={0.85}
                className="rounded-full border border-[#4D4D4D] px-2 py-1">
                <Text className="text-[11px] text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {msg.status === 'cancelled' && <Text className="text-[12px] text-white/60">Generation stopped.</Text>}
        </View>
      )}
    </View>
  );
});

export function ChatMessages({
  messages,
  isSessionLoading,
  isStreaming,
  streamStatusText,
  errorMessage,
  handleRetry,
  onLoadMore,
  hasMore,
  loadingMore,
}: {
  messages: Msg[];
  isSessionLoading: boolean;
  isStreaming: boolean;
  streamStatusText: string;
  errorMessage?: string | null;
  handleRetry: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}) {
  // @ts-ignore
  const listRef = useRef<FlashList<Msg>>(null);

  // ✅ prevent double-trigger
  const inFlightRef = useRef(false);
  const lastCallAtRef = useRef(0);

  const keyExtractor = useCallback((item: Msg) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Msg }) => <MessageRow msg={item} handleRetry={handleRetry} />,
    [handleRetry],
  );

  const handleEndReached = useCallback(() => {
    if (!hasMore) return;
    if (loadingMore) return;

    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - lastCallAtRef.current < 600) return;
    lastCallAtRef.current = now;

    inFlightRef.current = true;
    try {
      onLoadMore();
    } finally {
      // allow next trigger after a short delay (API state updates async)
      setTimeout(() => {
        inFlightRef.current = false;
      }, 300);
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const scrollToBottom = useCallback(() => {
    // rAF helps ensure FlashList has layout before scrolling
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  // ✅ scroll to bottom when opening / first render (or when you load history)
  useEffect(() => {
    if (!messages?.length) return;
    scrollToBottom();
    // only when message count changes (initial load included)
  }, [messages?.length, scrollToBottom]);

  const Footer = useMemo(() => {
    return (
      <View className="w-full pt-3">
        {/* Loading conversation */}
        {isSessionLoading && (
          <View className="flex-row items-center gap-2 self-start rounded-[10px] border border-[#4D4D4D] bg-white/10 px-[10px] py-[10px]">
            <ActivityIndicator />
            <Text className="text-[14px] font-normal leading-[14px] text-white/80">Loading conversation</Text>
          </View>
        )}

        {/* Streaming */}
        {isStreaming && (
          <View className="mt-3 flex-row items-center gap-2 self-start rounded-[10px] border border-[#4D4D4D] bg-white/10 px-[10px] py-[10px]">
            <ActivityIndicator />
            <Text className="text-[14px] font-normal leading-[14px] text-white/80">{streamStatusText}</Text>
          </View>
        )}

        {/* Error banner */}
        {!!errorMessage && !isStreaming && (
          <View className="mt-3 self-start rounded-[10px] border border-[#7A2E2E] bg-[#2A1313] px-3 py-2">
            <Text className="text-[13px] text-[#FFB3B3]">{errorMessage}</Text>
          </View>
        )}
      </View>
    );
  }, [isSessionLoading, isStreaming, streamStatusText, errorMessage, scrollToBottom]);

  return (
    <FlashList
      ref={listRef}
      data={messages ?? []}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: 32,
        paddingHorizontal: 16,
        paddingBottom: 8, // small space at bottom
      }}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListFooterComponent={Footer}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}
      // Helps keep the view stable when you append messages
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 50,
      }}
      onLayout={scrollToBottom}
      onEndReachedThreshold={0.2}
      onEndReached={handleEndReached} // ✅ fetch older messages
    />
  );
}
