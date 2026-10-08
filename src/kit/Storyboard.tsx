import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Captions} from './Captions';
import {FilmProvider} from './film';
import {usePixelFont} from './fonts';
import {pixelDissolve} from './pixel';
import {transitionOf, type Scene, type VideoScript} from './script';
import {renderScene} from './scenes';
import {isDarkBg, ThemeProvider, useTheme} from './theme';
import {Watermark} from './ui';

/**
 * 把脚本铺成时间轴。整条片子只有这一个入口组件，所有 composition 都用它，
 * 区别只在传进来的 script 和画布尺寸。
 */
export const Storyboard: React.FC<{script: VideoScript}> = ({script}) => {
  const transition = transitionOf(script);
  const transitionFrames = Math.round(transition.seconds * script.fps);
  const presentation =
    transition.type === 'slide' ? slide() : transition.type === 'pixel' ? pixelDissolve() : fade();
  usePixelFont(script.theme.style === 'pixel');

  /**
   * 音乐闪避。只在**旁白稀疏**时才有意义：旁白铺满全片的话，压低整条音乐轨即可，
   * 不用做曲线。这条曲线是给踩点快切那种片子的 —— 旁白只覆盖一段，
   * 剩下的时间音乐是主角，两边音量差着 10 dB 以上。
   */
  const vo = script.voiceover;
  const musicBase = script.musicVolume ?? 0.1;
  const musicVolume =
    vo?.seconds === undefined
      ? musicBase
      : (f: number) => {
          const start = (vo.delay ?? 0) * script.fps;
          const end = start + vo.seconds! * script.fps;
          const ramp = 0.35 * script.fps;
          const inside = Math.max(
            0,
            Math.min(1, Math.min((f - start + ramp) / ramp, (end + ramp - f) / ramp)),
          );
          return musicBase * (1 - inside * (1 - (vo.duck ?? 0.3)));
        };

  const nodes: React.ReactNode[] = [];
  script.scenes.forEach((scene, index) => {
    if (index > 0 && transition.type !== 'none') {
      nodes.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id}`}
          presentation={presentation}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />,
      );
    }
    nodes.push(
      <TransitionSeries.Sequence
        key={scene.id}
        durationInFrames={Math.round(scene.seconds * script.fps)}
      >
        <SceneSlot
          scene={scene}
          captions={script.captions !== false}
          watermark={script.watermark}
        />
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <ThemeProvider theme={script.theme}>
      <FilmProvider script={script}>
      <AbsoluteFill style={{backgroundColor: script.theme.colors.bg}}>
        {script.music ? (
          <Audio src={staticFile(script.music)} volume={musicVolume} loop />
        ) : null}
        {script.voiceover ? (
          <Sequence from={Math.round((script.voiceover.delay ?? 0) * script.fps)}>
            <Audio
              src={staticFile(script.voiceover.src)}
              volume={script.voiceover.volume ?? 1}
            />
          </Sequence>
        ) : null}
        <TransitionSeries>{nodes}</TransitionSeries>
      </AbsoluteFill>
      </FilmProvider>
    </ThemeProvider>
  );
};

const SceneSlot: React.FC<{
  scene: Scene;
  captions: boolean;
  watermark?: VideoScript['watermark'];
}> = ({scene, captions, watermark}) => {
  const {fps} = useVideoConfig();
  const theme = useTheme();
  // 片头 brand 和片尾 end 自带标志，再压一个就重了
  const wantsMark = watermark && scene.type !== 'brand' && scene.type !== 'end';
  // beat 的底色逐拍换，标志得跟着换深浅；其余镜头按**主题底色**算 ——
  // 写死 false 的话深色片子会一直拿深描边那版，压在深底上等于没有标志。
  const onDark = scene.type === 'beat' ? scene.ground !== 'base' : isDarkBg(theme);
  // 转场重叠期间上一场还在画面上，旁白要等过了那一段再出声，否则两条旁白叠着响。
  // voiced() 会把 voiceDelay 设成转场时长。
  const delay = Math.round((scene.voiceDelay ?? 0) * fps);
  return (
    <AbsoluteFill>
      {scene.voice ? (
        <Sequence from={delay}>
          <Audio src={staticFile(scene.voice)} />
        </Sequence>
      ) : null}
      {renderScene(scene)}
      {/* 小剧场的对白框就是字幕，再烧一层就重复了 */}
      {captions && scene.type !== 'stage' && scene.words && scene.words.length > 0 ? (
        <Captions words={scene.words} offset={scene.voiceDelay ?? 0} />
      ) : null}
      {wantsMark ? (
        <Watermark
          mark={onDark ? watermark.onDark : watermark.onLight}
          wordmark={watermark.wordmark}
          onDark={onDark}
        />
      ) : null}
    </AbsoluteFill>
  );
};
