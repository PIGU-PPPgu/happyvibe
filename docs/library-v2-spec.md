# 教学交互资源库 v2 · 总体设计（修订版 R4）

> 状态：已定稿（2026-11-01，总设计师，按评审三轮意见修订；R4 修复构建链归属 A1、P1/P2 时序矛盾 A2、normalize 示例 C1、体积阈值冲突 C2，增补落地差额清单 B1-B9 与 P8 页型归属）。本文档是 v2 资源库的唯一建设标准。
> 本文档存放于**基准仓**；**施工对象是工作仓**（见 §0，两仓不是同一个）。

## 0. 双仓事实与施工对象（本会话实测，非推断）

| | 基准仓 | 工作仓 |
|---|---|---|
| 路径 | `/Users/iguppp/src/happyvibe` | `/Users/iguppp/Library/Mobile Documents/com~apple~CloudDocs/代码备份/happyvibe` |
| 角色 | 深度基准与旗舰工件的**唯一来源**，已停更 | **v2 施工仓**（AGENTS.md 站点、部署 happyvibe.intelliedu.cc、活跃开发） |
| 实测 | `git rev-parse --verify 941574a6^{commit}` 与 `3f1dcad3^{commit}` 均返回完整 SHA；HEAD=3f1dcad3（资源库清零）；scripts/ 完整 | 两 commit 均 `fatal: Needed a single revision`；HEAD=7cd5cddf；`git log` 深遍历断在缺失对象 `e4143c91`；**工作树损坏**：scripts/ 仅剩 `__pycache__`，src/interactives 仅 1 文件（`math/bsuex-7a-1-3-section/index.mjs`），public/interactives/ 为空，git status 大量未提交删除，package.json scripts 仍指向已删文件 |

结论与规矩：
1. **v2 一切施工动作发生在工作仓**；对 `941574a6` / `3f1dcad3` 的每一处引用均指基准仓历史，工作仓内落地前不可 `git show`。2026-11-26 基准仓清除了 `loop.log` 的历史，10 月 27 日之后的提交号都变了：下文的 `941574a6` 现为 `ba2d0954`，`3f1dcad3` 现为 `f2680ad5`；旧号在整仓备份 `~/src/happyvibe-backup-2026-11-26.git` 里。
2. **P0-P2（含 P1.5）未完成前，任何资源件不开工**（§6）。
3. 构建链现状（实测）：`build_interactives.mjs` 只打包含 `index.mjs` 的目录（:1 注释、:53-54 `entry=index.mjs; if (!existsSync(entry)) continue`）；`test_interactives.mjs` 的被测名单来自构建生成的 `scripts/.interactives-report.json`（:12）；产物无 `__HV__{...}__HV__` 标记即判「无自测报告」fail（:27-28）；旗舰在 941574a6 本身也从未进过 `public/interactives/`（ls-tree 0 个 kdedraw 产物）。**因此 v2 六源文件的构建、被测资格、报告注入全部依赖 §6 P1.5 新增的构建分支——这是机器验收链的前置，不是可选项。**

## 1. 定位与命名

**定位**：v2 收录**深课件**——一个问题世界贯穿 9-11 页的完整教学件（情境→探究→判定→板书），教师投屏授课、学生课上动手；不收录碎片化单点演示。四条立库原则来自基准仓旧库清零教训（3f1dcad3「资源库清零」；941574a6 信息明言「自动化只留 CI，生成器废除，逐节精修重做」）：**一课一件、每页动手、机器+人工双验收、不批量不过夜**。

**slug 规则（含版本位）**：`{subject}-{版本码}-{册}-{章}-{节}`，册别 `7a`=七上、`7b`=七下、`8a`=八上……示例：`math-bs-7a-2-2`、`geography-rj-7a-1-3`。学科目录名与 slug 学科段一致。

**版本码 ↔ textbook-index 版本键对照**（索引键为中文全名，实测锚点正则 `/(人教A版|人教版|北师大版|统编版)/`（textbook-index.mjs:69）只认这四个，且「人教A版」在正则中序前——补目录时键名必须逐字用全名）：

| 版本码 | 索引版本键（中文全名） |
|---|---|
| `bs` | `北师大版` |
| `rj` | `人教版` |
| `rja` | `人教A版` |
| `tb` | `统编版` |

