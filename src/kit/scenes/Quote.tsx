import {rise, useProgress, wipe} from '../motion';
import {usePick, useUnit} from '../format';
import {Lines} from '../text';
import {Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent} from './types';

export const QuoteScene: SceneComponent<'quote'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const size = usePick({landscape: 62, portrait: 54, square: 56}) * unit;
  const mark = useProgress({delay: s * 0.03, duration: 0.5});
  const author = useProgress({delay: s * 0.58, duration: 0.5});

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      <div
        style={{
          ...wipe(mark),
          width: 88 * unit,
          height: 4 * unit,
          backgroundColor: theme.colors.accent,
          marginBottom: 40 * unit,
        }}
      />
      <div
        style={{
          fontFamily: theme.fonts.display,
          fontSize: size,
          lineHeight: 1.28,
          color: theme.colors.text,
          maxWidth: 20 * size,
        }}
      >
        <Lines text={scene.quote} delay={s * 0.12} per={s * 0.1} distance={size * 0.4} />
      </div>
      <div style={{...rise(author, 16), marginTop: 44 * unit}}>
        <div style={{fontFamily: theme.fonts.body, fontSize: 28 * unit, color: theme.colors.text}}>
          {scene.author}
        </div>
        {scene.role ? (
          <div
            style={{
              marginTop: 6 * unit,
              fontFamily: theme.fonts.body,
              fontSize: 23 * unit,
              color: theme.colors.muted,
            }}
          >
            {scene.role}
          </div>
        ) : null}
      </div>
    </Stage>
  );
};
