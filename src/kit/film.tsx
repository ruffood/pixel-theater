import React, {createContext, useContext} from 'react';
import type {VideoScript} from './script';

/**
 * 整片级的版面设定，从脚本传到每个场景组件。
 *
 * 为什么要一个 context：`align` 和 `background` 是**整片**的决定，不是某个镜头的。
 * 让每个场景各写各的，结果就是有的居中有的靠左 —— 竖版短视频里这种不一致
 * 一眼就看得出来。
 */
export type FilmLayout = {
  align: NonNullable<VideoScript['align']>;
  background: NonNullable<VideoScript['background']>;
  /** 小剧场要从前面各场推出当前的世界状态，所以把整份脚本也带上 */
  script: VideoScript | null;
};

const DEFAULT: FilmLayout = {align: 'start', background: {type: 'gradient'}, script: null};

const FilmContext = createContext<FilmLayout>(DEFAULT);

export const useFilm = () => useContext(FilmContext);

export const FilmProvider: React.FC<{script: VideoScript; children: React.ReactNode}> = ({
  script,
  children,
}) => (
  <FilmContext.Provider
    value={{
      align: script.align ?? DEFAULT.align,
      // 像素主题配平滑光晕不像样，没写背景就给像素墙
      background:
        script.background ??
        (script.theme.style === 'pixel' ? {type: 'pixel'} : DEFAULT.background),
      script,
    }}
  >
    {children}
  </FilmContext.Provider>
);