**物种共存与判定规则（工作仓现状 → v2 规则）**：

| 物种 | 全称与既有例 | 目录判定规则（构建与 harness 分派的依据） | 处置 |
|---|---|---|---|
| A | 三件套件（bsuex-7a-* 系列） | 目录含 `index.mjs`+`spec.json`，无 `js/` 目录 | 保留现状，不再新增 |
| B | 单页实验室（math-number-line「数轴动点实验室」，file: math-number-line，order 15） | 仅单文件（index.mjs 薄壳或单 html），无 spec.json 无 js/ | 保留不动：不迁移、不改名、不重跑 previews |
| C | **v2 深课件（本 spec）** | 目录含 `js/pages.js` | **唯一允许新增的物种** |

**入口链路**：源件 `src/interactives/<学科>/<slug>/` → **P1.5 构建分支** → 单文件 `public/interactives/<slug>.html`（iframe 嵌入+全屏，引用去 `.html` 后缀）→ 资源卡 `src/content/resources/<学科>/<slug>.md`。教材锚点必须已收录 `scripts/textbook-index.mjs`（键名按上表全名），未收录先据实体教材补目录再挂 meta。

## 2. 页面契约

### 2.1 编排骨架：四幕 9-11 页，幕序硬性

入场（开场/变身/投票，2-3 页）→ 探究（拼装/操作/量化/含量化逆推 judge 页，3-6 页）→ 判定（**检测页恰 1 页**，紧邻板书）→ 板书（1 页，末位）。**幕序不可穿插**，且**机器可校验**：`slides[i]` 带 `act` 幕字段（1 入场/2 探究/3 判定/4 板书），断言 act 序列单调不降且 1-4 各至少一页（§3.2）。

**judge 页（输入判定）归探究幕尾**：承担量化概念的逆推（旗舰「记录时刻·你来算」：已知位置反求时间），排在检测页之前、作为探究收束；动手动词=输入判定。**判定幕只留检测页 1 页**——输入判定式检测作为检测页的**必含题型**（输入题≥2、每题 why 非空）。此分类（评审三选一之 b）不动旗舰已实证教学节奏；若某件把 judge 单独成页排在检测后，视为对幕序契约的变更，须重走教学走查。

两个**必收项**（缺任一不收）：**检测页含输入判定式题型** 与 **板书页**。

### 2.2 页型池（9 种，自基准仓旗舰 941574a6 的 11 页蒸馏；旗舰 11 页全部有归属）

| 页型 | 旗舰实例 | 承担 | 学生动手点 | 页型验收要点 |
|---|---|---|---|---|
| 开场 cover | P1 糖豆往返跑 | 抛出问题世界与开放问题 | 揭示：点击引出悬念/出发主角 | 首屏即见主角运动；有一句开放问题 |
| 变身 transform | P2 温度计放平 | 生活原型→学科对象连续变形 | 步进：≥3 阶段 | 各阶段元素连续无跳变；末态即标准学科对象 |
| 投票 vote | P3 现场投票 | 暴露误区 | 投票：点选项，条形实时生长 | localStorage 键 `hv-<slug>-vote`；可清空重投 |
| 拼装 assemble | P4 三要素拼装 | 概念要素逐一到位 | 拼装：≥3 件逐步点亮 | 每步「还差一件」文案具体 |
| 操作 operate | P5 描点、P8 相反数对称折、P9 拖 A/B | 手上建立概念（含按钮步进型操作） | 点放/拖拽/方向键微调/步进按钮 | 坐标断言分两档：有反向交互（P5/P9 点放拖拽）→ 换算往返一致；无反向交互（P8 逐步摆放）→ 正向输出断言（toX 值校验） |
| 量化 quantify | P6 糖豆匀速跑 | 公式与过程随参数变化 | 时间条：拖动/播放/0.5-2x | 结论卡数字与图形同源（一函数两处显示） |
| 判定 judge | P7 记录时刻（探究幕尾） | 量化逆推+输入判定式作答 | 输入判定 | checkInput 按 §3.3 规范；对错反馈+纠正讲解 |
| 检测 quiz | P10 当堂检测（判定幕） | 当堂闭环 | 作答：输入+选择混合 | 输入题≥2、每题 why 非空、实时得分 |
| 板书 board | P11 板书设计 | 一图收束全课，可拍照留存 | 揭示：逐条生成，末条留白先说后看 | 条目与前页结论一一对应 |

