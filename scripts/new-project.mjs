#!/usr/bin/env node
/**
 * 开一条新片：
 *   npm run new -- my-film "片名"
 *
 * 干三件事：把像素小剧场样例（src/projects/_pixel/stage.ts）复制成
 * src/projects/<slug>/script.ts、改掉里面的 id/变量名/片名、往 src/projects/index.ts 登记。
 * 另外按样例里每场的台词生成一份 voice.json，改完台词跑 tts 就能配音。
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, title] = process.argv.slice(2);

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('用法：npm run new -- <slug> "<片名>"（slug 用小写字母、数字和短横线）');
  process.exit(1);
}

const dest = resolve(ROOT, 'src/projects', slug);
if (existsSync(dest)) {
  console.error(`${dest} 已存在，换个 slug。`);
  process.exit(1);
}

const camel = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const varName = `${camel}Script`;

const script = readFileSync(resolve(ROOT, 'src/projects/_pixel/stage.ts'), 'utf8')
  .replace('export const stageTemplateScript', `export const ${varName}`)
  .replace("id: 'template-stage',", `id: '${slug}',`)
  .replace("title: '模板：像素小剧场',", `title: '${title ?? slug}',`);
mkdirSync(dest, {recursive: true});
writeFileSync(resolve(dest, 'script.ts'), script);

// 每个 stage 场景的 id 和台词抄进 voice.json，两边必须一字不差
const lines = {};
for (const m of script.matchAll(/id: '([\w-]+)',\n\s+type: 'stage',[\s\S]*?line: \{who: '[\w-]+', text: '([^']+)'\}/g)) {
  lines[m[1]] = m[2];
}
writeFileSync(
  resolve(dest, 'voice.json'),
  `${JSON.stringify({_note: '逐场旁白，必须跟 script.ts 里每场 line.text 一字不差。改完跑 npm run tts -- --project ' + slug, lines}, null, 2)}\n`,
);

const indexPath = resolve(ROOT, 'src/projects/index.ts');
const index = readFileSync(indexPath, 'utf8')
  .replace(
    "import type {VideoScript} from '../kit/script';",
    `import type {VideoScript} from '../kit/script';\nimport {${varName}} from './${slug}/script';`,
  )
  .replace('export const projects: VideoScript[] = [', `export const projects: VideoScript[] = [${varName}, `);
writeFileSync(indexPath, index);

console.log(`已创建 src/projects/${slug}/（script.ts + voice.json）并登记。`);
console.log(`下一步：改脚本 → npm run check → npm run render -- ${slug} --still 1`);
