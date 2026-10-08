import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFilm} from '../film';
import {PixelBackdrop} from '../pixel/Backdrop';
import {useTheme, withAlpha} from '../theme';

/**
 * 背景层。**竖版短视频不许拿纯色底当背景** —— 观众是在一屏一屏往下划的，
 * 一块不动的底色跟没做过设计没有区别。
 *
 * 两种：
 *
 * - `gradient`：两团缓慢反向走的光晕。克制，横版讲解片用它，别抢内容。
 * - `aurora`：三到四团大色块各自按不同周期漂移、缩放、明暗呼吸，叠加成极光。
 *   竖版社媒用这个。色块用 `screen` 叠加，边缘全是软的，不会出硬边。
 *
 * 两种都撒一层噪声：大面积暗部渐变在 8bit 上会出同心环带，h264 还会把它放大。
 */

/** 一层细噪声，压掉渐变的色带 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * 每团色块的运动参数。周期都取互质的秒数，这样几团永远不会同时回到原位，
 * 循环感就出不来 —— 三十几秒的片子里，只要有两团同周期就看得出来在打拍子。
 */
const BLOBS = [
  {size: 1.15, x: 0.28, y: 0.3, ax: 0.16, ay: 0.1, period: 23, phase: 0, alpha: 0.3},
  {size: 0.95, x: 0.74, y: 0.62, ax: 0.13, ay: 0.14, period: 31, phase: 1.7, alpha: 0.24},
  {size: 1.35, x: 0.5, y: 0.86, ax: 0.18, ay: 0.09, period: 19, phase: 3.1, alpha: 0.2},
  {size: 0.8, x: 0.2, y: 0.78, ax: 0.1, ay: 0.12, period: 27, phase: 4.4, alpha: 0.16},
];

export const Ambience: React.FC<{seconds: number}> = ({seconds}) => {
  const {background} = useFilm();
  const theme = useTheme();
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  if (background.type === 'plain') return null;
  if (background.type === 'pixel') return <PixelBackdrop />;

  if (background.type === 'aurora') {
    // 没给调色就用主题里的强调色和卡片色，够用但不出彩；短视频建议在脚本里给三四个色。
    const palette =
      background.colors && background.colors.length > 0
        ? background.colors
        : [theme.colors.accent, theme.colors.surface, theme.colors.accent];
    const short = Math.min(width, height);
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {BLOBS.map((b, i) => {
          const w = 2 * Math.PI * (t / b.period) + b.phase;
          const x = (b.x + Math.sin(w) * b.ax) * 100;
          const y = (b.y + Math.cos(w * 0.73) * b.ay) * 100;
          // 明暗也在走：色块不只是位移，亮度跟着呼吸，画面才不像贴纸在滑。
          const breathe = 0.78 + 0.22 * Math.sin(w * 1.31 + i);
          const d = short * b.size * 1.6;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: d,
                height: d,
                marginLeft: -d / 2,
                marginTop: -d / 2,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${withAlpha(
                  palette[i % palette.length]!,
                  b.alpha * breathe,
                )} 0%, ${withAlpha(palette[i % palette.length]!, b.alpha * breathe * 0.4)} 38%, transparent 68%)`,
                mixBlendMode: 'screen',
              }}
            />
          );
        })}
        {/* 暗角。把注意力收回画面中间，顺便压住色块糊到边上的部分。 */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(76% 60% at 50% 46%, transparent 32%, ${withAlpha(
              theme.colors.bg,
              0.9,
            )} 100%)`,
          }}
        />
        <AbsoluteFill
          style={{backgroundImage: NOISE, opacity: 0.035, mixBlendMode: 'overlay'}}
        />
      </AbsoluteFill>
    );
  }

  // gradient：原来那两团，克制版
  const p = Math.min(1, Math.max(0, t / Math.max(seconds, 0.001)));
  const a = `radial-gradient(58% 54% at ${18 + p * 30}% ${34 - p * 22}%, ${withAlpha(
    theme.colors.accent,
    0.09,
  )}, transparent 72%)`;
  const b = `radial-gradient(52% 50% at ${84 - p * 26}% ${68 + p * 18}%, ${withAlpha(
    theme.colors.surface,
    0.5,
  )}, transparent 70%)`;
  return (
    <>
      <AbsoluteFill style={{background: `${a}, ${b}`}} />
      <AbsoluteFill style={{backgroundImage: NOISE, opacity: 0.035, mixBlendMode: 'overlay'}} />
    </>
  );
};
