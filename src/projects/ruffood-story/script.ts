import type {Scene, VideoScript} from '../../kit/script';
import {pixelTheme, type Theme} from '../../kit/theme';
import {voiced, type VoiceTimings} from '../../kit/voice';
import timings from './voice.timings.json';

/**
 * 若饭：从一碗狗粮说起。品牌故事，像素小剧场，横版一分钟左右。
 *
 * 故事节点按创始人原稿（2013 体检、2014 配方、2015 第一版），
 * 数字按官网 story 页现在的口径（40 万+ 用户）。旁白是第一人称伯恩。
 *
 * 一句旁白一场，整片硬切，世界状态一路往下传，看起来是一个长镜头。
 * 房间三屏长：第一屏伯恩的书桌和小狗，第二屏营养大屏，第三屏产品墙。
 */

const ruffoodTheme: Theme = {
  ...pixelTheme,
  name: 'ruffood-pixel',
  // 品牌橙，取自官网 tailwind primary-500
  colors: {...pixelTheme.colors, accent: '#FE6B34', accentInk: '#1B1726'},
};

const LOGO = 'brands/ruffood/logo.png';

const scenes: Scene[] = [
  {
    id: 'intro',
    type: 'stage',
    seconds: 6.5,
    iris: 'in',
    camera: {x: 0.5},
    chapter: '① 一个程序员',
    console: '2003 到 2014 · 写代码',
    line: {who: 'bern', text: '我是伯恩，若饭的创始人。做若饭之前，我写了十一年程序。'},
  },
  {
    id: 'checkup',
    type: 'stage',
    seconds: 6,
    console: '2013 · 一次常规体检',
    line: {who: 'bern', text: '2013 年体检，血脂偏高，还有脂肪肝倾向。医生说，三餐必须均衡。'},
    cues: [
      {
        at: 0.05,
        screen: 'desk',
        show: {
          kind: 'list',
          title: '体检报告',
          items: [
            {text: '血脂偏高', tone: 'bad'},
            {text: '肠胃不好', tone: 'bad'},
            {text: '脂肪肝倾向', tone: 'bad'},
          ],
        },
      },
      {at: 0.3, face: 'bern', mood: 'wide'},
    ],
  },
  {
    id: 'takeout',
    type: 'stage',
    seconds: 5,
    console: '早饭来不及 · 外卖 · 犯困',
    line: {who: 'bern', text: '可早饭来不及做，午饭晚饭全靠外卖，吃完就犯困。'},
    cues: [
      {at: 0.15, enter: 'takeout-a'},
      {at: 0.4, enter: 'takeout-b'},
      {at: 0.6, enter: 'takeout-c'},
      {at: 0.62, face: 'bern', mood: 'shut'},
    ],
  },
  {
    id: 'dog',
    type: 'stage',
    seconds: 5,
    camera: {x: 0.62, zoom: 1.2},
    line: {who: 'bern', text: '我看着家里的小狗，每天吃狗粮，却活得很健康。'},
    cues: [
      {at: 0.02, face: 'bern', mood: 'calm'},
      {at: 0.05, turn: 'bern', facing: 'right'},
      {at: 0.3, move: 'dog', to: 0.8},
      {at: 0.55, face: 'dog', mood: 'happy'},
    ],
  },
  {
    id: 'why',
    type: 'stage',
    seconds: 3.2,
    banner: {text: '为什么人没有这样的食物？', at: 0.1},
    line: {who: 'bern', text: '为什么人没有这样的食物？'},
    cues: [{at: 0.05, face: 'bern', mood: 'wide'}],
  },
  {
    id: 'nutrition',
    type: 'stage',
    seconds: 6.5,
    camera: {x: 1.4},
    chapter: '② 一顿饭的配方',
    console: '成年男性 · 每天',
    line: {who: 'bern', text: '营养学早就算清楚了，一个人一天需要什么。那就按比例把它配出来。'},
    cues: [
      {at: 0.0, face: 'bern', mood: 'calm'},
      {at: 0.02, move: 'bern', to: 1.12},
      {
        at: 0.2,
        screen: 'wall',
        show: {
          kind: 'bars',
          title: '每天需要',
          items: [
            {label: '蛋白质', value: 0.6, note: '60 克'},
            {label: '脂肪', value: 0.6, note: '60 克'},
            {label: '膳食纤维', value: 0.25, note: '25 克'},
            {label: '维生素 C', value: 1, note: '100 毫克'},
          ],
        },
      },
    ],
  },
  {
    id: 'precedent',
    type: 'stage',
    seconds: 5,
    line: {who: 'bern', text: '硅谷在做，航天员在吃，医院也在用。这事靠谱。'},
    cues: [
      {
        at: 0.05,
        screen: 'wall',
        show: {
          kind: 'list',
          title: '早就有人这么做',
          items: [
            {text: '硅谷：全营养食物', tone: 'good'},
            {text: '航天：航天食品', tone: 'good'},
            {text: '医院：肠道营养液', tone: 'good'},
          ],
        },
      },
      {at: 0.75, face: 'bern', mood: 'happy'},
    ],
  },
  {
    id: 'jane',
    type: 'stage',
    seconds: 6.5,
    camera: {x: 1.5},
    console: '2014 · 配方和人肉测试',
    line: {who: 'bern', text: '2014 年，我和营养师好友 Jane 定下配方，自己先连吃了好几周。'},
    cues: [
      {at: 0.0, face: 'bern', mood: 'calm'},
      {at: 0.05, enter: 'jane'},
      {at: 0.08, move: 'jane', to: 1.72},
      {at: 0.3, face: 'jane', mood: 'happy'},
      {
        at: 0.35,
        screen: 'wall',
        show: {kind: 'list', title: '配方 v0.1', items: [{text: '蛋白质 · 脂肪 · 碳水'}, {text: '膳食纤维'}, {text: '维生素和矿物质', tone: 'good'}]},
      },
    ],
  },
  {
    id: 'name',
    type: 'stage',
    seconds: 6.5,
    line: {who: 'bern', text: '它不是零食，不是代餐，也不是保健品。它就是一顿饭，我叫它若饭。'},
    cues: [
      {at: 0.05, screen: 'wall', show: {kind: 'text', title: '它不是', lines: ['零食', '代餐', '保健品']}},
      {at: 0.72, screen: 'wall', show: {kind: 'image', src: LOGO}},
      {at: 0.74, face: 'bern', mood: 'happy'},
    ],
  },
  {
    id: 'products',
    type: 'stage',
    seconds: 6,
    camera: {x: 2.5},
    chapter: '③ 若饭',
    console: '2015 · 第一版诞生',
    line: {who: 'bern', text: '2015 年，第一版若饭诞生。后来又有了粉末、液体和固体版。'},
    cues: [
      {at: 0.0, face: 'bern', mood: 'calm'},
      {at: 0.02, move: 'bern', to: 2.2},
      {at: 0.05, move: 'jane', to: 2.82},
      {at: 0.08, move: 'dog', to: 2.34},
      {
        at: 0.3,
        screen: 'shelf-screen',
        show: {
          kind: 'items',
          items: [
            {item: 'tub', label: '粉末'},
            {item: 'bottle', label: '液体'},
            {item: 'pouch', label: '固体'},
          ],
        },
      },
    ],
  },
  {
    id: 'users',
    type: 'stage',
    seconds: 4,
    line: {who: 'bern', text: '现在，已经有四十多万饭友在吃若饭。'},
    cues: [
      {at: 0.08, screen: 'shelf-screen', show: {kind: 'text', title: '40 万+ 饭友', lines: ['粉末 · 液体 · 固体', '一直在迭代']}},
      {at: 0.2, face: 'jane', mood: 'happy'},
      {at: 0.3, face: 'dog', mood: 'happy'},
      {at: 0.4, face: 'bern', mood: 'happy'},
    ],
  },
  {
    id: 'slogan',
    type: 'stage',
    seconds: 4,
    iris: 'out',
    line: {who: 'bern', text: '没空吃饭，来份若饭。'},
  },
  {
    id: 'end',
    type: 'end',
    seconds: 3.5,
    mark: LOGO,
    scale: 1.6,
    tagline: '让吃饭多一个省心的选择',
    url: 'ruffood.com',
  },
];

