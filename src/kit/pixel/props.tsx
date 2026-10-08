import React from 'react';
import {Img, staticFile, useVideoConfig} from 'remotion';
import {useMotionFrame} from '../motion';
import type {ScreenContent} from '../script';
import {useTheme} from '../theme';
import {ITEMS} from './items';
import {PixelArt} from './Sprite';

/**
 * 小剧场的布景件。全部用方块拼，尺寸以「格」（art，一格多少 px）为单位，
 * 镜头缩放时整体跟着缩。屏幕内容见下面的 Screen。
 */

const INK = '#1B1726';
const WOOD = '#8A5A3C';
const WOOD_DARK = '#5E3D2A';

/** 一块实心色块，坐标单位是格 */
const B: React.FC<{x: number; y: number; w: number; h: number; c: string; a: number; style?: React.CSSProperties}> = ({
  x,
  y,
  w,
  h,
  c,
  a,
  style,
}) => (
  <div style={{position: 'absolute', left: x * a, top: y * a, width: w * a, height: h * a, backgroundColor: c, ...style}} />
);

/** 书桌高几格。放在桌上的道具 lift 给这个数 */
export const DESK_TOP = 17;

/**
 * 书桌：桌板、两条腿、显示器、笔筒、台灯。坐标原点是桌子底边中点（地板上）。
 * 台灯那团光用抖动网点画，跟背景的光同一个手法。
 */
export const Desk: React.FC<{a: number; screen?: ScreenContent; age: number}> = ({a, screen, age}) => {
  const W = 54;
  return (
    <div style={{position: 'absolute', left: (-W / 2) * a, top: -DESK_TOP * a, width: W * a, height: DESK_TOP * a}}>
      {/* 台灯的光：一圈稀疏的暖色点 */}
      <Glow x={W / 2 + 12} y={-12} r={13} a={a} color="#F6C177" />
      {/* 桌板 + 腿 */}
      <B x={0} y={0} w={W} h={3} c={WOOD} a={a} />
      <B x={0} y={2} w={W} h={1} c={WOOD_DARK} a={a} />
      <B x={2} y={3} w={2} h={DESK_TOP - 3} c={WOOD_DARK} a={a} />
      <B x={W - 4} y={3} w={2} h={DESK_TOP - 3} c={WOOD_DARK} a={a} />
      {/* 显示器：浅一档的边框，不然黑框压在暗墙上等于没有 */}
      <B x={W / 2 - 22} y={-26} w={34} h={23} c="#4A4163" a={a} />
      <B x={W / 2 - 21} y={-25} w={32} h={21} c={INK} a={a} />
      <B x={W / 2 - 8} y={-3} w={6} h={3} c="#4A4163" a={a} />
      <div style={{position: 'absolute', left: (W / 2 - 20) * a, top: -24 * a, width: 30 * a, height: 19 * a, overflow: 'hidden', backgroundColor: '#14202A'}}>
        <Screen content={screen} w={30 * a} h={19 * a} a={a} age={age} />
      </div>
      {/* 笔筒 */}
      <B x={4} y={-5} w={4} h={5} c="#7FA7D9" a={a} />
      <B x={4} y={-8} w={1} h={3} c="#E05A5A" a={a} />
      <B x={6} y={-9} w={1} h={4} c="#F5C518" a={a} />
      {/* 台灯：底座、灯杆、灯罩 */}
      <B x={W - 9} y={-1} w={6} h={1} c={INK} a={a} />
      <B x={W - 7} y={-12} w={1} h={11} c={INK} a={a} />
      <B x={W - 10} y={-14} w={8} h={3} c="#F08A4B" a={a} />
      <B x={W - 9} y={-11} w={6} h={1} c="#F6E7B0" a={a} />
    </div>
  );
};

/** 抖动网点的一团光，以 (x, y) 为圆心、r 格为半径 */
const Glow: React.FC<{x: number; y: number; r: number; a: number; color: string}> = ({x, y, r, a, color}) => {
  let d = '';
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const k = 1 - Math.sqrt(i * i + j * j) / r;
      if (k <= 0) continue;
      // 棋盘格 + 越近越密：中心整片亮，外圈只剩一半的格子再变稀
      const on = (i + j) % 2 === 0 ? k > 0.05 : k > 0.55;
      if (on) d += `M${i + r} ${j + r}h1v1h-1z`;
    }
  }
  return (
    <svg
      width={(2 * r + 1) * a}
      height={(2 * r + 1) * a}
      viewBox={`0 0 ${2 * r + 1} ${2 * r + 1}`}
      shapeRendering="crispEdges"
      style={{position: 'absolute', left: (x - r) * a, top: (y - r) * a, opacity: 0.16}}
    >
      <path d={d} fill={color} />
    </svg>
  );
};

