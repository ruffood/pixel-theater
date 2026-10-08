import {Img, staticFile} from 'remotion';
import {rise, scaleIn, useAmbient, useProgress, wipe} from '../motion';
import {usePick, useUnit} from '../format';
import {Stage} from '../ui';
import {pixelBox, pixelDot} from '../pixel/box';
import {isPixel, useTheme} from '../theme';
import type {SceneComponent} from './types';

export const EndScene: SceneComponent<'end'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const size = usePick({landscape: 96, portrait: 76, square: 84}) * unit * (scene.scale ?? 1);
  const mark = useProgress({delay: s * 0.04, duration: 0.7});
  const rule = useProgress({delay: s * 0.24, duration: 0.6});
  const tag = useProgress({delay: s * 0.32, duration: 0.6});
  const cta = useProgress({delay: s * 0.52, duration: 0.6});
  const url = useProgress({delay: s * 0.68, duration: 0.5});
  // 标志跟文字反向漂移，静态收尾卡里也始终有相对运动。
  const parallax = useAmbient(s, {y: -s * 14, scale: 0});

  return (
    <Stage seconds={s} align="center" justify="center">
      {scene.mark ? (
        <Img
          src={staticFile(scene.mark)}
          style={{
            opacity: scaleIn(mark, 0.8).opacity,
            // 两个 transform 要拼起来，直接展开会后者覆盖前者，进场缩放就没了。
            transform: `${scaleIn(mark, 0.8).transform} ${parallax.transform}`,
            // 高度定死、宽度自适应。字标类标志是横长条，写成正方形会被压扁。
            height: size * 1.3,
            width: 'auto',
            maxWidth: '100%',
            marginBottom: 18 * unit,
          }}
        />
      ) : null}
      {scene.wordmark ? (
        <div
          style={{
            ...scaleIn(mark, 0.9),
            fontFamily: theme.fonts.display,
            fontSize: size,
            letterSpacing: size * 0.06,
            color: theme.colors.text,
          }}
        >
          {scene.wordmark}
        </div>
      ) : null}
      <div
        style={{
          ...wipe(rule),
          width: size * 1.6,
          height: 3 * unit,
          backgroundColor: theme.colors.accent,
          marginTop: 24 * unit,
        }}
      />
      {scene.tagline ? (
        <div
          style={{
            ...rise(tag, 20),
            marginTop: 26 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 30 * unit,
            color: theme.colors.muted,
          }}
        >
          {scene.tagline}
        </div>
      ) : null}
      {scene.cta ? (
        <div
          style={{
            ...scaleIn(cta, 0.88),
            marginTop: 52 * unit,
            ...(isPixel(theme)
              ? pixelBox({
                  fill: theme.colors.accent,
                  border: theme.colors.accentInk,
                  shadow: 'rgba(0,0,0,0.4)',
                  dot: pixelDot(unit),
                })
              : {backgroundColor: theme.colors.accent, borderRadius: 999}),
            color: theme.colors.accentInk,
            fontFamily: theme.fonts.body,
            fontWeight: 600,
            fontSize: 28 * unit,
            padding: `${20 * unit}px ${44 * unit}px`,
          }}
        >
          {scene.cta}
        </div>
      ) : null}
      {scene.url ? (
        <div
          style={{
            ...rise(url, 14),
            marginTop: 34 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 26 * unit,
            letterSpacing: 26 * unit * 0.05,
            color: theme.colors.accent,
          }}
        >
          {scene.url}
        </div>
      ) : null}
    </Stage>
  );
};
