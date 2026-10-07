---
name: teaching-interactives
description: 生产 K12 学科 3D/2D 交互教学资源（单文件 HTML，投屏级质量）的流水线规范。做新资源、改资源、审查资源前必读。
---

# 教学交互资源生产线

给 HappyVibe 资源库生产自产交互资源的完整规范。产物是**单文件 HTML**：教师下载后断网双击即可投屏。

## 黄金样例（照这个标准做）

| 样例 | 学科 | 形态 | 路径 |
|---|---|---|---|
| 正方体 11 种展开图 | 数学 | 3D（three.js） | `src/interactives/math/math-cube-nets/` |
| 中国朝代时间线 | 历史 | 2D（canvas 等宽尺） | `src/interactives/history/history-dynasties/` |
| 天净沙·秋思意境长卷 | 语文 | 2D（canvas 场景卷轴） | `src/interactives/chinese/chinese-tianjingsa/` |

三个样例分别覆盖 3D、2D 数据图、2D 场景图三种范式。新资源先选最接近的样例作骨架。

## 决策树：这个知识点该做什么形态

1. **空间结构与过程模拟**（几何体、分子、天体、机械）→ 3D（three.js）
2. **关系与变化**（时间线、函数图像、数据对比、流程）→ 2D canvas/SVG
3. **静态标注即可讲清**（结构图、对比图）→ diagram（无交互单文件）
4. **已有优秀现成资源**（国家平台、PhET、GeoGebra）→ 只录外链条目，不重复造

## 目录与文件约定

```
src/interactives/<subject>/<name>/
  ├── index.mjs    # 入口：import { init } from '../../_shared/runtime.mjs'
  ├── meta.json    # { "title": "中文名", "hint": "一句操作提示" }
  └── nets.mjs 等  # 可选：纯数据与几何计算，保持入口瘦（数学样例为范例）
src/content/resources/<subject>/<name>.md   # 资源条目（页面卡片数据）
public/interactives/<name>.html             # 构建产物（gitignore，勿手改）
```

frontmatter 全字段（从黄金样例复制后改）：

```yaml
title / subject(11选1) / stage(primary|junior|senior) / grades([1-12])
topic: 教材章节知识点（「单元 · 小节」格式）
kind: interactive-3d | interactive-2d | diagram | external
file: <name>          # 自产资源必填（与目录名一致，不带 .html）
url + source          # external 必填，source ∈ smartedu|phet|geogebra
usage: 一句话课堂用法（何时投屏、怎么提问）
tags / status(ready|draft) / order(知识点内排序，同知识点用 10/20/30 递增)
```

正文 Markdown 写「课堂用法」（傻瓜式三步，精确到点什么按钮）与「适用教材」（版本+册次+单元）。

## runtime API

```js
import { init } from '../../_shared/runtime.mjs';
init({
  mount(el, api) {
    // el = #stage 容器；在这里建 canvas / three 渲染器与自己的 UI
    api.onTheme = (theme) => {};  // 深浅色切换回调，重绘用
    api.onResize = () => {};      // 窗口/全屏变化回调
  },
});
```

规则：

- **主题色必须读 CSS 变量**：`getComputedStyle(document.documentElement).getPropertyValue('--text')`，禁止写死两套色值（模板已提供深浅两套变量，与站内 tokens.css 同源）
- 交互双通道：pointer 事件统一处理鼠标与触摸；缩放用 wheel + 双指捏合（样例均已实现，复制其事件骨架）
- 动画不自动循环干扰讲解；需要过程演示时提供滑杆或步进按钮
- 工具栏按钮文字用「上个 / 下个 / 全屏 / 深浅」这类干净词，不加解释性括号

## 设计先行：先写教学设计，再做动画交互

**流程顺序不可反**。先在条目 md 写「教学设计」一节（黄金范例：`src/content/resources/math/math-cube-nets.md`），内容含四块：

1. **学习目标**（2-3 条，行为动词：经历/知道/归纳/能判断……）；
2. **易错点预设**（学生会怎么错，资源要能演示出来）；
3. **环节设计表**：每环节给出 学生活动 / 教师提问 / 资源状态 三列——「资源状态」列就是交互与动画的需求清单（相机在哪、参数多少、高亮什么）；
4. **板书式小结**（可直接念的结论）。

写完设计再动手：环节设计表的「资源状态」逐条映射成 `teaching.steps[].apply()` 的预设代码；教师提问列就是 `guide` 话术；小结进 `teaching.summary`。**动画和交互是教学设计的实现手段，不是先做动画再想话术**。

