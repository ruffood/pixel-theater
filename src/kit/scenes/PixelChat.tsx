import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {useFormat, usePick, useUnit} from '../format';
import {scaleIn, useMotionFrame, useProgress} from '../motion';
import {Character, PixelArt, PLANT, pixelBox, pixelDot} from '../pixel';
import type {PixelSprite} from '../script';
import {useTheme, withAlpha} from '../theme';
import {Ambience} from '../ui/Ambience';
import type {SceneComponent} from './types';

/**
 * 像素主题的 chat：一间屋子，两个角色站在地板上，轮到谁说话谁就跳一下、对白框
 * 出现在他头上，字一个个打出来 —— RPG 对白的读法。
 *
 * 一次只出一个对白框。台词按条平分本场时长；每条前半段打字，后半段留给人读完。
 * 所以一场里的台词别超过三条，每条别超过两行。
 *
 * 不走 Stage：屋子要铺满画面，不吃安全边距。但台词、角色、章节牌都摆在竖版的
 * 安全带（屏高 20%-58%）里，地板以下只是装饰，被平台按钮盖住也无所谓。
 */
export const PixelChat: SceneComponent<'chat'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const format = useFormat();
  const frame = useMotionFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const s = scene.seconds;
  const dot = pixelDot(unit);
  const art = Math.round(usePick({landscape: 9, portrait: 10, square: 9}) * unit);
  const floorY = Math.round(height * usePick({landscape: 0.74, portrait: 0.58, square: 0.7}));
  const textSize = usePick({landscape: 34, portrait: 40, square: 36}) * unit;
  const chapter = useProgress({delay: s * 0.02, duration: 0.4});

  const cast = {
    agent: {sprite: scene.cast?.agent?.sprite ?? ('bot' as PixelSprite), name: scene.cast?.agent?.name},
    user: {sprite: scene.cast?.user?.sprite ?? ('slime' as PixelSprite), name: scene.cast?.user?.name},
  };
  // agent 站左、user 站右，面对面
  const spots = {
    agent: width * usePick({landscape: 0.4, portrait: 0.3, square: 0.34}),
    user: width * usePick({landscape: 0.6, portrait: 0.7, square: 0.66}),
  };
  const spriteW = 16 * art;

  const n = scene.messages.length;
  const start = s * 0.04;
  const slot = (s - start) / Math.max(1, n);
  const current = Math.min(n - 1, Math.max(0, Math.floor((t - start) / slot)));
  const msg = scene.messages[current];
  const lineStart = start + current * slot;
  const chars = Array.from(msg?.text ?? '');
  // 打字速度：每秒 14 个字左右，但最多占本条一半的时间，长句也要留出读的时间
  const typeFor = Math.min(slot * 0.5, chars.length / 14);
  const shown = t < lineStart ? 0 : Math.min(chars.length, Math.ceil(((t - lineStart) / typeFor) * chars.length));
  const typing = shown < chars.length;
  const speaker = msg?.from === 'user' ? 'user' : 'agent';
  const hop = (t - lineStart) / 0.4;

  const bubbleMax = width * usePick({landscape: 0.42, portrait: 0.84, square: 0.7});
  const charTop = floorY - 16 * art;
  const bubbleBottom = height - charTop + 7 * dot;
  const pop = scaleIn(Math.min(1, Math.max(0, (t - lineStart) / 0.2)), 0.85);
  // 对白框水平中心对着说话的人，但不许出画
  const margin = 40 * unit;
  const center = Math.min(width - margin - bubbleMax / 2, Math.max(margin + bubbleMax / 2, spots[speaker]));

  const ink = theme.colors.accentInk;

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, overflow: 'hidden'}}>
      <Ambience seconds={s} />
      <Window x={width * usePick({landscape: 0.1, portrait: 0.1, square: 0.08})} y={height * usePick({landscape: 0.12, portrait: 0.07, square: 0.1})} w={width * usePick({landscape: 0.2, portrait: 0.34, square: 0.26})} h={height * usePick({landscape: 0.3, portrait: 0.11, square: 0.22})} dot={dot} t={t} />
      {/* 地板：踢脚线 + 错缝砖 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: floorY,
          bottom: 0,
          backgroundColor: '#6B4A3A',
          backgroundImage: bricks(dot),
          borderTop: `${dot * 2}px solid #4A3329`,
        }}
      />
      <div style={{position: 'absolute', left: width * usePick({landscape: 0.84, portrait: 0.82, square: 0.84}), top: floorY - 12 * art}}>
        <PixelArt rows={PLANT.body} palette={PLANT.palette} dot={art} />
      </div>
      {(['agent', 'user'] as const).map((who, i) => (
        <div key={who} style={{position: 'absolute', left: spots[who] - spriteW / 2, top: charTop + dot}}>
          <Character
            sprite={cast[who].sprite}
            dot={art}
            seed={i * 1.37}
            talking={speaker === who && typing}
            hop={speaker === who ? hop : 0}
            flip={who === 'user'}
          />
        </div>
      ))}
      {msg ? (
        <div
          style={{
            position: 'absolute',
            left: center - bubbleMax / 2,
            width: bubbleMax,
            bottom: bubbleBottom,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              ...pop,
              transformOrigin: 'bottom center',
              position: 'relative',
              ...pixelBox({fill: theme.colors.text, border: ink, shadow: 'rgba(0,0,0,0.35)', dot}),
              padding: `${textSize * 0.55}px ${textSize * 0.7}px`,
              fontFamily: theme.fonts.body,
              fontSize: textSize,
              lineHeight: 1.4,
              color: ink,
              textAlign: 'left',
            }}
          >
            {cast[speaker].name ? (
              <div
                style={{
                  position: 'absolute',
                  left: textSize * 0.4,
                  top: -textSize * 0.95,
                  ...pixelBox({fill: theme.colors.accent, border: ink, dot}),
                  padding: `${textSize * 0.06}px ${textSize * 0.3}px`,
                  fontSize: textSize * 0.6,
                  color: ink,
                }}
              >
                {cast[speaker].name}
              </div>
            ) : null}
            {/* 没打出来的字也占位（透明），对白框一开始就是最终尺寸，不会边打边长 */}
            <span>{chars.slice(0, shown).join('')}</span>
            <span style={{color: 'transparent'}}>{chars.slice(shown).join('')}</span>
            {/* 打完了右下角闪一个小三角：RPG 里「按键继续」的那个提示 */}
            {!typing && Math.floor(t * 3) % 2 === 0 ? (
              <span
                style={{
                  position: 'absolute',
                  right: textSize * 0.3,
                  bottom: textSize * 0.15,
                  fontSize: textSize * 0.5,
                  color: theme.colors.accent,
                }}
              >
                ▼
              </span>
            ) : null}
          </div>
          {/* 尾巴：逐行收窄的一个像素三角，第一行压在框的下边上把边框「打开」，指向说话的人 */}
          <div
            style={{
              position: 'absolute',
              left: spots[speaker] - (center - bubbleMax / 2) - 4 * dot,
              bottom: -4 * dot,
              opacity: pop.opacity,
            }}
          >
            <PixelArt
              rows={['oTTTTTTo', '.oTTTTo.', '..oTTo..', '...oo...']}
              palette={{o: ink, T: theme.colors.text}}
              dot={dot}
            />
          </div>
        </div>
      ) : null}
      {scene.kicker ? (
        <div
          style={{
            ...scaleIn(chapter, 0.9),
            position: 'absolute',
            ...(format === 'portrait'
              ? {top: height * 0.2, left: 0, right: 0, display: 'flex', justifyContent: 'center'}
              : {left: 48 * unit, bottom: 40 * unit}),
          }}
        >
          <div
            style={{
              ...pixelBox({fill: withAlpha(theme.colors.bg, 0.92), border: theme.colors.accent, dot}),
              padding: `${12 * unit}px ${24 * unit}px`,
              fontFamily: theme.fonts.body,
              fontSize: 30 * unit,
              color: theme.colors.text,
            }}
          >
            {scene.kicker}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 错缝砖：两行一循环，第二行的竖缝错开半块 */
const bricks = (dot: number) => {
  const bw = dot * 24;
  const bh = dot * 8;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bw}' height='${bh * 2}' shape-rendering='crispEdges'><g fill='%234A3329'><rect x='0' y='${bh - dot}' width='${bw}' height='${dot}'/><rect x='0' y='${bh * 2 - dot}' width='${bw}' height='${dot}'/><rect x='${bw - dot}' y='0' width='${dot}' height='${bh}'/><rect x='${bw / 2}' y='${bh}' width='${dot}' height='${bh}'/></g><rect x='0' y='0' width='${bw}' height='${dot}' fill='%237D5845'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/'/g, '%27')}")`;
};

