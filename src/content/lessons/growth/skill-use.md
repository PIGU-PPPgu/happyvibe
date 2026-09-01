---
title: Skill 的使用与迁移：一个技能，所有 Agent 通用
module: growth
order: 6
description: 固化好的 SKILL.md 怎么用？WorkBuddy 里启用、搬到 Claude Code/ZCode/Trae——技能文件是纯文本，复制粘贴就行迁移。
source: 本站 skills/tutorial-visuals/SKILL.md 实践 ／ 各 Agent 技能机制通用原理
status: ready
---

> **一句话结论：SKILL.md 是纯文本文件，天下通用。WorkBuddy 里启用的技能，原样复制到 Claude Code、ZCode、Trae 的技能目录，照样工作——这就是「会用一个 = 会用所有」的终极证明。**

## 先回答三个高频问题

![同一个 SKILL.md 放进不同 Agent](/images/lessons/skills-directory.png)

**Q1：固化好的 Skill 存在哪里？**
一个纯文本文件（`SKILL.md`）。在 WorkBuddy 里它存在云端技能库（应用内「专家·技能」页可见）；在 Claude Code / ZCode 这类工具里，它就是你项目里的一个 Markdown 文件。

**Q2：是不是所有桌面 Agent 都能用？**
是。因为所有 Agent 的技能机制本质相同：**读一份说明文件 → 按里面的流程执行**。区别只是「文件放哪个口袋」。

**Q3：迁移会丢失吗？**
不会。技能文件是纯文本，复制粘贴零损耗。唯一要做的是找到新 Agent 的「技能口袋」在哪。

## 使用方式：三种场景

**场景 1 · 在 WorkBuddy 里用（最简单）**
固化时选「保存为技能」→ 之后在输入框打 `/` 就能看到你的技能列表，点选即用；或者直接说触发词（比如「出周报」）。

**场景 2 · 搬到另一个 Agent（迁移三步）**

1. 在旧 Agent 里找到技能文件（设置/技能页一般能查看或导出）；
2. 在新 Agent 的「技能 / 规则 / Rules」入口，粘贴或上传同一份文件；
3. 发一句触发词测试 → 通过即迁移完成。

**场景 3 · 用代码工具的同学（进阶）**
Claude Code / ZCode 读取项目里的 `skills/` 文件夹或 `~/.claude/skills/`——把 `SKILL.md` 放进去，AI 自动识别。本站的「教程配图 Skill」就是这么存的：[skills/tutorial-visuals/SKILL.md](https://happyvibe.intelliedu.cc/modules/growth/skill-born/)。

## 迁移检查清单

- [ ] 技能文件在新 Agent 里能被触发（发一句触发词测试）
- [ ] 触发后产出符合说明书里的「验收」标准
- [ ] 两边都能用时，确定一个「主力」避免版本分叉

## 常见问题

- **触发了但做得不对**：说明书写得不够具体——把这次的纠正**写回说明书**（Skill 是活的）；
- **新 Agent 看不懂某些指令**：不同 Agent 工具能力不同，把「调用 XX 工具」改成通用描述；
- **技能越攒越多乱了**：按用途命名（weekly-report / subject-site-builder），定期删掉不再用的。

## 下一站

到此，你已经打通了「形成 → 使用 → 迁移」的完整闭环。带着你的技能去 [任务一 · 打造学科主题网站](/modules/software/task-subject-website/) 实战，或者按 [学习路线图](/path/) 走完剩下的旅程。
