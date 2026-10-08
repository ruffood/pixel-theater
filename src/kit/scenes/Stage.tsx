import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {useFilm} from '../film';
import {useUnit} from '../format';
import {EASE_IN_OUT, scaleIn, useMotionFrame} from '../motion';
import {PixelBackdrop} from '../pixel/Backdrop';
import {pixelBox, pixelDot} from '../pixel/box';
import {Board, Desk, Item, Shelf, Window, WallScreen} from '../pixel/props';
import {Character, PixelArt} from '../pixel/Sprite';
import {PLANT, SPRITES} from '../pixel/sprites';
import {stateAt, stateBefore} from '../pixel/stageState';
import type {VideoScript, WordTiming} from '../script';
import {useTheme, withAlpha} from '../theme';
import type {SceneComponent} from './types';

/**
 * 像素小剧场。整片共用一个横向的长房间（script.world），每场是其中的一拍：
 * 镜头平移到某处、某个角色说一句话、屏幕换内容、有人走过去。
 *
 * 画面分两层：
 * - 世界层：墙、地板、布景、角色，跟着镜头平移缩放
 * - 屏幕层：对白框、面板、标题条、底部导演栏、光圈，不跟镜头走，字号永远可读
 */

/** 地板上沿、底栏上沿，占画面高度的比例 */
const FLOOR = 0.7;
const BAR = 0.87;

