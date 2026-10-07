# Harness v2 —— 从"手工做课"到"发资料即产出"

日期：2026-10-08。目标：用户只需提供教材资料（照片/PDF/课题描述），框架产出对标 WeduLab 的成品资源并自动上线。

## 六层流水线

| 层 | 职责 | 载体 |
|---|---|---|
| L0 资料层 | 教材照片/PDF/课题 → 提取课题、教材锚点、知识点 | `materials/`（不入库，隐私） |
| L1 契约层 | 教学契约（环节用教材动词/讲解/检测/小结）+ 锚点校验 | `teaching` 对象 + `scripts/textbook-index.mjs` |
| L2 场景层 | **场景原型库**：选原型 + 参数；custom 逃生门 | `src/interactives/_shared/scenes/*.mjs` |
| L3 产物层 | esbuild 单文件 HTML（港紫壳 v3：左轨章节栏） | `scripts/build_interactives.mjs` |
| L4 验收层 | 五阶段 verify：构建→预览（空白检测）→12 闸门→视觉闸门（像素+目检册）→双主题 harness | `scripts/verify.mjs` |
| L5 发布层 | 一条命令：verify→build→deploy（代理）→curl 字节验证→commit→push | `scripts/ship.mjs` |

## "发资料就能做"的标准动作

```bash
# 1. 脚手架（锚点先校验，G11 前置；生成 spec 骨架 + 教学设计 md 骨架）
node scripts/new_interactive.mjs math bsuex-7a-2-4-add \
  --title "有理数加法·数轴行者" \
  --anchor "北师大版七上第二章《有理数及其运算》· 2.4" \
  --archetype numberline
# 2. 填 TEACHING（教材动词环节：想一想/做一做/议一议）与 SPEC 参数（设计先行，md 先写）
# 3. 验收（五阶段，一处不过即中止）
npm run verify
# 4. 一键发布（字节级线上验证 + git 双端）
node scripts/ship.mjs "北师大七上 2.4 有理数加法上线"
```

## 技术栈决策（2026-10-08 复审）

**保留**：Astro 静态站 / 原生 JS + three.js / esbuild 单文件产物 / Cloudflare Pages。
理由：断网双击投屏是硬需求（单文件、零外链、零运行时）；25 资源与全链闸门已在此栈验证；CF Pages 零成本静态托管。

**增量**（本轮落地）：
1. 场景原型库 `_shared/scenes/`：构建期共享、产物仍单文件（与 runtime.mjs 同机制）。原型=参数化场景+内置数值同源自检；custom 资源不受影响。
2. 脚手架 `new_interactive.mjs`：锚点校验前置、spec/教学设计骨架一次生成。
3. 一键发布 `ship.mjs`：把我手工跑的六步序列固化（含 HTTPS_PROXY、字节验证、push 双端确认）。
4. 数值同源断言（edulab 原则）：所有读数类 UI 的显示值必须与同一计算函数的结果一致，selftest 断言名为「同源-xxx」。

**否决**：React/Vue（体积、无 SSR 需求）；Python/sympy 运行时（无端运行环境；精确性以"构建期双算 + runtime 同源断言"替代）；Web Components 框架（原生够用）；多文件产物（破坏断网单文件承诺）。

## 原型库路线图

- v1（本轮）：`numberline`（三要素/自由拖动/对称演示/加法行程四模式，参数：range/step/箭头/读数行）
- v2（下轮逐个抽取）：`canvas-lab`（function-lab 系）、`solid3d`（solid-section/cube-nets 系）、`timeline`（dynasties 系）、`cardwall`（famous-lines/pinyin 系）

## 验收契约（不变的部分）

教学契约 v2（steps≥3、guide≥15 字、note≥40 字、quiz≥4 且 ≥120 字）+ 12 产物闸门 + 双主题 harness + 视觉三层闸门 + 教材锚点真伪。视觉模型不可用时以像素规则+结构断言放行，目检册 method 字段如实标注证据类型。
