import React from 'react';
import {Composition} from 'remotion';
import {FORMATS} from './kit/format';
import {computeDuration} from './kit/script';
import {Storyboard} from './kit/Storyboard';
import {projects} from './projects';

/**
 * 每个项目 × 每个版式 = 一条 composition，id 形如 `my-film-landscape`。
 * 不用手写 Composition，往 projects/index.ts 里加脚本就行。
 */
export const Root: React.FC = () => (
  <>
    {projects.flatMap((script) =>
      script.formats.map((format) => (
        <Composition
          key={`${script.id}-${format}`}
          id={`${script.id}-${format}`}
          component={Storyboard}
          durationInFrames={computeDuration(script)}
          fps={script.fps}
          width={FORMATS[format].width}
          height={FORMATS[format].height}
          defaultProps={{script}}
        />
      )),
    )}
  </>
);
