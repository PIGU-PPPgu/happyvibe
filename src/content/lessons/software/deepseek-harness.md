---
title: DeepSeek Harness Desktop 上手指南
module: software
order: 3
description: 「Harness」= 给大模型装上手脚和工具的桌面壳。让 DeepSeek 不止会聊，还能直接操作你的电脑任务。
source: 道远 PPT S46 ／ 培训演示
status: draft
---

> **一句话结论：模型是脑子，Harness 是身体。DeepSeek Harness Desktop 让「只会在网页里聊天的 DeepSeek」变成能读文件、跑任务、交付结果的数字员工。**

## 先讲清楚「Harness」是什么

「Harness」直译是「马具/挽具」——给脑子套上挽具，它才能拉车干活：

- 网页版 DeepSeek = 只有脑子：你说一句，它答一句；
- Harness Desktop = 脑子 + 身体：读本地文件、执行步骤、调用工具、把结果存到指定位置。

这与[Agent 和 LLM 的区别](/modules/basics/agent-vs-llm/)是同一件事：Harness 是搭建桌面 Agent 的一种方式。培训里展示的开源项目（claude-harness 等）都是这个思路。

## 适合谁

- 想让**本地文件、固定流程**交给 AI 自动跑的老师；
- 有一定动手意愿、愿意按教程配置一次的（配置好之后就是点点点）；
- 完全零基础建议先用 WorkBuddy 这类现成产品（见[本模块上一课](/modules/software/workbuddy/)）。

## 上手步骤（骨架）

1. **准备**：安装 DeepSeek 桌面端 / 获取 API Key（具体步骤待补充）；
2. **安装 Harness**：从开源仓库下载（培训演示用的是 GitHub 上的 harness 项目，地址待补充），按 README 配置；
3. **跑通第一个任务**：让它读一个文件夹里的成绩表，输出汇总报告；
4. **固化为日常工作流**：把常用任务写成一键指令或 Skill。

## 与其他工具怎么选

| 需求 | 推荐 |
|---|---|
| 开箱即用、全校推广 | WorkBuddy |
| 做网页/项目、要预览 | Trae |
| 本地文件自动化、自定义流程 | DeepSeek / Claude Harness |
| 只是问答查资料 | 网页版大模型就够 |

## 待补充（需要吴老师补充讲述）

- [ ] 具体是哪个 Harness 项目（PPT 里出现过 claude-harness-win 截图）+ 下载地址
- [ ] 安装与配置的完整步骤截图
- [ ] API Key 的获取与安全注意事项（不要发群里！）
- [ ] 现场演示的任务案例与翻坑经验
