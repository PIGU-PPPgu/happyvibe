---
name: xiaozhi-teach-lesson-planner
title: 教案设计器
category: lesson-plan
does: 用逆向设计把一节课写成目标、评估、活动一致的教案，带分层任务和提问链
summary: 适合小学到高中的科任老师。产出含预期结果、评估证据、六段环节时间、板书和风险预案的教案。A/B/C 分层要配合它的学情分析师，单独安装时只出基础版并注明「无学情」。
source:
  kind: github
  repo: qizhitang/xiaozhi-skills
  path: teacher/general/xiaozhi-teach-lesson-planner
  url: https://github.com/qizhitang/xiaozhi-skills/tree/main/teacher/general/xiaozhi-teach-lesson-planner
  commit: 40a2d005219d
  license: MIT
  version: 2.12.7
  author: 小智伴学
distribution: mirror
platforms:
  - workbuddy
  - claude-code
  - generic
composition: resources
requires: []
install:
  workbuddy:
    - 下载技能包
    - 打开 WorkBuddy，进入技能页
    - 点添加技能，选上传技能，选中刚下载的压缩包
trigger: 帮我设计一节《一次函数》的新课教案
examples:
  - 八年级数学，帮我设计一节《一次函数》新课教案，45 分钟，要有评估证据、提问链和分层任务。
cautions:
  - 分层要有学情数据，读的是班级工作区里由学情分析师写入的分层结果；没有这项数据时只出基础版，标题注明无学情
  - 声明依赖平台的跨会话记忆和日期感知；没有日期感知时先问今天日期再排课时
  - 高中数学、物理、化学、生物学、地理、历史的内容优先转给同库的学科技能，没装时照出，并在教案开头注明未按该科课标核对
  - 一次最多输出 3 个课时的完整教案
  - 技能说明共 12 个文本文件约 9.1 万字，实测只带进了前 3 万字；SKILL.md 和 references 下三份文件是全的，shared 下的共用文件大部分没有带进会话
relatedLessons:
  - teaching/lesson-plan
  - growth/skill-use
status: tested
score:
  task: LP-1
  dims:
    value: 2
    quality: 3
    ease: 4
    edu: 4
    safety: 3
  notes:
    value: 3 轮平均要改 6.7 处，不装技能的对照是 1 处，没有少改。
    quality: 检查单 12 条过 8 条，3 轮共 0 处严重错误。
    ease: 3 步装进 WorkBuddy；后台点名加载，会不会自动触发没有测；没有在 WorkBuddy 上核对功能。
    edu: 教育项 8 条过 6 条，教材标识 3 轮里齐 3 轮。
    safety: 不联网，不用密钥，学生信息存在本机。
  verdict: 免费档上三份数轴教案都没有教学重难点栏目，其中一份把本课结论写成有理数与数轴上的点一一对应；要改的地方比不装技能还多。
  weakness: 技能内部的分工用语会原样出现在教案里，比如把追问交给课堂互动教练、把作业交给作业设计师，有一轮还把变量名 periodMinutes 写进了正文。
  tested:
    date: '2026-11-26'
    agent: ZCode 后台会话
    model: GLM-5.3-Flash
    by: ai
    skillVersion: 2.12.7
    layer: free-tier
    loadedBy: named
  platformComplete: false
  runs:
    - task: LP-1
      triggered: true
      seconds: 171
      edits: 10
      severe: 0
      output: /skill-reports/xiaozhi-teach-lesson-planner/free-tier/free-tier-xiaozhi-teach-lesson-planner-LP-1-1.md
    - task: LP-1
      triggered: true
      seconds: 261
      edits: 4
      severe: 0
      output: /skill-reports/xiaozhi-teach-lesson-planner/free-tier/free-tier-xiaozhi-teach-lesson-planner-LP-1-2.md
    - task: LP-1
      triggered: true
      seconds: 310
      edits: 6
      severe: 0
      output: /skill-reports/xiaozhi-teach-lesson-planner/free-tier/free-tier-xiaozhi-teach-lesson-planner-LP-1-3.md
    - task: LP-2
      triggered: true
      seconds: 217
      edits: 2
      severe: 0
      output: /skill-reports/xiaozhi-teach-lesson-planner/free-tier/free-tier-xiaozhi-teach-lesson-planner-LP-2-1.md
  baseline:
    edits: 1
    severe: 0
    seconds: 88
  checklist:
    - id: LP1
      pass: true
      note: ''
    - id: LP2
      pass: true
      note: ''
    - id: LP3
      pass: false
      note: 3 轮不过：全文未写明本课重点与难点，仅有风险预案；应对办法有，但没有点明难点
    - id: LP4
      pass: false
      note: 3 轮不过：预案 1 只写了错在哪与怎么应对，没写学生为什么错；预案 3、4 是完成率、冷场类课堂管理问题，不算易错点
    - id: LP5
      pass: true
      note: ''
    - id: LP6
      pass: true
      note: ''
    - id: LP7
      pass: true
      note: 1 轮不过：练习分了“基础题/中等题”、作业分了“基础题/迁移题”，但都没写明哪一层给谁做：课上两段都是全员“独立完成”，作业明写“统一布置”，没有必做/选做、全员/学有余力之类的分工。
    - id: LP8
      pass: true
      note: ''
    - id: LP9
      pass: true
      note: ''
    - id: LP10
      pass: true
      note: ''
    - id: LP11
      pass: false
      note: 3 轮不过：栏目名用 UbD 预期学习结果、评估证据、学习经验（WHERE TO）、课堂时间分配（六步矩阵）等框架名称，没有「教学目标」「教学过程」等通行栏目名
    - id: LP12
      pass: false
      note: 3 轮不过：脚本数出正文 3661 字，超过 2400 字（两页）上限
  textbookCheck:
    total: 3
    passed: 3
  audit:
    network: none
    credentials: false
    studentData: local
    overRead: false
  overrides: []
