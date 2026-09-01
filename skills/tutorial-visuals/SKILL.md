---
name: tutorial-visuals
description: HappyVibe 教程视觉生产流水线。当需要给课程配图、录操作 GIF、标注截图、写傻瓜式教程、或发布更新网站时使用。自动完成：截图 → 判断 GIF 还是静态标注 → 加工（聚焦放大/波纹/红框箭头/字幕条）→ 嵌入课程 → 部署验证。
---

# 教程视觉生产流水线（HappyVibe 标准）

目标：让一线老师「看得清、跟着点、学得会」。所有产出必须图文并茂、傻瓜式、无 emoji。

## 何时用本 Skill

- 用户说「给 X 课配图 / 录个操作 / 标注一下截图 / 写个教程 / 更新网站」
- 新增或修改 `src/content/` 下任何课程内容时
- 需要展示某个软件（WorkBuddy/Trae/任意应用）的操作流程时

## 第一步：判断形式（GIF 还是静态标注）

| 情况 | 形式 |
|---|---|
| 有**交互动作**（点击、输入、切换、拖拽，且动作顺序影响理解） | **录 GIF**：聚焦放大 → 波纹 → 拉回，每帧字幕条 |
| 只是**指位置**（点哪里、在哪一块、看哪个区域） | **静态截图 + 红框 + 箭头 + 标签** |
| 概念解释（对比、流程、分类） | **程序绘制示意图**（PIL/SVG，紫金风格，见规范） |
| 二者都有 | GIF 为主 + 静态标注图补充 |

## 第二步：采集素材

### 网页操作（本站或任何 web 页面）
用 Playwright 浏览器：导航 → 交互（evaluate/click）→ `page.screenshot` 逐帧存 `assets/demos/`。
- 有 canvas/rAF 持续重绘的页面，截图前先冻结：`window.requestAnimationFrame = () => 0`

### 桌面应用（WorkBuddy 等）
1. `open_application` 启动/激活应用
2. `list_windows` 拿 window_id
3. 操作：computer-use 的 AX 点击（无需前台）；键盘事件需应用在前台
4. 截图：`screencapture -x -l <window_id> -o frame.png`（窗口级，不拍到无关内容）
5. 元素精确坐标：`get_app_state detail=full` → bounds（屏幕点）；换算 retina：`(x)*2, (y-33)*2`（窗口原点 0,33）

### YouTube 视频
`yt-dlp --cookies-from-browser chrome`（需 deno：`brew install deno`；代理走系统 7897）。
压缩到 ≤24MB（Pages 单文件上限 25MB）：ffmpeg 两遍编码，录屏类 540p/168k 足够清晰。

## 第三步：加工（scripts/make_tutorial_gif.py）

```python
import sys; sys.path.insert(0, 'scripts')
from make_tutorial_gif import build, zoom_frame, full_frame, annotate, push_in_frames
```

- **GIF**：全景帧（聚焦框）→ 推近帧序列（渐进放大）→ 波纹帧 → 拉回全景帧；每帧字幕条（金色大字 + 灰色小字）
- **静态标注**：`annotate('截图.png', '输出.png', boxes=[红框坐标], notes=[(文字,位置)], arrow_from=(箭头起点))`
- 坐标从 `get_app_state detail=full` 的 bounds 读取，禁止凭感觉估

## 视觉规范（硬性）

- **字号就大不就小**：标题 ≥40px、正文 ≥29px、注释 ≥26px（投屏可读）
- **无 emoji**：用文字符号 ✓ ✗ ★ ← → ▶ ☀ ☾，其余用文字（「注意：」「来源：」）
- **配色**：紫金体系。深紫底 #150e22、主紫 #750F6D、金 #FEB300、成功绿 #7ed88a、警示红 #e262626
- **中文字体**：PingFang.ttc（含中文的行禁用纯英文字体，会变方框）
- **点击指示**：金色双圆环波纹 + 实心点（draw_click）
- **隐私**：真实学生姓名/成绩/照片一律不上线；演示用「学生A/化名/演示数据」

## 教程文字规范（傻瓜式）

- 每步精确到按钮：点哪里、打什么字、屏幕应出现什么、不对劲怎么办
- 话术用代码块给出可直接照抄
- 复杂任务用六要素：目标/输入/动作/约束/输出/验收
- 每课带验收清单；操作课必须配 GIF 或标注图
- 内容围绕两张图深化：六大应用方向（模块库）+ 成长路径（路线图）

## 第四步：嵌入与发布

1. 图片存 `public/images/lessons/`（webp，宽 ≤1100）；视频存 `public/videos/`（≤24MB，gitignore）
2. 课程 md 用 `![说明](/images/lessons/xxx.webp)` 嵌入；GIF 直接 img 引用
3. `npm run build` → 54+ 页无报错
4. `npx wrangler pages deploy dist --project-name=happyvibe`（需 CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID 环境变量）
5. **线上验证**：curl 正式页 URL 确认 200 且内容含新元素——本地构建 ≠ 上线
6. `git commit`

## 验收清单（缺一不交付）

- [ ] GIF 里能看到「点了哪里」（波纹+高亮），不只是结果画面
- [ ] 图内文字投屏可读
- [ ] 无 emoji；无真实学生信息
- [ ] 每个操作步骤都有「屏幕应出现什么」的描述
- [ ] 线上 URL 实测 200 且含新内容
