import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type P = { id: number; x: number; y: number; r: number; vx: number; vy: number; o: number };
const COUNT = 80;

function init(w: number, h: number): P[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2.5 + 0.5,
    vy: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.6,
    o: Math.random() * 0.5 + 0.2,
  }));
}

export default function SnowBackground() {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const particlesRef = useRef<P[]>([]);
  const rafRef = useRef<number | null>(null);
  const [, tick] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    const h = Math.round(e.nativeEvent.layout.height);
    if (w !== layout.w || h !== layout.h) setLayout({ w, h });
  };

  useEffect(() => {
    if (!layout.w || !layout.h) return;

    particlesRef.current = init(layout.w, layout.h);

    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      const w = layout.w;
      const h = layout.h;

      for (const p of particlesRef.current) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y > h) p.y = -p.r;
        if (p.y < -p.r) p.y = h;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
      }

      tick((n) => (n + 1) % 100000); // re-render
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [layout.w, layout.h]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Svg width="100%" height="100%">
        {particlesRef.current.map((p) => (
          <Circle key={p.id} cx={p.x} cy={p.y} r={p.r} fill={`rgba(255,255,255,${p.o})`} />
        ))}
      </Svg>
    </View>
  );
}
