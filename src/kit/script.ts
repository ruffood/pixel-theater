import type {FormatId} from './format';
import type {Theme} from './theme';

/**
 * 分镜脚本 —— 一条片子的唯一真源。
 *
 * 规矩：**只放纯数据**。它整个会作为 defaultProps 传给 Composition，
 * Remotion 要求可 JSON 序列化，所以不能出现函数、JSX、Date、undefined 以外的特殊值。
 * 要加新表现形式，加一个 scene type + 一个场景组件，别往脚本里塞组件。
 */

/** 一个词的起止，毫秒，相对**本场旁白**的起点。tts.mjs 出的就是这个。 */
export type WordTiming = {word: string; startMs: number; endMs: number};

/** 像素主题里的角色，画法在 kit/pixel/sprites.ts */
export type PixelSprite = 'bot' | 'slime' | 'cat' | 'coder' | 'nutritionist' | 'dog';

/** 像素小道具，画法在 kit/pixel/items.ts */
export type PixelItem = 'tub' | 'bottle' | 'pouch' | 'takeout' | 'bowl';

/** 角色表情 */
export type Mood = 'calm' | 'happy' | 'shut' | 'wide';

/**
 * 显示器和墙上大屏里放什么。都是画出来的，不放截图 —— 像素小剧场里的屏幕
 * 是道具，内容要跟世界一个画风。
 */
export type ScreenContent =
  | {kind: 'off'}
  /** 滚动的代码行 */
  | {kind: 'code'}
  | {kind: 'text'; title?: string; lines: string[]}
  /** 条目列表，bad 标红、good 标绿。体检单、清单用 */
  | {kind: 'list'; title?: string; items: {text: string; tone?: 'bad' | 'good'}[]}
  /** 横条，value 0-1，会从 0 长上去 */
  | {kind: 'bars'; title?: string; items: {label: string; value: number; note?: string}[]}
  /** 一排像素道具，带标签 */
  | {kind: 'items'; items: {item: PixelItem; label?: string}[]}
  /** 相对 public/ 的图片，按像素放大（标志用） */
  | {kind: 'image'; src: string};

/**
 * 小剧场的布景。横坐标 x 一律以**屏宽**为单位，指物体的水平中心：
 * 0.5 是第一屏正中，1.5 是第二屏正中。
 */
export type StageProp =
  /** 书桌 + 显示器 + 台灯。显示器内容用 screen 给，场景里可以用 cue 换 */
  | {id: string; kind: 'desk'; x: number; screen?: ScreenContent}
  /** 墙上大屏。width 占屏宽比例，默认 0.42 */
  | {id: string; kind: 'screen'; x: number; width?: number; screen?: ScreenContent}
  | {id: string; kind: 'window' | 'board' | 'plant' | 'shelf'; x: number}
  /** 地上（或桌上）的小道具。lift 是离地多少格，放桌上给 20 */
  | {id: string; kind: 'item'; item: PixelItem; x: number; lift?: number; hidden?: boolean};

/** 小剧场里的一个动作。at 是在本场的什么位置发生，0-1，改了旁白时长不用重排 */
export type StageCue =
  /** 走到 to（屏宽单位），按固定步速走，朝向自动转 */
  | {at: number; move: string; to: number}
  | {at: number; face: string; mood: Mood}
  | {at: number; turn: string; facing: 'left' | 'right'}
  /** 换某块屏幕的内容 */
  | {at: number; screen: string; show: ScreenContent}
  /** 角色或道具出现 / 消失 */
  | {at: number; enter: string}
  | {at: number; exit: string};

export type StageWorld = {
  /** 房间多长，屏宽为单位。2.5 就是两屏半 */
  width: number;
  props: StageProp[];
  cast: {
    id: string;
    sprite: PixelSprite;
    /** 对白框名牌 */
    name?: string;
    x: number;
    facing?: 'left' | 'right';
    hidden?: boolean;
  }[];
};

