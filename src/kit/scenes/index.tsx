import React from 'react';
import type {Scene} from '../script';
import {BeatScene} from './Beat';
import {BrandScene} from './Brand';
import {BulletsScene} from './Bullets';
import {ChatScene} from './Chat';
import {DetailScene} from './Detail';
import {EndScene} from './End';
import {FeaturesScene} from './Features';
import {PricingScene} from './Pricing';
import {QuoteScene} from './Quote';
import {ShowcaseScene} from './Showcase';
import {StatementScene} from './Statement';
import {StageScene} from './Stage';
import {StatsScene} from './Stats';
import {TourScene} from './Tour';
import {TitleScene} from './Title';

export * from './types';

/**
 * scene.type → 组件。加新场景类型：script.ts 加一个联合分支，这里加一行，
 * 再写对应组件。别在别处 switch。
 */
export const renderScene = (scene: Scene): React.ReactNode => {
  switch (scene.type) {
    case 'beat':
      return <BeatScene scene={scene} />;
    case 'brand':
      return <BrandScene scene={scene} />;
    case 'title':
      return <TitleScene scene={scene} />;
    case 'statement':
      return <StatementScene scene={scene} />;
    case 'bullets':
      return <BulletsScene scene={scene} />;
    case 'chat':
      return <ChatScene scene={scene} />;
    case 'features':
      return <FeaturesScene scene={scene} />;
    case 'stats':
      return <StatsScene scene={scene} />;
    case 'showcase':
      return <ShowcaseScene scene={scene} />;
    case 'tour':
      return <TourScene scene={scene} />;
    case 'detail':
      return <DetailScene scene={scene} />;
    case 'pricing':
      return <PricingScene scene={scene} />;
    case 'quote':
      return <QuoteScene scene={scene} />;
    case 'end':
      return <EndScene scene={scene} />;
    case 'stage':
      return <StageScene scene={scene} />;
    default: {
      // 穷尽检查：script.ts 里加了新 type 却忘了在这里接上，tsc 会在这一行报错。
      const unhandled: never = scene;
      throw new Error(`未接线的场景类型：${JSON.stringify(unhandled)}`);
    }
  }
};
