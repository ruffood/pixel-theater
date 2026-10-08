import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rise, useProgress} from '../motion';
import {useSafePadding, useUnit} from '../format';
import {Headline, Kicker} from '../text';
import {useTheme, withAlpha} from '../theme';
import type {SceneComponent} from './types';

/**
 * 界面特写：把截图的某个局部放大占满画面，配一句短文案。
 * 用来在巡览之后给一个「看清楚这里」的重音，全程持续推近。
 */
export const DetailScene: SceneComponent<'detail'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const pad = useSafePadding();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = scene.seconds;
  const fx = scene.focus?.x ?? 0.5;
  const fy = scene.focus?.y ?? 0.5;
  const base = scene.zoom ?? 1.15;
  // 全程推近，关注点始终压在画面中心。
  const z = interpolate(frame, [0, s * fps], [base, base * 1.09], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const kick = useProgress({delay: s * 0.12, duration: 0.5});

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, overflow: 'hidden'}}>
      <Img
        src={staticFile(scene.src)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          // cover + 焦点定位：横竖两个版式都能填满，不会像按宽度缩放那样在竖版留一条。
          objectFit: 'cover',
          objectPosition: `${fx * 100}% ${fy * 100}%`,
          transform: `scale(${z}) translateY(-5%)`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
        }}
      />
      {/* 底部压一层渐变，文案才压得住。 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${theme.colors.bg} 0%, ${withAlpha(
            theme.colors.bg,
            0.82,
          )} 26%, transparent 58%)`,
        }}
      />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: `${pad.y}px ${pad.x}px`,
        }}
      >
        {scene.kicker ? (
          <Kicker style={{...rise(kick, 14), marginBottom: 16 * unit}}>{scene.kicker}</Kicker>
        ) : null}
        <Headline scale={0.6} delay={s * 0.18} per={0.14}>
          {scene.headline}
        </Headline>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
