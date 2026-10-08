import {Img, OffthreadVideo, staticFile} from 'remotion';
import {rise, scaleIn, useKenBurns, useProgress} from '../motion';
import {useFormat, useUnit} from '../format';
import {Lede, Headline, Kicker} from '../text';
import {ScreenPanel, Stage} from '../ui';
import type {SceneComponent} from './types';

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/** 界面展示：左文右图（竖版改成上文下图）。图全程缓推，不当贴片。 */
export const ShowcaseScene: SceneComponent<'showcase'> = ({scene}) => {
  const unit = useUnit();
  const format = useFormat();
  const s = scene.seconds;
  const stacked = format !== 'landscape';
  const kick = useProgress({delay: s * 0.03, duration: 0.45});
  const body = useProgress({delay: s * 0.26, duration: 0.6});
  const media = useProgress({delay: s * 0.18, duration: 0.8});
  const ken = useKenBurns(s, 0.08);
  const isVideo = VIDEO_EXT.test(scene.src);

  const copy = (
    <div style={{flex: stacked ? 'none' : 0.85, display: 'flex', flexDirection: 'column'}}>
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 20 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <Headline scale={stacked ? 0.7 : 0.54} delay={s * 0.08} per={0.16}>
        {scene.headline}
      </Headline>
      {scene.body ? (
        <Lede style={{...rise(body, 20), marginTop: 26 * unit}}>{scene.body}</Lede>
      ) : null}
    </div>
  );

  const frame = (
    <ScreenPanel
      chrome={scene.chrome}
      url={scene.url}
      style={{...scaleIn(media, 0.94), flex: stacked ? 'none' : 1.8, minWidth: 0}}
    >
      {isVideo ? (
        <OffthreadVideo
          src={staticFile(scene.src)}
          style={{width: '100%', display: 'block', ...ken}}
          muted
        />
      ) : (
        <Img src={staticFile(scene.src)} style={{width: '100%', display: 'block', ...ken}} />
      )}
    </ScreenPanel>
  );

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: stacked ? 'column' : scene.side === 'left' ? 'row-reverse' : 'row',
          gap: stacked ? 44 * unit : 64 * unit,
          alignItems: stacked ? 'stretch' : 'center',
        }}
      >
        {copy}
        {frame}
      </div>
    </Stage>
  );
};
