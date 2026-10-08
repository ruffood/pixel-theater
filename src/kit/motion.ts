import type {CSSProperties} from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {isPixel, useTheme} from './theme';

/** 收尾很软的缓出，界面动画默认用它。 */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 像素风的动画帧率。逐格走是像素画的手感，30fps 平滑插值一看就是矢量动画。 */
export const PIXEL_FPS = 10;

/**
 * 动画用的帧号。像素主题下按 PIXEL_FPS 取整，于是所有进场、漂移都一格一格地跳；
 * 别的主题原样返回。场景里要做「跟着时间走」的动画，用它代替 useCurrentFrame。
 */
export const useMotionFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pixel = isPixel(useTheme());
  if (!pixel) return frame;
  const step = Math.max(1, Math.round(fps / PIXEL_FPS));
  return Math.floor(frame / step) * step;
};

type ProgressOptions = {
  /** 秒 */
  delay?: number;
  /** 秒 */
  duration?: number;
  easing?: (n: number) => number;
};

/** 0→1 的进度，用秒描述，内部换算成帧。 */
export const useProgress = ({delay = 0, duration = 0.6, easing = EASE_OUT}: ProgressOptions = {}) => {
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  return interpolate(frame, [delay * fps, (delay + duration) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
};

/** 弹性进度，适合图标、徽标这类需要一点物理感的元素。 */
export const useSpringProgress = ({delay = 0, damping = 200, stiffness = 100} = {}) => {
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay * fps, fps, config: {damping, stiffness}});
};

/** 场景末尾淡出：exitAt 之前是 1，之后线性到 0。 */
export const useExit = ({exitAt, duration = 0.35}: {exitAt: number; duration?: number}) => {
  const frame = useMotionFrame();
  const {fps} = useVideoConfig();
  return interpolate(frame, [exitAt * fps, (exitAt + duration) * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN,
  });
};

/** 第 i 个元素该等多久。列表、宫格统一用它排队。 */
export const stagger = (index: number, per = 0.08, base = 0) => base + index * per;

/**
 * 本场该用多长的进场动画。默认 0.6 秒是给 4 秒以上镜头的；快切片里一个镜头
 * 只有 1.5 秒，0.6 秒的淡入还没结束镜头就切走了，看着像每一帧都糊着。
 */
export const entrance = (seconds: number, max = 0.6) =>
  Math.max(0.16, Math.min(max, seconds * 0.26));

/**
 * 把 count 个元素的进场时间摊到整场里，而不是挤在开头一秒。
 * 返回第 index 个的延迟（秒）。start/end 是占本场时长的比例。
 *
 * 这条是硬规矩的落点：画面不许静止超过 0.5 秒，所以内容要一直在到达，
 * 不能前一秒全落位、后四秒冻着。
 */
export const spread = (index: number, count: number, seconds: number, start = 0.06, end = 0.66) => {
  if (count <= 1) return seconds * start;
  return seconds * (start + (end - start) * (index / (count - 1)));
};

/**
 * 全场不停的缓慢漂移。每个场景的 Stage 都挂它，保证任何一帧画面都在动。
 * 幅度故意小：看得出来在动，但不抢内容。
 */
export const useAmbient = (
  seconds: number,
  {y = 46, scale = 0.022}: {y?: number; scale?: number} = {},
): CSSProperties => {
  const frame = useMotionFrame();
  const {fps, width, height} = useVideoConfig();
  const pixel = isPixel(useTheme());
  const t = interpolate(frame, [0, seconds * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 位移量按时长放大，保证一个最低漂移速率（约 9px/秒）。固定位移在长镜头里
  // 摊得太慢，等于没动 —— 片尾那种 8 秒的静态卡片就是这么冻住的。
  // 用绝对值取下限再补回符号，否则传负数（反向漂移）会被 Math.max 直接吃掉。
  const travel = Math.max(Math.abs(y), seconds * 9) * (y < 0 ? -1 : 1);
  if (pixel) {
    // 像素风只平移不缩放：缩放会把像素字体的点阵糊成灰边。位移对齐到 2 个单位的网格。
    const grid = 2 * (Math.min(width, height) / 1080);
    return {transform: `translateY(${Math.round(((0.5 - t) * travel) / grid) * grid}px)`};
  }
  return {transform: `translateY(${(0.5 - t) * travel}px) scale(${1 + t * scale})`};
};

/** 媒体的缓推（Ken Burns）。整场持续放大，界面图不会看着像贴片。 */
export const useKenBurns = (seconds: number, amount = 0.07): CSSProperties => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [0, seconds * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {transform: `scale(${1 + t * amount})`, transformOrigin: 'center center'};
};

// —— 把进度换成 style ——

export const rise = (p: number, distance = 28): CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
});

export const fall = (p: number, distance = 28): CSSProperties => ({
  opacity: p,
  transform: `translateY(${-(1 - p) * distance}px)`,
});

export const scaleIn = (p: number, from = 0.94): CSSProperties => ({
  opacity: p,
  transform: `scale(${from + (1 - from) * p})`,
});

export const blurIn = (p: number, amount = 10): CSSProperties => ({
  opacity: p,
  filter: `blur(${(1 - p) * amount}px)`,
});

/** 遮罩擦除，文字整行出现时比淡入更利落。 */
export const wipe = (p: number): CSSProperties => ({
  clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
});

/** 数字滚动。返回已经按 decimals 截好的字符串。 */
export const countTo = (p: number, target: number, decimals = 0) =>
  (target * p).toFixed(decimals);
