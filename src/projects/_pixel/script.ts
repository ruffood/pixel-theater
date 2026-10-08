import {pixelTheme} from '../../kit/theme';
import type {VideoScript} from '../../kit/script';

/**
 * 像素主题样例：全部场景类型在像素风下各摆一遍，顺便验中文像素字。
 *
 * 任何一条脚本片换成像素风只改一行：`theme: pixelTheme`。背景默认变像素墙、
 * 转场默认变方块溶解，`chat` 变成角色对白。产品是虚构的。
 */
export const pixelTemplateScript: VideoScript = {
  id: 'template-pixel',
  title: '模板：像素主题',
  fps: 30,
  theme: pixelTheme,
  formats: ['landscape', 'portrait'],

  scenes: [
    {id: 'brand', type: 'brand', seconds: 2, wordmark: '小方块', tagline: '像素风样例'},
    {
      id: 'open',
      type: 'title',
      seconds: 4,
      kicker: '第一章',
      headline: '一句标题\n断在你想断的地方',
      sub: '副标题讲承诺，两行以内。',
      footnote: '可选的脚注',
    },
    {id: 'beat', type: 'beat', seconds: 1.6, text: '一句短话\n踩在拍子上', ground: 'accent'},
    {
      id: 'chat',
      type: 'chat',
      seconds: 7,
      kicker: '① 粗略的想法',
      cast: {agent: {sprite: 'bot', name: '小方'}, user: {sprite: 'cat', name: '阿橘'}},
      messages: [
        {from: 'user', text: '每天吃什么，真是个难题。'},
        {from: 'agent', text: '那就把营养算清楚，一次配好。'},
      ],
      note: '像素主题的 chat：一次一个对白框，字逐个打出来，说话的角色会跳一下。kicker 变成章节牌。',
    },
    {id: 'statement', type: 'statement', seconds: 3, text: '一句话\n画面上什么都不放。', attribution: '问题'},
    {
      id: 'points',
      type: 'bullets',
      seconds: 4.5,
      kicker: '它做什么',
      headline: '三件事，\n不是十三件。',
      items: ['第一件事', '第二件事', '第三件事'],
    },
    {
      id: 'features',
      type: 'features',
      seconds: 5,
      kicker: '一个平台',
      headline: '要的都在这里。',
      items: [
        {icon: '◆', title: '第一个功能', body: '一句话说清它到底干什么。'},
        {icon: '▲', title: '第二个功能', body: '一句话说清它到底干什么。'},
        {icon: '■', title: '第三个功能', body: '一句话说清它到底干什么。'},
      ],
    },
    {
      id: 'numbers',
      type: 'stats',
      seconds: 4,
      kicker: '数字',
      items: [
        {value: 18, suffix: '万', label: '用户'},
        {value: 99.5, decimals: 1, suffix: '%', label: '好评'},
        {value: 2015, label: '创立'},
      ],
    },
    {
      id: 'ui',
      type: 'showcase',
      seconds: 4.5,
      kicker: '看它怎么用',
      headline: '放产品，\n不放图库照片。',
      src: 'demo/placeholder.png',
    },
    {
      id: 'tour',
      type: 'tour',
      seconds: 6,
      kicker: '走一圈',
      headline: '让人看见东西在动。',
      shots: [
        {src: 'demo/placeholder.png', title: '第一屏', body: '这一屏是干什么的。'},
        {src: 'demo/placeholder.png', title: '第二屏', body: '这一屏是干什么的。'},
      ],
    },
    {
      id: 'detail',
      type: 'detail',
      seconds: 3,
      src: 'demo/placeholder.png',
      focus: {x: 0.34, y: 0.28},
      zoom: 2.2,
      kicker: '看这里',
      headline: '一个局部，占满画面。',
    },
    {
      id: 'price',
      type: 'pricing',
      seconds: 4.5,
      kicker: '价格',
      headline: '一个价格，说清楚。',
      price: '¥99',
      per: '/ 月',
      includes: ['全部功能', '没有隐藏模块', '专人上手指导'],
      note: '免费试用 14 天',
    },
    {id: 'quote', type: 'quote', seconds: 4, quote: '一句真有人说过的夸奖。', author: '某某', role: '职位，公司'},
    {
      id: 'end',
      type: 'end',
      seconds: 4,
      wordmark: '小方块',
      tagline: '你想让人记住的那句话。',
      cta: '免费试用',
      url: 'example.com',
    },
  ],
};
