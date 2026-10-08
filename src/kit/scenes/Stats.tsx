import React from 'react';
import {countTo, rise, spread, useProgress} from '../motion';
import {EASE_OUT} from '../motion';
import {useFormat, useUnit} from '../format';
import {Headline, Kicker} from '../text';
import {Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent, SceneOf} from './types';

export const StatsScene: SceneComponent<'stats'> = ({scene}) => {
  const unit = useUnit();
  const format = useFormat();
  const s = scene.seconds;
  const kick = useProgress({delay: s * 0.03, duration: 0.45});

  return (
    <Stage seconds={s} align={format === 'portrait' ? 'flex-start' : 'center'} justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 22 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      {scene.headline ? (
        <Headline scale={0.7} delay={s * 0.08} per={0.16} style={{marginBottom: 56 * unit}}>
          {scene.headline}
        </Headline>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: format === 'portrait' ? 'column' : 'row',
          gap: format === 'portrait' ? 44 * unit : 96 * unit,
          alignItems: format === 'portrait' ? 'flex-start' : 'flex-end',
        }}
      >
        {scene.items.map((item, i) => (
          <Stat
            key={item.label}
            item={item}
            delay={spread(i, scene.items.length, s, 0.24, 0.56)}
            seconds={s}
            unit={unit}
          />
        ))}
      </div>
    </Stage>
  );
};

const Stat: React.FC<{
  item: SceneOf<'stats'>['items'][number];
  delay: number;
  seconds: number;
  unit: number;
}> = ({item, delay, seconds, unit}) => {
  const theme = useTheme();
  const appear = useProgress({delay, duration: 0.5});
  // 数字滚够久：占本场时长的四成，滚完也快到转场了，中间没有静止段。
  const count = useProgress({delay, duration: seconds * 0.4, easing: EASE_OUT});
  const label = useProgress({delay: delay + 0.25, duration: 0.5});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 10 * unit}}>
      <div
        style={{
          ...rise(appear, 22),
          fontFamily: theme.fonts.display,
          fontSize: 116 * unit,
          lineHeight: 1,
          color: theme.colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {item.prefix ?? ''}
        {countTo(count, item.value, item.decimals ?? 0)}
        {item.suffix ?? ''}
      </div>
      <div
        style={{
          ...rise(label, 14),
          fontFamily: theme.fonts.body,
          fontSize: 28 * unit,
          color: theme.colors.text,
        }}
      >
        {item.label}
      </div>
      {item.note ? (
        <div
          style={{
            ...rise(label, 10),
            fontFamily: theme.fonts.body,
            fontSize: 22 * unit,
            color: theme.colors.muted,
          }}
        >
          {item.note}
        </div>
      ) : null}
    </div>
  );
};