### 2.3 每页统一结构

非 full 页固定五要素：**标题+条件条 strip+主图+右侧结论卡+底部操作提示**，角标 `FIG·章·小节`。v2 强制数据字段：`slides[i]` 带 `handsOn` 动词（侧栏徽标显示）与 `act` 幕号（K.Toc 分组渲染的**唯一数据源**——替代旗舰 app.js 硬编码的 GROUPS 四组，见 P1 差额 B8）。

### 2.4 交互词汇表与键盘契约（全库统一，页面文案只从此选词）

词汇 12 个：**步进**（data-s 分步，与 PPT 点击序一致）/ **揭示**（先猜后看）/ **点放**（点主图放角色，半格吸附）/ **拖拽**（pointer 连续移动）/ **微调**（方向键±最小单位）/ **投票**（本机存储+条形生长）/ **拼装**（逐件点亮）/ **时间条**（Clock：拖/播放/倍速）/ **输入判定**（checkInput）/ **画笔**（ink canvas 批注，按页保存）/ **双视图**（2.5D⇄平面，**700ms 缓动**——以旗舰 core.js setDepth 实测 `dur=700` 为准，不取配方文档的 300ms）/ **深链**（`#p=<no>`）。

键盘契约**14 键＝11 主键 + 3 别名**（保留旗舰全部已实证绑定，删键才是风险；input/textarea/select 聚焦时全部让路；harness 断言覆盖）：
- 步进组：`←`/`→`/`空格`，别名 `Enter`≡下一步
- 换页组：`PgUp`/`PgDn`，别名 `↑`≡上一页、`↓`≡下一页
- 工具组：`V` 双视图、`B` 开关 K.Toc 目录抽屉、`D` 开关画笔、`N` 开关 K.Notes 教师备注层、`F` 全屏、`Esc` 关画笔与备注（较旗舰「只关画笔」为**向后兼容扩展**）

### 2.5 工程契约：六源文件 + 1 测试文件

```
src/interactives/<学科>/<slug>/
  index.html        外壳：1280×720 舞台 + 步进/时间条挂点 + ink canvas（不含逻辑）
  css/app.css       纸面色板+等距网格+描边实体投影卡片（§3.4）
  js/data.js        slides(含 handsOn+act)+notes(六项)+世界常数+题库；禁止散落 pages
  js/engine.js      学科引擎：纯函数、不碰 DOM、node 可测（UMD 挂 window/globalThis）。
                    文件名恒为 engine.js，学科无关；含 normalize()（§3.3 归一化唯一实现）
  js/core.js        K.* 部件：h/box/card/svg/table、学科主图部件、Clock、Chart、
                    K.Toc 与 K.Notes 两外壳部件（见下）；尾部 K.boot() 装配外壳
                    （toc 构建/事件绑定/fit 缩放/hash 启动，吸收旗舰 app.js 职责，
                    14 键绑定原样保留，见 P1 差额 B7）——不设第七个源文件
  js/pages.js       P[n] = { full?, build(ctx) → {steps, step(k), clock?, leave?} }
  tests/engine.test.cjs  node 直跑断言（引擎公式+数据契约，§3.2）
```

**K.Toc（目录抽屉）**：按 `slides[i].act` 分四幕分组渲染导航（当前页高亮、handsOn 徽标），`B` 键与 ☰ 按钮开关；收起时面包屑仍显示当前页；任何页型下 B 均生效。
**K.Notes（教师备注层）**：渲染 `notes[cur]` 六项（本页问题/教师开口/提问追问/点击顺序/关键困难/过渡），`N` 键开关；**内存态不落盘**（教师投屏数据不出本机的最严格实现）；板书页允许开备注（教师收尾讲解用）。

铁律：舞台固定 1280×720 绝对定位 px 坐标、`transform: scale()` 适配；换算只在 engine.js 定义一次；`leave` 必清 interval 与全局监听。

## 3. 质量验收线

### 3.1 机器闸门（五条，命令逐字可执行，任一失败即止）

