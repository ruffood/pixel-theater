import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Chrome 在 macOS 上用 angle 渲染最稳，避免偶发的白帧。
Config.setChromiumOpenGlRenderer('angle');
