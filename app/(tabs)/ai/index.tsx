import { router, useFocusEffect } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AIDrawerContent from '~/components/AIDrawerContent';
import AIPushDrawer from '~/components/AIPushDrawer';
import { MaritesCloseCircleIcon, MaritesMenuIcon, MaritesQRWiseIcon } from '~/components/icons/icons';
import SnowBackground from '~/components/SnowBackground';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/context/AuthUserContext';
import { useFirebaseIdToken } from '~/hooks/useFirebaseIdToken';
import { ChatMessageRecord } from '~/types/chat';

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { token: authKey } = useFirebaseIdToken();
  const { store } = useAuth();
  const storeId = store?.id ?? '';

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const [cursor, setCursor] = useState<string | undefined>();
  const [sessions, setSessions] = useState<ChatMessageRecord[]>([]);

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
    }, [authKey, storeId]),
  );

  const fetchSessions = async (next?: string) => {
    const query = new URLSearchParams();
    query.set('limit', '20');
    if (next) query.set('cursor', next);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_AI_CHAT_API_URL}/chat/sessions?${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authKey}`,
          'X-Store-ID': storeId,
        },
        cache: 'no-store',
      });
      const data = await response.json();
      console.log('>>', data);

      setSessions((prev) => (next ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch {}
  };

  const loadMore = () => {
    if (!cursor) return;
    fetchSessions(cursor);
  };

  const footerBottom = Math.max(0, keyboardHeight - insets.bottom); // ✅ key line

  return (
    <AIPushDrawer
      open={open}
      onClose={() => setOpen(false)}
      drawer={
        <AIDrawerContent
          chats={sessions}
          onNewChat={() => {
            setOpen(false);
            // do your new chat logic
          }}
          onSearchChats={() => {
            setOpen(false);
            // open search
          }}
          onPlans={() => {
            setOpen(false);
            // open plans
          }}
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

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              <View className="flex-row items-center justify-between px-4 py-1.5">
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity onPress={() => setOpen(true)}>
                    <MaritesMenuIcon />
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2.5">
                    <MaritesQRWiseIcon />
                    <Text className="font-OnestMedium text-lg text-white">Ask Marites</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.back()}>
                  <MaritesCloseCircleIcon />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingHorizontal: 16,
                  // ✅ make room for footer (when keyboard open, footer goes up)
                  paddingBottom: (keyboardHeight ? footerBottom : insets.bottom) + 96,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
                <View className="flex-1 items-center justify-center gap-7">
                  <MaritesQRWiseIcon size="50" />
                  <Text className="text-2xl font-medium text-white">How can i help you today?</Text>
                  <Text className="font-OnestRegular text-[#EBEBEB]">I&apos;m available 24/7. Ask me anything.</Text>
                </View>
              </ScrollView>

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: footerBottom, // ✅ sits right above keyboard
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: keyboardHeight ? 44 : insets.bottom + 12,
                  zIndex: 50,
                  elevation: 50,
                }}>
                <View style={{ position: 'relative' }}>
                  <Input
                    value={q}
                    onChangeText={setQ}
                    placeholder="Ask Marites anything..."
                    placeholderTextColor="#FFFFFF"
                    className="!h-[60px] w-full !rounded-xl px-12 !font-OnestMedium !text-sm"
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      // send message
                    }}
                  />

                  <View style={{ position: 'absolute', left: 12, top: 21 }}>
                    <SearchIcon color="#838B91" size="18" />
                  </View>

                  <TouchableOpacity className="absolute right-3 top-3 size-10 items-center justify-center">
                    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <Path
                        d="M9 15V3M9 3L13.5 7.5M9 3L4.5 7.5"
                        stroke="#86E7F1"
                        strokeWidth="1.125"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ImageBackground>
      </View>
    </AIPushDrawer>
  );
}
