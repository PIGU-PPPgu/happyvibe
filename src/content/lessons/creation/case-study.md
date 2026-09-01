---
title: 实战案例：从「1人公司」到固化的 Skill
module: creation
order: 11
description: 两个真实案例：让 AI 按你的设计规范自动产出网页（Notion 风 Skill 固化），以及飞象老师的经验教训。
source: 道远 PPT S15、S30
status: ready
---

> **一句话结论：把你的审美和规范固化成 Skill 之后，AI 每次产出都像「你亲手做的」——这才是复利的开始。**

## 案例 1：把「Notion 黑白风」固化成 Skill

**背景**：希望 AI 每次生成网页都保持同一套极简黑白风格。做法：把设计规范写成 Skill，一次性教给 Agent。

![1 人公司，7 个 AI 在为你工作](/images/lessons/onework-company.webp)

**提示词核心**（节选，可直接抄结构）：

```text
极简黑白 Notion 风格，设计统一：
- 色彩：浅色系统统，背景 #FFFFFF（或 #191919），文字 #191919；纯色块强调用于标题图形，保证对比度明显
- 字体：系统字体栈 -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC'…
- 图标：线性图标，统一使用线性 SVG（24×24 viewBox, 1.5px stroke, round 端点），风格类 Lucide / Feather icons
- 人格图标：黑白线性 SVG，共通（100×120 viewBox, 1.5px 线条，不具表情）， Candid 布局，图像区域留白
- 卡片与分割：1px solid 边框，中等圆角，卡片 padding 24px，不用 box-shadow
- 交互：Hover 仅改变背景，加重一级中点，过渡 200ms
下次凡自动生成时，这个 skill 会被自动匹配，无需再重复描述。
```

![Skill 固化：提示词与规范](/images/lessons/skill-solidify-1.webp)

**结果**：Agent 回复「已固化为 Skill」，命名 `minimal-bw-notion-web`，内容包含 8 条规范（可复用 CSS 变量、字号级差、响应式断点、SVG 图标规范、人格插图规范、自然语言命名、黑白模式一键切换、恢复复用流程）——**下次只要说「按我的黑白风格做个页面」，无需再重复描述。**

![Skill 固化完成](/images/lessons/skill-solidify-2.webp)

## 案例 2：飞象老师的经验教训

用 AI 生成平台（飞象老师）时的三条真实经验：

1. **第一次生成的效果很好**——新鲜感期是效率最高的时期；
2. **多次优化之后模型会「混乱」**——反复打补丁不如重新起一次话；
3. **不管是任何平台，生成式模型的能力决定平台做出的质量**——平台只是壳，脑子才是关键（回看[如何选「脑子」](/modules/basics/choose-model/)）。

另外两条情报：飞象老师未来将收费；有需要的老师可以使用「AI 龙老师」。

## 带走的三个心法

1. **先固化，再复用**：任何一个用顺的提示词，都值得升级成 Skill；
2. **补丁不如重启**：迭代超过三轮还没对，重开对话重新描述；
3. **规范是你的资产**：你的排版习惯、评分标准、教案结构，写成规范就是可复制的生产力。
