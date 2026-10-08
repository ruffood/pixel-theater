import type {VideoScript} from '../kit/script';
import {pixelTemplateScript} from './_pixel/script';
import {stageTemplateScript} from './_pixel/stage';
import {ruffoodStoryScript} from './ruffood-story/script';

/**
 * 所有片子在这里登记。`npm run new` 会自动往数组最前面加一行。
 * 顺序不影响渲染，只影响 Studio 侧栏的排序。
 */
export const projects: VideoScript[] = [ruffoodStoryScript, stageTemplateScript, pixelTemplateScript];
