import {rise, useProgress} from '../motion';
import {useUnit} from '../format';
import {Headline, Kicker, Lede} from '../text';
import {Stage} from '../ui';
import {useTheme} from '../theme';
import type {SceneComponent} from './types';

export const TitleScene: SceneComponent<'title'> = ({scene}) => {
  const unit = useUnit();
  const theme = useTheme();
  const s = scene.seconds;
  // 分批到达：最后一件在本场 ~60% 处才落位，画面不会进完就冻住。
  const pKicker = useProgress({delay: s * 0.04, duration: 0.55});
  const pSub = useProgress({delay: s * 0.42, duration: 0.7});
  const pFoot = useProgress({delay: s * 0.6, duration: 0.6});

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(pKicker, 16), marginBottom: 28 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      {/*
        instant：负的 delay 让进场动画在第 0 帧之前就走完，标题一上来就是完整的。
        画面并没有因此静止 —— Stage 的漂移和背景光晕照常在动。
      */}
      <Headline delay={scene.instant ? -1 : s * 0.14} per={scene.instant ? 0 : 0.18}>
        {scene.headline}
      </Headline>
      {scene.sub ? (
        <Lede style={{...rise(pSub, 26), marginTop: 32 * unit}}>{scene.sub}</Lede>
      ) : null}
      {scene.footnote ? (
        <div
          style={{
            ...rise(pFoot, 20),
            marginTop: 46 * unit,
            fontFamily: theme.fonts.body,
            fontSize: 22 * unit,
            color: theme.colors.muted,
          }}
        >
          {scene.footnote}
        </div>
      ) : null}
    </Stage>
  );
};