```bash
node src/interactives/<学科>/<slug>/tests/engine.test.cjs   # ① 引擎+契约断言（node 直跑，不依赖构建）
node scripts/test_interactives.mjs <slug>                    # ② 无头自测（依赖 P1.5 构建产物与 P2 断言升级；
                                                             #    名单来自构建报告 .interactives-report.json）
npm run check:interactives                                   # ③ 六项闸门（含体积分档，阈值随物种，见 §3.4/P6）
npm run verify                                               # ④ 全链路（构建→预览图→闸门→自测）
node scripts/ship.mjs "<件名>：<一句话>"                       # ⑤ 发布收尾：verify→build→deploy→线上字节验证→commit/push
```

⑤ 对应 AGENTS.md 收尾铁律。P0 完成前 ②③④⑤ 在工作仓均会 ENOENT（scripts 工作树已删，实测 package.json 仍指向它们）；P1.5 完成前 ②③④ 对 v2 件空转（构建不认六源目录、测试名单无 v2 条目）。

### 3.2 契约断言清单（写进每件 tests/engine.test.cjs，①必含）

1. **引擎硬算按页型分派**：operate/quantify/judge/quiz 页每页 ≥2 条公式断言（如 `pos(-4,2,3)===2`）；cover/vote/transform/board 豁免公式硬算。**坐标断言分两档**：有反向换算交互的页（P5/P9 型）必含往返一致（`fromX(toX(v))===v`）；无反向交互的页（P8 型）与豁免页，若该页用到坐标函数则以正向输出断言（`toX(2.5,6,900,80)` 等定点核）或 slides/notes/题库结构断言替代。
2. `slides.length` 与资源 md frontmatter `pages:` 相等——**从 md 原文正则解析**（node 直跑，不依赖 Astro 构建顺序）；schema 侧落点见 §6 P5。
3. 每页 `handsOn` 非空；**act 序列单调不降且 1/2/3/4 各至少一页**（幕序硬性的机器化）；每页 `notes` 六项齐全——**口径：`ask` 允许空数组（检测页可无追问），其余五项（goal/open/clicks/difficulty/transition）非空**。
4. 检测页题库：输入题≥2、每题 `why` 非空、选项与答案索引合法。
5. checkInput 按 §3.3 判定表全量断言（accepts 全过、rejects 全拒），含 normalize 往返断言。

### 3.3 输入判定式检测的精确规范

**归一化 normalize()（engine.js 单处实现）**：删空白 → 逐对全角转半角（映射表**封闭集合，逐对列出**）→ 删前导 `+`（「+4」等于「4」）：

| 输入 | 输出 |
|---|---|
| `０１２３４５６７８９`（全角数字） | `0123456789` |
| `＋`（U+FF0B 全角加号） | `+` |
| `－`（U+FF0D 全角减号） | `-` |
| `−`（U+2212 数学减号） | `-` |
| `，`（U+FF0C 全角逗号） | `,` |
| `、`（U+3001 顿号） | `,` |
| `：`（U+FF1A 全角冒号） | `:` |

（与旗舰 checkInput 行为兼容并加严：旗舰已做 `、，→,`、`＋→+`、删前导+，v2 补全角数字与两种减号——按本表补断言。）**判定**＝归一化后与 `accepts` 数组任一项（同样归一化后）全等。

**题库结构（data.js，judge 与 quiz 的输入题统一）**：
```js
{ q: "图上 3cm、比例尺 1:5000，实地多少米？",
  accepts: ["150", "150m", "150米"],   // 每项归一化后必须判 true
  rejects: ["15", "1500m"],            // 每项归一化后必须判 false，断言逐项跑
  why:  "3 × 5000 = 15000cm = 150m：比例尺分母就是放大倍数。" }
```
错答反馈文案须指向 `why` 的第一步（纠正讲解），不许只判错。tests 至少一条断言锁住映射表本身（注意**删前导 + 在转半角之后**）：`normalize("＋１５０，３") === "150,3"`。

### 3.4 视觉体系与体积分档

**视觉（标准档：手绘 2.5D 纸面系）**：起点=旗舰 `css/app.css`（P1 落地后取自基准仓 941574a6；落地失败则按 §2 契约从零新建同风格）：紫金集团色（`--purple:#6C2166 --gold:#DEAA18 --paper:#FBF7EE --ink:#2B2326`）+纸面等距网格+描边实体投影卡片+衬线标题/等宽数字+有厚度 2.5D 主图。

