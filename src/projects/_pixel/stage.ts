import {pixelTheme} from '../../kit/theme';
import type {VideoScript} from '../../kit/script';

/**
 * 像素小剧场样例。一个房间、两个角色、四拍戏，演示 stage 场景的全部能力：
 * 光圈开合、镜头平移和推近、走位、表情、屏幕换内容、面板、大字条、底部导演栏。
 *
 * 真片子里每场的 seconds 由 voiced() 从旁白算，对白框跟着词级时间戳打字；
 * 这里没有音频，按秒数匀速打。产品是虚构的。
 */
export const stageTemplateScript: VideoScript = {
  id: 'template-stage',
  title: '模板：像素小剧场',
  fps: 30,
  theme: pixelTheme,
  formats: ['landscape'],
  // 小剧场一律硬切，世界状态一场接一场往下传
  transition: {type: 'none', seconds: 0},
  world: {
    width: 2,
    props: [
      {id: 'window', kind: 'window', x: 0.14},
      {id: 'desk', kind: 'desk', x: 0.45, screen: {kind: 'code'}},
      {id: 'box', kind: 'item', item: 'takeout', x: 0.34, lift: 17, hidden: true},
      {id: 'wall', kind: 'screen', x: 1.45, screen: {kind: 'off'}},
      {id: 'shelf', kind: 'shelf', x: 1.85},
    ],
    cast: [
      {id: 'dev', sprite: 'coder', name: '小林', x: 0.62, facing: 'left'},
      {id: 'pup', sprite: 'dog', x: 0.78, facing: 'left'},
      {id: 'doc', sprite: 'nutritionist', name: '周医生', x: 1.7, facing: 'left'},
    ],
  },
  scenes: [
    {
      id: 'open',
      type: 'stage',
      seconds: 5,
      iris: 'in',
      camera: {x: 0.5},
      chapter: '① 开场',
      console: '第一拍 · 光圈打开',
      line: {who: 'dev', text: '又加班到半夜，晚饭还没吃。'},
      cues: [
        {at: 0.4, enter: 'box'},
        {at: 0.5, face: 'dev', mood: 'shut'},
      ],
    },
    {
      id: 'walk',
      type: 'stage',
      seconds: 5,
      camera: {x: 1.3},
      chapter: '② 走位',
      console: '第二拍 · 镜头平移，角色走过去',
      line: {who: 'doc', text: '先看看你一天到底吃了什么。'},
      cues: [
        {at: 0.0, face: 'dev', mood: 'calm'},
        {at: 0.02, move: 'dev', to: 1.15},
        {
          at: 0.3,
          screen: 'wall',
          show: {kind: 'bars', title: '今天吃了', items: [{label: '蛋白质', value: 0.3, note: '不够'}, {label: '膳食纤维', value: 0.15, note: '不够'}]},
        },
      ],
    },
    {
      id: 'panel',
      type: 'stage',
      seconds: 4.5,
      panel: {title: '面板', rows: ['浮在画面上的信息', '逐行出现'], at: 0.1},
      line: {who: 'dev', text: '原来差这么多。'},
      cues: [{at: 0.3, face: 'dev', mood: 'wide'}],
    },
    {
      id: 'close',
      type: 'stage',
      seconds: 4.5,
      iris: 'out',
      banner: {text: '大字条', sub: '顶部居中', at: 0.05},
      line: {who: 'doc', text: '那就从明天的早饭开始。'},
      cues: [
        {at: 0.1, face: 'doc', mood: 'happy'},
        {at: 0.2, face: 'dev', mood: 'happy'},
      ],
    },
  ],
};
