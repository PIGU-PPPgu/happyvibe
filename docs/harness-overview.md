# HappyVibe Harness 完整清单（交付文档）

一份文档看懂整套"发资料 → 成品资源上线"的生产线。每层列出全部文件、职责、怎么跑、失败时它会怎么拦你。

## 总览：六层流水线

```
L0 资料层        你给的教材照片/PDF/课题
      │ node scripts/new_interactive.mjs <学科> <slug> --title --anchor --archetype
L1 契约层        教学契约（环节/讲解/检测）+ 教材锚点校验（textbook-index）
      │ 填 TEACHING 与教学设计 md（设计先行：先填表再写码）
L2 场景层        场景原型库 _shared/scenes/（numberline 四模式 + 情景层）+ custom 逃生门
      │ node scripts/build_interactives.mjs
L3 产物层        单文件 HTML（esbuild 树摇 + 港紫壳模板注入，断网可投屏）
      │ node scripts/verify.mjs
L4 验收层        五阶段：构建 → 预览实拍（空白检测）→ 12 项闸门 → 视觉闸门（像素+目检册）→ 双主题 harness
      │ node scripts/ship.mjs "commit 信息"
L5 发布层        一键：verify → build → 部署（自动代理）→ 字节级线上验证（CDN 重试）→ commit/push 双端确认
```

## 逐文件清单

### 共享层（25+ 资源共用，改一处全站生效）

| 文件 | 职责 |
|---|---|
| `src/interactives/_shared/template.html` | 工具页壳 v3：44px 薄顶栏（返回/标题/‹›翻页/讲解/检测/小结/◐/全屏）+ 左侧 216px 编号章节栏（◆随堂检测、≡课堂小结入列）+ 舞台章节标头 + 引导浮层 + quiz 引擎 DOM + 上手引导；`--shell-top/--rail-w/--rail-h` 三变量驱动全布局，`?embed=1` 全壳隐藏 |
| `src/interactives/_shared/runtime.mjs` | 教学引擎：环节切换/键盘/进度/讲解与检测浮层/quiz 逐题解析得分/selftest 报告（`__HV__` 协议供 harness 断言）/呼吸动画钩子 |
| `src/interactives/_shared/scenes/numberline.mjs` | 场景原型 #1：数轴（sanys 三要素/free 拖点/mirror 对称/add 加减法行程）+ 情景层（thermo 双温度计温差/walker 行走小人脚印）+ 读数标签覆盖 + **同源数值断言**（读数必须与计算函数一致） |

### 构建与验收（scripts/）

| 脚本 | 一句话 |
|---|---|
| `build_interactives.mjs` | esbuild 单文件打包 + 模板注入，产物 `public/interactives/<slug>.html` |
| `check_interactives.mjs` | 12 项闸门：体积/零外链/无 emoji/title/全屏/双主题/教材锚点真伪/操作提示≥6字/预览新鲜度/交互绑定≥2类或≥5处（含原型文件绑定）/上手引导 |
| `test_interactives.mjs` | 双主题无头 harness：JS 零报错、场景断言、画布主体占比≥50%×40%、教研契约 v2（steps≥3、guide≥15字、note≥40字、quiz≥4且≥120字）、作答流程、同源断言 |
| `build_resource_previews.mjs` | 卡片实拍：无头 Chrome 截图 → 720w JPEG；**像素级空白检测**（色彩桶/方差）+ 4 次重试 + 副本垃圾自动清理 |
| `visual_gate.mjs` | 视觉三层：L1 双主题×首末帧取证 → L2 像素规则（非空白、双主题生效，stderr 分流）→ L3 目检册新鲜度（buildHash 过期即挡） |
| `verify.mjs` | 五阶段串行，一处不过即中止 |
| `textbook-index.mjs` | 教材目录数据库（人教/北师大/统编历史语文）+ `validateTextbookAnchor()`：假锚点进不了流程 |
| `new_interactive.mjs` | 脚手架：锚点先校验 → 生成薄壳代码 + spec + 教学设计表骨架 |
| `ship.mjs` | 一键发布：verify→build→deploy(代理)→字节验证(CDN 8s×2 重试+白名单)→commit/push 双端确认 |

### 资源本体（每个资源三件套）

```
src/interactives/<学科>/<slug>/index.mjs   薄壳：TEACHING 契约 + SPEC 参数 + 原型挂接
src/interactives/<学科>/<slug>/spec.json   原型参数（modes/readouts/labels/scenario/thermo）
src/content/resources/<学科>/<slug>.md     教学设计（book/unit 锚点、目标、易错、环节表、检测表、双版映射）
```

## 标准"发资料"工作流（三条命令）

```bash
node scripts/new_interactive.mjs math my-lesson --title "课题" --anchor "北师大版七上第二章《有理数及其运算》· 2.6" --archetype numberline
# 人工两件事：填 md 教学设计表；填 index.mjs 的 TEACHING/SPEC
node scripts/verify.mjs          # 不过就修，闸门信息会告诉你差什么
node scripts/ship.mjs "xx课上线"  # 到线上为止全自动
```

## 质量红线（为什么这么多闸门）

- 断网投屏 = 单文件零外链（G2），体积分档（2D 100KB/3D 1MB）
- 教学不是口号 = 环节用教材动词、锚点过数据库校验（G7+textbook-index）、quiz 带解析
- 数值不心算 = 读数与计算函数同源，selftest 强制断言
- 视觉不盲发 = 像素规则 + 目检册绑定构建哈希（改版必须重新目检）
- 发布不猜 = 线上逐文件字节级比对 + git 双端哈希一致

## 已知边界与路线

- 原型库目前只有 numberline；canvas-lab/solid3d/timeline/cardwall 待从现有资源抽取
- 资料层（PDF/照片 → 锚点+知识点半自动提取）未建
- Blender 资产层（试点：青铜鼎）在建：程序化建模 gen.py → GLB → base64 内嵌 → three.js PBR 渲染；本机 Blender 曾为空壳已触发重装
- 视觉模型依赖外部服务，不可用时以像素规则+结构断言放行，目检册如实标注