/** 本场旁白已经念到第几个字。按词级时间戳数，标点跟着前一个字一起出 */
const revealed = (text: string, words: WordTiming[] | undefined, ms: number, fallback: number) => {
  const chars = Array.from(text);
  const isMark = (c: string) => /[\s，。、！？：；,.!?:;「」『』“”"'（）()…·]/.test(c);
  if (!words || words.length === 0) return Math.min(chars.length, Math.ceil(fallback * chars.length));
  let spoken = 0;
  for (const w of words) {
    const len = Array.from(w.word).filter((c) => !isMark(c)).length;
    if (ms >= w.endMs) spoken += len;
    else if (ms >= w.startMs) spoken += Math.ceil((len * (ms - w.startMs)) / Math.max(1, w.endMs - w.startMs));
  }
  let count = 0;
  let i = 0;
  for (; i < chars.length && count < spoken; i++) if (!isMark(chars[i]!)) count++;
  while (i < chars.length && isMark(chars[i]!)) i++;
  return i;
};

export const StageScene: SceneComponent<'stage'> = ({scene}) => {
  const {script} = useFilm();
  const theme = useTheme();
  const unit = useUnit();
  const frame = useMotionFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  if (!script?.world) throw new Error(`stage 场景 ${scene.id} 需要脚本顶层的 world`);
  const world = script.world;
  const t = frame / fps;
  const s = scene.seconds;
  const a = Math.round(7 * unit);
  const dot = pixelDot(unit);

  const before = stateBefore(script, scene.id);
  const now = stateAt(before, scene, t);

  // —— 镜头：本场开头从上一场的位置平移过来 ——
  // 写了 camera 没写 zoom 就回到 1：推近是一场的事，不该悄悄带到后面几场
  const target = scene.camera ? {x: scene.camera.x, zoom: scene.camera.zoom ?? 1} : before.camera;
  const pan = Math.min(1.4, s * 0.4);
  const k = interpolate(t, [0, pan], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT});
  const camX = before.camera.x + (target.x - before.camera.x) * k;
  const zoom = before.camera.zoom + (target.zoom - before.camera.zoom) * k;
  const floorY = H * FLOOR;
  // 世界坐标 → 屏幕坐标。缩放以地板线为锚，地板不会上下跳
  const toScreen = (wx: number, wy: number) => ({
    x: Math.round(W / 2 + (wx * W - camX * W) * zoom),
    y: Math.round(floorY + (wy - floorY) * zoom),
  });
  const origin = toScreen(0, 0);

  // —— 台词 ——
  const line = scene.line;
  const speaker = line ? now.actors[line.who] : undefined;
  const cast = line ? world.cast.find((c) => c.id === line.who) : undefined;
  const ms = (t - (scene.voiceDelay ?? 0)) * 1000;
  const shown = line ? revealed(line.text, scene.words, ms, (t - 0.1) / Math.max(0.5, s * 0.6)) : 0;
  const lastWord = scene.words?.[scene.words.length - 1];
  const talking = !!line && ms >= 0 && (lastWord ? ms <= lastWord.endMs : shown < Array.from(line.text).length);

  // 本场里各块屏幕亮了多久：本场换过内容的从换的那一刻算，没换过的当作早就亮着
  const ageOf = (id: string) => {
    const cues = (scene.cues ?? []).filter((c) => 'screen' in c && c.screen === id && c.at * s <= t);
    const last = cues[cues.length - 1];
    return last ? t - last.at * s : 99;
  };

  const progress = filmProgress(script, scene.id, t);
  const chapter = scene.chapter ?? before.chapter;

  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, overflow: 'hidden'}}>
      {/* —— 世界层 —— */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: world.width * W,
          height: H,
          transformOrigin: '0 0',
          transform: `translate(${origin.x}px, ${origin.y}px) scale(${zoom})`,
        }}
      >
        {/* 墙：木板竖缝跟着世界走，镜头一动就看得出在平移 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent ${15 * a - a}px, rgba(0,0,0,0.18) ${15 * a - a}px, rgba(0,0,0,0.18) ${15 * a}px)`,
          }}
        />
        {/* 地板：踢脚线 + 错缝砖，一直铺到画面底 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: floorY,
            height: H,
            backgroundColor: '#6B4A3A',
            backgroundImage: bricks(a),
            borderTop: `${a * 1.5}px solid #4A3329`,
          }}
        />
        {world.props.map((p) => {
          if (now.hidden[p.id]) return null;
          const x = p.x * W;
          if (p.kind === 'desk')
            return (
              <div key={p.id} style={{position: 'absolute', left: x, top: floorY}}>
                <Desk a={a} screen={now.screens[p.id]} age={ageOf(p.id)} />
              </div>
            );
          if (p.kind === 'screen') {
            const w = (p.width ?? 0.42) * W;
            return (
              <div key={p.id} style={{position: 'absolute', left: x, top: H * 0.06}}>
                <WallScreen w={w} h={H * 0.34} a={a} screen={now.screens[p.id]} age={ageOf(p.id)} />
              </div>
            );
          }
          if (p.kind === 'window')
            return (
              <div key={p.id} style={{position: 'absolute', left: x, top: H * 0.1}}>
                <Window w={W * 0.16} h={H * 0.3} a={a} />
              </div>
            );
          if (p.kind === 'board')
            return (
              <div key={p.id} style={{position: 'absolute', left: x, top: H * 0.14}}>
                <Board w={W * 0.15} h={H * 0.22} a={a} />
              </div>
            );
          if (p.kind === 'shelf')
            return (
              <div key={p.id} style={{position: 'absolute', left: x, top: floorY}}>
                <Shelf a={a} />
              </div>
            );
          if (p.kind === 'plant')
            return (
              <div key={p.id} style={{position: 'absolute', left: x - 5 * a, top: floorY - 12 * a}}>
                <PixelArt rows={PLANT.body} palette={PLANT.palette} dot={a} />
              </div>
            );
          if (p.kind !== 'item') return null;
          return (
            <div key={p.id} style={{position: 'absolute', left: x, top: floorY - (p.lift ?? 0) * a}}>
              <Item item={p.item} a={a} />
            </div>
          );
        })}
        {world.cast.map((c, i) => {
          const st = now.actors[c.id]!;
          if (!st.visible) return null;
          const rows = SPRITES[c.sprite].body.length;
          // 位置取整到格，走路时一格一格挪
          const x = Math.round((st.x * W) / a) * a;
          return (
            <div key={c.id} style={{position: 'absolute', left: x - 8 * a, top: floorY - rows * a + a}}>
              <Character
                sprite={c.sprite}
                dot={a}
                seed={i * 1.37}
                mood={st.mood}
                walking={st.walking}
                talking={line?.who === c.id && talking}
                hop={line?.who === c.id ? (t - (scene.voiceDelay ?? 0)) / 0.4 : 0}
                flip={st.facing === 'left'}
              />
            </div>
          );
        })}
      </div>

      {/* 光和光尘浮在世界上面，不跟镜头 */}
      <PixelBackdrop planks={false} />

      {/* —— 屏幕层 —— */}
      {line && speaker && speaker.visible && shown > 0 ? (
        <Bubble
          text={line.text}
          shown={shown}
          name={cast?.name}
          anchor={toScreen(speaker.x, floorY - (SPRITES[cast!.sprite].body.length + 3) * a)}
          W={W}
          unit={unit}
          dot={dot}
          done={!talking}
          t={t}
        />
      ) : null}
      {scene.panel ? <Panel panel={scene.panel} t={t} s={s} unit={unit} dot={dot} W={W} H={H} /> : null}
      {scene.banner ? <Banner banner={scene.banner} t={t} s={s} unit={unit} dot={dot} H={H} /> : null}
      <BottomBar chapter={chapter} console={scene.console} progress={progress} t={t} unit={unit} dot={dot} W={W} H={H} />
      {scene.iris ? (
        <Iris
          mode={scene.iris}
          t={t}
          s={s}
          W={W}
          H={H}
          unit={unit}
          // 有人在说话就对着他收放，片头从主角身上打开、片尾收在主角身上
          center={speaker && cast ? toScreen(speaker.x, floorY - SPRITES[cast.sprite].body.length * a * 0.5) : {x: W / 2, y: H / 2}}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** 整片进度，0-1。底栏那条进度线用 */
const filmProgress = (script: VideoScript, id: string, t: number) => {
  let done = 0;
  let total = 0;
  let passed = false;
  for (const sc of script.scenes) {
    if (sc.id === id) {
      done = total + t;
      passed = true;
    }
    total += sc.seconds;
  }
  return passed ? Math.min(1, done / total) : 0;
};

/** 错缝砖：两行一循环，第二行的竖缝错开半块 */
const bricks = (a: number) => {
  const bw = a * 24;
  const bh = a * 7;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bw}' height='${bh * 2}' shape-rendering='crispEdges'><g fill='%234A3329'><rect x='0' y='${bh - a}' width='${bw}' height='${a}'/><rect x='0' y='${bh * 2 - a}' width='${bw}' height='${a}'/><rect x='${bw - a}' y='0' width='${a}' height='${bh}'/><rect x='${bw / 2}' y='${bh}' width='${a}' height='${bh}'/></g><rect x='0' y='0' width='${bw}' height='${a}' fill='%237D5845'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/'/g, '%27')}")`;
};