type SceneBase = {
  /** 场景 id，渲染日志和排错时靠它定位 */
  id: string;
  /** 本场景时长（秒），总时长自动求和 */
  seconds: number;
  /** 旁白音频文件，相对 public/ 的路径；没有就留空 */
  voice?: string;
  /**
   * 旁白起始延迟（秒）。转场是**重叠**的：本场开头那几帧上一场还在画面上，
   * 这时候出声会跟上一场的旁白撞在一起。voiced() 会自动把它设成转场时长，
   * 手写脚本一般不用管。
   */
  voiceDelay?: number;
  /**
   * 词级时间戳，用来烧字幕。跟 voice 一样由 voiced() 从 voice.timings.json 填，
   * 手写也行但没必要 —— 时间戳来自语音合成本身，抄不准。
   */
  words?: WordTiming[];
  /** 给人看的备注，不出现在画面上 */
  note?: string;
};

export type Scene =
  /** 品牌开场：标志 + 字标。放在全片第一个，1.5-2.5 秒，别更长 */
  | (SceneBase & {
      type: 'brand';
      /** 相对 public/ 的标志文件（SVG 或 PNG），不给就只出字标 */
      mark?: string;
      wordmark: string;
      tagline?: string;
    })
  /**
   * 快切重拍：一句短话占满画面，可以拿一张界面当底。为 1.2-2 秒的镜头设计，
   * 底色可以逐拍切换，靠节奏和色块出情绪，跟慢节奏的 statement 不是一回事。
   */
  | (SceneBase & {
      type: 'beat';
      text: string;
      /** 相对 public/ 的界面图，当背景用，会压一层色罩 */
      src?: string;
      /** 底色：base 跟主题底、accent 品牌色块、surface 卡片色 */
      ground?: 'base' | 'accent' | 'surface';
      /** 界面背景的焦点，0-1 归一化坐标 */
      focus?: {x: number; y: number};
      /**
       * 这一拍在**第 0 帧**就完整可见，不做弹入。两个用处：
       *
       * - 全片第一个镜头：竖版社媒拿第一帧当缩略图，弹入意味着封面是空的。
       * - 配合 stagger 做「先一行、后一行」的揭示：第一行第 0 帧就在，后面几行按
       *   stagger 依次进来。
       */
      instant?: boolean;
      /**
       * 行与行之间隔多久进场，秒。默认快切片的 0.09；`instant` 时默认 0（全部一起在）。
       *
       * 给一个大数就是**在一个镜头里做揭示**：第一行先立住，第二行等到该出现的时候
       * 再进。这件事必须在一个镜头里做，不能靠切两场 —— 每场的缓慢漂移各自从头走，
       * 硬切时相位对不上，同样的字在切点上会跳几十像素。
       */
      stagger?: number;
    })
  /** 开场/章节标题 */
  | (SceneBase & {
      type: 'title';
      kicker?: string;
      headline: string;
      sub?: string;
      footnote?: string;
      /**
       * 标题在**第 0 帧**就完整可见，不做进场动画。
       *
       * 竖版社媒的全片第一帧就是封面：平台拿它当缩略图，观众划到之前先看到它。
       * 默认那 0.4 秒的逐行淡入意味着第一帧是空的，封面就废了。
       * 只对全片第一个镜头用，片中的章节标题照常进场。
       */
      instant?: boolean;
    })
  /**
   * 对话：气泡按顺序冒出来。用来演示「跟智能体聊」这件事本身 ——
   * 对话式产品的界面截图是静态的，看不出交互，一屏气泡反而更像那么回事。
   *
   * 一拍放 2 到 3 条。竖版一屏放得下的就这么多，四条以上字号会小到看不清，
   * 观众在一拍里也只读得完两三句。**演示数据必须是假的**，别贴真实用户对话。
   */
  | (SceneBase & {
      type: 'chat';
      kicker?: string;
      messages: {from: 'user' | 'agent'; text: string}[];
      /**
       * 只在像素主题下用：谁来演这两方。像素主题的 chat 是一间屋子里两个角色对话，
       * 一次只出一个对白框，字一个个打出来；kicker 变成左下角的章节牌。
       * `name` 印在对白框的名牌上，不给就不印。默认 user 是 slime、agent 是 bot。
       */
      cast?: {
        user?: {sprite?: PixelSprite; name?: string};
        agent?: {sprite?: PixelSprite; name?: string};
      };
    })
  /** 一句狠话，占满画面 */
  | (SceneBase & {type: 'statement'; text: string; attribution?: string})
  /** 标题 + 逐条出现的要点 */
  | (SceneBase & {type: 'bullets'; kicker?: string; headline: string; items: string[]})
  /** 功能宫格 */
  | (SceneBase & {
      type: 'features';
      kicker?: string;
      headline: string;
      items: {icon: string; title: string; body: string}[];
    })
  /** 数字墙，数值会滚上去 */
  | (SceneBase & {
      type: 'stats';
      kicker?: string;
      headline?: string;
      items: {value: number; prefix?: string; suffix?: string; decimals?: number; label: string; note?: string}[];
    })
  /** 界面展示：浏览器框里放一张截图或一段录屏 */
  | (SceneBase & {
      type: 'showcase';
      kicker?: string;
      headline: string;
      body?: string;
      /** 相对 public/ 的图片或视频路径 */
      src: string;
      /** 画浏览器标题栏和地址栏。默认不画，见 ScreenPanel 的注释 */
      chrome?: boolean;
      /** 地址栏文字，只在 chrome 为 true 时出现 */
      url?: string;
      /** 图文左右关系，竖版一律上下 */
      side?: 'left' | 'right';
    })
  /**
   * 界面巡览：一个镜头里轮播多张产品截图，左侧标题跟着高亮。
   * 产品片的主力镜头 —— 文字镜头再漂亮也不如让人看见东西在动。
   */
  | (SceneBase & {
      type: 'tour';
      kicker?: string;
      headline: string;
      /** 画浏览器标题栏和地址栏。默认不画 */
      chrome?: boolean;
      /** 地址栏文字，只在 chrome 为 true 时出现 */
      url?: string;
      shots: {src: string; title: string; body?: string}[];
    })
  /** 界面特写：把某张截图的某个局部放大占满画面，配一句短文案 */
  | (SceneBase & {
      type: 'detail';
      src: string;
      /** 关注点，0-1 归一化坐标，默认画面中心 */
      focus?: {x: number; y: number};
      /** 放大倍数，默认 1.8 */
      zoom?: number;
      kicker?: string;
      headline: string;
    })
  /** 价格页 */
  | (SceneBase & {
      type: 'pricing';
      kicker?: string;
      headline: string;
      price: string;
      per?: string;
      includes: string[];
      note?: string;
    })
  /** 引语 */
  | (SceneBase & {type: 'quote'; quote: string; author: string; role?: string})
  /**
   * 像素小剧场的一拍。整条片子共用脚本顶层的 `world`，场与场之间硬切但世界状态
   * 一直往下传 —— 上一场走到哪、屏幕上是什么，下一场接着来，看起来是一个长镜头。
   *
   * 一句旁白一场：`line` 是这场谁在说什么，对白框里的字跟着旁白的词级时间戳打出来，
   * 所以这种场景不再烧字幕（对白框就是字幕）。只用于像素主题，整片 transition 给 none。
   */
  | (SceneBase & {
      type: 'stage';
      /** 镜头对准哪（屏宽单位的横坐标），本场开头平移过去。zoom 默认 1 */
      camera?: {x: number; zoom?: number};
      /** who 是 world.cast 里的 id */
      line?: {who: string; text: string};
      /** 底部控制台里逐字打出的一行，年份、旁注之类 */
      console?: string;
      /** 底部左侧章节牌，给了就一直挂到下一次换 */
      chapter?: string;
      cues?: StageCue[];
      /** 浮在画面上的信息面板 */
      panel?: {title?: string; rows: string[]; at?: number};
      /** 顶部居中的大字条 */
      banner?: {text: string; sub?: string; at?: number};
      /** 抖动光圈：in 从黑里打开，out 收回黑里 */
      iris?: 'in' | 'out';
    })
  /** 收尾页 */
  | (SceneBase & {
      type: 'end';
      /** 相对 public/ 的标志文件，跟 brand 场景用同一个，首尾呼应 */
      mark?: string;
      /** 整体尺寸倍率，默认 1。短片的收尾卡要压得住，给 1.3 左右 */
      scale?: number;
      /**
       * 字标文字。**标志文件本身就是字标时不要再填** —— 同一个名字会印两遍。
       * 也别拿文字去凑一个牌子实际没有的字标：那不是这个品牌的标志。
       */
      wordmark?: string;
      tagline?: string;
      cta?: string;
      url?: string;
    });

