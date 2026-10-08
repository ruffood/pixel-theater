import React, {type CSSProperties} from 'react';
import {usePick, useUnit} from '../format';
import {rise, useProgress} from '../motion';
import {tighten, useTheme} from '../theme';

type TextProps = {children: React.ReactNode; style?: CSSProperties};

/** 标题上方那行小字。全大写 + 拉开字距。 */
export const Kicker: React.FC<TextProps> = ({children, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const size = usePick({landscape: 20, portrait: 24, square: 22}) * unit;
  return (
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontSize: size,
        letterSpacing: size * 0.16,
        textTransform: 'uppercase',
        fontWeight: 600,
        color: theme.colors.accent,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * 一段文字按 \n 拆成行，逐行进场。整块一起淡入会让画面「进完就冻住」，
 * 逐行进是让开场持续有动作的最省事办法。
 */
export const Lines: React.FC<{
  text: string;
  /** 秒 */
  delay?: number;
  /** 行间隔，秒 */
  per?: number;
  distance?: number;
}> = ({text, delay = 0, per = 0.14, distance = 30}) => (
  <>
    {text.split('\n').map((line, i) => (
      <Line key={`${i}-${line}`} text={line} delay={delay + i * per} distance={distance} />
    ))}
  </>
);

const Line: React.FC<{text: string; delay: number; distance: number}> = ({
  text,
  delay,
  distance,
}) => {
  const p = useProgress({delay, duration: 0.65});
  return <div style={{...rise(p, distance), whiteSpace: 'pre'}}>{text || '\u00a0'}</div>;
};

/** 主标题。字符串里的 \n 会断行，并且逐行进场。 */
export const Headline: React.FC<{
  children: string;
  /** 秒 */
  delay?: number;
  per?: number;
  scale?: number;
  style?: CSSProperties;
}> = ({children, delay = 0, per = 0.14, scale = 1, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const size = usePick({landscape: 92, portrait: 76, square: 80}) * unit * scale;
  return (
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: tighten(theme, size, 0.02),
        fontWeight: 500,
        color: theme.colors.text,
        ...style,
      }}
    >
      <Lines text={children} delay={delay} per={per} distance={size * 0.36} />
    </div>
  );
};

/** 标题下的说明段。 */
export const Lede: React.FC<TextProps> = ({children, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const size = usePick({landscape: 34, portrait: 34, square: 32}) * unit;
  return (
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontSize: size,
        lineHeight: 1.45,
        color: theme.colors.muted,
        whiteSpace: 'pre-line',
        maxWidth: 26 * size,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 卡片里的小正文。 */
export const Body: React.FC<TextProps> = ({children, style}) => {
  const theme = useTheme();
  const unit = useUnit();
  const size = usePick({landscape: 24, portrait: 26, square: 25}) * unit;
  return (
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontSize: size,
        lineHeight: 1.5,
        color: theme.colors.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
