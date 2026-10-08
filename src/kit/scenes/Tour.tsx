import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rise, useProgress} from '../motion';
import {useFormat, useUnit} from '../format';
import {Headline, Kicker} from '../text';
import {ScreenPanel, Stage} from '../ui';
import {pillRadius, useTheme} from '../theme';
import type {SceneComponent, SceneOf} from './types';

/** 截图之间的交叉淡入时长（秒）。 */
const CROSS = 0.4;

/**
 * 界面巡览。本场时长平分给每张截图，图之间交叉淡入，左侧标题跟着高亮。
 * 画面主体是产品本身，文字只当说明。
 */
export const TourScene: SceneComponent<'tour'> = ({scene}) => {
  const unit = useUnit();
  const format = useFormat();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = scene.seconds;
  const stacked = format !== 'landscape';
  const per = s / scene.shots.length;
  const active = Math.min(scene.shots.length - 1, Math.floor(frame / fps / per));
  const kick = useProgress({delay: s * 0.02, duration: 0.45});

  const list = (
    <div
      style={{
        flex: stacked ? 'none' : 0.92,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 18 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <Headline scale={stacked ? 0.6 : 0.44} delay={s * 0.06} per={0.15}>
        {scene.headline}
      </Headline>
      <div
        style={{
          marginTop: 34 * unit,
          display: 'flex',
          flexDirection: stacked ? 'row' : 'column',
          flexWrap: 'wrap',
          gap: stacked ? 14 * unit : 4 * unit,
        }}
      >
        {scene.shots.map((shot, i) => (
          <TourLabel
            key={shot.src}
            shot={shot}
            index={i}
            active={i === active}
            per={per}
            unit={unit}
            compact={stacked}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          gap: stacked ? 40 * unit : 52 * unit,
          alignItems: 'center',
        }}
      >
        {list}
        <ScreenPanel
          chrome={scene.chrome}
          url={scene.url}
          style={{flex: stacked ? 'none' : 1.95, width: stacked ? '100%' : undefined}}
        >
          <div style={{position: 'relative', width: '100%', aspectRatio: '1512 / 945'}}>
            {scene.shots.map((shot, i) => (
              <Shot key={shot.src} src={shot.src} index={i} per={per} count={scene.shots.length} />
            ))}
          </div>
        </ScreenPanel>
      </div>
    </Stage>
  );
};

/** 单张截图：本段时间内淡入淡出，并且全程缓推。 */
const Shot: React.FC<{src: string; index: number; per: number; count: number}> = ({
  src,
  index,
  per,
  count,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const start = index * per;
  const end = start + per;
  const opacity = interpolate(
    t,
    [start - CROSS, start, end - (index === count - 1 ? 0 : CROSS * 0.2), end + CROSS],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const zoom = interpolate(t, [start - CROSS, end + CROSS], [1, 1.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        opacity,
        transform: `scale(${zoom})`,
      }}
    />
  );
};

const TourLabel: React.FC<{
  shot: SceneOf<'tour'>['shots'][number];
  index: number;
  active: boolean;
  per: number;
  unit: number;
  compact: boolean;
}> = ({shot, index, active, per, unit, compact}) => {
  const theme = useTheme();
  const enter = useProgress({delay: 0.3 + index * 0.1, duration: 0.5});
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // 高亮条随本段时间推进，是一个持续在动的元素。
  const progress = active
    ? interpolate(frame / fps, [index * per, (index + 1) * per], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div style={{...rise(enter, 14), paddingTop: 12 * unit, paddingBottom: 12 * unit}}>
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: (compact ? 24 : 30) * unit,
          fontWeight: 600,
          color: active ? theme.colors.text : theme.colors.muted,
          opacity: active ? 1 : 0.45,
        }}
      >
        {shot.title}
      </div>
      {!compact && shot.body ? (
        <div
          style={{
            marginTop: 6 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 22 * unit,
            lineHeight: 1.4,
            color: theme.colors.muted,
            opacity: active ? 1 : 0,
            maxWidth: 380 * unit,
          }}
        >
          {shot.body}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 12 * unit,
          height: 3 * unit,
          width: compact ? 60 * unit : '100%',
          maxWidth: 320 * unit,
          backgroundColor: theme.colors.line,
          borderRadius: pillRadius(theme),
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: theme.colors.accent,
            borderRadius: pillRadius(theme),
          }}
        />
      </div>
    </div>
  );
};