/** 墙上大屏：深色木框 + 黑屏，内容占满 */
export const WallScreen: React.FC<{w: number; h: number; a: number; screen?: ScreenContent; age: number}> = ({
  w,
  h,
  a,
  screen,
  age,
}) => (
  <div style={{position: 'absolute', left: -w / 2, top: 0, width: w, height: h, backgroundColor: WOOD_DARK, padding: a * 2}}>
    <div style={{width: '100%', height: '100%', backgroundColor: '#14121C', overflow: 'hidden', position: 'relative'}}>
      <Screen content={screen} w={w - a * 4} h={h - a * 4} a={a} age={age} big />
    </div>
  </div>
);

/** 夜窗：木框、十字窗棂、方月亮、轮流闪的星 */
export const Window: React.FC<{w: number; h: number; a: number}> = ({w, h, a}) => {
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const stars = [
    [0.18, 0.22],
    [0.7, 0.16],
    [0.42, 0.62],
    [0.82, 0.72],
    [0.28, 0.82],
  ];
  return (
    <div style={{position: 'absolute', left: -w / 2, top: 0, width: w, height: h, backgroundColor: WOOD, padding: a * 1.5}}>
      <div style={{position: 'relative', width: '100%', height: '100%', backgroundColor: '#16233B', overflow: 'hidden'}}>
        <div style={{position: 'absolute', right: '14%', top: '12%', width: a * 4, height: a * 4, backgroundColor: '#F6E7B0'}} />
        {stars.map(([sx, sy], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${sx! * 100}%`,
              top: `${sy! * 100}%`,
              width: a,
              height: a,
              backgroundColor: '#F4E9D0',
              opacity: (Math.floor(t * 2) + i) % 3 === 0 ? 0.25 : 0.9,
            }}
          />
        ))}
        <div style={{position: 'absolute', left: `calc(50% - ${a / 2}px)`, top: 0, bottom: 0, width: a, backgroundColor: WOOD}} />
        <div style={{position: 'absolute', top: `calc(50% - ${a / 2}px)`, left: 0, right: 0, height: a, backgroundColor: WOOD}} />
      </div>
    </div>
  );
};

/** 软木板：几张便签和卡片，跟参考里的作业板一个意思 */
export const Board: React.FC<{w: number; h: number; a: number}> = ({w, h, a}) => {
  const notes = [
    {x: 0.08, y: 0.12, w: 0.24, h: 0.32, c: '#F4F1EA', top: '#E05A5A'},
    {x: 0.38, y: 0.14, w: 0.26, h: 0.26, c: '#1E2A35', top: '#5FC3B5'},
    {x: 0.7, y: 0.1, w: 0.2, h: 0.36, c: '#E05A5A', top: '#F4F1EA'},
    {x: 0.14, y: 0.56, w: 0.22, h: 0.28, c: '#F6E7B0', top: '#C98A55'},
    {x: 0.46, y: 0.54, w: 0.24, h: 0.3, c: '#F4C2A8', top: '#C98A55'},
  ];
  return (
    <div style={{position: 'absolute', left: -w / 2, top: 0, width: w, height: h, backgroundColor: WOOD_DARK, padding: a * 1.5}}>
      <div style={{position: 'relative', width: '100%', height: '100%', backgroundColor: '#B98A5C'}}>
        {notes.map((n, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${n.x * 100}%`,
              top: `${n.y * 100}%`,
              width: `${n.w * 100}%`,
              height: `${n.h * 100}%`,
              backgroundColor: n.c,
              borderTop: `${a * 1.5}px solid ${n.top}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** 书架：三层，书脊颜色错开 */
export const Shelf: React.FC<{a: number}> = ({a}) => {
  const W = 26;
  const H = 34;
  const colors = ['#E05A5A', '#5FC3B5', '#F5C518', '#7FA7D9', '#F4F1EA', '#C98A55', '#8BD46E'];
  return (
    <div style={{position: 'absolute', left: (-W / 2) * a, top: -H * a, width: W * a, height: H * a, backgroundColor: WOOD_DARK}}>
      {[0, 1, 2].map((row) => (
        <React.Fragment key={row}>
          <B x={1} y={1 + row * 11} w={W - 2} h={10} c="#2A2030" a={a} />
          {Array.from({length: 7}, (_, i) => {
            const h = 6 + ((i * 7 + row * 3) % 4);
            return <B key={i} x={2 + i * 3.2} y={1 + row * 11 + (10 - h)} w={2.4} h={h} c={colors[(i + row * 2) % colors.length]!} a={a} />;
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

/** 道具：底边中点对齐 */
export const Item: React.FC<{item: keyof typeof ITEMS; a: number}> = ({item, a}) => {
  const def = ITEMS[item];
  const w = def.body[0]!.length;
  return (
    <div style={{position: 'absolute', left: (-w / 2) * a, top: -def.body.length * a}}>
      <PixelArt rows={def.body} palette={def.palette} dot={a} />
    </div>
  );
};

/**
 * 屏幕内容。`age` 是这块内容亮出来多少秒了，条形图、逐行出现都按它走。
 * `big` 是墙上大屏，字号放大。
 */
export const Screen: React.FC<{content?: ScreenContent; w: number; h: number; a: number; age: number; big?: boolean}> = ({
  content,
  w,
  h,
  a,
  age,
  big = false,
}) => {
  const theme = useTheme();
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const size = big ? h / 9 : h / 6.5;
  const pad = size * 0.6;
  const font: React.CSSProperties = {fontFamily: theme.fonts.body, fontSize: size, lineHeight: 1.35, color: theme.colors.text};
  // 逐行出现：每行隔 0.25 秒
  const shown = (i: number) => age >= i * 0.25;

  if (!content || content.kind === 'off') {
    return <div style={{position: 'absolute', left: w * 0.1, top: h * 0.12, width: w * 0.2, height: a, backgroundColor: 'rgba(255,255,255,0.06)'}} />;
  }

  if (content.kind === 'code') {
    const offset = Math.floor(t / 0.3);
    return (
      <div style={{padding: pad, display: 'flex', flexDirection: 'column', gap: size * 0.5}}>
        {Array.from({length: 6}, (_, i) => {
          const n = offset + i;
          const len = 0.3 + ((n * 37) % 50) / 100;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: size * 0.5}}>
              <div style={{...font, fontSize: size * 0.7, color: theme.colors.muted, width: size * 1.2}}>{String(n % 100).padStart(2, '0')}</div>
              <div style={{height: a, width: `${len * 100}%`, backgroundColor: n % 5 === 2 ? '#F5C518' : '#7EE0C3'}} />
            </div>
          );
        })}
      </div>
    );
  }

  if (content.kind === 'text') {
    return (
      <div style={{padding: pad, ...font}}>
        {content.title ? <div style={{color: theme.colors.accent, marginBottom: size * 0.3}}>{content.title}</div> : null}
        {content.lines.map((line, i) => (
          <div key={i} style={{opacity: shown(i + 1) ? 1 : 0}}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  if (content.kind === 'list') {
    return (
      <div style={{padding: pad, ...font}}>
        {content.title ? <div style={{color: theme.colors.accent, marginBottom: size * 0.3}}>{content.title}</div> : null}
        {content.items.map((it, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: size * 0.4, opacity: shown(i + 1) ? 1 : 0}}>
            <div
              style={{
                width: size * 0.5,
                height: size * 0.5,
                flexShrink: 0,
                backgroundColor: it.tone === 'bad' ? '#E05A5A' : it.tone === 'good' ? '#7EE0C3' : theme.colors.muted,
              }}
            />
            <div style={{color: it.tone === 'bad' ? '#FF8A80' : theme.colors.text}}>{it.text}</div>
          </div>
        ))}
      </div>
    );
  }

  if (content.kind === 'bars') {
    return (
      <div style={{padding: pad, ...font, display: 'flex', flexDirection: 'column', gap: size * 0.25}}>
        {content.title ? <div style={{color: theme.colors.accent}}>{content.title}</div> : null}
        {content.items.map((it, i) => {
          // 长条按 10 段一格一格涨上去
          const p = Math.min(1, Math.max(0, (age - 0.2 - i * 0.3) / 0.8));
          const filled = Math.round(p * it.value * 10) / 10;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: size * 0.5}}>
              <div style={{width: size * 4.2, flexShrink: 0, fontSize: size * 0.8}}>{it.label}</div>
              <div style={{flex: 1, height: size * 0.6, backgroundColor: 'rgba(255,255,255,0.08)', position: 'relative'}}>
                <div style={{position: 'absolute', inset: 0, width: `${filled * 100}%`, backgroundColor: theme.colors.accent}} />
              </div>
              {it.note ? <div style={{fontSize: size * 0.8, width: size * 3.4, textAlign: 'right', opacity: p >= 1 ? 1 : 0}}>{it.note}</div> : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (content.kind === 'items') {
    const n = content.items.length;
    const cell = Math.floor(Math.min((w - pad * 2) / (n * 14), (h - pad * 2 - size * 2) / 13));
    return (
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: pad}}>
        {content.items.map((it, i) => {
          const def = ITEMS[it.item];
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.4, opacity: shown(i) ? 1 : 0}}>
              <div style={{height: 13 * cell, display: 'flex', alignItems: 'flex-end'}}>
                <PixelArt rows={def.body} palette={def.palette} dot={Math.max(1, cell)} />
              </div>
              {it.label ? <div style={{...font, fontSize: size * 0.85}}>{it.label}</div> : null}
            </div>
          );
        })}
      </div>
    );
  }

  // image：像素图按像素放大，不做平滑
  return (
    <div style={{position: 'absolute', inset: pad, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={staticFile(content.src)} style={{maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated'}} />
    </div>
  );
};
