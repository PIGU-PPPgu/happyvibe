---
title: 飞象 Skill：让 Agent 自动跑平台里的学情与组卷
module: teaching
order: 5
description: 一个 OpenClaw Skill：操作浏览器登录飞象平台，自动完成学情分析、智能组卷和出题。
source: 培训 PPT S49
status: ready
---

> **一句话结论：把「登录平台 → 点选班级 → 导出学情 → 组卷出题」这套固定流程写成 Skill，以后一句话就全自动。**

![飞象星球 OpenClaw Skill](/images/lessons/feixiang-skill-readme.webp)

## 这个 Skill 是什么

开源项目 [feixiang-skill](https://github.com/PIGU-PPPgu/feixiang-skill)：让 AI 智能体通过浏览器操作**飞象星球平台**，自动完成：

- 作业布置、课文点读、口语评测、应用推荐
- 学情查询、知识错题、成绩单等
- 高难度自动避免（带失败重试）

这就是 [Skill](/modules/growth/prompt-vs-skill/) 思路的落地：**把你在网页上的每一步操作固化下来，交给 Agent 执行**。

## 安装要点（技术教师）

```bash
git clone https://github.com/PIGU-PPPgu/feixiang-skill.git
# 按 README 配置 Cookie / 手动配置两种方式，内置失败重试
```

支持自动配置（推荐，需要 OpenClaw）与手动配置（飞书 open.feishu.cn 获取 cookie 等）。

## 普通老师怎么用

不用自己装——**把链接发给你的电子助手**（回看[为什么要养好一只电子助手](/modules/agent/why-agent/)：它自己会读取并安装），然后：

- 「帮我查一下三年级最近的学情报告」
- 「按上周错题率组一份 20 题的卷子」

## 提醒

- 平台账号安全：Cookie 相当于登录凭证，只放在自己的 Agent 里，不要发群里；
- 平台改版可能导致流程失效——这正是 Skill 需要维护的原因（改一处流程，全体受益）。
