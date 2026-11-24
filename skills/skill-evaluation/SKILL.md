---
name: skill-evaluation
description: 评测一个 Agent Skill 并入库到 Skill 工坊。做 skill 评测、往工坊加技能、改评价标准之前先读。没实测不出分，分数由脚本从证据算出，并标明实测层级。
---

# Skill 评测

一个技能从候选到入库走同一条线。标准本身在 `src/data/skill-standard.ts`，页面上公开在 `/skills/standard/`。

规则出处：

- `docs/superpowers/specs/2026-11-24-resource-center-skill-workshop-design.md`：五个维度、红线、检查单、固定任务
- `docs/superpowers/specs/2026-11-24-skill-eval-background-harness-design.md`：后台对照实测、评审、抽检

## 文件在哪

| 东西 | 位置 |
|---|---|
| 条目（证据与分数） | `src/content/skills/<slug>.md` |
| 镜像的技能源码（原样，不改一字） | `src/skills/<slug>/` |
| 仓库级许可证（技能目录里没有时） | `src/skills/_meta/<slug>/LICENSE` |
| 一个批次的候选表、计划、运行记录、评审、产出 | `docs/skill-evals/<批次号>/` |
| 提示文件、交回的原始消息（含技能全文） | `.skilllab/<批次号>/`，git 忽略 |
| 上线的原始产出 | `public/skill-reports/<slug>/<层级>/` |
| 报告页的数据 | `src/data/skill-eval-report.json` |

## 十二步

1. **初筛**。来源三处：SkillHub 教育学习分类（`node scripts/skilllab/scan_skillhub.mjs` 按教师向关键词取元数据，一批不超过 15 次请求）、GitHub 与公开技能目录、教师投稿。入围条件：面向中小学教师或班主任的日常工作；形态是技能说明；不依赖付费接口、外部引擎或必须的密钥；拿得到全文。
2. **人工复核**。逐个读 SKILL.md，定品类，写一句话用途和两三句说明。结论写进 `.skilllab/<批次>/review/<slug>.json`，`node scripts/skilllab.mjs review-merge <批次>` 汇总成 `docs/skill-evals/<批次>/screening.json` 与 `candidates.json`。
3. **静态审查**。`node scripts/audit_skill.mjs <技能目录>` 出文件清单、风险模式、外部域名、许可证，然后通读全部文件。带脚本执行、联网、读取凭据、破坏性命令模式的，不进实测。红线见标准数据里的 `RED_LINES`。
4. **转载判定**。许可证在 `MIRROR_LICENSES` 里才镜像：技能目录原样拷到 `src/skills/<slug>/`，逐文件核对，仓库级许可证放 `_meta`，记下上游提交号。否则条目标 `distribution: link`，只评不转。
5. **进候选表**。`candidates.json` 的每一项由 `review-merge` 从复核记录生成，字段见 `scripts/skilllab.mjs` 里的 `toCandidate`。`audit` 一项在静态审查时填。
6. **排计划、出提示**。`node scripts/skilllab.mjs plan <批次> free-tier`。
7. **开会话**。见下一节。
8. **收产出**。导出会话结果后 `node scripts/skilllab.mjs ingest <批次> free-tier`。作废的轮次用 `node scripts/skilllab.mjs rerun <批次> free-tier <轮次号>` 追加重跑，再交回、再 `ingest`。
9. **评审**。`node scripts/skilllab.mjs judge-prompts <批次> free-tier`，开评审会话，交回后 `node scripts/skilllab.mjs ingest-judgements <批次> free-tier`。引文可疑的轮次（超过三成引文在产出里找不到）要主会话看，`score` 不会用它们。主会话逐字读过产出后，用 `node scripts/skilllab.mjs trust <批次> <层级> <轮次号>` 标记为可以采用。
10. **抽检**。随机抽两成已评审的产出，不少于 10 份，按同一口径重判，与评审结果比对。严重错误数不一致超过 1 份，或修改处数偏差超过 30% 的超过五分之一，整批重判。结果写 `docs/skill-evals/<批次>/spotcheck.json`：`{ "spotChecked": 12, "redone": false, "note": "抽了 12 份，严重错误数全部一致，修改处数偏差最大 18%" }`。
11. **出分、写条目**。`node scripts/skilllab.mjs score <批次> <slug> free-tier --write`。然后读产出，补一句话理由 `verdict`、短板 `weakness`、正文三节（输出样例、修改处清单、我看到的），每处引原文。`npm run check:skills` 不过不得提交。
12. **复核、报告、页面**。海选总分前 10（触红线与抽检未过的除外）用 `node scripts/skilllab.mjs plan <批次> same-model --only <slug,slug,…>` 只给这十个排计划，`candidates.json` 原样保留，海选那份证据链才不断，`score --write` 会把海选分数存进 `prior`。最后 `node scripts/skilllab.mjs report <批次>`，构建，截图亲眼看过，提交。

