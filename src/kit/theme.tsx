import React, {createContext, useContext} from 'react';
import {INTER, PIXEL, PLAYFAIR, STACK} from './fonts';

/**
 * 主题只放**纯数据** —— 它会作为 Composition 的 defaultProps 走一遍 JSON
 * 序列化，放函数或组件会炸。
 */
export type Theme = {
  name: string;
  colors: {
    /** 画面底色 */
    bg: string;
    /** 卡片/浮层底色 */
    surface: string;
    /** 正文色 */
    text: string;
    /** 次要文字 */
    muted: string;
    /** 强调色（品牌色） */
    accent: string;
    /** 压在 accent 上的文字色 */
    accentInk: string;
    /** 描边 */
    line: string;
  };
  fonts: {
    /** 标题字体族名 */
    display: string;
    /** 正文字体族名 */
    body: string;
    /**
     * display 字体的平均字宽（em）。按最长行反推字号时要用它，不同字体差很多：
     * Georgia 这类衬线体约 0.55，Anton 这类窄体只有 0.42，用错会白白浪费一半画面
     * 或者顶出去。不给按 0.55 算。
     */
    displayWidth?: number;
  };
  /** 圆角基准值，px */
  radius: number;
  /**
   * 整套外观。不写就是默认的柔和风格；`'pixel'` 换成像素风：卡片和气泡变成缺角像素框
   * 加硬投影、动画按 10fps 逐格走、背景和转场默认换成像素版、`chat` 变成角色对白。
   * 直接用 `pixelTheme`，要换品牌色照常复制一份改 `accent`。
   */
  style?: 'pixel';
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    bg: '#0B0D12',
    surface: '#14181F',
    text: '#F5F7FA',
    muted: '#8A93A3',
    accent: '#C8A24A',
    accentInk: '#0B0D12',
    line: 'rgba(255,255,255,0.10)',
  },
  fonts: {display: `${PLAYFAIR}, ${STACK}`, body: `${INTER}, ${STACK}`},
  radius: 18,
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    bg: '#FBFAF7',
    surface: '#FFFFFF',
    text: '#14181F',
    muted: '#6B7280',
    accent: '#8A6D1F',
    accentInk: '#FFFFFF',
    line: 'rgba(20,24,31,0.10)',
  },
  fonts: {display: `${PLAYFAIR}, ${STACK}`, body: `${INTER}, ${STACK}`},
  radius: 18,
};

/**
 * 像素风。黄昏紫的墙、奶油色的字、橘色强调 —— 色数故意少，像素画靠的是有限调色板，
 * 颜色一多就变回普通插画。
 */
export const pixelTheme: Theme = {
  name: 'pixel',
  style: 'pixel',
  colors: {
    bg: '#241F33',
    surface: '#352E4A',
    text: '#F4E9D0',
    muted: '#A79CBF',
    accent: '#F08A4B',
    accentInk: '#1B1726',
    line: '#4A4163',
  },
  // 像素字体的拉丁字母约半个字宽，中文是满宽。beat 按字符逐个估宽，这里只管拉丁。
  fonts: {display: `"${PIXEL}", ${STACK}`, body: `"${PIXEL}", ${STACK}`, displayWidth: 0.5},
  radius: 0,
};

export const defaultTheme = darkTheme;

export const isPixel = (theme: Theme) => theme.style === 'pixel';

/** 胶囊形的圆角。像素风没有圆角，一条细线画成圆头就露馅了。 */
export const pillRadius = (theme: Theme) => (isPixel(theme) ? 0 : 999);

/**
 * 大字收紧字距。像素字体的字距是画在字形里的，再收就粘成一团，所以像素风不收。
 * `k` 是收紧量占字号的比例。
 */
export const tighten = (theme: Theme, size: number, k: number) => (isPixel(theme) ? 0 : -size * k);

/** 给 token 颜色加透明度。只认 #RRGGBB，别的原样返回。 */
export const withAlpha = (hex: string, alpha: number) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/**
 * 底色算不算深色。用来在深色片子上挑**浅描边**那版标志 —— SVG 里的描边颜色是写死的，
 * 不跟主题变，深描边的压在深底上等于没有标志。
 * 用感知亮度而不是简单平均：同样的数值，绿比蓝亮得多。
 */
export const isDarkBg = (theme: Theme) => {
  const m = /^#([0-9a-f]{6})$/i.exec(theme.colors.bg);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{theme: Theme; children: React.ReactNode}> = ({
  theme,
  children,
}) => <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