---

#### 输出样例

带技能产出的是一份七个栏目的教案。以第 1 轮为例，开头几行是适用班级、基于学情、生成日期，后面依次是 UbD 预期学习结果、评估证据、学习经验、课堂时间分配、板书设计、风险预案、课后反思要点。时间分配把 45 分钟分成六段，写明「核对等式：5 + 15 + 12 + 5 + 3 + 5 = 45（与课时一致）」，每一段列出任务、提问和教师话术。

#### 修改处清单

评审按备课教案检查单逐轮核对。带技能的主任务 3 轮，平均每轮要改 6.7 处；不装技能的对照 3 轮，平均每轮 1 处。带技能的 4 份产出里反复出现下面几类修改。

- 没有教学重难点栏目。三份数轴教案和一份变量与函数教案，栏目都是预期学习结果、评估证据、学习经验、课堂时间分配、板书设计、风险预案、课后反思要点，全文找不到这一课的重点和难点。对照的教案有「三、教学重点与难点」这样的栏目。
- 栏目名用的是 UbD 框架里的名称。四份带技能的教案都把栏目叫作 UbD 预期学习结果、评估证据、学习经验，老师往学校教案本上誊写时要换成通行的栏目名。
- 风险预案没写错因。带技能的 4 份和对照的 4 份都被判这一条不过：预案写了学生错在哪、老师怎么应对，没写学生为什么会这样错。
- 技能内部的分工用语进了教案。第 1 轮写「完整候场追问与现场追问策略由课堂互动教练展开」和「提交细化可交作业设计师」，第 2 轮写「完整候场追问矩阵见课堂互动教练」。老师手里没有课堂互动教练和作业设计师这两个技能，这几句只能删掉。
- 面向系统的批注。练习题旁边反复出现「【AI 生成，入库前请人工验算】」，表头写着「未提供近 3 次测评得分率（studentTiers）」。第 2 轮的时间核对一行是「六段之和核对：5 + 15 + 12 + 5 + 3 + 5 = 45 = periodMinutes」。第 3 轮的末尾说明里写着「已按 ai-item-check 自检」。
- 一处知识性错误，出在第 1 轮。总结环节和板书设计都把本课结论写成有理数与数轴上的点一一对应，原文在两者之间画了一个双向箭头。数轴上的点与实数一一对应，有理数只对应其中一部分。第 2 轮写的是「任何一个有理数都能用数轴上的一个点表示」，第 3 轮把数轴上的点是否都表示有理数留作悬念，这两轮没有这个问题。
- 篇幅超出。检查单要求一课时教案排出来在 1 到 2 页。带技能的 4 轮都被判超出，对照 4 轮都在限内。
- 作业没有落到题号上。带技能的 4 份都要老师自己圈题，例如第 2 轮写的「完成教材 2.2 节随堂练习与习题中老师圈定的题号」；对照 4 份都写了题号，例如「教材习题 2.2 第 1、2 题」。

#### 我看到的

八份产出我逐字读过，带技能的 4 份，对照 4 份。

带技能的教案多出几样对照里没有的内容。每条「学生将能做到」后面跟着达标的证据，例如「判断全对即为达标。」；提问链每一问后面带一句追问，例如「-1.5 的点在原点哪一侧、离原点多远？」；时间分配后面有一行加总核对；另有四条风险预案，写的是学生画数轴漏标方向、练习完成率低、导入冷场时老师怎么接。给出了答案的例题和练习，我逐题验算过，没有算错的。

同一份技能说明、同一道任务、同一个模型，三轮的写法差别不小。第 1 轮和第 3 轮开头有一行分隔线，栏目名前面带一个方块符号；第 2 轮的标题开头带一个表情符号，后面标着无学情基础版。副任务那一份整份包在代码块里，每行在三四十个字处断开。带技能每轮用时 171 到 310 秒，对照 82 到 151 秒。

这次带进会话的技能说明只有前 3 万字，约占全文的三分之一。
