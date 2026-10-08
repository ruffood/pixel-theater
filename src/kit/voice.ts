import {transitionOf, type VideoScript, type WordTiming} from './script';

/**
 * scripts/tts.mjs 写出来的东西。一条片子一份，落在
 * src/projects/<项目>/voice.timings.json。
 */
export type VoiceTimings = {
  engine: string;
  voice: string;
  lufs: number;
  generatedAt: string;
  scenes: Record<string, {file: string; seconds: number; words: WordTiming[]}>;
};

/** 每条旁白说完留的呼吸，秒。最后一句需要它落地，中间几句需要它换气。 */
const BREATH = 0.8;

/**
 * 把旁白接进脚本：**秒数从旁白算，不写死**。
 *
 * 这是这套工作台跟原来最大的不同。原来是「合成完把打印出来的 seconds 抄回
 * script.ts」，抄错、改了文案忘了重抄，都会让画面和声音对不上，而且只有整片
 * 渲出来才看得见。现在时长是算出来的：文案一改、重新合成，画面自己跟上。
 *
 * 转场是重叠的（TransitionSeries 会让相邻两场共用 transition.seconds 那段时间），
 * 所以每场前后各补一段静音余量，让旁白落在中间，两条旁白就不会撞在一起。
 * 这个补偿必须在这里做：computeDuration 是按场景秒数之和减重叠算的，
 * 补偿完总时长依然对得上。
 *
 * 没有对应旁白的场景（片头品牌页那种）原样保留作者写的秒数。
 */
export const voiced = (
  script: VideoScript,
  timings: VoiceTimings,
  {breath = BREATH}: {breath?: number} = {},
): VideoScript => {
  const transition = transitionOf(script);
  const overlap = transition.type === 'none' ? 0 : transition.seconds;
  const last = script.scenes.length - 1;

  // 时间戳里有、脚本里没有的场景 id，多半是改脚本时删了场景或者拼错了。
  // 不报出来的话那条旁白就静悄悄地不见了，而画面看上去一切正常。
  const ids = new Set(script.scenes.map((s) => s.id));
  const orphans = Object.keys(timings.scenes).filter((id) => !ids.has(id));
  if (orphans.length > 0) {
    throw new Error(
      `voice.timings.json 里这些场景在脚本里找不到：${orphans.join(', ')}。` +
        '改完场景 id 记得同步 voice.json 再重新合成。',
    );
  }

  return {
    ...script,
    scenes: script.scenes.map((scene, index) => {
      const take = timings.scenes[scene.id];
      if (!take) return scene;
      const lead = index > 0 ? overlap : 0;
      const tail = breath + (index < last ? overlap : 0);
      return {
        ...scene,
        seconds: Math.round((lead + take.seconds + tail) * 100) / 100,
        voice: take.file,
        voiceDelay: lead,
        words: take.words,
      };
    }),
  };
};