const base: VideoScript = {
  id: 'ruffood-story',
  title: '若饭：从一碗狗粮说起',
  fps: 30,
  theme: ruffoodTheme,
  formats: ['landscape'],
  // 小剧场一律硬切：世界是连续的，转场一出现就露馅
  transition: {type: 'none', seconds: 0},
  // chiptune 音床，make-bed.py --style chiptune --bpm 100 --seconds 64.67 生成（片长变了要重出）
  music: 'audio/ruffood-story/bed.mp3',
  musicVolume: 0.2,
  world: {
    width: 3,
    props: [
      // 第一屏：伯恩的家
      {id: 'window', kind: 'window', x: 0.14},
      {id: 'board', kind: 'board', x: 0.31},
      {id: 'desk', kind: 'desk', x: 0.47, screen: {kind: 'code'}},
      {id: 'takeout-a', kind: 'item', item: 'takeout', x: 0.35, lift: 17, hidden: true},
      {id: 'takeout-b', kind: 'item', item: 'takeout', x: 0.3, hidden: true},
      {id: 'takeout-c', kind: 'item', item: 'takeout', x: 0.24, hidden: true},
      {id: 'bowl', kind: 'item', item: 'bowl', x: 0.86},
      {id: 'plant-a', kind: 'plant', x: 0.95},
      // 第二屏：营养大屏
      {id: 'wall', kind: 'screen', x: 1.5, width: 0.46, screen: {kind: 'off'}},
      {id: 'shelf-a', kind: 'shelf', x: 1.88},
      // 第三屏：产品墙
      {id: 'shelf-screen', kind: 'screen', x: 2.5, width: 0.5, screen: {kind: 'off'}},
      {id: 'plant-b', kind: 'plant', x: 2.93},
    ],
    cast: [
      {id: 'bern', sprite: 'coder', name: '伯恩', x: 0.62, facing: 'left'},
      {id: 'dog', sprite: 'dog', x: 0.74, facing: 'left'},
      {id: 'jane', sprite: 'nutritionist', name: 'Jane', x: 1.98, facing: 'left', hidden: true},
    ],
  },
  scenes,
};

// 每场秒数由旁白实测时长算，上面写的只是没有旁白时的兜底。片尾标志卡不配旁白，保留 3.5 秒。
// 句间呼吸给短一点：这是一个人一口气讲下来的故事，停太久像在念稿。
export const ruffoodStoryScript = voiced(base, timings as VoiceTimings, {breath: 0.4});
