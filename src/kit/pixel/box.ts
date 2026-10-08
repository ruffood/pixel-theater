import type {CSSProperties} from 'react';

/**
 * 缺角像素框。边框不用 border，用四个方向各偏一格的硬阴影拼：每条阴影只盖住一条边，
 * 四个角就自然缺一格 —— 像素画里的框都是这样，直角框看着像网页。
 * 再给 `shadow` 就在右下补一层硬投影（不模糊，像素风没有模糊）。
 *
 * `dot` 是一格的边长，px。
 */
export const pixelBox = ({
  fill,
  border,
  shadow,
  dot,
}: {
  fill: string;
  border: string;
  shadow?: string;
  dot: number;
}): CSSProperties => ({
  backgroundColor: fill,
  border: 'none',
  borderRadius: 0,
  boxShadow: [
    `0 ${-dot}px 0 0 ${border}`,
    `0 ${dot}px 0 0 ${border}`,
    `${-dot}px 0 0 0 ${border}`,
    `${dot}px 0 0 0 ${border}`,
    ...(shadow ? [`${dot * 2}px ${dot * 2}px 0 0 ${shadow}`] : []),
  ].join(', '),
});

/** 像素框和各种小方块的一格边长。跟着画面短边走，1080 上是 5px。 */
export const pixelDot = (unit: number) => Math.max(2, Math.round(5 * unit));