纪律：唯一强调色=金（选中/结论/活动态）；语义色仅判定反馈与角色区分（绿=对、红=错/警示）；按钮描边白底，**彩色按钮阵列=违规**；主图区≤60%留白充足；HUD 一行等宽元数据；引线注释锚到主图实际位置；面板数字与图形同源，**假数据=违规**；暗部留 10-15% 微光；双视图 700ms 缓动不瞬移。

**体积分档（闸门③实测阈值随 kind/物种分派，check_interactives.mjs:56 现状：interactive-3d→4MB、其余→100KB）**：

| 档 | 阈值 | 说明 |
|---|---|---|
| 物种 C（v2 深课件，kind=interactive-2d） | **≤512KB（P6 新增档）** | 手绘 SVG 系天然 <200KB（旗舰源约 1300 行 js+316 行 css），512KB 给足余量；不新增此档则 v2 件按 100KB 会被直接闸死 |
| interactive-3d | ≤4MB | 沿用（含内嵌 GLB） |
| 其余旧物种 | ≤100KB | 沿用 |

门面档（仅 3D 课题，走 interactive-3d 档）：贴图栈（≥3 张 ≥1024 宽）+自研着色器+加载态。首批两门均标准档。

### 3.5 人工评审线（不达线不收）

- **视觉评分线**（wedulab 标尺）：常规件 <6 不收；**首批样板 <8.5 不收**；门面件 <9 不收。评审必须无头截图亲眼看过：**封面/探究页/板书页/分步末态共 4 张全截，缺任何一张即违规**；prompt 点名问「5 个最可复制的细节」与「还差什么」。
- **教学走查线**：试讲走完全部 9-11 页，每个 handsOn 动词真实触发≥1 次；教师备注足以让陌生教师照讲；板书页可拍照当课堂板书。
- **红线**：无 emoji、零外链、不联网、学生数据只进本机可清空（**所有 localStorage 键统一 `hv-<slug>-` 前缀**，见 P1 差额 B6）、教师备注内存态不落盘、AI-isms 文风红线沿用 AGENTS.md、没截图亲眼看过就上线=违规。

## 4. 生产流程（七步，一件一循环）

0. **前置就绪检查**：§6 P0-P4（含 P1.5）已完成且 `npm run verify` 基线绿——否则停。
1. **选题挂锚**：锚点过 textbook-index（版本键用 §1 全名表，未收录先补目录）；查 `_shared/scenes/` 与库内防重复。
2. **契约先行**：写本件 spec（问题世界一句话+9-11 页表【页型/act 幕属/动手动词/结论卡公式】+检测题库含 accepts/rejects/why）。**契约评审通过才开工**。
3. **骨架与断言先行**：`new_interactive.mjs --species v2`（P4 改造后）生成六源文件+测试骨架 → data.js 填世界常数与题库 → engine.js 纯函数 → tests 断言先绿（数学先于美术：测试不过不截图）。
4. **逐页精修**：一页一页做，每页完成即跑闸门①+无头截图目检本页，不积压。
5. **全链路验证**：闸门②③④。
6. **双评审**：视觉评分（首批≥8.5）+教学走查；不过线回第 4 步。
7. **入库发布**：资源 md（frontmatter 含 `pages:`、锚点、status: ready）→ 重跑预览图 → 闸门⑤ ship。

过夜批量、模板自动生成：**禁止**（旧库死因）。

## 5. 首批样板（恰好 2 门，均按旗舰深度；前置 P0-P4（含 P1.5）完成后开工）

### 样板一：`math-bs-7a-2-2` 数轴 · 糖豆找家（基准件）

- **问题世界**：小狗糖豆的家在原点，它左右跑，每一步都落在一条线上——这条线就是数轴。
- **来源（条件式）**：若 §6 P1 落地成功，以基准仓 `941574a6:src/interactives/math/kdedraw-7a-2-2/` 工件为起点升级入库（改名映射与**落地差额清单**见 P1）；P1 失败则从零新建并删除对 941574a6/3f1dcad3 的一切引用。
- **11 页四幕——页型分类与页序零调整；落地差额清单（题库 schema/notes/handsOn/键名/板书揭示等数据与行为改造）必须动，两者不矛盾：前者保教学节奏，后者是 schema 对齐**：入场（1 封面循环 / 2 温度计放平 / 3 现场投票）→ 探究（4 三要素拼装 / 5 描点 / 6 匀速跑 / **7 记录时刻·你来算＝量化逆推 judge** / 8 相反数对称折（operate 步进型）/ 9 拖 AB 比大小）→ 判定（10 当堂检测，**输入题≥2、每题 why 非空**）→ 板书（11，升级为逐条揭示+末条留白，见差额 B5）。
- 角色：全库基准件，校准管线（构建分支、断言、评审线）与深度对照。

