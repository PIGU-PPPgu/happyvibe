---
name: skill-evaluation
description: 评测一个 Agent Skill 并入库到 Skill 工坊。做 skill 评测、往工坊加技能、改评价标准之前先读。没实测不出分，分数由脚本从证据算出。
---

# Skill 评测

一个技能从候选到入库走同一条线，一次只评一个，不批量套模板。标准本身在 `src/data/skill-standard.ts`，页面上公开在 `/skills/standard/`，设计与规则出处见 `docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md`。

## 文件在哪

| 东西 | 位置 |
|---|---|
| 条目（证据与分数） | `src/content/skills/<slug>.md` |
| 镜像的技能源码（原样，不改一字） | `src/skills/<slug>/` |
| 仓库级许可证（技能目录里没有时） | `src/skills/_meta/<slug>/LICENSE` |
| 评测截图 | `public/images/skill-reports/<slug>/` |
| 固定任务用的脱敏成绩表 | `public/skill-tasks/grade-sample.csv`（`scripts/gen_skill_task_data.mjs` 生成，结果可复现） |

## 九步

1. **候选**。来源限三处：SkillHub 教育学习分类里逐条挑、明确开源的 GitHub 仓库、教师投稿。SkillHub 的列表接口匿名可读（`api.skillhub.cn/api/skills?keyword=…&category=education`），只取元数据；它的协议禁止批量抓取与再分发，**不做定时同步，不转存全文**。
2. **隔离下载**。每个技能放独立空目录，只读不执行。GitHub 技能用仓库压缩包，不要把仓库当脚本跑。
3. **静态审查**。`node scripts/audit_skill.mjs <技能目录>` 出文件清单、构成、风险模式命中、外部域名、许可证；然后**通读全部文件**。带脚本的必须逐行审代码。红线五条见标准数据。
4. **转载判定**。许可证在 `MIRROR_LICENSES` 里才镜像：技能目录原样拷到 `src/skills/<slug>/`，逐文件 `cmp` 核对，仓库级许可证放 `_meta`，记下该目录的上游提交号。否则条目标 `distribution: link`，只评不转。依赖另一个技能或引擎才能用的，不镜像残包，标 `link` 并在摘要里写明依赖。
5. **装进 WorkBuddy**。技能目录拷到 `~/.workbuddy/skills/hvtest-<slug>/`，在「专家·技能·连接器 → 技能 → 已安装」里确认它出现且开关是开的（开关上的字是**点下去的动作**：写「关闭」表示现在开着）。测完删除这个目录。
6. **实测**。见下一节。
7. **定分**。把证据写进条目的 `score`（三轮 `runs`、`baseline`、`checklist`、`textbookCheck`、`audit`），`dims` 先随便填，然后 `node scripts/score_skill.mjs <条目.md> --write` 算出五个维度并写回。终审要改分，写进 `overrides` 并注明理由，不要直接改 `dims`。
8. **入库**。补 `install`、`trigger`、`examples`、`cautions`，正文写输出样例与修改处清单；`npm run build:skills` → `node scripts/check_skills.mjs` → `npm run build` → 深浅主题截图亲眼看过 → 提交。
9. **复测**。上游更新后重跑；评测超过六个月，校验脚本会提醒标「待复测」。

## 实测怎么做

- **固定任务**取自 `TASKS`，任务原文一字不改。主任务跑 3 次，有副任务的品类加 1 次。
- **对照基线**：先把待测技能的开关关掉，同一任务、同一模型跑 1 次，记修改处数与严重错误数；这道任务已经有基线就不用重跑。
- **每一轮都新会话**，用老师平时说话的方式发任务，不点名技能；技能被调用记为触发。
- **记录**：是否触发、耗时秒数、修改处数、严重错误数、输出截图。修改处与严重错误的口径见标准页「名词口径」，每一处都列进正文。
- **模型统一用 WorkBuddy 的「均衡」档**（0.5 倍），全流程不变；测完把模型档位恢复成用户原来的设置。
- 没截图亲眼看过的输出不算测过。

## 代测 WorkBuddy 的已知事实（2026-11-24 实测）

- **输入框只认应用在最前台时的真实键盘输入。** 应用在后台时，设值、走辅助功能的按键、粘贴都不被编辑器认可：文字进了框，发送按钮仍是灰的。电脑操作环境会拒绝在非前台时发送全局输入，这是有意的护栏，**不要用 shell 命令把窗口调到前台去绕过它**。需要用户把 WorkBuddy 留在最前台，并在此期间不动鼠标键盘。
- 用户正在用电脑时不要代测：全局输入会打进用户正在用的应用。
- **每个新任务会自动挂上用户的默认技能**（当时是 `continuation-writing`）。发任务前先把它清掉，否则测的不是目标技能。
- 用户 WorkBuddy 里可能还开着别的技能，会抢着响应。不改用户的开关，在条目正文里记下当时同场启用的技能。
- 官方 Open API 的任务跑在云端沙箱，用不了桌面端安装的技能，不能代替桌面实测。应用自带的命令行单独启动时没有登录态。
- 不读 `~/.workbuddy` 下的凭据、记忆、会话文件；观察界面时侧栏会露出用户的会话标题与桌面文件名，不记录、不引用。
- 应用版本看界面左上角（安装包里的 Info.plist 可能过时）。

## 检查命令

```bash
node scripts/audit_skill.mjs <技能目录>          # 静态审查
node scripts/score_skill.mjs <条目.md> [--write] # 按证据算分
npm run test:score                               # 评分规则与校验器自测
npm run check:skills                             # 条目校验，不过不得提交
npm run build && node scripts/check_links.mjs    # 构建后站内链接巡检
```

`check_links.mjs` 在 2026-11-24 的基线是 38 处遗留坏链（36 张教材演示配图已丢失，2 个 WorkBuddy 课程视频不在库里）。新增页面不得引入这 38 处之外的坏链。

## 待补的品类检查单

课件、班级管理、教研课题、公文事务四个品类还没有检查单。某品类第一个技能入库前先定检查单并经终审；没有检查单的品类不能有「已实测」条目，校验脚本会拦。
