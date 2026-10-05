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

## 视觉规范

- 图内文字 ≥ 16px，标题 ≥ 20px（投屏可读性优先）
- 深浅色都要审：构建后用无头 Chrome 截图 `?theme=light` 与默认深色各一张自查
- 配色用站内色板衍生：金 #FEB300、紫 #A63D97、蓝 #4FC3F7、绿 #66D9A8 等对面同色类对比可用
- 无 emoji（闸门会拦），无真实学生信息

## 构建与验收（harness + 六项闸门，全过才算完成）

```bash
npm run build:interactives     # 产出 public/interactives/<name>.html
npm run check:interactives     # 六项闸门：体积（2D<100KB / 3D<1MB）、零外部请求、无 emoji、title、全屏按钮、双主题
node scripts/test_interactives.mjs <name>   # 自测 harness（只验单个资源；不带参数跑全部）
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
