import React, { PropsWithChildren, useEffect } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(284, Math.round(SCREEN_W * 0.82));

export default function AIPushDrawer({
  open,
  onClose,
  drawer,
  children,
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  drawer: React.ReactNode;
}>) {
  const insets = useSafeAreaInsets();
  const p = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(open ? 1 : 0, { duration: 260 });
  }, [open]);

  // Drawer slides in from left
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(p.value, [0, 1], [-DRAWER_W, 0]) }],
  }));

  // Main content pushes right + scales down a bit + rounds corners
  const contentStyle = useAnimatedStyle(() => {
    const tx = interpolate(p.value, [0, 1], [0, DRAWER_W]);
    const s = interpolate(p.value, [0, 1], [1, 0.92]); // <-- subtle zoom-out
    const r = interpolate(p.value, [0, 1], [0, 26]); // <-- rounded like screenshot

    return {
      transform: [{ translateX: tx }, { scale: s }],
      borderRadius: r,
      overflow: 'hidden',
    };
  });

  // Dim overlay on top of content (tap to close)
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0, 0.45]),
    pointerEvents: open ? ('auto' as any) : ('none' as any),
  }));

  // Optional: add shadow when open
  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(p.value, [0, 1], [0, 0.35]),
    elevation: interpolate(p.value, [0, 1], [0, 18]),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Drawer */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_W,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: '#000000',
            zIndex: 10,
          },
          drawerStyle,
        ]}>
        {drawer}
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[
          {
            flex: 1,
            zIndex: 20,
            backgroundColor: '#000',
            shadowColor: '#000',
            shadowRadius: 20,
            shadowOffset: { width: -4, height: 6 },
          },
          shadowStyle,
          contentStyle,
        ]}>
        {children}

        {/* Overlay */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000',
            },
            overlayStyle,
          ]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
