import React from 'react';
import {rise, scaleIn, spread, useProgress} from '../motion';
import {useFormat, useUnit} from '../format';
import {Body, Headline, Kicker} from '../text';
import {Card, Glyph, Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent, SceneOf} from './types';

export const FeaturesScene: SceneComponent<'features'> = ({scene}) => {
  const unit = useUnit();
  const format = useFormat();
  const s = scene.seconds;
  const columns = format === 'landscape' ? 3 : format === 'square' ? 2 : 1;
  const kick = useProgress({delay: s * 0.03, duration: 0.45});

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 22 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <Headline scale={0.72} delay={s * 0.08} per={0.16}>
        {scene.headline}
      </Headline>
      <div
        style={{
          marginTop: 48 * unit,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 24 * unit,
        }}
      >
        {scene.items.map((item, i) => (
          <FeatureCard
            key={item.title}
            item={item}
            delay={spread(i, scene.items.length, s, 0.28, 0.74)}
            unit={unit}
          />
        ))}
      </div>
    </Stage>
  );
};

const FeatureCard: React.FC<{
  item: SceneOf<'features'>['items'][number];
  delay: number;
  unit: number;
}> = ({item, delay, unit}) => {
  const theme = useTheme();
  const card = useProgress({delay, duration: 0.6});
  // 卡片进来之后图标和正文再各补一拍，一张卡内部也有三段动作。
  const glyph = useProgress({delay: delay + 0.18, duration: 0.5});
  const body = useProgress({delay: delay + 0.3, duration: 0.5});
  return (
    <Card style={{...scaleIn(card, 0.96), display: 'flex', flexDirection: 'column', gap: 18 * unit}}>
      <Glyph icon={item.icon} style={scaleIn(glyph, 0.6)} />
      <div
        style={{
          ...rise(glyph, 12),
          fontFamily: theme.fonts.body,
          fontWeight: 600,
          fontSize: 30 * unit,
          color: theme.colors.text,
        }}
      >
        {item.title}
      </div>
      <Body style={rise(body, 10)}>{item.body}</Body>
    </Card>
  );
};
