---
title: Agent 和 LLM 是什么关系
module: basics
order: 5
description: LLM 是「脑子」，Agent 是「完整的人」。搞混这两个概念，是很多老师选错工具的根源。
source: 培训 PPT S34
status: ready
---

> **一句话结论：LLM 模型 = 脑子；Agent = 一个完整的人（有全部五官、能说会道、还会执行）。**

## 一个比喻讲清楚

![LLM 是脑子，Agent 是完整的人](/images/lessons/agent-vs-llm.webp)

| | LLM（大模型） | Agent（智能体） |
|---|---|---|
| 比喻 |  脑子 |  完整的人 |
| 能力 | 理解、思考、生成文字 | 脑子 + 五官 + 手脚 |
| 能看到什么 | 你发给它的文字 | 能看网页、读文件、开 Excel |
| 能做什么 | 只能「说」 | 说完还能「做」：点按钮、跑代码、发邮件 |
| 例子 | DeepSeek、Kimi、通义的对话窗口 | WorkBuddy 等桌面 Agent、自动备课流程 |

## 为什么这个区别重要

- 你在**聊天框**里让 AI「帮我做个 PPT」，它只能给你一堆文字建议——因为它只有脑子，没有手；
- 你在 **Agent** 里说同样的话，它会真的去打开工具、查资料、生成文件、存到你指定的文件夹——因为它有手有脚。

## 延伸

- 脑子是可以换的：同一个 Agent，可以接不同的 LLM（这就是「换脑子」），见 [如何选「脑子」](/modules/basics/choose-model/)；
- 人是可以培训的：给 Agent 装上「技能」（Skill），它就会按你学校的固定流程干活，见 [Prompt 与 Skill](/modules/growth/prompt-vs-skill/) 与 [M1 AI Agent 模块](/modules/agent/)。
