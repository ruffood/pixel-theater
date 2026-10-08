import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFilm} from '../film';
import {entrance, useAmbient, useProgress, useSpringProgress} from '../motion';
import {useFormat, usePick, useSafePadding, useUnit} from '../format';
import {Lines} from '../text';
import {pillRadius, tighten, useTheme, withAlpha} from '../theme';
import {Ambience} from '../ui/Ambience';
import type {SceneComponent} from './types';

/**
 * 快切重拍。一句话 + 可选的界面底，1.2-2 秒。
 * 情绪来自三处：底色逐拍换、文字带一点回弹、界面底全程推近。
 */
export const BeatScene: SceneComponent<'beat'> = ({scene}) => {
  const theme = useTheme();
  const unit = useUnit();
  const pad = useSafePadding();
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const format = useFormat();
  const s = scene.seconds;
  // Lines 是按行渲染且不换行的，字号写死就会顶出画面。按最长那行反推一个能装下的字号，
  // 0.55em 是 Georgia 混合大小写的平均字宽，留了一点余量。中日韩字是满宽，按 1em 算，
  // 不然中文的 beat 字号会估大一倍、直接顶出画面。
  const base = usePick({landscape: 150, portrait: 150, square: 150}) * unit;
  const em = theme.fonts.displayWidth ?? 0.55;
  const lineWidth = (line: string) =>
    Array.from(line).reduce((acc, ch) => acc + (/[\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 1 : em), 0);
  const longest = Math.max(...scene.text.split('\n').map(lineWidth));
  const size = Math.min(base, (width - pad.x * 2) / longest);
  const ground = scene.ground ?? 'base';
  // 整片说了居中就居中。竖版短视频一律居中，靠左在手机上像排版事故，
  // 而且底部字幕本来就是居中的，两条基线对不上更难看。
  const film = useFilm();
  const box = film.align === 'center' ? 'center' : 'flex-start';
  // 全场缓慢漂移，跟 Stage 里那层是同一个。beat 没走 Stage，得自己接上：
  // 字弹完就不动的话，一拍两三秒里画面是**真的静止**的（帧差量得出来）。
  // 纯底色那种拍尤其明显，只剩极光在飘，动不够。
  const ambient = useAmbient(s);

  const bg =
    ground === 'accent'
      ? theme.colors.accent
      : ground === 'surface'
        ? theme.colors.surface
        : theme.colors.bg;
  const ink = ground === 'accent' ? theme.colors.accentInk : theme.colors.text;

  // 弹一下就到位，快切片里没时间做缓入缓出。
  // instant 的那拍不弹：它是全片第一帧，也是平台拿去当封面的那一帧。
  const spring = useSpringProgress({delay: 0.02, damping: 14, stiffness: 190});
  const pop = scene.instant ? 1 : spring;
  const rule = useProgress({delay: s * 0.3, duration: entrance(s, 0.35)});
  const fx = scene.focus?.x ?? 0.5;
  const fy = scene.focus?.y ?? 0.4;
  const zoom = interpolate(frame, [0, s * fps], [1.04, 1.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: bg, overflow: 'hidden'}}>
      {scene.src ? (
        <>
          <Img
            src={staticFile(scene.src)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${fx * 100}% ${fy * 100}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${fx * 100}% ${fy * 100}%`,
            }}
          />
          {/* 色罩：压到刚好能让重磅字站住，再重界面就看不见了，那还不如不放 */}
          <AbsoluteFill style={{backgroundColor: withAlpha(bg, 0.62)}} />
          {/* 文字在中上部，那一带补一层渐变，保证字够黑够白 */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, ${withAlpha(bg, 0.9)} 0%, ${withAlpha(
                bg,
                0.45,
              )} 46%, transparent 74%)`,
            }}
          />
        </>
      ) : null}
      {/*
        没有界面图、底色又是主题底的时候，把背景层放出来 —— 一块不动的底色
        跟没做过设计没有区别。ground 给了 accent / surface 就是要一整块色，
        极光用 screen 叠在浅色块上会糊成一片白，那种拍不叠。
      */}
      {!scene.src && ground === 'base' ? <Ambience seconds={s} /> : null}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          // 跟 Stage 用同一套：垂直居中、竖版再整体上移屏高的 5%（底部那条字幕
          // 需要呼吸）。原来 beat 是顶到安全区上沿的，同一条片子里 statement 居中、
          // beat 顶上去，两种排法混着一眼就看得出不齐。
          justifyContent: 'center',
          alignItems: box,
          textAlign: box === 'center' ? 'center' : 'left',
          padding:
            format === 'portrait'
              ? `${pad.y}px ${pad.x}px ${pad.y + height * 0.1}px`
              : `${pad.y}px ${pad.x}px`,
        }}
      >
        <div
          style={{
            opacity: Math.min(1, pop * 1.4),
            transform: `${ambient.transform} scale(${0.94 + pop * 0.06})`,
            transformOrigin: box === 'center' ? 'center' : 'left center',
            fontFamily: theme.fonts.display,
            fontSize: size,
            lineHeight: 0.94,
            letterSpacing: tighten(theme, size, 0.012),
            fontWeight: 600,
            color: ink,
          }}
        >
          {/*
            instant：负的 delay 让第一行的进场在第 0 帧之前就走完，字一上来就是完整的。
            stagger 给大数时后面的行会落在正数时间上，于是同一个镜头里先一行后一行。
          */}
          <Lines
            text={scene.text}
            delay={scene.instant ? -1 : 0.04}
            per={scene.stagger ?? (scene.instant ? 0 : 0.09)}
            distance={size * 0.22}
          />
        </div>
        <div
          style={{
            width: `${rule * 30}%`,
            height: 10 * unit,
            marginBottom: 30 * unit,
            order: -1,
            backgroundColor: ground === 'accent' ? theme.colors.accentInk : theme.colors.accent,
            borderRadius: pillRadius(theme),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
