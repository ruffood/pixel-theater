import type {PixelItem} from '../script';

const INK = '#1B1726';

/** 小道具。跟角色一样是字符画，`.` 透明 */
export const ITEMS: Record<PixelItem, {palette: Record<string, string>; body: string[]}> = {
  /** 粉末罐：黄盖白身 */
  tub: {
    palette: {o: INK, y: '#F5C518', Y: '#D9A40E', w: '#F4F1EA', W: '#D8D2C4', r: '#FE6B34'},
    body: [
      '..oooooooo..',
      '.oyyyyyyyyo.',
      '.oYYYYYYYYo.',
      'oooooooooooo',
      'owwwwwwwwwWo',
      'owwrrrrrrwWo',
      'owwrwwwwrwWo',
      'owwrrrrrrwWo',
      'owwwwwwwwwWo',
      'owwwwwwwwwWo',
      '.oooooooooo.',
    ],
  },
  /** 液体瓶：白瓶棕标 */
  bottle: {
    palette: {o: INK, w: '#F4F1EA', W: '#D8D2C4', b: '#8A5A3C', B: '#6B4430'},
    body: [
      '..oooo..',
      '..owWo..',
      '..owWo..',
      '.owwwWo.',
      'owwwwwWo',
      'obbbbbBo',
      'obwwwbBo',
      'obbbbbBo',
      'owwwwwWo',
      'owwwwwWo',
      'owwwwwWo',
      '.oooooo.',
    ],
  },
  /** 固体版：黑色立袋，开窗看得见金色小球 */
  pouch: {
    palette: {o: INK, k: '#2A2733', K: '#3A3645', r: '#FE6B34', g: '#E8B84A'},
    body: [
      '.oooooooo.',
      'okkkkkkkKo',
      'okkkkkkkKo',
      'okrrrrrrKo',
      'okkkkkkkKo',
      'okkkggkkKo',
      'okkggggkKo',
      'okkkggkkKo',
      'okkkkkkkKo',
      'okkkkkkkKo',
      '.oooooooo.',
    ],
  },
  /** 外卖袋 */
  takeout: {
    palette: {o: INK, w: '#F4F1EA', W: '#D8D2C4', r: '#E05A5A'},
    body: [
      '....oooo....',
      '...o....o...',
      'oooooooooooo',
      'orrrrrrrrrro',
      'owwwwwwwwwWo',
      'owwwrrrrwwWo',
      'owwwwwwwwwWo',
      'owwwwwwwwwWo',
      'oooooooooooo',
    ],
  },
  /** 狗碗，上面一层狗粮 */
  bowl: {
    palette: {o: INK, k: '#A0683A', r: '#E05A5A', R: '#B84444'},
    body: [
      '..kkkkkkkk..',
      '.oooooooooo.',
      'orrrrrrrrRRo',
      '.orrrrrrrRo.',
      '..oooooooo..',
    ],
  },
};
