import React, {useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

/**
 * 像素溶解：画面切成方块，新镜头一块一块顶上来。顺序是「左上到右下的斜扫 + 一点随机」，
 * 纯随机看着像信号故障，纯斜扫又太规整。
 *
 * 进场和出场两边用互补的遮罩，谁压在谁上面都不影响结果。
 */
type Props = Record<string, unknown>;

const rand = (i: number) => {
  const x = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
};

const PixelDissolve: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationProgress,
  presentationDirection,
}) => {
  const {width, height} = useVideoConfig();
  const cell = Math.min(width, height) / 9;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);

  const ranks = useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const diag = (c / cols + r / rows) / 2;
        out.push(diag * 0.6 + rand(r * cols + c) * 0.4);
      }
    }
    return out;
  }, [cols, rows]);

  const entering = presentationDirection === 'entering';
  const p = presentationProgress;
  // 两头不用遮罩：进场完成后、出场开始前，整张画面原样显示
  if ((entering && p >= 1) || (!entering && p <= 0)) return <AbsoluteFill>{children}</AbsoluteFill>;

  let d = '';
  ranks.forEach((rank, i) => {
    if (rank < p === entering) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      d += `M${c} ${r}h1v1h-1z`;
    }
  });
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' width='${cols * cell}' height='${rows * cell}' shape-rendering='crispEdges'><path d='${d || 'M0 0'}' fill='black'/></svg>`;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <AbsoluteFill
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: `${cols * cell}px ${rows * cell}px`,
        WebkitMaskSize: `${cols * cell}px ${rows * cell}px`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const pixelDissolve = (): TransitionPresentation<Props> => ({
  component: PixelDissolve,
  props: {},
});