/**
 * 对白框。锚点是说话人头顶上方（屏幕坐标），框不出画。
 * 没打出来的字透明占位，框一开始就是最终尺寸，不会边打边长。
 */
const Bubble: React.FC<{
  text: string;
  shown: number;
  name?: string;
  anchor: {x: number; y: number};
  W: number;
  unit: number;
  dot: number;
  done: boolean;
  t: number;
}> = ({text, shown, name, anchor, W, unit, dot, done, t}) => {
  const theme = useTheme();
  const size = 30 * unit;
  const maxW = W * 0.34;
  const margin = 40 * unit;
  // 框从说话人头顶往右展开（尾巴在框的左段），左边通常是桌上的显示器，别挡住它。
  // 人站在画面右侧时，框贴右边往左让。
  const left = Math.min(W - margin - maxW, Math.max(margin, anchor.x - maxW * 0.18));
  const ink = theme.colors.accentInk;
  const chars = Array.from(text);
  return (
    <div style={{position: 'absolute', left, width: maxW, bottom: `calc(100% - ${anchor.y}px)`, display: 'flex', justifyContent: anchor.x - left > maxW * 0.6 ? 'flex-end' : 'flex-start'}}>
      <div
        style={{
          position: 'relative',
          ...pixelBox({fill: theme.colors.text, border: ink, shadow: 'rgba(0,0,0,0.35)', dot}),
          padding: `${size * 0.5}px ${size * 0.65}px`,
          fontFamily: theme.fonts.body,
          fontSize: size,
          lineHeight: 1.4,
          color: ink,
        }}
      >
        {name ? (
          <div
            style={{
              position: 'absolute',
              left: size * 0.4,
              top: -size * 0.9,
              ...pixelBox({fill: theme.colors.accent, border: ink, dot}),
              padding: `${size * 0.04}px ${size * 0.3}px`,
              fontSize: size * 0.6,
            }}
          >
            {name}
          </div>
        ) : null}
        <span>{chars.slice(0, shown).join('')}</span>
        <span style={{color: 'transparent'}}>{chars.slice(shown).join('')}</span>
        {done && Math.floor(t * 3) % 2 === 0 ? (
          <span style={{position: 'absolute', right: size * 0.25, bottom: size * 0.1, fontSize: size * 0.45, color: theme.colors.accent}}>▼</span>
        ) : null}
      </div>
      {/* 尾巴指向说话的人 */}
      <div style={{position: 'absolute', left: anchor.x - left - 4 * dot, bottom: -4 * dot}}>
        <PixelArt rows={['oTTTTTTo', '.oTTTTo.', '..oTTo..', '...oo...']} palette={{o: ink, T: theme.colors.text}} dot={dot} />
      </div>
    </div>
  );
};

