import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {useMotionFrame} from '../motion';
import type {Mood, PixelSprite} from '../script';
import {type Rect, SPRITES} from './sprites';

/**
 * 字符画 → SVG。同一行里连续同色的格子合成一个 rect，一个角色几十个元素而不是几百个。
 * crispEdges 关掉抗锯齿，放大多少倍边缘都是硬的。
 */
export const PixelArt: React.FC<{
  rows: string[];
  palette: Record<string, string>;
  /** 一格多少 px */
  dot: number;
  /** 盖在身体上面的几块，眼睛和嘴用 */
  overlays?: {rects: Rect[]; color: string}[];
  style?: React.CSSProperties;
}> = ({rows, palette, dot, overlays = [], style}) => {
  const w = rows[0]?.length ?? 0;
  const runs = useMemo(() => {
    const out: {x: number; y: number; len: number; color: string}[] = [];
    rows.forEach((row, y) => {
      if (row.length !== w) throw new Error(`像素画第 ${y} 行有 ${row.length} 格，第 0 行是 ${w} 格`);
      let x = 0;
      while (x < row.length) {
        const ch = row[x]!;
        let len = 1;
        while (row[x + len] === ch) len++;
        const color = palette[ch];
        if (ch !== '.' && color) out.push({x, y, len, color});
        x += len;
      }
    });
    return out;
  }, [rows, palette, w]);

  return (
    <svg
      width={w * dot}
      height={rows.length * dot}
      viewBox={`0 0 ${w} ${rows.length}`}
      shapeRendering="crispEdges"
      style={{display: 'block', overflow: 'visible', ...style}}
    >
      {runs.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.len} height={1} fill={r.color} />
      ))}
      {overlays.flatMap((o, i) =>
        o.rects.map(([x, y, rw, rh]) => (
          <rect key={`o${i}-${x}-${y}`} x={x} y={y} width={rw} height={rh} fill={o.color} />
        )),
      )}
    </svg>
  );
};

/** 眯眼笑：每只眼换成一个 ^。左眼往左挪一格，两个 ^ 才对称 */
const happyEyes = (open: Rect[]): Rect[] =>
  open.flatMap(([x, y], i) => {
    const l = i === 0 ? x - 1 : x;
    return [
      [l, y + 1, 1, 1],
      [l + 1, y, 1, 1],
      [l + 2, y + 1, 1, 1],
    ] as Rect[];
  });

/** 瞪大眼：往上多一格 */
const wideEyes = (open: Rect[]): Rect[] => open.map(([x, y, w, h]) => [x, y - 1, w, h + 1] as Rect);

/**
 * 会动的角色。三件事一直在做，保证角色站着不说话时画面也不静止：
 *
 * - 呼吸：每半秒上下跳一格；走路时换成每 0.2 秒一步
 * - 眨眼：每三秒多眨一次，`seed` 错开几个角色的节奏，免得齐刷刷一起眨
 * - 说话：`talking` 时嘴一张一合
 *
 * `hop` 是 0→1 的进度，给了就在这段里跳一下。轮到谁开口就让谁跳，观众一眼知道是谁在说。
 */
export const Character: React.FC<{
  sprite: PixelSprite;
  dot: number;
  talking?: boolean;
  hop?: number;
  seed?: number;
  /** 朝左。默认朝右 */
  flip?: boolean;
  mood?: Mood;
  walking?: boolean;
}> = ({sprite, dot, talking = false, hop = 0, seed = 0, flip = false, mood = 'calm', walking = false}) => {
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps + seed;
  const def = SPRITES[sprite];
  const bob = Math.floor(t * (walking ? 5 : 2)) % 2 === 0 ? 0 : dot;
  const blink = t % 3.3 < 0.2;
  const mouthOpen = talking && Math.floor(t * 5) % 2 === 0;
  // 跳的高度取整到格：半格的位移在像素画里就是糊。
  const jump = Math.round(Math.sin(Math.PI * Math.min(1, Math.max(0, hop))) * 4) * dot;
  const eyes =
    mood === 'happy'
      ? happyEyes(def.eyes.open)
      : mood === 'shut' || blink
        ? def.eyes.shut
        : mood === 'wide'
          ? wideEyes(def.eyes.open)
          : def.eyes.open;

  return (
    <PixelArt
      rows={def.body}
      palette={def.palette}
      dot={dot}
      overlays={[
        {rects: eyes, color: def.eyes.color},
        {rects: mouthOpen ? def.mouth.open : def.mouth.shut, color: def.mouth.color},
      ]}
      style={{transform: `translateY(${bob - jump}px)${flip ? ' scaleX(-1)' : ''}`}}
    />
  );
};
