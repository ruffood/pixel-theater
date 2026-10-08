import React from 'react';
import {rise, spread, useProgress, wipe} from '../motion';
import {useUnit, usePick} from '../format';
import {Headline, Kicker} from '../text';
import {Stage} from '../ui';
import {pillRadius, useTheme} from '../theme';
import type {SceneComponent} from './types';

export const BulletsScene: SceneComponent<'bullets'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const itemSize = usePick({landscape: 36, portrait: 36, square: 34}) * unit;
  const kick = useProgress({delay: s * 0.03, duration: 0.5});

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 24 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <Headline scale={0.82} delay={s * 0.1} per={0.16}>
        {scene.headline}
      </Headline>
      <div style={{marginTop: 52 * unit, display: 'flex', flexDirection: 'column', gap: 26 * unit}}>
        {scene.items.map((item, i) => (
          <Item
            key={item}
            text={item}
            delay={spread(i, scene.items.length, s, 0.34, 0.78)}
            size={itemSize}
            unit={unit}
            accent={theme.colors.accent}
            font={theme.fonts.body}
            color={theme.colors.text}
            radius={pillRadius(theme)}
          />
        ))}
      </div>
    </Stage>
  );
};

const Item: React.FC<{
  text: string;
  delay: number;
  size: number;
  unit: number;
  accent: string;
  font: string;
  color: string;
  radius: number;
}> = ({text, delay, size, unit, accent, font, color, radius}) => {
  const p = useProgress({delay, duration: 0.55});
  // 短横先擦出来再出字，一条要点内部也有两拍。
  const dash = useProgress({delay: delay - 0.12, duration: 0.35});
  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: 20 * unit}}>
      {/* 用一条线做项目符号，不用破折号字符 —— 画面文案不出现破折号。 */}
      <div
        style={{
          ...wipe(dash),
          width: size * 0.62,
          height: Math.max(2, size * 0.055),
          backgroundColor: accent,
          borderRadius: radius,
          flexShrink: 0,
          transform: `translateY(${-size * 0.3}px)`,
        }}
      />
      <div style={{...rise(p, 22), fontFamily: font, fontSize: size, lineHeight: 1.35, color}}>
        {text}
      </div>
    </div>
  );
};