/** 信息面板：深底紫框，标题前一个方块，几行字逐行出 */
const Panel: React.FC<{
  panel: NonNullable<Extract<import('../script').Scene, {type: 'stage'}>['panel']>;
  t: number;
  s: number;
  unit: number;
  dot: number;
  W: number;
  H: number;
}> = ({panel, t, s, unit, dot, W, H}) => {
  const theme = useTheme();
  const at = (panel.at ?? 0.1) * s;
  const p = Math.min(1, Math.max(0, (t - at) / 0.25));
  if (p <= 0) return null;
  const size = 28 * unit;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.07, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          ...scaleIn(p, 0.9),
          ...pixelBox({fill: withAlpha('#15121F', 0.96), border: '#6F5FA8', shadow: 'rgba(0,0,0,0.4)', dot}),
          minWidth: W * 0.3,
          maxWidth: W * 0.56,
          padding: `${size * 0.7}px ${size}px`,
          fontFamily: theme.fonts.body,
          fontSize: size,
          lineHeight: 1.5,
          color: theme.colors.text,
        }}
      >
        {panel.title ? (
          <div style={{display: 'flex', alignItems: 'center', gap: size * 0.4, marginBottom: size * 0.4, color: theme.colors.accent}}>
            <div style={{width: size * 0.5, height: size * 0.5, backgroundColor: theme.colors.accent}} />
            {panel.title}
          </div>
        ) : null}
        {panel.rows.map((row, i) => (
          <div key={i} style={{opacity: t - at >= 0.3 + i * 0.3 ? 1 : 0}}>
            {row}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 顶部大字条：品牌色框，主句 + 小字 */
const Banner: React.FC<{
  banner: NonNullable<Extract<import('../script').Scene, {type: 'stage'}>['banner']>;
  t: number;
  s: number;
  unit: number;
  dot: number;
  H: number;
}> = ({banner, t, s, unit, dot, H}) => {
  const theme = useTheme();
  const at = (banner.at ?? 0.05) * s;
  const p = Math.min(1, Math.max(0, (t - at) / 0.25));
  if (p <= 0) return null;
  const size = 52 * unit;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.09, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          ...scaleIn(p, 0.85),
          ...pixelBox({fill: withAlpha('#15121F', 0.96), border: theme.colors.accent, shadow: 'rgba(0,0,0,0.4)', dot: dot * 1.5}),
          padding: `${size * 0.35}px ${size * 0.8}px`,
          textAlign: 'center',
          fontFamily: theme.fonts.display,
          color: theme.colors.text,
        }}
      >
        <div style={{fontSize: size, color: theme.colors.accent}}>{banner.text}</div>
        {banner.sub ? <div style={{fontSize: size * 0.48, marginTop: size * 0.2, opacity: t - at > 0.4 ? 1 : 0}}>{banner.sub}</div> : null}
      </div>
    </div>
  );
};

