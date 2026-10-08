# 作业规程（给 Claude Code）

这是一个用 Remotion 做**像素小剧场**短片的工作台：一个横向的像素房间，角色说话、走位，
屏幕跟着剧情换内容，镜头平移。用户会用中文描述想讲的故事，你负责把它做成片子。

动手前先读 `docs/像素小剧场.md`（字段、布景、角色、调试经验都在那里），
再看一遍样片 `src/projects/ruffood-story/script.ts`，它是一条完整做好的片子。

## 从需求到成片

每一步做完给用户看一眼再往下走。分镜和文案是用户最在意的，别闷头做到渲染才给看。

### 1. 问清楚（缺什么问什么，有默认值的不用问）

- 讲什么故事，有没有现成的稿子或素材（标志、产品图、网站）
- 时长：默认一分钟左右。中文旁白每秒约 4 字，一分钟 ≈ 250 字 ≈ 10 到 14 句
- 谁来讲：第一人称主角、第三人称旁白
- 版式：默认横版 1920×1080。小剧场是横向长房间，竖版要重新排镜头
- 事实：稿子和官网说法对不上的（年份、数字），列出来让用户定，别自己挑

### 2. 写分镜（先给用户看，再写代码）

列一张表：每场一句旁白、谁说、镜头在房间哪里、屏幕上放什么、角色做什么动作。原则：

- **一句旁白一场**，每句 10 到 30 字。长稿子要狠压，只留一条主线
- 房间 2 到 3 屏长，按剧情分区（比如：家 → 实验室 → 产品墙），镜头顺着剧情往右走
- **信息放进场景里的屏幕**（清单、条形图、产品道具），少用浮层面板，浮层压在屏幕上很乱
- 表情和动作要跟台词对上：说到问题瞪眼，说到困闭眼，说到成了笑
- 首场光圈打开（`iris: 'in'`），末场光圈收拢（`iris: 'out'`），最后接一张标志卡

### 3. 写脚本

```bash
npm run new -- <slug> "<片名>"     # 从小剧场模板复制，生成 script.ts 和 voice.json
```

只改 `src/projects/<slug>/` 里的文件。写 `world`（布景、角色）和 `scenes`。
品牌色：复制 `pixelTheme` 改 `accent`（和压在它上面的 `accentInk`），**别丢掉 `style: 'pixel'`**。
标志、图片放 `public/` 下，脚本里写相对 `public/` 的路径。

### 4. 配音

1. `voice.json` 的 `lines` 里每场一条，**跟 `line.text` 一字不差**（对白框按配音的词级时间戳打字）
2. `npm run tts -- --project <slug>`（默认男声 zh-CN-YunxiNeural，`--voice zh-CN-XiaoxiaoNeural` 换女声）
3. 脚本末尾用 `voiced()` 接上，照样片的写法：

```ts
import {voiced, type VoiceTimings} from '../../kit/voice';
import timings from './voice.timings.json';
// ...
export const myFilmScript = voiced(base, timings as VoiceTimings, {breath: 0.4});
```

改了台词就重新跑 tts。**每场秒数由配音算，不许手写**，手写的秒数在改稿后会悄悄错位。
年份、数字念得别扭的，`line.text` 和 `voice.json` 一起改写法。

### 5. 音乐

```bash
npx remotion compositions | grep <slug>      # 拿到片长（秒）
python3 scripts/make-bed.py --style chiptune --bpm 100 --seconds <片长> --out public/audio/<slug>/bed.mp3
```

脚本里 `music: 'audio/<slug>/bed.mp3', musicVolume: 0.2`。片长变了要重新生成，`--seconds` 必须等于片长。

### 6. 验收（每次收工都跑）

```bash
npm run check                               # 类型检查，必须通过
npm run render -- <slug> --still <秒>       # 逐场截图看版面，几秒一张
npm run render -- <slug>                    # 整片
ffmpeg -hide_banner -nostats -i out/<slug>/landscape.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary
python3 scripts/check-motion.py out/<slug>/landscape.mp4    # 有没有静止超过 0.5 秒的段落
```

- **调版面用 `--still`**，别每改一处都渲整片
- 截图时重点看：对白框有没有压住屏幕内容、角色说话时在不在画面里、屏幕上的字读不读得清
- 响度：整片 -16 LUFS 左右（低于 -20 就太闷），真峰不超过 -1 dBFS
- 画面不许静止超过 0.5 秒，`check-motion.py` 报出来的段落要回去加动作（表情、走位、屏幕换内容）

## 不可破的约束

1. **脚本必须可 JSON 序列化**：它整个作为 `defaultProps` 传给 Composition。不许出现函数、JSX、Date、类实例。类型用 `type` 不用 `interface`。
2. **改一条片子只改它自己的目录。** 为一条片子去改 `src/kit/` 是错的；真缺能力就加通用的（新角色、新道具、新屏幕内容），并在模板里补样例。
3. **尺寸一律 `n * useUnit()`**，不写死 px；像素格用 `pixelDot(unit)` 或场景里的格长。
4. **hook 无条件调用**，不许写进条件分支或回调。
5. **用 npm，不用 pnpm。** 版本锁死，不改成 `^` 范围。
6. **画面上的文案不用破折号**（— / –）。用逗号、句号、冒号，或拆成两句。
7. **小剧场整片 `transition: {type: 'none', seconds: 0}`**。世界是连续的，转场一出现就露馅。
8. **演示数据要像真的，但必须是编的**，别放真实用户信息。真人姓名、品牌素材用之前确认用户有权使用。
9. **不要为了「更好看」引入新的动画库。** 动效在 `src/kit/motion.ts`，像素风的逐格时间用 `useMotionFrame()`。
10. **别自己起 `npm run studio`**（会占端口常驻），要预览先问用户。

## 扩展

| 要加的 | 改哪里 |
|---|---|
| 新角色 | `src/kit/pixel/sprites.ts` 加一张字符画，名字加进 `src/kit/script.ts` 的 `PixelSprite` |
| 新道具 | `src/kit/pixel/items.ts` 加一张字符画，名字加进 `PixelItem` |
| 新布景 | `src/kit/pixel/props.tsx` 写组件，`StageProp` 加类型，`scenes/Stage.tsx` 里接上 |
| 新屏幕内容 | `ScreenContent` 加一种 `kind`，`props.tsx` 的 `Screen` 里画出来 |
| 新场景类型 | `kit/script.ts` 加 type → `kit/scenes/` 加组件 → `scenes/index.tsx` 的 `renderScene` 接线 → 模板补样例 |

字符画每行字符数必须一样，`.` 是透明。画完先 `--still` 截一张看看像不像，
16 格宽的脸放不下眼镜这种细节，越简单越好认。
