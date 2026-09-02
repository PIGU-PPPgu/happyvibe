---
title: 桌面 Agent 的组成（以 WorkBuddy 为例）
module: agent
order: 3
description: Agent = 工作角色 + 可替换的大脑 + 技能 + 工具 + 记忆。拆开一只电子助手，看清每个部位干什么。
source: 培训 PPT S37
status: ready
---

> **一句话结论：桌面 Agent 的五件套——工作角色、大脑、Skill、工具、记忆。大脑可以换，技能可以教，记忆越攒越厚。**

## 五件套

以桌面端 Agent「WorkBuddy」为例：

| 组成 | 类比 | 说明 |
|---|---|---|
| **WorkBuddy** |  工作角色 | Agent 本体：接收任务、拆解流程、汇报结果 |
| **GPT / 混元 / DeepSeek** |  可以替换的大脑 | 底层 LLM，按任务随时切换（见[如何选「脑子」](/modules/basics/choose-model/)） |
| **Skill** |  角色掌握的技能 | 你教给它的固定流程和模板（见[Prompt 与 Skill](/modules/growth/prompt-vs-skill/)） |
| **浏览器、文件、Excel、代码、邮箱等** |  能使用的工具 | 让它从「能说」变成「能做」 |
| **历史任务、资料库** |  记忆 | 你的班级学情、常用格式，越用越懂你 |

下面这张是一次**真实的 WorkBuddy 执行记录**——五件套全在里面：它自己拆任务（角色）、用了哪个模型（大脑）全程可见、调用工具写文件、执行轨迹留档（记忆）：

![WorkBuddy 真实执行记录：拆任务/调工具/积分与模型全程可见](/images/lessons/wb-real-run.webp)

## 两个部件的实拍

**大脑可以换**——输入框右下角点开就是「货架」，从限时免费到旗舰随时切换：

![WorkBuddy 模型货架：一排大脑随时换](/images/lessons/wbz-shelf.webp)

**技能与专家**——左侧「专家·技能·连接器」就是给它配人手的市场：

![WorkBuddy 专家·技能市场](/images/lessons/wb-03-experts.webp)

同类产品都有类似的「智能体广场」（下图为 Qoder 的）——换任何软件，先找这几个部件：

![Qoder 智能体广场（同类产品示例）](/images/lessons/qoder-platform.webp)

## 选购时看什么

对照这五件套去检查任何一款 Agent 产品：**脑子能不能换？工具接得全不全？记忆在本地还是云端（数据安全！）？Skill 好不好教？** 下一课的横评表就是按这些维度打的分。

→ [大厂 Agent 产品横评](/modules/agent/product-comparison/)