## 教学面板 API（模板内置，统一 UI：港中深紫 + 键盘翻环节 + 讲解 + 检测）

```js
init({
  teaching: {
    meta: '数学·五年级｜人教版五年级下册第三单元《长方体和正方体》· 展开与折叠',   // 定位行（顶栏胶囊），教材联动写到册·单元·课题
    steps: [
      {
        name: '认一认',
        guide: '教师提问话术……',          // 引导语：抛给学生的问题
        note: '本环节知识点讲解……',        // 讲解词（可选但应有）：环节的知识内容，与引导语分工——引导问、讲解答
        apply: () => setFold(0),            // apply 切换到该环节的真实画面状态
      },
      ...
    ],
    summary: '可直接念的知识结论……',
    quiz: [                                  // 随堂检测（目标：全部资源 ≥4 题；过渡期未配置不判失败）
      { q: '题干', opts: ['A 选项', 'B 选项', 'C 选项', 'D 选项'], a: 2, why: '逐题解析，≥10 字，讲清为什么' },
      ...
    ],
  },
  mount(stage, api) { ... },
});
```

模板负责渲染（顶栏定位胶囊、环节 pill 按钮、进度条、引导语区、讲解弹层、小结浮层、随堂检测答题器），资源只提供数据与 apply。**禁止资源自建教学面板 DOM**。首个环节的 apply 在 mount 完成后由 runtime 触发；apply 里若依赖相机等场景对象，须做未就绪防护。

模板内置交互（免写代码）：键盘 ←/→ 切环节（投屏讲解）、Esc 收浮层、检测逐题作答出解析、末题出得分可重做。答题浮层打开时方向键不切环节。

**检测题出题规范**：每题 4 选项、1 个正确项；干扰项要打在本课易错点上（对照条目 md 的「易错点预设」）；解析要讲机制不能只报答案（参考 math-cube-nets 的 5 题：反例辨析/事实记忆/规律理解/规律应用/说理，五个层次递进）。题干与选项文字遵守文风红线。

## 统一色板（降饱和，深底可读）

UI 结构色为港中深品牌紫（与港中文「一个品牌，两个校园」同一体系）：`--cuhk #6B2077`（Pantone 2612C，激活态/进度条/主按钮）、`--brand #8A3D99`（暗色下的交互紫）；金色 `#E8B04B` 只用于定位胶囊与小结/解析的点缀。场景/图形主色从这套里选，禁止再用 #feb300 等高饱和原色大面积涂块：
金 `#E8B04B`、紫 `#A66BA6`、蓝 `#6FA8C9`、绿 `#7FBF9E`、橙 `#D99A6C`、堇 `#9D8FD1`、红 `#C97B7B`、青 `#6FBFB2`。
3D 材质配 Hemisphere+Directional 双光照；canvas 图形避免大面积极饱和色块。

## 教研员契约（每个交互资源的必修结构）

一个有经验的教研员第一次打开资源，会问：**这是什么课的什么点？课堂怎么组织？这一步我问学生什么？学生练什么？学生带走什么？** 由模板教学面板承载、harness 机器核查：

| 标记 | 要求 | 回答的问题 |
|---|---|---|
| `#meta` `[data-hv-meta]` | 定位行：学科·学段年级｜教材版本册次单元 · 章节知识点，≥8 字 | 这是什么课的什么点（教材联动） |
| `[data-hv-step]` | 教学环节 ≥2 个（建议 3 个），点击/键盘切换到该环节的真实预设状态 | 课堂怎么组织 |
| `#guide` | 各环节引导话术合计 ≥60 字（教师口吻的提问/引导） | 这一步问什么 |
| `#note` `[data-hv-note]` | 各环节讲解词（配置后自动出现「讲解」按钮），与引导语分工：引导问、讲解答 | 这一步讲什么 |
| `[data-hv-quiz]` | 随堂检测 ≥3 题（建议 4-5 题），每题题干/选项/答案/解析齐全（runtime 注入 quiz-valid 与 quiz-answer-flow 断言） | 学生练什么、练完懂没懂 |
| `#summary` `[data-hv-summary]` | 知识小结 ≥30 字（可念的结论） | 学生带走什么 |



一个有经验的教研员第一次打开资源，会问三个问题：**这是什么课的什么点？课堂怎么组织？这一步我问学生什么？** 资源必须页内自答，用四个标准 DOM 标记承载（harness 机器核查，全过才算完成）：

