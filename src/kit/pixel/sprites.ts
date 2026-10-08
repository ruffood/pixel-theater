import type {PixelSprite} from '../script';

/** [x, y, 宽, 高]，单位是格 */
export type Rect = [number, number, number, number];

/**
 * 一个角色：身体是一张字符画，每个字符查 palette 取色，`.` 是透明。
 * 眼睛和嘴单独给几块矩形，这样眨眼、说话只换这几块，身体不用画好几帧。
 */
export type SpriteDef = {
  palette: Record<string, string>;
  body: string[];
  eyes: {open: Rect[]; shut: Rect[]; color: string};
  mouth: {shut: Rect[]; open: Rect[]; color: string};
};

const INK = '#1B1726';

/**
 * 三个原创角色。新加角色就在这里加一项，再把名字加进 script.ts 的 PixelSprite。
 * 每行字符数必须一样，不一样的话 PixelArt 渲染时直接报错，不会悄悄画歪。
 */
export const SPRITES: Record<PixelSprite, SpriteDef> = {
  /** 方脑袋机器人，脸是一块屏幕 */
  bot: {
    palette: {o: INK, b: '#5FC3B5', s: '#3E8F86', d: '#1E2A35', a: '#F08A4B', h: '#F6D365'},
    body: [
      '.......aa.......',
      '.......oo.......',
      '..oooooooooooo..',
      '.obbbbbbbbbbbbbo',
      '.obddddddddddbso',
      '.obddddddddddbso',
      '.obddddddddddbso',
      '.obddddddddddbso',
      '.obddddddddddbso',
      '.obbbbbbbbbbbbso',
      '..oooooooooooo..',
      '...obbbbbbbbso..',
      '..obbhbbbbhbbso.',
      '..obbbbbbbbbbso.',
      '...oso....oso...',
      '...ooo....ooo...',
    ],
    eyes: {open: [[4, 5, 2, 2], [10, 5, 2, 2]], shut: [[4, 6, 2, 1], [10, 6, 2, 1]], color: '#9BF6E8'},
    mouth: {shut: [[6, 8, 4, 1]], open: [[6, 7, 4, 2]], color: '#9BF6E8'},
  },
  /** 水滴形的果冻 */
  slime: {
    palette: {o: INK, b: '#8BD46E', s: '#5E9E4B', h: '#E2F9D2'},
    body: [
      '................',
      '................',
      '.......oo.......',
      '......obbo......',
      '.....obhbbo.....',
      '....obhbbbbo....',
      '...obhbbbbbbo...',
      '..obbbbbbbbbbo..',
      '..obbbbbbbbbbo..',
      '.obbbbbbbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.obsbbbbbbbbsbo.',
      '.obssbbbbbbssbo.',
      '..osssssssssso..',
      '...oooooooooo...',
    ],
    eyes: {open: [[5, 9, 2, 2], [9, 9, 2, 2]], shut: [[5, 10, 2, 1], [9, 10, 2, 1]], color: INK},
    mouth: {shut: [[7, 12, 2, 1]], open: [[7, 12, 2, 2]], color: INK},
  },
  /** 坐着的猫 */
  cat: {
    palette: {o: INK, b: '#F2B880', s: '#C98A55', a: '#F48FA0', w: '#FFF1DC'},
    body: [
      '..o..........o..',
      '.oao........oao.',
      '.obbo......obbo.',
      '.obbboooooobbbo.',
      '.obbbbbbbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.owwbbbbbbbbwwo.',
      '.obbbbbbbbbbbbo.',
      '..obbbbbbbbbbo..',
      '...oooooooooo...',
      '...obbbbbbbbo...',
      '..obbwwwwwwbsoo.',
      '..obbwwwwwwbsobo',
      '..obbbbbbbbbsoo.',
      '...oo.oooo.oo...',
    ],
    eyes: {open: [[4, 5, 2, 2], [10, 5, 2, 2]], shut: [[4, 6, 2, 1], [10, 6, 2, 1]], color: INK},
    mouth: {shut: [[7, 7, 2, 1]], open: [[7, 7, 2, 2]], color: INK},
  },
  /** 穿连帽衫的程序员 */
  coder: {
    palette: {o: INK, h: '#3B2A26', s: '#F2C69B', S: '#D9A57A', c: '#4C6FAF', C: '#3A5690', w: '#E9E3D6', p: '#2E2A3D', g: '#F4E9D0'},
    body: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhsssssshho..',
      '..ohssssssssho..',
      '..ossssssssssoo.',
      '..osssssssssso..',
      '..ossssssssssoo.',
      '...osssssssso...',
      '....osssssso....',
      '...ooooSSoooo...',
      '..occcccccccco..',
      '.occccgccgccccco',
      '.occccgccgcccCco',
      '.ocCcccccccccCco',
      '.osCccccccccCso.',
      '.oSoccccccccoSo.',
      '..oocccccccco...',
      '...opppppppo....',
      '...opppopppo....',
      '...oppo.oppo....',
      '...owwo.owwo....',
      '...oooo.oooo....',
    ],
    eyes: {open: [[5, 6, 2, 2], [9, 6, 2, 2]], shut: [[5, 7, 2, 1], [9, 7, 2, 1]], color: INK},
    mouth: {shut: [[7, 9, 2, 1]], open: [[7, 9, 2, 2]], color: '#8A4A3A'},
  },
  /** 穿白大褂的营养师 */
  nutritionist: {
    palette: {o: INK, h: '#7A4A2E', s: '#F2C69B', S: '#D9A57A', c: '#F4F1EA', C: '#CFC8BA', r: '#E05A5A', p: '#3D4A6B', w: '#2E2A3D'},
    body: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhsssssshhho.',
      '.ohhssssssssho..',
      '.ohssssssssssho.',
      '.ohssssssssssho.',
      '.ohhssssssssho..',
      '.ohhosssssshho..',
      '..ohhosssshho...',
      '...ooooSSoooo...',
      '..occcCrrCccco..',
      '.occccCrrCcccco.',
      '.occccCrrCcccco.',
      '.ocCcccCCcccCco.',
      '.osCcccccccccso.',
      '.oSocccccccccSo.',
      '..occccccccco...',
      '...opppppppo....',
      '...opppopppo....',
      '...oppo.oppo....',
      '...owwo.owwo....',
      '...oooo.oooo....',
    ],
    eyes: {open: [[5, 6, 2, 2], [9, 6, 2, 2]], shut: [[5, 7, 2, 1], [9, 7, 2, 1]], color: INK},
    mouth: {shut: [[7, 9, 2, 1]], open: [[7, 9, 2, 2]], color: '#8A4A3A'},
  },
  /** 垂耳小狗。闭嘴不画嘴，张嘴吐舌头 */
  dog: {
    palette: {o: INK, b: '#E3A15B', s: '#9A5E2E', w: '#FFF1DC', n: INK},
    body: [
      '...oooooooooo...',
      '..obbbbbbbbbbo..',
      '.osbbbbbbbbbbso.',
      'ossbbbbbbbbbbsso',
      'ossbbbbbbbbbbsso',
      'ossbbbbbbbbbbsso',
      '.osbbwwwwwwbbso.',
      '..obwwwnnwwwbo..',
      '...owwwwwwwwo...',
      '....oooooooo....',
      '...obbbbbbbbo.oo',
      '..obbbwwwwbbbobo',
      '..obbwwwwwwbbbo.',
      '..obbobbbbobbo..',
      '...oo.oooo.oo...',
    ],
    eyes: {open: [[5, 4, 2, 2], [9, 4, 2, 2]], shut: [[5, 5, 2, 1], [9, 5, 2, 1]], color: INK},
    mouth: {shut: [], open: [[7, 8, 2, 2]], color: '#E86A7A'},
  },
};

/** 房间里的盆栽 */
export const PLANT = {
  palette: {g: '#5E9E4B', G: '#8BD46E', r: '#B5643A', p: '#D9804F', o: INK},
  body: [
    '.....g....',
    '..g.gGg...',
    '.gGg.Gg.g.',
    '.gGgggGgGg',
    '..gGg.gGg.',
    '...gggg...',
    '....gg....',
    '.rrrrrrrr.',
    '.oppppppo.',
    '..oppppo..',
    '..oppppo..',
    '...oooo...',
  ],
};
