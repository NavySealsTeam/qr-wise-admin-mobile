import { router, useFocusEffect } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import AIDrawerContent from '~/components/AIDrawerContent';
import AIPushDrawer from '~/components/AIPushDrawer';
import { MaritesArrowUpSendIcon, MaritesCloseCircleIcon, MaritesIcon, MaritesMenuIcon } from '~/components/icons/icons';
import SnowBackground from '~/components/SnowBackground';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/context/AuthUserContext';
import { parseSSE, toApiError, toStatusText } from '~/lib/chat-utils';
import { ChatMessage, ChatSession, StreamEvent } from '~/types/chat';
import { ChatMessages } from './components/ChatMessages';

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { store, fUser } = useAuth();
  const storeId = store?.id ?? '';

  const inputRef = useRef<any>(null);
  const [q, setQ] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [open, setOpen] = useState(false);
  const [isChatView, setIsChatView] = useState(false);

  const [cursor, setCursor] = useState<string | undefined>();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesCursor, setMessagesCursor] = useState<string | undefined>();

  const streamAbortRef = useRef<AbortController | null>(null);
  const pendingStreamSessionIdRef = useRef<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamStatusText, setStreamStatusText] = useState('Generating response');

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [storeId]),
  );

  const fetchSessions = async (next?: string) => {
    if (isSessionsLoading) return; // ✅ guard
    setIsSessionsLoading(true);

    const query = new URLSearchParams();
    query.set('limit', '20');
    if (next) query.set('cursor', next);

    try {
      const response = await fetch(`https://qr-wise-ai-chat-api.onrender.com/chat/sessions?${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await fUser?.getIdToken()}`,
          'X-Store-ID': storeId,
        },
      });
      const data = await response.json();
      console.log('fetchSessions >>', data);

      setSessions((prev) => (next ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const loadMore = () => {
    if (!cursor) return;
    fetchSessions(cursor);
  };

  const fetchMessages = async (sessionId: string, next?: string) => {
    const query = new URLSearchParams();
    query.set('limit', '30');
    if (next) query.set('cursor', next);

    setIsSessionLoading(true);
    try {
      const res = await fetch(`https://qr-wise-ai-chat-api.onrender.com/chat/session/${sessionId}/messages?${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await fUser?.getIdToken()}`,
          'X-Store-ID': storeId,
        },
      });

      const data = await res.json();
      console.log('fetchMessages >>', data);

      setMessages((prev) => (next ? [...prev, ...data.items] : data.items));
      setMessagesCursor(data.nextCursor);
    } catch (e) {
      console.log('fetchMessages error', e);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (!selectedSessionId || !messagesCursor) return;
    fetchMessages(selectedSessionId, messagesCursor);
  };

  const handleSend = async (msg: string, appendUserMessage?: boolean) => {
    const text = msg.trim();
    if (!text) return;

    setIsChatView(true);

    const userMessage: ChatMessage = {
      id: uuid.v4(),
      role: 'user',
      content: text,
      status: 'complete',
    };

    const assistantMessageId = uuid.v4();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    };

    setMessages((prev) =>
      appendUserMessage ? [...prev, userMessage, assistantPlaceholder] : [...prev, assistantPlaceholder],
    );

    const controller = new AbortController();
    streamAbortRef.current = controller;

    let resolvedSessionId = selectedSessionId || undefined;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await fUser?.getIdToken()}`,
          'X-Store-ID': storeId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          sessionId: resolvedSessionId,
        }),
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw await toApiError(response);
      }

      if (!response.body) {
        throw new Error('Missing response body for stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          buffer += decoder.decode();
          const parsed = parseSSE(buffer);
          for (const e of parsed.events) {
            const data = JSON.parse(e.data) as StreamEvent['data'];
            const event = {
              event: e.event as StreamEvent['event'],
              data,
            } as StreamEvent;

            if (event.event === 'session' && event.data.sessionId) {
              pendingStreamSessionIdRef.current = event.data.sessionId;
              resolvedSessionId = event.data.sessionId;
              setSelectedSessionId(event.data.sessionId);
              return;
            }

            if (event.event === 'status') {
              const nextStatus = toStatusText(event.data.message || event.data.phase || 'Generating response');
              setStreamStatusText(nextStatus);
              return;
            }

            if (event.event === 'formatting') {
              const nextStatus = toStatusText(
                event.data.decisionReason || event.data.fallbackReason || event.data.type || 'Validating response',
              );
              setStreamStatusText(nextStatus);
              return;
            }

            if (event.event === 'token') {
              const chunk = event.data.token || '';
              if (!chunk) return;

              setStreamStatusText('Writing response...');

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content: `${message.content}${chunk}`,
                        status: 'streaming',
                      }
                    : message,
                ),
              );
              return;
            }

            if (event.event === 'error') {
              const message = event.data.message || 'Failed to generate response';

              setErrorMessage(message);
              setStreamStatusText('Response failed');
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId
                    ? {
                        ...item,
                        content: item.content || message,
                        status: 'error',
                      }
                    : item,
                ),
              );
              return;
            }

            if (event.event === 'done') {
              if (event.data.sessionId) {
                resolvedSessionId = event.data.sessionId;
                setSelectedSessionId(event.data.sessionId);
              }

              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId
                    ? {
                        ...item,
                        status: item.status === 'error' ? 'error' : 'complete',
                      }
                    : item,
                ),
              );
              setStreamStatusText('Response completed');
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSE(buffer);
        buffer = parsed.rest;

        for (const e of parsed.events) {
          const data = JSON.parse(e.data) as StreamEvent['data'];
          const event = {
            event: e.event as StreamEvent['event'],
            data,
          } as StreamEvent;

          if (event.event === 'session' && event.data.sessionId) {
            pendingStreamSessionIdRef.current = event.data.sessionId;
            resolvedSessionId = event.data.sessionId;
            setSelectedSessionId(event.data.sessionId);
            return;
          }

          if (event.event === 'status') {
            const nextStatus = toStatusText(event.data.message || event.data.phase || 'Generating response');
            setStreamStatusText(nextStatus);
            return;
          }

          if (event.event === 'formatting') {
            const nextStatus = toStatusText(
              event.data.decisionReason || event.data.fallbackReason || event.data.type || 'Validating response',
            );
            setStreamStatusText(nextStatus);
            return;
          }

          if (event.event === 'token') {
            const chunk = event.data.token || '';
            if (!chunk) return;

            setStreamStatusText('Writing response...');

            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content: `${message.content}${chunk}`,
                      status: 'streaming',
                    }
                  : message,
              ),
            );
            return;
          }

          if (event.event === 'error') {
            const message = event.data.message || 'Failed to generate response';

            setErrorMessage(message);
            setStreamStatusText('Response failed');
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: item.content || message,
                      status: 'error',
                    }
                  : item,
              ),
            );
            return;
          }

          if (event.event === 'done') {
            if (event.data.sessionId) {
              resolvedSessionId = event.data.sessionId;
              setSelectedSessionId(event.data.sessionId);
            }

            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      status: item.status === 'error' ? 'error' : 'complete',
                    }
                  : item,
              ),
            );
            setStreamStatusText('Response completed');
          }
        }
      }
    } catch (error: unknown) {
      console.log('streaming error', error);
      const isAbortError = error && (error as any).name === 'AbortError';

      if (isAbortError) {
        setStreamStatusText('Generation stopped');
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  status: 'cancelled',
                  content: item.content || 'Generation stopped.',
                }
              : item,
          ),
        );
      } else {
        const message = error instanceof Error ? error.message : 'Failed to generate response';

        setErrorMessage(message);
        setStreamStatusText('Response failed');
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: item.content || message,
                  status: 'error',
                }
              : item,
          ),
        );
      }
    } finally {
      streamAbortRef.current = null;
      pendingStreamSessionIdRef.current = null;
      setIsStreaming(false);
      // Refetch sessions to update last active time and order
      fetchSessions();
    }

    // clear input
    setQ('');
    Keyboard.dismiss();
  };

  const handleRetry = useCallback(
    (assistantMessageId: string) => {
      if (isStreaming) return;

      const assistantIndex = messages.findIndex((message) => message.id === assistantMessageId);
      if (assistantIndex <= 0) return;

      for (let index = assistantIndex - 1; index >= 0; index -= 1) {
        const candidate = messages[index];
        if (candidate?.role === 'user') {
          void handleSend(candidate.content, false);
          return;
        }
      }
    },
    [isStreaming, messages, handleSend],
  );

  return (
    <AIPushDrawer
      open={open}
      onClose={() => setOpen(false)}
      drawer={
        <AIDrawerContent
          onNewChat={() => {
            setQ('');
            setOpen(false);
            setIsChatView(false);
            setSelectedSessionId(null);
            setMessages([]);
            setMessagesCursor(undefined);
            setIsStreaming(false);
            setIsSessionLoading(false);
            setErrorMessage(null);
            setStreamStatusText('Generating response');
            inputRef.current?.focus();
          }}
          onSearchChats={() => {
            // open search
          }}
          onPlans={() => {
            // open plans
          }}
          chats={sessions}
          selectedChatId={selectedSessionId ?? undefined}
          onSelectChat={(chat) => {
            setQ('');
            setOpen(false);
            setIsChatView(true);
            setSelectedSessionId(chat.id); // or chat.sessionId depending on your type
            setMessages([]); // clear old convo
            setMessagesCursor(undefined);
            setIsStreaming(false);
            setIsSessionLoading(false);
            setErrorMessage(null);
            setStreamStatusText('Generating response');
            fetchMessages(chat.id); // load convo
          }}
          onLoadMoreChats={loadMore}
          hasMoreChats={!!cursor}
          loadingChats={isSessionsLoading}
        />
      }>
      <View className="flex-1 bg-[#000000]">
        <ImageBackground
          source={require('~/assets/images/marites/ellipse-5.png')}
          style={{ flex: 1, paddingTop: insets.top }}>
          <SnowBackground />
          <Image
            source={require('~/assets/images/marites/vector-5.png')}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
          <Image
            source={require('~/assets/images/marites/vector-4.png')}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : keyboardHeight === 0 ? undefined : 'height'} // ✅ Android uses height
            keyboardVerticalOffset={Platform.OS === 'ios' ? -30 : -40}>
            <View style={{ flex: 1 }}>
              {selectedSessionId || isChatView ? (
                <View className="flex-row items-center justify-between px-4 py-1.5">
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setOpen(true);
                      }}>
                      <MaritesMenuIcon />
                    </TouchableOpacity>
                  </View>
                  <MaritesIcon />
                  <TouchableOpacity onPress={() => router.back()}>
                    <MaritesCloseCircleIcon />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center justify-between px-4 py-1.5">
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setOpen(true);
                      }}>
                      <MaritesMenuIcon />
                    </TouchableOpacity>
                    <MaritesIcon />
                  </View>
                  <TouchableOpacity onPress={() => router.back()}>
                    <MaritesCloseCircleIcon />
                  </TouchableOpacity>
                </View>
              )}

              {selectedSessionId || isChatView ? (
                <View style={{ flex: 1 }}>
                  <ChatMessages
                    messages={messages}
                    isSessionLoading={isSessionLoading}
                    isStreaming={isStreaming}
                    streamStatusText={streamStatusText}
                    errorMessage={errorMessage}
                    handleRetry={(id) => handleRetry(id)}
                    onLoadMore={loadMoreMessages}
                    hasMore={!!messagesCursor}
                    loadingMore={isSessionLoading} // or create a separate "isLoadingMoreMessages"
                  />
                </View>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 16,
                  }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
                  <View className="flex-1 items-center justify-center gap-7">
                    <MaritesIcon height="42" iconOnly />
                    <Text className="text-2xl font-medium text-white">How can i help you today?</Text>
                    <Text className="font-OnestRegular text-[#EBEBEB]">I&apos;m available 24/7. Ask me anything.</Text>
                  </View>
                </ScrollView>
              )}

              <View style={{ paddingBottom: insets.bottom + 12 }}>
                <View className="px-4 pt-3">
                  <View className="relative">
                    <Input
                      ref={inputRef}
                      value={q}
                      onChangeText={setQ}
                      placeholder="Ask Marites anything..."
                      className="!h-[60px] w-full !rounded-xl px-12 !font-OnestMedium !text-sm placeholder:text-white/80"
                      returnKeyType="send"
                      onSubmitEditing={() => handleSend(q, true)}
                    />

                    <View className="absolute left-3 top-6">
                      <SearchIcon color="#838B91" size="18" />
                    </View>

                    <TouchableOpacity
                      onPress={() => handleSend(q, true)}
                      disabled={!q.trim()}
                      style={{ opacity: q.trim() ? 1 : 0.4 }}
                      className="absolute right-3 top-3.5 size-10 items-center justify-center">
                      <MaritesArrowUpSendIcon />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </AIPushDrawer>
  );
}
