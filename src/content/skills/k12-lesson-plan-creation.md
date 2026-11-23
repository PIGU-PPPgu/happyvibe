---
name: k12-lesson-plan-creation
title: K12 教案与材料
category: lesson-plan
does: 生成一节课的教案、学生材料和课堂观察表，能导出成 Word
summary: Anthropic 与 Learning Commons 出品，附公开的教案评分量规。以美国课标为基准，完整功能依赖 Claude 的课标连接器。国内老师直接用，教材版本和课标条目对不上。
source:
  kind: github
  repo: anthropics/k12-teacher-skills
  path: plugin/skills/k12-lesson-plan-creation
  url: https://github.com/anthropics/k12-teacher-skills/tree/main/plugin/skills/k12-lesson-plan-creation
  commit: 31fd6dbb0c07
  license: Apache-2.0
  author: Anthropic、Learning Commons
distribution: mirror
platforms:
  - claude-code
  - generic
composition: scripts
requires:
  - python
relatedLessons:
  - teaching/lesson-plan
status: pending
---

