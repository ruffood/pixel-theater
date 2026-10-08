import {rise, useProgress} from '../motion';
import {usePick, useUnit} from '../format';
import {Lines} from '../text';
import {Stage} from '../ui';
import {tighten, useTheme} from '../theme';
import type {SceneComponent} from './types';

/** 一句话占满画面，用来做节奏上的重音。逐行进，不整块进。 */
export const StatementScene: SceneComponent<'statement'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const size = usePick({landscape: 104, portrait: 84, square: 90}) * unit;
  const pAttr = useProgress({delay: s * 0.62, duration: 0.6});

  return (
    <Stage seconds={s} align="center" justify="center">
      <div
        style={{
          fontFamily: theme.fonts.display,
          fontSize: size,
          lineHeight: 1.16,
          letterSpacing: tighten(theme, size, 0.02),
          color: theme.colors.text,
          maxWidth: 16 * size,
        }}
      >
        <Lines text={scene.text} delay={s * 0.06} per={s * 0.16} distance={size * 0.4} />
      </div>
      {scene.attribution ? (
        <div
          style={{
            ...rise(pAttr, 18),
            marginTop: 40 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 24 * unit,
            letterSpacing: 24 * unit * 0.12,
            textTransform: 'uppercase',
            color: theme.colors.accent,
          }}
        >
          {scene.attribution}
        </div>
      ) : null}
    </Stage>
  );
};
