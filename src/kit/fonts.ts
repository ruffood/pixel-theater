/**
 * 字体统一在这里加载。@remotion/google-fonts 在渲染时会去 gstatic 取 woff2，
 * Remotion 会等字体就绪再截帧，所以渲染机需要能联网。断网环境把字体文件放到
 * assets/fonts/ 下，改用 @remotion/fonts 的 loadFont({ url }) 即可。
 */
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import fusionPixel from './assets/fusion-pixel/fusion-pixel-12px-proportional-zh_hans.otf.woff2';

export const INTER = loadInter().fontFamily;
export const PLAYFAIR = loadPlayfair().fontFamily;
/** 窄体重磅无衬线。快切短片用，字能上到衬线体的一倍半大还装得下 */
export const ANTON = loadAnton().fontFamily;

/** 兜底字体栈：主字体没加载出来时不至于跳成 Times。 */
export const STACK = `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

/**
 * 像素字体：Fusion Pixel 12px 简体中文版（OFL，见 assets/fusion-pixel/OFL.txt）。
 * Google Fonts 里的像素字体都不带简体中文，混排会一半像素一半黑体，所以自带文件。
 *
 * 不在模块顶层加载：650KB 的字体只有像素主题的片子用得上，别的片子不该为它等。
 * Storyboard 里调 usePixelFont(是否像素主题)。
 */
export const PIXEL = 'Fusion Pixel 12';

let pixelFont: Promise<void> | null = null;
const loadPixelFont = () => {
  pixelFont ??= new FontFace(PIXEL, `url(${fusionPixel}) format('woff2')`)
    .load()
    .then((face) => {
      document.fonts.add(face);
    });
  return pixelFont;
};

export const usePixelFont = (enabled: boolean) => {
  const [handle] = useState(() => (enabled ? delayRender('加载像素字体') : null));
  useEffect(() => {
    if (handle === null) return;
    loadPixelFont()
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle]);
};
