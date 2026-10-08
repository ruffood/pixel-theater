import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {useMotionFrame} from '../motion';
import {useTheme, withAlpha} from '../theme';

/**
 * 像素背景：竖条木板墙 + 两团抖动网点光 + 往上飘的光尘。
 *
 * 光不用 radial-gradient：平滑渐变一出现就不是像素画了。这里按 4×4 Bayer 矩阵做有序抖动
 * —— 越靠近光心，格子点亮的比例越高，边缘只剩稀疏的棋盘点。整张图拼成一条 SVG path，
 * 一千多个格子只占一个 DOM 节点。
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 光团：位置和半径是占画面短边的比例，周期取互质秒数，免得两团同步打拍子 */
const GLOWS = [
  {x: 0.3, y: 0.34, r: 0.42, ax: 0.08, ay: 0.05, period: 17, phase: 0, density: 0.62, alpha: 0.22},
  {x: 0.76, y: 0.66, r: 0.36, ax: 0.06, ay: 0.07, period: 23, phase: 2.1, density: 0.5, alpha: 0.16},
];

/** 光尘的种子。确定性的伪随机，同一帧渲几次都一样。 */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const MOTES = Array.from({length: 18}, (_, i) => ({
  x: rand(i),
  y: rand(i + 50),
  speed: 0.02 + rand(i + 100) * 0.03,
  accent: rand(i + 150) > 0.7,
}));

export const PixelBackdrop: React.FC<{
  /** 画木板墙。小剧场自己在世界里画墙（要跟镜头一起走），这里就不画 */
  planks?: boolean;
}> = ({planks = true}) => {
  const theme = useTheme();
  const frame = useMotionFrame();
  const {fps, width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 1080;
  const t = frame / fps;
  const cell = Math.max(2, Math.round(8 * unit));
  const short = Math.min(width, height);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const plank = Math.round(120 * unit);

  const glows = GLOWS.map((g, gi) => {
    const w = (2 * Math.PI * t) / g.period + g.phase;
    const cx = g.x * width + Math.sin(w) * g.ax * short;
    const cy = g.y * height + Math.cos(w * 0.8) * g.ay * short;
    const r = g.r * short;
    let d = '';
    const c0 = Math.max(0, Math.floor((cx - r) / cell));
    const c1 = Math.min(cols, Math.ceil((cx + r) / cell));
    const r0 = Math.max(0, Math.floor((cy - r) / cell));
    const r1 = Math.min(rows, Math.ceil((cy + r) / cell));
    for (let row = r0; row < r1; row++) {
      for (let col = c0; col < c1; col++) {
        const dx = (col + 0.5) * cell - cx;
        const dy = (row + 0.5) * cell - cy;
        const k = 1 - Math.sqrt(dx * dx + dy * dy) / r;
        if (k <= 0) continue;
        const threshold = (BAYER[(row % 4) * 4 + (col % 4)]! + 0.5) / 16;
        if (k * g.density > threshold) d += `M${col * cell} ${row * cell}h${cell}v${cell}h${-cell}z`;
      }
    }
    const color = gi === 0 ? theme.colors.accent : theme.colors.muted;
    return {d, color, alpha: g.alpha};
  });

  const mote = Math.max(2, Math.round(6 * unit));

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* 木板墙：每块板右边一道暗缝 */}
      {planks ? (
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent ${
            plank - cell
          }px, rgba(0,0,0,0.16) ${plank - cell}px, rgba(0,0,0,0.16) ${plank}px)`,
        }}
      />
      ) : null}
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}} shapeRendering="crispEdges">
        {glows.map((g, i) => (
          <path key={i} d={g.d} fill={withAlpha(g.color, g.alpha)} />
        ))}
        {MOTES.map((m, i) => {
          // 往上飘，出了顶边从底下再进来；三拍里亮一拍暗两拍，像在闪
          const y = ((m.y - t * m.speed) % 1 + 1) % 1;
          const on = (Math.floor(t * 3) + i) % 3 !== 0;
          const x = Math.round((m.x * width) / mote) * mote;
          return (
            <rect
              key={i}
              x={x}
              y={Math.round((y * height) / mote) * mote}
              width={mote}
              height={mote}
              fill={withAlpha(m.accent ? theme.colors.accent : theme.colors.text, on ? 0.5 : 0.18)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