/** 夜窗：木框、十字窗棂、一轮方月亮、几颗轮流闪的星 */
const Window: React.FC<{x: number; y: number; w: number; h: number; dot: number; t: number}> = ({
  x,
  y,
  w,
  h,
  dot,
  t,
}) => {
  const stars = [
    [0.18, 0.22],
    [0.7, 0.16],
    [0.42, 0.62],
    [0.82, 0.72],
    [0.28, 0.82],
  ];
  const moon = Math.round(Math.min(w, h) * 0.22 / dot) * dot;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        ...pixelBox({fill: '#16233B', border: '#8A5A3C', shadow: 'rgba(0,0,0,0.3)', dot: dot * 2}),
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', right: w * 0.14, top: h * 0.14, width: moon, height: moon, backgroundColor: '#F6E7B0'}} />
      {stars.map(([sx, sy], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: sx! * w,
            top: sy! * h,
            width: dot,
            height: dot,
            backgroundColor: '#F4E9D0',
            opacity: (Math.floor(t * 2) + i) % 3 === 0 ? 0.25 : 0.9,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: w / 2 - dot, top: 0, bottom: 0, width: dot * 2, backgroundColor: '#8A5A3C'}} />
      <div style={{position: 'absolute', top: h / 2 - dot, left: 0, right: 0, height: dot * 2, backgroundColor: '#8A5A3C'}} />
    </div>
  );
};
