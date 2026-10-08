#!/usr/bin/env node
/**
 * 统一渲染入口。
 *
 *   node scripts/render.mjs <project-id>                 出脚本里声明的所有版式
 *   node scripts/render.mjs my-film --format portrait
 *   node scripts/render.mjs my-film --codec gif --scale 0.5
 *   node scripts/render.mjs my-film --crf 23                 压体积（默认 18，越大越小越糊）
 *   node scripts/render.mjs my-film --still 3.5      在第 3.5 秒截一张图
 *   node scripts/render.mjs --list                       列出全部 composition
 *
 * 成片落在 out/<项目>/<版式>.mp4，草图落在 out/<项目>/stills/。
 * 同名文件直接覆盖（remotion.config.ts 里开了 overwrite）。
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const remotion = (args, opts = {}) =>
  execFileSync('npx', ['remotion', ...args], {cwd: ROOT, stdio: 'inherit', ...opts});

const listCompositions = () => {
  const out = execFileSync('npx', ['remotion', 'compositions'], {cwd: ROOT, encoding: 'utf8'});
  // 解析那张表：`<id>  <fps>  <w>x<h>  <frames> (<sec>)`，顺带剥掉进度条的 ANSI 码。
  return out
    .replace(/\u001b\[[0-9;]*m/g, '')
    .split('\n')
    .map((line) => line.trim().match(/^(\S+)\s+(\d+)\s+\d+x\d+\s/))
    .filter(Boolean)
    .map((m) => ({id: m[1], fps: Number(m[2])}));
};

if (has('list') || argv.length === 0) {
  console.log(listCompositions().map((c) => c.id).join('\n'));
  process.exit(0);
}

const project = argv[0];
const all = listCompositions();
const wanted = flag('format')
  ? flag('format')
      .split(',')
      .map((f) => all.find((c) => c.id === `${project}-${f.trim()}`))
      .filter(Boolean)
  : all.filter((c) => c.id === project || c.id.startsWith(`${project}-`));

if (wanted.length === 0) {
  console.error(`找不到 ${project} 对应的 composition。现有的是：\n${all.map((c) => c.id).join('\n')}`);
  process.exit(1);
}

// 成片按项目分目录：out/<项目>/<版式>.mp4；调版面用的草图另放 stills/，
// 不然一个项目迭代几轮就把 out/ 根目录堆满了。
const outDir = resolve(ROOT, 'out', project);
mkdirSync(outDir, {recursive: true});

const codec = flag('codec', 'h264');
const scale = flag('scale');
const still = flag('still');
const crf = flag('crf');
const ext = {h264: 'mp4', h265: 'mp4', vp9: 'webm', vp8: 'webm', prores: 'mov', gif: 'gif'}[codec] ?? 'mp4';

for (const {id, fps} of wanted) {
  // composition id 是 `<项目>-<版式>`，落地时把项目名那截去掉，目录已经带了
  const variant = id === project ? project : id.slice(project.length + 1);
  if (still !== undefined) {
    mkdirSync(resolve(outDir, 'stills'), {recursive: true});
    const target = `out/${project}/stills/${variant}-${still}s.png`;
    console.log(`\n▶ 截图 ${id} @ ${still}s → ${target}`);
    remotion(['still', id, target, `--frame=${Math.round(Number(still) * fps)}`]);
    continue;
  }
  const target = `out/${project}/${variant}.${ext}`;
  console.log(`\n▶ 渲染 ${id} → ${target}`);
  remotion([
    'render',
    id,
    target,
    `--codec=${codec}`,
    ...(scale ? [`--scale=${scale}`] : []),
    ...(crf ? [`--crf=${crf}`] : []),
    '--log=info',
  ]);
}

console.log(`\n完成。成片在 out/${project}/`);
