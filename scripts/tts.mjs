#!/usr/bin/env node
/**
 * 合成旁白。读 src/projects/<项目>/voice.json，每条出一个 mp3 到
 * public/audio/<项目>/<场景 id>.mp3，并把**词级时间戳**写进
 * src/projects/<项目>/voice.timings.json。
 *
 *   node scripts/tts.mjs --project my-film                         默认男声 Yunxi
 *   node scripts/tts.mjs --project my-film --voice zh-CN-XiaoxiaoNeural
 *   node scripts/tts.mjs --project my-film --rate +8%
 *
 * 引擎是微软 edge-tts：免费、不要凭据，能吐**词级**时间戳 —— 对白框逐字打、
 * 每场时长都从这里来。靠 `uv run --with edge-tts` 现拉现跑，本仓不装 Python 环境。
 * 常用中文音色：zh-CN-YunxiNeural（男）、zh-CN-XiaoxiaoNeural（女）、zh-CN-YunjianNeural（男，沉）。
 *
 * 时长不用再手抄回 script.ts。脚本写出的 voice.timings.json 由 kit 的 `voiced()`
 * 读进去，每场秒数从旁白算，转场补偿也在那里做。改文案重新合成，画面自己跟上。
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const project = flag('project');
const engine = 'edge';
const rate = flag('rate', '+0%');
/** 旁白目标响度（LUFS）。合成出来的东西只有 -24 上下，不归一化的话整片会闷得没法听。 */
const LUFS = flag('lufs', '-16');
/** 语速倍率。1.0 是原速；快节奏片子给 1.08-1.15，比原速更有冲劲又不失真。 */
const TEMPO = Number(flag('tempo', '1'));

/**
 * 头尾各留多少静音，秒。
 *
 * edge-tts 在每条前后都会补一段静音，**尾巴的长度还跟句末标点有关** ——
 * 实测同一批里从 0.008 秒到 0.47 秒不等。每场是一条独立音频，这段静音就直接
 * 变成句与句之间的死气，而且长短不齐，听起来像一句一句分开念的，没有连贯性。
 *
 * 词级时间戳里已经写明第一个词什么时候开口、最后一个词什么时候收，按它裁就行，
 * 不用做静音检测。裁完句间停顿完全由 voiced() 的 breath 一个参数决定，全片一致。
 */
const HEAD_PAD = 0.03;
// 尾巴给得比头宽：WordBoundary 的 endMs 卡在词的主体上，句末的擦音和塞音
// （"inbox" 的 /ks/、"apart" 的 /t/）会拖在它后面，裁太紧就把词尾削掉了。
const TAIL_PAD = 0.08;

const voice = flag('voice', 'zh-CN-YunxiNeural');

if (!project) {
  console.error('用法：node scripts/tts.mjs --project <slug> [--voice <音色>] [--rate +5%]');
  process.exit(1);
}

const projectDir = resolve(ROOT, 'src/projects', project);
const manifest = JSON.parse(readFileSync(resolve(projectDir, 'voice.json'), 'utf8'));
const outDir = resolve(ROOT, 'public/audio', project);
mkdirSync(outDir, {recursive: true});

/**
 * voice.json 里除了逐场的 `lines`，还可以给一条 `track` —— 整片一条连续旁白。
 * 硬切的快节奏片子必须用它：镜头只有 1-2 秒，挂在镜头上的音频到切点就被截断。
 * 它照样合成和归一化，但**不进 voice.timings.json** —— 连续轨没有「本场」可言，
 * 时长也不该反过来决定画面（那种片子的节奏是踩着 BPM 定死的）。
 */
const TRACK = 'track';
const lines = {
  ...(manifest.lines ?? {}),
  ...(manifest.track ? {[TRACK]: manifest.track} : {}),
};
if (Object.keys(lines).length === 0) {
  console.error('voice.json 里既没有 lines 也没有 track，没东西可合成。');
  process.exit(1);
}