export type VideoScript = {
  /** composition id 前缀，用短横线小写 */
  id: string;
  /** 人读的片名 */
  title: string;
  fps: number;
  theme: Theme;
  /** 要出哪几个版式，每个版式各注册一条 composition */
  formats: FormatId[];
  /**
   * 场景之间的转场；none 表示硬切，pixel 是方块溶解。
   * 不写时默认 fade，像素主题默认 pixel。
   */
  transition?: {type: 'fade' | 'slide' | 'pixel' | 'none'; seconds: number};
  /**
   * 整片一条连续旁白，横跨所有切点。
   *
   * 快切片必须用这个而不是每场的 `voice`：镜头只有 1-2 秒，挂在镜头上的音频
   * 到切点就被截断，一句话念一半没了。慢节奏片子仍然用每场 `voice`，
   * 那样改一句文案只需重切一条。
   */
  voiceover?: {
    /** 相对 public/ 的路径 */
    src: string;
    /** 延后多少秒开始，默认 0。留一点让开场的字先落位 */
    delay?: number;
    /** 旁白时长（秒），tts.mjs 会打出来。给了才会做音乐闪避 */
    seconds?: number;
    /** 闪避倍率：旁白期间音乐乘以它，默认 0.3 */
    duck?: number;
    volume?: number;
  };
  /**
   * 常驻标志。压在每个镜头上方中间，**片头 brand 和片尾 end 那两种自带标志的
   * 镜头除外**。
   *
   * 短片必须有：观众划到第一句、第二句时还不知道这是谁家的东西，
   * 看完也不会记得。SVG 里的描边颜色是写死的，所以深底浅底各给一版。
   */
  watermark?: {
    /** 压在浅色底上用的那版（深色描边） */
    onLight?: string;
    /** 压在深色底上用的那版（浅色描边） */
    onDark?: string;
    wordmark?: string;
  };
  /**
   * 正文横向对齐。**竖版短视频一律 'center'** —— 内容贴着左边缘在手机上像排版事故，
   * 而且下面还有一条居中的字幕，两条基线对不上。横版讲解片才用 'start'。
   */
  align?: 'start' | 'center';
  /**
   * 背景层。**不许拿纯色底当背景**：观众一屏一屏往下划，不动的底色等于没做设计。
   *
   * - `aurora` 竖版社媒用：三四团大色块各自漂移缩放，永远在动。`colors` 给品牌色，
   *   不给就退回主题色，能跑但不出彩。
   * - `gradient` 横版讲解片用：两团缓慢的光晕，克制，不抢内容。
   * - `plain` 只在背景要让位给满屏素材时用。
   * - `pixel` 木板墙 + 抖动网点光 + 飘浮光尘。像素主题不写 background 时默认就是它。
   */
  background?: {type: 'aurora' | 'gradient' | 'plain' | 'pixel'; colors?: string[]};
  /** 像素小剧场的布景和角色，有 stage 场景才需要 */
  world?: StageWorld;
  /** 背景音乐，相对 public/ 的路径 */
  music?: string;
  /** 背景音乐音量 0-1，有旁白时建议 0.12 以下 */
  musicVolume?: number;
  /**
   * 烧字幕。有 words 的场景默认就烧 —— 竖版社媒大半的人是静音刷的，
   * 没字幕等于没内容。整片不要字幕才设 false。
   */
  captions?: boolean;
  scenes: Scene[];
};

export const DEFAULT_TRANSITION = {type: 'fade' as const, seconds: 0.4};

/** 本片实际用的转场：脚本写了就用脚本的，没写看主题 —— 像素主题默认方块溶解。 */
export const transitionOf = (script: VideoScript): NonNullable<VideoScript['transition']> =>
  script.transition ??
  (script.theme.style === 'pixel' ? {type: 'pixel', seconds: 0.5} : DEFAULT_TRANSITION);

/** 总帧数 = 场景时长之和 - 转场重叠部分。Root 和渲染脚本都用这个算。 */
export const computeDuration = (script: VideoScript) => {
  const transition = transitionOf(script);
  const total = script.scenes.reduce((acc, s) => acc + s.seconds, 0);
  const overlap =
    transition.type === 'none' ? 0 : transition.seconds * Math.max(0, script.scenes.length - 1);
  return Math.max(1, Math.round((total - overlap) * script.fps));
};
