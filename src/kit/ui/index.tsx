import React, {type CSSProperties} from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import {useFilm} from '../film';
import {useFormat, useSafePadding, useUnit} from '../format';
import {useAmbient} from '../motion';
import {pixelBox, pixelDot} from '../pixel/box';
import {isPixel, pillRadius, useTheme} from '../theme';
import {Ambience} from './Ambience';

/**
 * 每个场景的外壳：底色 + 安全边距 + 竖直排布 + **全场缓慢漂移**。
 *
 * `seconds` 传本场时长，内容会在整场里持续位移一点点。这是「画面不许静止
 * 超过 0.5 秒」那条规矩的兜底：就算内容全落位了，画面也还在动。
 */
export const Stage: React.FC<{
  children: React.ReactNode;
  /** 本场时长（秒），传了才有漂移 */
  seconds?: number;
  align?: 'center' | 'flex-start';
  justify?: 'center' | 'flex-start' | 'space-between';
  style?: CSSProperties;
}> = ({children, seconds, align = 'flex-start', justify = 'center', style}) => {
  const theme = useTheme();
  const pad = useSafePadding();
  const format = useFormat();
  const {height} = useVideoConfig();
  /**
   * 竖版正文比正中**略高一点**：画面底部还有一条居中字幕，正文压在正中会显得
   * 被字幕顶着。多给一段底部内边距，居中的结果就整体上移 —— 这里是屏高的 5%。
   * 横版没有字幕带，正中即可。
   */
  const lift = format === 'portrait' ? height * 0.1 : 0;
  const ambient = useAmbient(seconds ?? 0);
  // 整片说了居中就居中，压过场景各自的偏好。一片之内有的居中有的靠左，一眼就看得出来。
  const film = useFilm();
  const box = film.align === 'center' ? 'center' : align;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        padding: `${pad.y}px ${pad.x}px ${pad.y + lift}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: box,
        justifyContent: justify,
        textAlign: box === 'center' ? 'center' : 'left',
        ...style,
      }}
    >
      {seconds ? <Ambience seconds={seconds} /> : null}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: box,
          ...(seconds ? ambient : null),
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const Card: React.FC<{children: React.ReactNode; style?: CSSProperties}> = ({
  children,
  style,
}) => {
  const theme = useTheme();
  const unit = useUnit();
  return (
    <div
      style={{
        ...(isPixel(theme)
          ? pixelBox({
              fill: theme.colors.surface,
              border: theme.colors.line,
              shadow: 'rgba(0,0,0,0.35)',
              dot: pixelDot(unit),
            })
          : {
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.line}`,
              borderRadius: theme.radius * unit,
            }),
        padding: 36 * unit,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{children: React.ReactNode; style?: CSSProperties}> = ({
  children,
  style,
}) => {
  const theme = useTheme();
  const unit = useUnit();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10 * unit,
        ...(isPixel(theme)
          ? pixelBox({fill: 'transparent', border: theme.colors.line, dot: pixelDot(unit)})
          : {border: `1px solid ${theme.colors.line}`, borderRadius: pillRadius(theme)}),
        padding: `${10 * unit}px ${22 * unit}px`,
        fontFamily: theme.fonts.body,
        fontSize: 22 * unit,
        color: theme.colors.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 方形图标底座，icon 传一个字符（符号或 emoji）。 */
export const Glyph: React.FC<{icon: string; style?: CSSProperties}> = ({icon, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const size = 58 * unit;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: (theme.radius * 0.66) * unit,
        backgroundColor: theme.colors.accent,
        color: theme.colors.accentInk,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        fontFamily: theme.fonts.body,
        flexShrink: 0,
        ...style,
      }}
    >
      {icon}
    </div>
  );
};

/**
 * 常驻标志。放在**上方中间**：竖版顶部约 8-12% 是平台的返回和进度条，
 * 压在 11% 处既避开它们，又在主文案（20% 起）上方，不会打架。
 */
export const Watermark: React.FC<{
  mark?: string;
  wordmark?: string;
  onDark: boolean;
}> = ({mark, wordmark, onDark}) => {
  const theme = useTheme();
  const unit = useUnit();
  const {height} = useVideoConfig();
  const size = 54 * unit;
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: height * 0.105,
        pointerEvents: 'none',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 12 * unit}}>
        {mark ? <Img src={staticFile(mark)} style={{width: size, height: size}} /> : null}
        {wordmark ? (
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontSize: size * 0.72,
              letterSpacing: size * 0.09,
              color: onDark ? '#FFFFFF' : theme.colors.text,
            }}
          >
            {wordmark}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/**
 * 截图面板。默认是一块纯净的圆角卡片 —— 界面在里面缓推时，卡片边框只当取景框，
 * 不会像浏览器框那样让人觉得「同一个窗口怎么一半在动一半不动」。
 *
 * `chrome` 打开才画标题栏和地址栏，只在真要表达「这是浏览器里的网页」时用。
 * 注意开了 chrome 又给里面的内容做缩放，就会出现上面说的那种割裂感。
 */
export const ScreenPanel: React.FC<{
  children: React.ReactNode;
  chrome?: boolean;
  url?: string;
  style?: CSSProperties;
}> = ({children, chrome = false, url, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const bar = 56 * unit;
  return (
    <div
      style={{
        overflow: 'hidden',
        // 像素风的投影是硬的：一格偏移、不模糊。软阴影一出来就像网页截图贴在像素画上。
        ...(isPixel(theme)
          ? pixelBox({
              fill: theme.colors.surface,
              border: theme.colors.line,
              shadow: 'rgba(0,0,0,0.45)',
              dot: pixelDot(unit),
            })
          : {
              borderRadius: theme.radius * unit,
              border: `1px solid ${theme.colors.line}`,
              backgroundColor: theme.colors.surface,
              boxShadow: `0 ${40 * unit}px ${90 * unit}px rgba(0,0,0,0.45)`,
            }),
        ...style,
      }}
    >
      {chrome ? (
        <div
          style={{
            height: bar,
            display: 'flex',
            alignItems: 'center',
            gap: 10 * unit,
            padding: `0 ${20 * unit}px`,
            borderBottom: `1px solid ${theme.colors.line}`,
          }}
        >
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div
              key={c}
              style={{width: 12 * unit, height: 12 * unit, borderRadius: pillRadius(theme), backgroundColor: c}}
            />
          ))}
          {url ? (
            <div
              style={{
                marginLeft: 18 * unit,
                flex: 1,
                height: 32 * unit,
                borderRadius: pillRadius(theme),
                backgroundColor: theme.colors.bg,
                display: 'flex',
                alignItems: 'center',
                padding: `0 ${18 * unit}px`,
                fontFamily: theme.fonts.body,
                fontSize: 18 * unit,
                color: theme.colors.muted,
              }}
            >
              {url}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{position: 'relative', display: 'flex'}}>{children}</div>
    </div>
  );
};
