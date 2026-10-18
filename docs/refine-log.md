# 精修循环档案（10 轮）

固定样本两件：**青铜鼎**（history-bronze，Blender GLB）与 **正方体展开图**（math-cube-nets，three.js 程序化）。每轮：改动 → 实拍截图存档 → 像素+视觉证据 → 记录分数与下一轮焦点。用户要求 loop 10 个回合，此文件是唯一轨迹记录，不得跳轮虚报。

| 轮 | 日期 | 样本 | 改动 | 证据 | 分数 | 下一轮焦点 |
|---|---|---|---|---|---|---|
| R2 | 2026-10-15 | 鼎 | 视觉通道（analyze_image MCP）恢复后三轮闭环评审驱动。①形制：矩形立耳（rect_loop 方框管，耳 0.40×0.60×0.16 厚壁）、蹄形足（上粗下细）、腹径下移束颈放缓；②材质：弃顶点色（Blender COLOR_1 坑 + 735KB 超闸门），改页面端 CanvasTexture 双贴图——彩色图（绿锈底+三段纹带：颈回纹/腹兽面/下弦纹，柱面 UV 环绕 4 次）+ 灰度浮雕图（bumpScale 1.2），耳单独素面防纹带挤成迷宫；金属度 0.6→0.25（锈层非金属，0.6 会被 envMap 洗成银白）；③光影：三点布光（主光投影 1024 shadow map + 补光 + 轮廓光）+ 地面 ShadowMaterial + 径向渐变接触暗斑（不依赖 shadow map 的保底）；④构图：鼎下移 0.22、相机收进地面。附带修死两个管线 bug：promoteColor0 多跳 8 字节吞掉 BIN 头（RangeError）、无头 Chrome 合成器拍 WebGL 全空 → playwright swiftshader 截图脚本（scripts/refine_shot.py）成为 refine 循环标准取证工具 | 三轮 analyze_image：6→6→7/10，门面位 facade_ok=true；青铜绿/三段纹带/落地感全 true；docs/refine/ding-round2.png；闸门 27/27 + harness 自测 PASS | 7 | R3：耳口沿接缝感、兽面辨识度再提升、足身过渡+阴影偏弱（视觉评审遗留 top3）；正方体样本入循环 |
| R1.5 | 2026-10-10 | 鼎 | 用户抓到形状错误（三足悬空飘在鼎外、鼎身直筒不垂腹）。重写回转 profile（圜底 0.46→垂腹 0.97@中下→束颈 0.75→撇口 0.81），足心 1.30→0.80 贴圜底加长嵌入，耳贴口沿。新增世界坐标几何质检（垂直/水平相交判定 + ASCII 侧影），不靠眼也能抓脱接 | 几何判定双双相交 ✓；ASCII 轮廓标准鼎形；docs/refine/ding-round1b.png | 7（形状对，质感待 R2/R3） | R2 三点布光+展台；R3 锈色贴图 |
| R1 | 2026-10-10 | 鼎 | Blender 便携版落地 ~/tools；纯 bmesh 程序化建模（回转鼎身/饕餮凸纹 displacement/三足二耳）→ GLB 666KB → base64 内嵌进单文件（1.5MB）；three.js GLTFLoader + RoomEnvironment 环境反射；青铜绿材质（金属 0.62/粗糙 0.5）；热点坐标适配 + 史实文案通用化 | docs/refine/ding-round1.png：鼎面均色 RGB(114,125,99)，偏绿像素 89%，实体占比 26%（构图饱满） | 6.5 | R2：光照三点布光+鼎身旋转展台；R3：噪声锈色烘焙成贴图（swap COLOR_0 方案废弃，改 Cycles bake 正规路） |

## skill 验收案例（wedulab-craft v1.0）

| 案例 | 日期 | 资源 | skill 配方应用 | 证据 | 分数轨迹 |
|---|---|---|---|---|---|
| S1 | 2026-10-18 | 截一个几何体（bsuex-7a-1-3-section，北师大七上 1.3） | 同源截面计算（逐面裁剪→闭合环→鞋带面积，ε 探测过顶点退化）；自研着色器×2（截面 cap 菲涅尔边缘金 + 分层星空双高斯闪烁）；HUD 仪器读数；引线注释锚定截面质心带避让；磨砂白瓷主体+径向渐变深空+接触暗斑；双语排版/唯一强调色/预设即知识点 | docs/refine/section-round1.png；analyze_image 四轮 6→7→7.5→8（82% WeduLab）；自测 6 组同源断言 PASS | 8（ship_ok=true） |

## 技术债（循环中消化）

- ~~Blender glTF exporter 把非激活顶点色层排到 COLOR_1（three 只读 COLOR_0）~~——R2 已根治：GLB 不再带顶点色，改页面端 CanvasTexture（build_interactives 的 promoteColor0 保留给未来需要顶点色的资产）
- /Applications 的 Blender 装上即被系统清除——便携版 ~/tools/Blender.app 是长期解
- 无头 Chrome CLI 合成器拍 WebGL 全空帧（Invalid mailbox）——refine_shot.py（playwright + swiftshader）是解，预览脚本仍用 CLI（非 WebGL 资源无碍）
- 正方体展开图样本尚未进入循环（R3 起与鼎并行）
- headless Blender 的 matrix_world 惰性求值：几何质检前必须 view_layer.update()

## 规则

1. 每轮结束必须：截图存 docs/refine/、本表追加一行、分数趋势只升不降（降了要说明为什么接受了倒退）
2. 上线的轮次走 verify 五阶段 + ship；纯建模迭代的轮次可只存档不上线
3. 分数标准对标 WeduLab：6=可用，7.5=站内平均，8.5=当前强图水平，9+=可当门面
