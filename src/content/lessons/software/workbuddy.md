---
title: WorkBuddy 上手指南
module: software
order: 1
description: 桌面端 Agent「五件套」的代表作：可换大脑、可教技能、有记忆。开源教程生态齐全，全校办公、教案、公文、Excel 的首选。
source: 道远 PPT S36-S40 ／ 开源社区文档
status: draft
---

> **一句话结论：WorkBuddy = 工作角色 + 可换的大脑 + Skill + 工具 + 记忆。先跑通第一个任务，再花两周把它养熟。**

> 📷 界面截图待补（权限开通后实操截取）：主界面 / 登录页 / 任务执行 / 交付文件 / 模型选择器

## 它是什么、适合谁

WorkBuddy（腾讯出品，官网 [workbuddy.ai](https://www.workbuddy.ai/)）是桌面 AI Agent 工作台：**你用自然语言描述需求，它自主读取本地文件、拆解任务、调用工具，最后交付可验收的成果**——这正是[桌面 Agent 五件套](/modules/agent/agent-anatomy/)的产品化落地。

在[产品横评](/modules/agent/product-comparison/)里，它是「学校只推一款的首选」：

- **强项**：全校办公、教案、公文、Excel 处理、消息端派单；
- **短板**：PPT 审美、复杂桌面操控（这类活儿换 Kimi 或 Trae 配合）；
- **适合**：普通教师日常办公，不需要技术背景。

## 开源教程资源（免费）

WorkBuddy 有相当完整的社区开源教程生态：

| 资源 | 适合 | 链接 |
|---|---|---|
| WorkBuddy 实战蓝皮书（27 章） | 小白入门 + 11 个真实案例 | [腾讯云社区](https://cloud.tencent.com/developer/article/2710719) ／ [博客园](https://www.cnblogs.com/xiezhr/p/21564296) |
| 保姆级上手教程 | 安装→配置→第一个 Agent | [知乎](https://zhuanlan.zhihu.com/p/2065473630981583532) |
| DeepSeek 接入官方文档 | 给 WorkBuddy 换 DeepSeek 大脑 | [awesome-deepseek-agent](https://github.com/deepseek-ai/awesome-deepseek-agent/blob/main/docs/workbuddy.zh-CN.md) |
| 从 0 复刻 WorkBuddy 架构（24 章） | 进阶：搞懂 Harness 原理 | [GitHub learn-workbuddy](https://github.com/adongwanai/learn-workbuddy) |

本课聚焦「老师怎么用」，原理课放在最后的进阶区。

## 上手三步

### 第 1 步：安装登录

从官网下载 macOS / Windows 版，安装后用微信或手机号登录。首次打开建议新建一个工作文件夹（比如桌面建 `my-workbuddy`），后面所有产出都让它放这里，好找好备份。

> 【截图位 wb-02】首次启动的登录/欢迎界面

### 第 2 步：跑通第一个任务

把一个 Excel 成绩表拖进对话，发送：

```
读取这个表格，统计每个班的平均分并从高到低排序，
生成一个新的 Excel 文件放到桌面 my-workbuddy 文件夹里。
```

观察它**拆步骤 → 调工具 → 交付文件**的全过程——这就是 Agent 和普通聊天机器人的本质区别（回看[什么是 Agent](/modules/agent/what-is-agent/)）。

> 【截图位 wb-03】任务执行过程中的步骤展示
> 【截图位 wb-04】任务完成后交付的文件

### 第 3 步：接入 DeepSeek 大脑（可选）

WorkBuddy 支持通过本地配置文件添加自定义模型。以接入 DeepSeek 为例（[官方中文文档](https://github.com/deepseek-ai/awesome-deepseek-agent/blob/main/docs/workbuddy.zh-CN.md)）：

1. 到 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 申请 API Key；
2. 在用户目录创建模型配置（macOS：`~/.codebuddy/models.json`），按文档填写接口地址和 Key；
3. **完全退出并重开** WorkBuddy，在模型选择器里就能看到新大脑。

⚠️ 常见坑（文档里明确提醒的）：
- 配置文件必须保存为 **UTF-8 无 BOM** 编码，否则读取失败；
- 401 报错 = Key 填错（别把接口网址填进 Key 字段）；
- 模型选择器看不到新模型 = 没有完全重启。

> 【截图位 wb-05】模型选择器里出现多个大脑

### 日常：教它你的第一个 Skill

把你最常用的文档格式（比如周计划模板）固化成 Skill，一次教会终身受用——具体做法见 [Prompt 与 Skill](/modules/creation/prompt-vs-skill/) 和 [实战案例](/modules/creation/case-study/)。

## 教师场景推荐

- 每周成绩导入 → 自动出[分析报告](/modules/edu-data/grade-analysis/)；
- 会议录音 → 提要点 → 按模板成通知；
- 消息端派单：在外面用手机派任务，回办公室它已做完。

## 进阶：想知道它内部怎么运作？

开源项目 [learn-workbuddy](https://github.com/adongwanai/learn-workbuddy) 用 24 章 Python 教程从零复刻 WorkBuddy 架构，核心思想一句话：**模型是大脑，Harness 是操作系统**。适合信息科技老师带社团玩。

## 待补充（需要真实截图）

- [ ] wb-02 登录/欢迎界面
- [ ] wb-03 任务执行过程
- [ ] wb-04 交付文件
- [ ] wb-05 模型选择器
- [ ] 主界面导览（wb-01）
