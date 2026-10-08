import {useVideoConfig} from 'remotion';

export type FormatId = 'landscape' | 'portrait' | 'square';

export const FORMATS: Record<FormatId, {width: number; height: number; label: string}> = {
  landscape: {width: 1920, height: 1080, label: '16:9'},
  portrait: {width: 1080, height: 1920, label: '9:16'},
  square: {width: 1080, height: 1080, label: '1:1'},
};

/** 版式靠画布宽高自己判断，不用往下传 prop。 */
export const useFormat = (): FormatId => {
  const {width, height} = useVideoConfig();
  if (height > width) return 'portrait';
  if (height === width) return 'square';
  return 'landscape';
};

/**
 * 尺寸单位。所有字号/间距都写成 px(n)，这样把 --scale 调到 2 出 4K 时
 * 版面比例不变。基准是画布短边 1080。
 */
export const useUnit = () => {
  const {width, height} = useVideoConfig();
  return Math.min(width, height) / 1080;
};

/** 按版式取值：pick({landscape: 96, portrait: 72, square: 80}) */
export const usePick = <T,>(map: Record<FormatId, T>): T => map[useFormat()];

/**
 * 竖版可用的纵向区间（占画面高度的比例）。
 *
 * 抖音 / Reels / Shorts / 小红书的播放界面：**底部 20% 是文案、账号名和话题**，
 * **右侧一条是点赞收藏按钮**，顶部还有返回和进度条。所以竖版的字只有中上部
 * 这条带是安全的，往下压一点就被盖住。
 *
 * 这不是审美问题，是会不会被挡住的问题 —— 别把主文案放在下半屏。
 */
export const PORTRAIT_SAFE = {top: 0.2, bottom: 0.58};

/** 画面安全边距 —— 竖版要留得多，社媒 UI 会盖住上下。 */
export const useSafePadding = () => {
  const unit = useUnit();
  const format = useFormat();
  if (format === 'portrait') return {x: 72 * unit, y: 220 * unit};
  if (format === 'square') return {x: 80 * unit, y: 96 * unit};
  return {x: 140 * unit, y: 96 * unit};
};