/** 合成到 <id>.raw.mp3，返回 {id: 词级时间戳[]}。 */
const synthesize = () => {
  // uv 会把 edge-tts 拉进自己的缓存里跑，本仓不需要 venv，也不往系统里装东西。
  const out = execFileSync(
    'uv',
    ['run', '--quiet', '--with', 'edge-tts', 'python', resolve(ROOT, 'scripts/tts_edge.py')],
    {input: JSON.stringify({lines, voice, rate, outDir}), maxBuffer: 64 * 1024 * 1024},
  );
  return JSON.parse(out.toString());
};

const words = synthesize();

const scenes = {};
for (const id of Object.keys(lines)) {
  const raw = resolve(outDir, `${id}.raw.mp3`);
  const file = resolve(outDir, `${id}.mp3`);
  // 时间戳是**变速前**的（edge-tts 在原速音频上给的），下面 atempo 之后要同比缩放。
  const take = words[id] ?? [];
  // 按第一个词和最后一个词裁掉头尾静音。没有词级时间戳（连续轨）就不裁。
  const cut = take.length > 0 ? Math.max(0, take[0].startMs / 1000 - HEAD_PAD) : 0;
  const until = take.length > 0 ? take[take.length - 1].endMs / 1000 + TAIL_PAD : null;
  // 响度归一化。别跳过这步：TTS 各家出来的响度都不一样，不归一化就只能靠猜
  // musicVolume，猜出来的结果多半是音乐听不见或者盖住人声。
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y', '-i', raw,
      // 裁剪必须写成滤镜链里的 atrim，不能用 -ss/-to：那两个放在输出侧是作用在
      // **滤镜之后**的时间轴上，跟 atempo 撞车，裁出来的位置对不上。
      // 顺序也是定死的：atrim（原速时间轴）→ atempo（变速）→ loudnorm（变速会
      // 改动电平，归一化必须是最后一步）。
      '-af', [
        ...(until === null ? [] : [`atrim=start=${cut}:end=${until}`, 'asetpts=PTS-STARTPTS']),
        ...(TEMPO === 1 ? [] : [`atempo=${TEMPO}`]),
        `loudnorm=I=${LUFS}:TP=-1.5:LRA=11`,
      ].join(','),
      file,
    ],
    {stdio: ['ignore', 'ignore', 'inherit']},
  );
  rmSync(raw);
  // 裁掉的那段要从时间戳里减掉，变速要除掉，否则字幕会越走越滞后 ——
  // 一句 4.7 秒的话在 1.18 倍速下到句尾能差 0.7 秒。
  const shifted = take.map((w) => ({
    ...w,
    startMs: Math.round((w.startMs - cut * 1000) / TEMPO),
    endMs: Math.round((w.endMs - cut * 1000) / TEMPO),
  }));
  const seconds = Number(
    execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      file,
    ]).toString().trim(),
  );
  if (id === TRACK) {
    console.log(`✓ ${id.padEnd(16)} ${seconds.toFixed(2)}s  （整片连续轨，不进 timings）`);
    continue;
  }
  scenes[id] = {file: `audio/${project}/${id}.mp3`, seconds, words: shifted};
  console.log(`✓ ${id.padEnd(16)} ${seconds.toFixed(2)}s  ${shifted.length} 词`);
}

const hasScenes = Object.keys(scenes).length > 0;
if (hasScenes) {
  writeFileSync(
    resolve(projectDir, 'voice.timings.json'),
    `${JSON.stringify({engine, voice, lufs: Number(LUFS), generatedAt: new Date().toISOString(), scenes}, null, 2)}\n`,
  );
}

console.log(`\n音频在 public/audio/${project}/，音色 ${voice}（${engine}），已归一化到 ${LUFS} LUFS`);
if (hasScenes) {
  const total = Object.values(scenes).reduce((a, s) => a + s.seconds, 0);
  console.log(`时间戳写进 src/projects/${project}/voice.timings.json，旁白共 ${total.toFixed(1)}s`);
  console.log('脚本里用 voiced(script, timings) 接上，秒数和字幕都从这份文件来，不用手抄。');
} else {
  // 只有连续轨的片子（踩点快切那种）不写 timings，写一份空的只会让人以为忘了配
  console.log('只有整片连续轨，没写 voice.timings.json。在 script.ts 的 voiceover 字段里接上它。');
}
