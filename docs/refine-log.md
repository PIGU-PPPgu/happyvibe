# 精修循环档案（10 轮）

固定样本两件：**青铜鼎**（history-bronze，Blender GLB）与 **正方体展开图**（math-cube-nets，three.js 程序化）。每轮：改动 → 实拍截图存档 → 像素+视觉证据 → 记录分数与下一轮焦点。用户要求 loop 10 个回合，此文件是唯一轨迹记录，不得跳轮虚报。

| 轮 | 日期 | 样本 | 改动 | 证据 | 分数 | 下一轮焦点 |
|---|---|---|---|---|---|---|
| R1 | 2026-10-10 | 鼎 | Blender 便携版落地 ~/tools；纯 bmesh 程序化建模（回转鼎身/饕餮凸纹 displacement/三足二耳）→ GLB 666KB → base64 内嵌进单文件（1.5MB）；three.js GLTFLoader + RoomEnvironment 环境反射；青铜绿材质（金属 0.62/粗糙 0.5）；热点坐标适配 + 史实文案通用化 | docs/refine/ding-round1.png：鼎面均色 RGB(114,125,99)，偏绿像素 89%，实体占比 26%（构图饱满） | 6.5 | R2：光照三点布光+鼎身旋转展台；R3：噪声锈色烘焙成贴图（swap COLOR_0 方案废弃，改 Cycles bake 正规路） |

## 技术债（循环中消化）

- Blender glTF exporter 把非激活顶点色层排到 COLOR_1（three 只读 COLOR_0）——R1 用整体色绕开，R3 用贴图烘焙根治
- /Applications 的 Blender 装上即被系统清除——便携版 ~/tools/Blender.app 是长期解
- 正方体展开图样本尚未进入循环（R2 起与鼎并行）

## 规则

1. 每轮结束必须：截图存 docs/refine/、本表追加一行、分数趋势只升不降（降了要说明为什么接受了倒退）
2. 上线的轮次走 verify 五阶段 + ship；纯建模迭代的轮次可只存档不上线
3. 分数标准对标 WeduLab：6=可用，7.5=站内平均，8.5=当前强图水平，9+=可当门面
