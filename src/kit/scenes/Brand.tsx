import {Img, staticFile} from 'remotion';
import {rise, scaleIn, useProgress, wipe} from '../motion';
import {usePick, useUnit} from '../format';
import {Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent} from './types';

/**
 * 品牌开场。全片第一个镜头，1.5-2.5 秒足够 —— 观众是来看产品的，
 * 不是来看标志的，所以后面第一个界面镜头要尽快接上。
 */
export const BrandScene: SceneComponent<'brand'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const size = usePick({landscape: 84, portrait: 70, square: 76}) * unit;
  // 短镜头，动作必须挤在前六成里，不然还没看清就切走了。
  const mark = useProgress({delay: s * 0.04, duration: s * 0.32});
  const word = useProgress({delay: s * 0.2, duration: s * 0.34});
  const rule = useProgress({delay: s * 0.4, duration: s * 0.3});
  const tag = useProgress({delay: s * 0.5, duration: s * 0.3});

  return (
    <Stage seconds={s} align="center" justify="center">
      {scene.mark ? (
        <Img
          src={staticFile(scene.mark)}
          style={{
            ...scaleIn(mark, 0.7),
            width: size * 2.2,
            height: size * 2.2,
            marginBottom: 26 * unit,
          }}
        />
      ) : null}
      <div
        style={{
          ...rise(word, 18),
          fontFamily: theme.fonts.display,
          fontSize: size,
          letterSpacing: size * 0.08,
          color: theme.colors.text,
        }}
      >
        {scene.wordmark}
      </div>
      <div
        style={{
          ...wipe(rule),
          width: size * 2.4,
          height: 3 * unit,
          backgroundColor: theme.colors.accent,
          marginTop: 22 * unit,
        }}
      />
      {scene.tagline ? (
        <div
          style={{
            ...rise(tag, 14),
            marginTop: 22 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 26 * unit,
            letterSpacing: 26 * unit * 0.04,
            color: theme.colors.muted,
          }}
        >
          {scene.tagline}
        </div>
      ) : null}
    </Stage>
  );
};