/** 底部导演栏：左边章节牌、中间控制台逐字打一行、底下一条整片进度线 */
const BottomBar: React.FC<{
  chapter?: string;
  console?: string;
  progress: number;
  t: number;
  unit: number;
  dot: number;
  W: number;
  H: number;
}> = ({chapter, console: text, progress, t, unit, dot, W, H}) => {
  const theme = useTheme();
  const size = 24 * unit;
  const chars = Array.from(text ?? '');
  const typed = Math.min(chars.length, Math.floor(Math.max(0, t - 0.2) * 16));
  const cursor = Math.floor(t * 2.5) % 2 === 0;
  const top = H * BAR;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, bottom: 0, backgroundColor: '#120F18', borderTop: `${dot}px solid #2A2438`}}>
      {chapter ? (
        <div
          style={{
            position: 'absolute',
            left: 36 * unit,
            top: (H - top) / 2 - size * 0.95,
            ...pixelBox({fill: '#120F18', border: theme.colors.accent, dot}),
            padding: `${size * 0.3}px ${size * 0.6}px`,
            fontFamily: theme.fonts.body,
            fontSize: size,
            color: theme.colors.text,
          }}
        >
          {chapter}
        </div>
      ) : null}
      {text ? (
        <div
          style={{
            position: 'absolute',
            left: W * 0.22,
            width: W * 0.5,
            top: (H - top) / 2 - size * 1.1,
            ...pixelBox({fill: '#1A1624', border: '#3A3350', dot}),
            padding: `${size * 0.35}px ${size * 0.6}px`,
            fontFamily: theme.fonts.body,
            fontSize: size,
            color: theme.colors.text,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{color: theme.colors.accent, marginRight: size * 0.5}}>&gt;</span>
          {chars.slice(0, typed).join('')}
          <span style={{opacity: cursor ? 1 : 0, color: theme.colors.text}}>▌</span>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: W * 0.22, width: W * 0.72, bottom: 18 * unit, height: dot, backgroundColor: '#2A2438'}}>
        <div style={{width: `${Math.round(progress * 60) / 60 * 100}%`, height: '100%', backgroundColor: theme.colors.accent}} />
      </div>
    </div>
  );
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 抖动光圈：圆外整片黑，圆的边缘是一圈 Bayer 网点，不是平滑的边 */
const Iris: React.FC<{
  mode: 'in' | 'out';
  t: number;
  s: number;
  W: number;
  H: number;
  unit: number;
  center: {x: number; y: number};
}> = ({mode, t, s, W, H, unit, center}) => {
  const dur = Math.min(1.6, s * 0.4);
  const p = mode === 'in' ? Math.min(1, t / dur) : Math.min(1, Math.max(0, (s - t) / dur));
  if (p >= 1) return null;
  const cell = Math.round(12 * unit);
  const cx = center.x;
  const cy = center.y;
  // 圆心不在正中时，要盖到最远的那个角才算完全打开
  const full = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x! - cx, y! - cy))) + cell * 4;
  const r = EASE_IN_OUT(p) * full;
  const band = cell * 6;
  const cols = Math.ceil(W / cell);
  const rows = Math.ceil(H / cell);
  let d = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const dist = Math.hypot((i + 0.5) * cell - cx, (j + 0.5) * cell - cy);
      const edge = r + ((BAYER[(j % 4) * 4 + (i % 4)]! + 0.5) / 16 - 0.5) * band;
      if (dist > edge) d += `M${i * cell} ${j * cell}h${cell}v${cell}h${-cell}z`;
    }
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}} shapeRendering="crispEdges">
      <path d={d} fill="#0B0910" />
    </svg>
  );
};
