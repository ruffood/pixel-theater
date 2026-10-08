import React from 'react';
import {rise, spread, useProgress} from '../motion';
import {usePick, useUnit} from '../format';
import {Kicker} from '../text';
import {Stage} from '../ui';
import {isPixel, useTheme, withAlpha} from '../theme';
import {PixelChat} from './PixelChat';
import type {SceneComponent} from './types';

/** 像素主题下换成角色对白（见 PixelChat），别的主题是一屏气泡。 */
export const ChatScene: SceneComponent<'chat'> = ({scene}) =>
  isPixel(useTheme()) ? <PixelChat scene={scene} /> : <BubbleChat scene={scene} />;

/**
 * 对话：气泡按顺序冒出来，用来演示「跟智能体聊」这件事本身。
 *
 * 左右分边不靠 Stage 的 align：整片说了居中，Stage 会把内容压成一列，
 * 对话就没有来回感了。所以容器占满宽度，每个气泡自己用 alignSelf 决定靠哪边。
 *
 * 气泡数量控制在 2 到 3 条。竖版一屏放得下的就这么多，四条以上字号会小到看不清，
 * 而观众在一拍里本来也只读得完两三句。
 */
const BubbleChat: SceneComponent<'chat'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const s = scene.seconds;
  const size = usePick({landscape: 30, portrait: 38, square: 34}) * unit;
  const kick = useProgress({delay: s * 0.02, duration: 0.4});
  const n = scene.messages.length;

  return (
    <Stage seconds={s} align="flex-start" justify="center">
      {scene.kicker ? (
        <Kicker style={{...rise(kick, 14), marginBottom: 30 * unit}}>{scene.kicker}</Kicker>
      ) : null}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20 * unit,
          textAlign: 'left',
        }}
      >
        {scene.messages.map((m, i) => (
          <Bubble
            key={`${i}-${m.text}`}
            text={m.text}
            mine={m.from === 'user'}
            // 快节奏：气泡在本场 60% 处全部到位，剩下的时间留给人读完。
            delay={spread(i, n, s, 0.04, 0.6)}
            size={size}
            unit={unit}
            theme={theme}
          />
        ))}
      </div>
    </Stage>
  );
};

const Bubble: React.FC<{
  text: string;
  mine: boolean;
  delay: number;
  size: number;
  unit: number;
  theme: ReturnType<typeof useTheme>;
}> = ({text, mine, delay, size, unit, theme}) => {
  const p = useProgress({delay, duration: 0.42});
  return (
    <div
      style={{
        ...rise(p, 26),
        // 自己那侧靠右、智能体那侧靠左。宽度留白，两边都不顶到边缘，
        // 一眼就看得出这是两个人在说话。
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        // 弹一点点，快片子里比纯淡入有精神
        transform: `${(rise(p, 26).transform ?? '')} scale(${0.965 + p * 0.035})`,
        backgroundColor: mine ? theme.colors.accent : theme.colors.surface,
        color: mine ? theme.colors.accentInk : theme.colors.text,
        border: mine ? 'none' : `1px solid ${withAlpha(theme.colors.text, 0.14)}`,
        borderRadius: theme.radius * 2.2 * unit,
        // 靠向对方那一角收一点，气泡才像气泡不像卡片
        [mine ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: theme.radius * 0.5 * unit,
        padding: `${size * 0.62}px ${size * 0.78}px`,
        fontFamily: theme.fonts.body,
        fontSize: size,
        lineHeight: 1.32,
      }}
    >
      {text}
    </div>
  );
};
