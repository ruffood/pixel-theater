import React from 'react';
import {rise, scaleIn, spread, useProgress} from '../motion';
import {useFormat, useUnit} from '../format';
import {Headline, Kicker} from '../text';
import {Card, Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent} from './types';

export const PricingScene: SceneComponent<'pricing'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const format = useFormat();
  const s = scene.seconds;
  const kick = useProgress({delay: s * 0.03, duration: 0.45});
  const card = useProgress({delay: s * 0.22, duration: 0.7});
  const price = useProgress({delay: s * 0.3, duration: 0.6});
  const note = useProgress({delay: s * 0.72, duration: 0.5});

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 22 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <Headline scale={0.74} delay={s * 0.08} per={0.16}>
        {scene.headline}
      </Headline>
      <Card
        style={{
          ...scaleIn(card, 0.96),
          marginTop: 48 * unit,
          width: '100%',
          display: 'flex',
          flexDirection: format === 'landscape' ? 'row' : 'column',
          gap: 48 * unit,
          alignItems: format === 'landscape' ? 'center' : 'flex-start',
        }}
      >
        <div style={{flexShrink: 0}}>
          <div
            style={{
              ...scaleIn(price, 0.82),
              fontFamily: theme.fonts.display,
              fontSize: 120 * unit,
              lineHeight: 1,
              color: theme.colors.accent,
            }}
          >
            {scene.price}
          </div>
          {scene.per ? (
            <div
              style={{
                ...rise(price, 12),
                marginTop: 12 * unit,
                fontFamily: theme.fonts.body,
                fontSize: 24 * unit,
                color: theme.colors.muted,
                whiteSpace: 'pre-line',
              }}
            >
              {scene.per}
            </div>
          ) : null}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 14 * unit}}>
          {scene.includes.map((line, i) => (
            <Include
              key={line}
              text={line}
              delay={spread(i, scene.includes.length, s, 0.36, 0.78)}
              unit={unit}
            />
          ))}
        </div>
      </Card>
      {scene.note ? (
        <div
          style={{
            ...rise(note, 16),
            marginTop: 28 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 22 * unit,
            color: theme.colors.muted,
          }}
        >
          {scene.note}
        </div>
      ) : null}
    </Stage>
  );
};

const Include: React.FC<{text: string; delay: number; unit: number}> = ({text, delay, unit}) => {
  const theme = useTheme();
  const p = useProgress({delay, duration: 0.45});
  const tick = useProgress({delay: delay - 0.1, duration: 0.35});
  return (
    <div style={{display: 'flex', gap: 14 * unit, alignItems: 'baseline'}}>
      <span style={{...scaleIn(tick, 0.4), color: theme.colors.accent, fontSize: 24 * unit}}>✓</span>
      <span
        style={{
          ...rise(p, 14),
          fontFamily: theme.fonts.body,
          fontSize: 27 * unit,
          color: theme.colors.text,
        }}
      >
        {text}
      </span>
    </div>
  );
};
