import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {createTikTokStyleCaptions, type Caption, type TikTokPage} from '@remotion/captions';
import {usePick, useSafePadding, useUnit} from './format';
import type {WordTiming} from './script';
import {isPixel, useTheme, withAlpha} from './theme';

/**
 * 词级字幕。当前这个词高亮，其余同页的词压暗。
 *
 * 时间戳来自语音合成本身（edge-tts 的 WordBoundary），是精确的。别拿 Whisper
 * 去转写我们自己合成的音频再对齐 —— 那是在已有的准确数据上再叠一层猜测。
 *
 * 分页先用官方的 createTikTokStyleCaptions 按停顿分，再按句末标点和词数上限切细。
 * 自己写的那部分只切页，不碰时间戳 —— 老路子是手抄时间轴，句级边界还互相重叠
 * （前一句的结束晚于后一句的开始），那期间旁白已经走了字幕还没走。
 */

/** 同一页里词与词的最大间隔，超过就翻页。 */
const GROUP_MS = 1200;

/**
 * 一页最多几个词。只按时间间隔分页是不够的：一句连贯的旁白里词和词几乎没有停顿，
 * 十七个词会全落进同一页，在竖版上堆成三行，读的人跟不上高亮。
 */
const MAX_TOKENS = 4;

/** 一句说完之后字幕还留多久才消失，毫秒。留一点，不然每句之间都在闪。 */
const LINGER_MS = 400;

/**
 * 再切一刀：句号问号叹号处断开，其余按词数上限断开。
 * 在句子边界翻页读起来最顺 —— 那本来就是人停顿的地方。
 */
const splitPage = (page: TikTokPage): TikTokPage[] => {
  const out: TikTokPage[] = [];
  let current: TikTokPage['tokens'] = [];
  const flush = () => {
    if (current.length === 0) return;
    const startMs = current[0]!.fromMs;
    out.push({
      text: current.map((t) => t.text).join(' ').trim(),
      startMs,
      durationMs: current[current.length - 1]!.toMs - startMs,
      tokens: current,
    });
    current = [];
  };
  for (const token of page.tokens) {
    current.push(token);
    if (/[.!?\u2026]$/.test(token.text.trim()) || current.length >= MAX_TOKENS) flush();
  }
  flush();
  return out;
};

export const Captions: React.FC<{
  words: WordTiming[];
  /** 旁白相对本场开头的延迟（秒），跟 scene.voiceDelay 一致 */
  offset?: number;
}> = ({words, offset = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const theme = useTheme();
  const unit = useUnit();
  const pad = useSafePadding();
  const size = usePick({landscape: 46, portrait: 58, square: 52}) * unit;

  const pages = useMemo(() => {
    const captions: Caption[] = words.map((w) => ({
      text: w.word,
      startMs: w.startMs,
      endMs: w.endMs,
      timestampMs: w.startMs,
      confidence: null,
    }));
    const grouped = createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: GROUP_MS,
    }).pages;
    return grouped.flatMap(splitPage);
  }, [words]);

  const ms = (frame / fps) * 1000 - offset * 1000;
  // 取最后一个已经开始的页面。用「已开始」而不是「区间命中」，页与页之间的空隙
  // 才不会闪一下空白。
  let page = null as (typeof pages)[number] | null;
  for (const p of pages) {
    if (p.startMs <= ms) page = p;
  }
  if (!page || ms > page.startMs + page.durationMs + LINGER_MS) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: pad.y,
        paddingLeft: pad.x,
        paddingRight: pad.x,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: `${size * 0.18}px ${size * 0.32}px`,
          fontFamily: theme.fonts.body,
          fontSize: size,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: 'center',
          // 字幕经常压在画面上，光靠颜色分不开。给一层暗描边保底。
          // 像素风用不模糊的硬阴影，四个方向各偏一格，等于一圈像素描边。
          textShadow: isPixel(theme)
            ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]
                .map(([x, y]) => `${x! * size * 0.08}px ${y! * size * 0.08}px 0 ${theme.colors.accentInk}`)
                .join(', ')
            : `0 ${size * 0.06}px ${size * 0.24}px ${withAlpha(theme.colors.bg, 0.85)}`,
        }}
      >
        {page.tokens.map((token, i) => {
          const active = ms >= token.fromMs && ms < token.toMs;
          return (
            <span
              key={`${i}-${token.fromMs}`}
              style={{
                color: active ? theme.colors.accent : theme.colors.text,
                // 当前词稍微放大一点。字幕本身在逐词走，这里不需要再加动画。
                transform: `scale(${active ? 1.06 : 1})`,
                display: 'inline-block',
              }}
            >
              {token.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