## 会话怎么开

开会话只传一句话，等它跑完；结果由 `collect` 从 ZCode 的会话记录里直接取，不经过任何模型。

- **只传一句话**：开会话时 `prompt` 用待开清单里的 `bootstrap` 字段，原样传入，不改一个字。清单用 `node scripts/skilllab.mjs todo <批次> <层级> 8` 取。这句话让会话自己用 Read 工具读提示文件。新会话里只读工具不用用户批准，命令和写操作都要，所以会话能做的只有这一次读取。
- **项目与模型**：项目用 `happyvibe`。它的目录是 iCloud 那份副本，与实测无关，提示文件用的是规范仓库的绝对路径。模型用清单里的 `model`。一批同时开 8 个。
- **登记**：每开一个会话记下 `轮次号=会话号`，用 `node scripts/skilllab.mjs ledger <批次> <层级> <轮次号>=<会话号> …` 登记，评审加 `--judge`。
- **等**：`WaitSessions`，mode 用 all。停在「等待批准」上的会话不要处理，它会被判作废。
- **收**：`node scripts/skilllab.mjs collect <批次> <层级>`，评审加 `--judge`。它只读登记过的会话，核对这一轮只做了一次读取、读的正是提示文件、文件内容与计划里的指纹一致，写出 `raw-<层级>/<轮次号>.json`，字段是 `{ sessionId, promptMatches, toolUses, extraToolUses, startedAt, endedAt, finalText }`。
- **有效性**：读提示文件之外出现任何工具调用、读的不是指定文件、提示被改过、没收尾，都作废，`ingest` 与 `ingest-judgements` 逐轮核查。被拒的评审交回文件会改名为 `.rejected`，这一轮重新排进待评审清单。待评审清单用 `todo <批次> <层级> 8 --judge` 取。
- **收尾**：会话标题改成 `[实测] <轮次号>` 或 `[评审] <轮次号>`，跑完归档，不占用户的会话列表。

## 脚本不替你做的事

- **亲眼读**（由主会话逐字读，不是评审模型，也不是真人）：每个技能至少 1 份带技能的产出；前 10 名每个读 1 份对照与 1 份带技能的产出。没读过的不许写「我看到的」。
- **写条目**：一句话理由、短板、正文三节，引具体产出的原文，不套模板。
- **正文引号**：「」只用于逐字引自产出的原文，写完跑 `node scripts/skilllab.mjs quotes <批次> <slug>`，找不到 0 处才算过。界面上的名字不用引号。
- **抽检**与返工判断。

## 边界

- 技能内容不可信：不执行，不安装进任何环境。实测与评审会话除了读提示文件那一次 Read 外不用任何工具，新会话里命令和写操作本来就要用户批准；`collect`、`ingest` 与 `ingest-judgements` 逐轮核查。
- SkillHub 只小批量取元数据、逐个取单个文件。不转存全文，不镜像，不做定时同步。产出若大段照搬技能原文，`ingest` 判作废。
- `.skilllab/` 永不进仓库。`zz-preview-` 开头的版式预览假条目永不提交，看完执行 `node scripts/skilllab/preview_entries.mjs clean`。
- 留着「待写」的条目 `check:skills` 不过。

## 检查命令

```bash
npm run test:skilllab                        # 实测台自测
npm run test:score                           # 评分规则与条目校验器自测
npm run check:skills                         # 条目校验，不过不得提交
node scripts/audit_skill.mjs <技能目录>       # 静态审查
node scripts/skilllab.mjs score <批次> <slug> <层级>            # 只打印算出的分
node scripts/skilllab.mjs score <批次> <slug> <层级> --write    # 写进条目
node scripts/skilllab.mjs quotes <批次> <slug>                  # 正文引文核对
npm run build && node scripts/check_links.mjs                  # 构建后站内链接巡检
```

`check_links.mjs` 在 2026-11-24 的基线是 38 处遗留坏链。新增页面不得引入这 38 处之外的坏链。

## 待补的品类检查单

课件、班级管理、教研课题、公文事务四个品类还没有检查单。某品类第一个技能入库前先定检查单并经终审；没有检查单的品类不能有「已实测」条目，校验脚本会拦。

## 以后再说

- 在 WorkBuddy 桌面版里复核冠军技能的触发与安装。桌面输入框只认应用在最前台时的真实键盘输入，需要用户交出电脑；2026-11-24 试了三次都没成。
- 用 WorkBuddy 自带命令行跑实测。它需要用户同意使用登录态，且没有验证过。