### 样板二：`geography-rj-7a-1-3` 地图的阅读 · 校园寻宝（非数学，页型跨学科首验）

- **问题世界**：转学生小满捡到学长的「校园寻宝图」，图在手却找不到社团活动室——缺的每一样正好是地图三要素。
- **10 页四幕（幕序严格合规，act 序列 1/1/1/2/2/2/2/2/3/4）**：
  1. 开场：手绘校园地图+悬念「图在手，为什么还是找不到」（动手：点亮藏宝点）
  2. 变身：航拍照片→描边→符号化→地图（动手：逐步符号化）
  3. 投票：「缺了哪样最找不到路？」三选一暴露误区（本机条形生长）
  4. 拼装：逐个点亮 比例尺→指向标→图例，缺件提示
  5. 操作：格网点放「你」的图标读出位置，方向键微调（描点同构）
  6. 量化：拖「图上距离」滑杆实地距离实时换算——`实地距离=图上距离×比例尺分母`
  7. 操作（步进型，探究幕收尾之一）：拖指向标旋转，「教学楼在操场的什么方向」相对方位随之变
  8. judge 量化逆推（输入判定）：图上 3cm、比例尺 1:5000，实地多少米？accepts `["150","150m","150米"]`、rejects `["15","1500m"]`
  9. 判定幕·检测：**输入题≥2 + 选择题，每题 why 非空**，实时得分（与闸门①逐字对齐）
  10. 板书：一图三要素一换算，逐条揭示，末条留白先说后看
- **前置**：textbook-index.mjs 新增 `地理: { 人教版: { 七年级上册: { units: [...] } } }`——**键名必须用中文全名「人教版」**，与锚点正则（textbook-index.mjs:69）一致，否则锚点校验不过；units 据实体教材核对。视觉走标准档手绘纸面系。

两件完成后复盘页型池映射与断言清单，修订本 spec 再扩产。

## 6. 前置工程（P0-P6 含 P1.5，有序，全部完成才进生产流程）

**P0 工作仓恢复与基线（第一优先）**。现状（实测）：scripts/ 工作树仅剩 `__pycache__`、src/interactives 仅 1 文件、public/interactives 空、git status 大量未提交删除，package.json scripts 指向已删文件。动作：(a) **定性**——与仓主确认这批删除是否即「旧库清零」的有意行为；(b) 有意→`git commit` 固化删除，误删→`git restore scripts src/interactives public` 类恢复；(c) 恢复/固化后 `npm run verify` 跑通并存基线输出。**不许带着未提交删除施工**。工作仓深历史已缺对象（`e4143c91` 不可读），恢复只依赖 HEAD 可达对象，不做历史重写。

**P1 旗舰工件落地（第二优先）**。**源**：基准仓 `/Users/iguppp/src/happyvibe` 的 `941574a6:src/interactives/math/kdedraw-7a-2-2/`（源件清单实测：index.html、css/app.css、js/app.js、js/core.js、js/data.js、js/mathengine.js、js/pages.js、meta.json、tests/math.test.cjs）。

**落地差额清单（改名映射 + 9 项必改，照单施工，不靠施工者自由发挥）**：

*改名与文件对齐*：
| # | 源（941574a6） | v2 目标 | 说明 |
|---|---|---|---|
| M1 | `…/math/kdedraw-7a-2-2/` | `…/math/math-bs-7a-2-2/` | 目录与资源 md `file:` 字段同步改 |
| M2 | `js/mathengine.js` | `js/engine.js` | index.html 引用同步改 |
| M3 | `tests/math.test.cjs` | `tests/engine.test.cjs` | 闸门①命令按此路径找到文件 |
| M4 | `js/app.js` | 并入 `js/core.js` 尾部 `K.boot()` 后**删除** | 契约维持六源文件 |
| M5 | `meta.json` | 保留，`kind` 置 `interactive-2d`，补 anchor | |