| 标记 | 要求 | 回答的问题 |
|---|---|---|
| `[data-hv-meta]` | 定位行：学科·学段年级｜教材版本册次 · 章节知识点，≥8 字，页内可见 | 这是什么课的什么点 |
| `[data-hv-step]` | 教学环节按钮 ≥2 个（建议 3 个：引入/探究/归纳），点击切换到该环节的预设状态（不是空导航） | 课堂怎么组织 |
| `[data-hv-guide]` | 每个环节一句教师引导/提问话术，全部环节合计 ≥60 字；未激活的引导语留在 DOM 里（display:none 即可） | 这一步干什么、问什么 |
| `[data-hv-summary]` | 知识小结面板 ≥30 字的结论性内容，按钮唤出 | 学生带走什么 |

实现范例：`src/interactives/math/math-cube-nets/index.mjs` 的 `TEACHING` 配置（含 note 讲解词与 quiz 五题检测，是全套契约的黄金样例）。环节预设要真的改变场景状态（如展开图的三环节分别设折叠度 0/0.35/1），引导语写成教师口吻的课堂话术，讲解词写成环节知识点，小结束成可念的知识结论——**这些都是教学内容，不是 UI 装饰，写之前想清楚这节课的环节设计**。

## 视觉规范

- 图内文字 ≥ 16px，标题 ≥ 20px（投屏可读性优先）
- 深浅色都要审：构建后用无头 Chrome 截图 `?theme=light` 与默认深色各一张自查
- 配色用统一色板（见上节），UI 结构色一律用模板的港中深品牌紫变量，不自行调色
- 无 emoji（闸门会拦），无真实学生信息

## 构建与验收（harness + 六项闸门，全过才算完成）

```bash
npm run build:interactives     # 产出 public/interactives/<name>.html
npm run check:interactives     # 十项闸门：体积（2D<100KB / 3D<1MB）、零外部请求、无 emoji、title、全屏、双主题、教材版本+章节锚点、操作提示 ≥6 字、预览图新鲜度（不得旧于产物）、交互绑定（≥2 类事件或 ≥5 处）
node scripts/test_interactives.mjs <name>   # 自测 harness（只验单个资源；不带参数跑全部）
npm run build:previews         # 重生成卡片预览图（资源库卡片用实际界面实拍；改了界面必须重跑，闸门 G9 会拦旧图）

**harness 教研契约 v2（全部硬性，无过渡豁免）**：环节 ≥3（环节名优先用教材固有栏目动词：北师大「想一想/做一做/议一议/随堂练习」，人教「探究/练习」，统编语文「默读/精读/积累」）；引导语合计 ≥90 字且单环节 ≥15 字；讲解词合计 ≥120 字且单环节 ≥40 字；小结 ≥30 字；随堂检测 ≥4 题且题干+解析合计 ≥120 字。
```

**harness 是验收的最终标准**，无头浏览器加载 `?selftest=1` 检查三类内容：

1. **运行报错**：页面 JS 错误与未捕获 rejection 必须为零；
2. **画布主体占比**：主画布内容包围盒需 ≥50% 宽 × ≥40% 高（防「主体一小块缩在中间」）；
3. **资源内置断言**：用 `window.__hvPushCheck(name, pass, detail)` 写场景级/数据级断言（范例：`src/interactives/math/math-cube-nets/index.mjs` 的 `runSelfChecks`，验证 3D 面的世界坐标在展开态/折叠态分别等于网格坐标/立方体面心）。

写断言的铁律：**比较前先判 `Number.isFinite`**——NaN 与任何数比较都是 false，会静默通过断言（真实教训：曾因此放过五个面全 NaN 的场景）。3D 资源渲染器需带 `preserveDrawingBuffer: new URLSearchParams(location.search).has('selftest')`，画布尺寸一律取 `#stage` 的 clientWidth/Height（勿用 innerWidth，视口就绪时序不可靠）。

体积超标的减重手段：不引 examples/jsm 控件（自写 orbit/事件，样例已示范）、贴图用程序化生成、three 按需 import、几何体合并。

## 事实性红线

- 学科事实（历史年代、朝代顺序、数学结论）必须有据可查；能用程序验证的就写验证脚本（例：`scripts/test_cube_nets.mjs` 验证 11 种展开图折叠闭合，`scripts/gen_cube_nets.mjs` 枚举生成）
- 教材对应关系（版本/册次/单元）写入条目正文，不确定就查国家平台课程栏核对
- 外链必须联网验证可达后才能录入，绝不凭记忆写 URL

## 文风红线（AGENTS.md 第 5 条摘录）

按钮/标题/导航 = 干净的名字；禁填充词；不替读者下结论；解释只出现在正文段落。
