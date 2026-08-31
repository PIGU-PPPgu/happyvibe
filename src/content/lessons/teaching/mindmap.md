---
title: 用 AI 做思维导图
module: teaching
order: 4
description: 把课文、章节、单元整理成结构化思维导图，配合 Mermaid 语法可以直接生成可编辑的图。
source: 道远 PPT S10-S11、S55
status: draft
---

> **一句话结论：让 AI 先「拆结构」，再由 Mermaid 之类工具「画出来」——两分钟得到一张可编辑的单元思维导图。**

![Mermaid 生成的知识图谱](/images/lessons/mermaid-graph.webp)

## 思路：AI 两个长处一起用

1. **长处一：拆结构**——把课文/章节丢给 AI：「把这部分内容整理成层级大纲（不超过三层）」；
2. **长处二：出格式**——让 AI 把大纲转成 Mermaid 代码：

```
把上面的大纲转成 Mermaid mindmap 语法输出给我
```

3. 把代码粘到 [mermaid.live](https://mermaid.live) 或支持 Mermaid 的笔记软件（Obsidian 原生支持），导出图片即可。

## 课堂用法

- 单元导入：新单元第一课，投影导图让学生预览全景；
- 复习课：让学生先自己画，再和 AI 版对照查漏；
- 板书升级：导图代码存档，每年迭代，越改越准。

## 待补充（需要吴老师补充讲述）

- [ ] 现场演示的导图案例（哪篇课文/哪个单元）
- [ ] 推荐的渲染工具组合（mermaid.live / Obsidian / 其他）

> 本课为骨架内容，等补充后升级为完整教程。