*数据与行为差额（B1-B9，全部必做）*：
- **B1** `tests/engine.test.cjs` 内 `require('../js/mathengine.js')` 同步改 `../js/engine.js`（只改文件名不改 require 会 ENOENT）。
- **B2** `data.js` slides 增 `handsOn` 字段：从 app.js `HANDS_ON` 硬编码表迁移（3 投票/4 拼装/5 描点/6 拖动/7 输入/8 折纸/9 拖动/10 检测）**并补漏登页**：P2「放平」、P11「揭示」——12 页全有 handsOn 后 §3.2-3 断言才过。
- **B3** notes 补全：`notes[11]`（板书页六项，现整体缺失）、`notes[10].difficulty` 填实（现为空串）；`ask` 空数组允许（§3.2-3 口径）。
- **B4** 题库 schema 迁移：输入题从旗舰 `{q,ans,alt}`（无 why）迁为 §3.3 `{q,accepts,rejects,why}`；**P7 判定答案 `"3"` 从 pages.js:286 硬编码迁入 data.js 题库**；P10 错答反馈从「✗ 应为 c.ans」（pages.js:369）改为**指向 why 第一步**的纠正讲解。页面代码与题库同改。
- **B5** P11 板书页升级：现 5 条一次性全渲染、steps:1（pages.js:392-420）→ **逐条揭示（steps≥5）+ 末条留白先说后看**。此为对已实证工件的行为变更，落地后该页**局部重走教学走查**。
- **B6** localStorage 键统一 `hv-<slug>-` 前缀：`hv-vote-7a-2-2`（pages.js P3）→`hv-math-bs-7a-2-2-vote`；`dongdian:depth`（core.js setDepth）→`hv-math-bs-7a-2-2-depth`；app.js store 前缀 `dongdian:`→`hv-math-bs-7a-2-2:`。
- **B7** 键盘对齐：保留旗舰 14 键全绑定（Enter/↑/↓ 三别名不删，§2.4）；`Esc` 从只关画笔**扩展**为关画笔/备注。合并 app.js→K.boot 时按此口径，**不是纯逐函数搬迁**。
- **B8** slides 增 `act` 幕字段（1/1/1/2/2/2/2/2/2/3/4），K.Toc 按 act 分组渲染，**删除 app.js 硬编码 GROUPS**（其四组「情境引入/探究一/探究二/归纳与检测」≠ v2 四幕）。
- **B9** 双视图动画时长以旗舰代码 `dur=700` 为契约值（§2.4），spec 不取 300ms——不改代码只改口径。

**三路径命令级步骤与首选顺序**：
- **路径①（首选）文件级拷贝+独立提交**：`git -C 基准仓 archive 941574a6 src/interactives/math/kdedraw-7a-2-2 | tar -x -C <临时目录>`（或逐文件 `git show`），按差额清单改造后落到工作仓新目录，一个独立 commit（message 注明来源 SHA 与核验方式）。代价：不带历史对象；溯源以逐文件 sha256 与基准仓版本一致核验（改造前先核原始件，改造后以差额清单为 diff 依据）。
- **路径② 远端引入（需完整溯源时）**：`git remote add baseline /Users/iguppp/src/happyvibe && git fetch baseline 941574a6 && git checkout 941574a6 -- src/interactives/math/kdedraw-7a-2-2`（按路径取，不整仓合并）。**代价（须知情）**：fetch 把基准仓对象（含 31 节历史与清零 commit）带进部署仓对象库；好处：`git rev-parse --verify 941574a6^{commit}` 直接通过。
- **路径③ 从零新建（兜底）**：P0/①/② 均不可行时，样板一按 §2 契约从零施工，删除对 941574a6/3f1dcad3 的一切引用，本 spec §0/§3.4/§5 同步降级。

**P1 统一验收（与 P2 解耦，解决时序矛盾）**：改名映射 M1-M5 逐项完成；差额 B1-B9 逐项完成；`slides` 数=11 且 act/handsOn 齐；**闸门①跑通**（node 直跑，复审已实测旗舰抽出后 node tests 可执行）+ 差额改造后产物在本地可打开目检。**不含闸门②**——②依赖 P1.5 构建产物与 P2 断言升级，**在 P2 完成后对基准件补跑并记录**。文件级核验：路径②额外 `rev-parse` 通过；路径①以逐文件 sha256 一致替代（如实用何种验收写进落地报告）。

