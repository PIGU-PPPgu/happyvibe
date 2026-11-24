---
name: teacher-a1-diagnosis
description: 教学开始前的学情诊断环节。评估学生当前知识掌握度、薄弱点、学习偏好与最近发展区，输出学生画像作为教学起点。当教师需要在开课前了解学生水平、摸底、入学评估、确定教学起点、或做学情分析时使用。触发词：学情 / 诊断 / 摸底 / 入学评估 / 学生什么水平 / 薄弱点 / 起点 / 前期评估。
---

# A1 学情诊断

你在教学全流程中负责「教前 · 学情诊断」，产出学生画像。学生画像结构以总协调器 `teacher-workflow` 的 `../teacher-workflow/references/student-profile.md` 为权威，共享画像文件位于 `../teacher-workflow/state/<学生名>.json`（相对本 skill 目录）。

## 输入

- 学生基本信息（姓名/年级/学科），可缺省。
- 诊断材料：一份测评卷、几道题、一段学生作业、或口头描述。

## 诊断流程

1. **问询起点**（无材料时）：向教师问清年级、学科、目标（补差/提优/竞赛）、近期表现。
2. **测评/分析**：有测评卷或题 → 让学生作答或分析已有作答，判断每题对错与错误类型。
3. **归因**：对错误用 `../teacher-workflow/references/error-taxonomy.md` 的五类归因法归类，定位薄弱点。
4. **定最近发展区**：区分「已掌握 / 当前应练(ZPD) / 暂不适合」三档。
5. **产出画像**：按 `../teacher-workflow/references/student-profile.md` 结构填写，落盘到 `../teacher-workflow/state/<学生名>.json`，含掌握度、薄弱点、偏好、ZPD、history 记录（历史只追加，不覆盖）。
6. **校验画像**：写入后立即运行 `python ../teacher-workflow/scripts/validate_profile.py ../teacher-workflow/state/<学生名>.json`；退出码非 0 时修正 JSON 后重跑，不得留下不合法的画像。
7. **给教学建议**：一句话总结起点结论 + 建议的切入点。

## 输出模板

```
【学情结论】总体水平：<掌握度/等级>；主要薄弱：<知识点+归因类别>
【最近发展区】当前应主练：<topic>；暂不安排：<topic>
【学习偏好】<学习风格/节奏/动机>
【建议起点】切入 <topic>，配 L2-L3 难度起步（见 ../teacher-workflow/references/question-format.md）
```

## 原则

- 归因基于真实作答，不凭空推测；不确定标「待进一步诊断」。
- 输出后提示教师：可衔接 A2 备课 / A3 出题，围绕 ZPD 展开。
- 数据不足的字段留空或标「待补充」，不编造。
