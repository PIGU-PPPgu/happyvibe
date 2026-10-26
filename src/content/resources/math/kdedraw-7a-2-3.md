---
title: 绝对值
subject: math
stage: junior
grades: [7]
book: 北师大版七年级上册
unit: 第二章 有理数及其运算
topic: 有理数及其运算 · 绝对值
kind: interactive-2d
file: kdedraw-7a-2-3
usage: 讲 2.3 时投屏：第 2 页拖小狗读距离理解绝对值非负，第 3 页拖 A/B 两点归纳负数比大小法则，第 4 页检测。
tags: [绝对值, 距离, 负数比较]
status: ready
order: 22
---

## 教学设计（handdrawn-25d）

**教材锚点**：北师大版七年级上册第二章《有理数及其运算》2.3 绝对值

**页面结构（5 页）**：封面（小狗找家）→ 拖狗读距离 → 双点比大小（拖拽）→ 当堂检测 4 题 → 演示台

**易错点**：绝对值=距离恒非负；两负数比较绝对值大反而小；|a|=-a 的分类讨论。

**数学测试**：node tests/math.test.cjs（abs + cmpNeg 三例 + quiz 合法性）。