**P1.5 构建链分支（A1 修复，P2 的前置）**。`build_interactives.mjs` 增**物种 C 分支**：目录含 `js/pages.js`（§1 判定规则）时走六源打包——`css/app.css` 与 `js/{data,engine,core,pages}.js` 按序内联进 index.html 外壳，产出 `public/interactives/<slug>.html`；**构建器注入 `__HV__` 自检 runtime**（收集 species:"v2-course"、pages 数、act 序列、逐页 build 结果、`data-hands-on` 元素清点、输入题 accepts/rejects 现场判定结果、clock 页 t 可 set、`#p=` 深链、14 键绑定存在性，序列化为 `__HV__{...}__HV__` 文本标记供闸门② :27 正则抓取），并把 `<slug>` 条目写入 `scripts/.interactives-report.json`（闸门② :12 的被测名单来源）。**__HV__ 注入归属=构建器**：源件六文件保持纯教学逻辑，报告器是 harness 关注点，属构建层，不进 K.boot。验收（构建冒烟）：工作仓 `node scripts/build_interactives.mjs` 后 `public/interactives/math-bs-7a-2-2.html` 存在、体积 ≤512KB、含 `__HV__` 标记、report 含该条目。

**P2 harness 升级为双物种断言（依赖 P1.5）**。现状（实测 HEAD 版 123 行）：断言=教研员契约 v2（metaChars≥8、steps≥3、guideChars≥90、每环节引导≥15 字、noteChars≥120），无步进/clock/深链/handsOn 逻辑。升级：(a) 按 §1 物种判定规则分派断言集；(b) 物种 C 逐条断言＝P1.5 注入的 `__HV__` 报告字段逐项校验（species/pages 与 md `pages` 一致/act 单调且四幕齐/逐页 build 无异常/每页 steps≥1 且 handsOn 非空/data-hands-on 可触发/accepts 全过+rejects 全拒/clock 可 set/#p= 深链可达/14 键绑定存在）；(c) `--engine` 子命令直接调起 slug 目录内 tests/engine.test.cjs 断言集；(d) **教研员 v2 五项阈值对物种 C 废止**，对物种 A（bsuex-* 三件套）与物种 B（单页实验室）保留原样。**P2 验收：对 P1 落地的基准件补跑闸门②，全绿。**

**P3 重写 skills/teaching-interactives/SKILL.md**。现状（实测 HEAD 版）：全文三件套约定，与 v2 契约不兼容，而 AGENTS.md 规则 2.5 以它为必读入口。改为分节声明：物种 A/B 沿用原约定，物种 C（v2 深课件）按本 spec §2/§3/§4/§6-P1.5 施工与验收；开头加 §1 物种判定表。

**P4 改造 scripts/new_interactive.mjs**。现状（实测 HEAD 版）产物为三件套。增 `--species v2`：产出六源文件+tests/engine.test.cjs 骨架（含 §3.2 断言样板、§3.3 判定表样板、K.boot 装配段与 14 键绑定、act/handsOn 字段骨架），锚点校验（validateTextbookAnchor）原样复用；默认行为不变（物种 A）。

**P5 src/content.config.ts resources schema 补字段**：`pages: z.number().int().min(9).max(11).optional()`——现状（实测 HEAD:47-59）无此字段，zod 丢弃未知键。闸门①不依赖它（从 md 原文解析），此字段供站内卡片展示层使用；物种 A/B 的 md 无 pages，故 optional。

**P6 闸门核对与物种阈值调整（C2 修复）**。check_interactives.mjs:56 现状 `limit = kind==='interactive-3d' ? 4MB : 100KB`——v2 件 kind=interactive-2d 按 100KB 必被闸死。动作：**按物种调整分档阈值**，新增物种 C 档 ≤512KB（§3.4 表）；其余五项（零外链/无 emoji/双主题/title/全屏）逐项核对对 1280×720 课件件的适用性（双主题按产物自带主题核验），不适配项在本 spec 记录豁免理由，不静默放行——**个案豁免不替代物种级分档**。
