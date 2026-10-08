import type {Mood, Scene, ScreenContent, StageCue, StageWorld, VideoScript} from '../script';

type StageScene = Extract<Scene, {type: 'stage'}>;

/** 走路速度，屏宽每秒 */
export const WALK_SPEED = 0.55;

export type ActorState = {
  x: number;
  facing: 'left' | 'right';
  mood: Mood;
  visible: boolean;
  walking: boolean;
};

export type WorldState = {
  actors: Record<string, ActorState>;
  screens: Record<string, ScreenContent | undefined>;
  hidden: Record<string, boolean>;
  camera: {x: number; zoom: number};
  chapter?: string;
};

/** 布景的初始状态 */
const initial = (world: StageWorld): WorldState => ({
  actors: Object.fromEntries(
    world.cast.map((c) => [
      c.id,
      {x: c.x, facing: c.facing ?? 'right', mood: 'calm' as Mood, visible: !c.hidden, walking: false},
    ]),
  ),
  screens: Object.fromEntries(
    world.props.flatMap((p) => (p.kind === 'desk' || p.kind === 'screen' ? [[p.id, p.screen]] : [])),
  ),
  hidden: Object.fromEntries(world.props.map((p) => [p.id, p.kind === 'item' ? !!p.hidden : false])),
  camera: {x: 0.5, zoom: 1},
});

/**
 * 把一场的 cue 推到本场第 t 秒（t 给 Infinity 就是推到底）。
 *
 * 走路要算中间态：从 cue 的时刻起按 WALK_SPEED 走，到了就停。朝向跟着走的方向。
 */
const apply = (state: WorldState, cues: StageCue[], seconds: number, t: number): WorldState => {
  const next: WorldState = {
    ...state,
    actors: Object.fromEntries(Object.entries(state.actors).map(([k, v]) => [k, {...v, walking: false}])),
    screens: {...state.screens},
    hidden: {...state.hidden},
  };
  const sorted = [...cues].sort((a, b) => a.at - b.at);
  for (const cue of sorted) {
    const at = cue.at * seconds;
    if (at > t) break;
    if ('move' in cue) {
      const a = next.actors[cue.move];
      if (!a) continue;
      const dist = cue.to - a.x;
      const dur = Math.abs(dist) / WALK_SPEED;
      const p = dur === 0 ? 1 : Math.min(1, (t - at) / dur);
      next.actors[cue.move] = {
        ...a,
        x: a.x + dist * p,
        facing: dist === 0 ? a.facing : dist > 0 ? 'right' : 'left',
        walking: p < 1,
      };
    } else if ('mood' in cue) {
      const a = next.actors[cue.face];
      if (a) next.actors[cue.face] = {...a, mood: cue.mood};
    } else if ('turn' in cue) {
      const a = next.actors[cue.turn];
      if (a) next.actors[cue.turn] = {...a, facing: cue.facing};
    } else if ('screen' in cue) {
      next.screens[cue.screen] = cue.show;
    } else if ('enter' in cue) {
      if (next.actors[cue.enter]) next.actors[cue.enter] = {...next.actors[cue.enter]!, visible: true};
      else next.hidden[cue.enter] = false;
    } else if ('exit' in cue) {
      if (next.actors[cue.exit]) next.actors[cue.exit] = {...next.actors[cue.exit]!, visible: false};
      else next.hidden[cue.exit] = true;
    }
  }
  return next;
};

/**
 * 某一场开头时世界是什么样：把它之前所有 stage 场景的 cue 都推到底。
 * 返回值里的 camera 是**上一场的镜头**，本场从这里平移到自己的 camera。
 */
export const stateBefore = (script: VideoScript, sceneId: string): WorldState => {
  const world = script.world!;
  let state = initial(world);
  let first = true;
  for (const scene of script.scenes) {
    if (scene.id === sceneId) break;
    if (scene.type !== 'stage') continue;
    state = apply(state, scene.cues ?? [], scene.seconds, Infinity);
    if (scene.camera) state.camera = {x: scene.camera.x, zoom: scene.camera.zoom ?? 1};
    if (scene.chapter) state.chapter = scene.chapter;
    first = false;
  }
  // 第一场没有「上一场的镜头」，直接从自己的镜头开始，不平移
  if (first) {
    const self = script.scenes.find((s): s is StageScene => s.id === sceneId && s.type === 'stage');
    if (self?.camera) state.camera = {x: self.camera.x, zoom: self.camera.zoom ?? 1};
  }
  return state;
};

export const stateAt = (before: WorldState, scene: StageScene, t: number): WorldState =>
  apply(before, scene.cues ?? [], scene.seconds, t);
