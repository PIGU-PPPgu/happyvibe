import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * 精选 PPT 截图 → public/images/lessons/*.webp
 * 隐私规则：凡露出真实学生姓名/学号/心理通报的图，不上线；只保留无姓名截图
 * 或作者已打码的图；含姓名但上半部干净的用 crop 裁出干净区域。
 */
const RAW = 'assets/raw/daoyuan';
const OUT = 'public/images/lessons';

// [源文件, 输出名, 可选裁剪 {top,bottom}] crop 为保留区间的像素 y 范围
const MAP = [
  // M0 basics —— 手绘漫画（安全）
  ['s004-01.png', 'comics-involution.png'],
  // M1 agent
  ['s042-03.png', 'agent-qna-to-flow.png'],
  ['s042-04.png', 'agent-auto-flow.png'],
  ['s041-01.png', 'agent-lobster-diary.png'],
  ['s058-01.png', 'agent-lobster-manual.png'],
  ['s036-01.png', 'workbuddy-chat.png'],
  ['s036-02.png', 'agent-today.png'],
  ['s036-03.png', 'kimi-demo.png'],
  ['s036-04.png', 'qoder-platform.png'],
  ['s043-01.png', 'obsidian-folders.png'],
  ['s043-02.png', 'obsidian-logo.png'],
  ['s043-03.png', 'obsidian-graph.png'],
  // M2 teaching
  ['s047-01.png', 'lesson-mvp.png'],
  ['s047-02.png', 'lesson-pack.png'],
  ['s048-02.png', 'lesson-handout.png'],
  ['s049-01.png', 'feixiang-skill-readme.png'],
  ['s015-01.png', 'feixiang-platform.png'],
  ['s024-02.png', 'physics-interactive.png'],
  ['s053-02.png', 'ohm-law.png'],
  ['s053-01.png', 'chemistry-lab.png'],
  // M3 class-management —— 仅无姓名/作者已打码截图
  ['s061-02.png', 'tracedesk-poster.png'],
  ['s063-02.png', 'tracedesk-risk.png'],
  ['s063-01.png', 'tracedesk-home.png', { top: 0, bottom: 800 }],
  ['s063-09.png', 'class-report.png'],
  ['s064-01.jpg', 'seat-os.png', { top: 0, bottom: 1560 }],
  ['s070-01.png', 'teacher-collab.png'],
  ['s070-02.png', 'duty-rules.png'],
  ['s070-04.png', 'praise-cert.png'],
  ['s071-01.png', 'growth-archive.png'],
  ['s045-03.png', 'coteacher-features.png'],
  ['s045-04.png', 'coteacher-notice.png'],
  // M4 edu-data
  ['s063-07.png', 'subject-compare.png'],
  ['s063-08.png', 'class-portrait.png'],
  // M5 research
  ['s057-01.png', 'topic-generator.png'],
  ['s057-02.png', 'topic-roadmap.png'],
  // M6 creation
  ['s019-01.png', 'luckdraw-prompt.png'],
  ['s019-02.png', 'luckdraw-output.png'],
  ['s022-01.png', 'volunteer-system.png'],
  ['s024-01.png', 'projectile-interactive.png'],
  ['s017-01.jpg', 'xhs-paid-tools.png'],
  ['s018-01.png', 'xhs-workbench.png'],
  ['s020-03.png', 'keyword-table.png'],
  ['s020-04.png', 'keyword-handbook.png'],
  ['s027-02.png', 'skill-cat-grow.png'],
  ['s028-01.png', 'skill-cat-inside.png'],
  ['s029-02.png', 'skill-cat-game.png'],
  ['s016-02.png', 'ide-cline.png'],
  ['s016-04.png', 'ide-editor.png'],
  ['s030-02.png', 'skill-solidify-1.png'],
  ['s030-03.png', 'skill-solidify-2.png'],
  ['s050-01.png', 'hermes-obsidian.png'],
  ['s011-01.png', 'mermaid-graph.png'],
  ['s030-01.png', 'onework-company.png'],
];

mkdirSync(OUT, { recursive: true });

for (const [src, out, crop] of MAP) {
  const inPath = join(RAW, src);
  const dest = join(OUT, out.replace(/\.png$/, '.webp'));
  await mkdirSync(dirname(dest), { recursive: true });
  let pipe = sharp(inPath);
  if (crop) {
    const meta = await pipe.metadata();
    pipe = pipe.extract({
      left: 0,
      top: crop.top,
      width: meta.width,
      height: Math.min(crop.bottom, meta.height) - crop.top,
    });
  }
  const meta = await pipe.metadata();
  const width = Math.min(meta.width ?? 1200, 1100);
  await pipe.resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
  console.log('→', dest);
}
console.log(`done: ${MAP.length} images`);
