#!/usr/bin/env python3
"""全模块补强视觉：选型决策图 / Skill 目录对照 / 迁移六概念图 / 演练文件夹结构图"""
import sys, os
sys.path.insert(0, 'scripts')
from PIL import Image, ImageDraw
import make_tutorial_gif as mtg

font = mtg.font
font = mtg.font
F = mtg.font(36)

def save(im, name):
    im.convert('RGB').save(OUT / name, quality=88)
    print('→', name)
FS = mtg.font(27)
F2 = mtg.font(29)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
GOLD = (254, 179, 0)
PURPLE = (166, 61, 151)
GREEN = (126, 216, 138)
BLUE = (111, 179, 232)
OUT = Path('public/images/lessons')
import pathlib
OUT = pathlib.Path('public/images/lessons')


def box(d, x, y, w, h, text, color, fill=(34, 24, 54), f=None, align='center'):
    d.rounded_rectangle((x, y, x + w, y + h), 12, fill=fill, outline=color, width=3)
    ff = f or F
    if align == 'center':
        d.text((x + w / 2, y + h / 2), text, font=ff, fill=TXT, anchor='mm')


def arrow(d, x1, y1, x2, y2, color=GOLD):
    d.line((x1, y1, x2, y2), fill=color, width=5)
    ang = math.atan2(y2 - y1, x2 - x1)
    d.polygon([(x2 - 16 * math.cos(ang - .5), y2 - 16 * math.sin(ang - .5)),
               (x2 - 16 * math.cos(ang + .5), y2 - 16 * math.sin(ang + .5)), (x2, y2)], fill=color)


import math

# ① 选型决策流程（M1 product-comparison / 横评怎么用）
def selection_flow():
    im = Image.new('RGB', (1400, 720), (21, 14, 34))
    d = ImageDraw.Draw(im)
    d.text((70, 40), '傻瓜三步选型：按「你主要干什么」选', font=font(38), fill=TXT)
    rows = [
        ('日常办公 · 教案公文 · Excel · 消息派单', 'WorkBuddy', '学校只推一款的首选', GOLD),
        ('教研 · 课题论文 · 长文档分析', 'Kimi Work', '教研科研首选', (201, 143, 191)),
        ('做网站 · 小程序 · 边改边预览', 'Trae', '工作坊骨干 / 信息科技教师', BLUE),
        ('批量自动化 · 校内系统集成', 'QoderWork / Harness', '自动化与信息中心首选', GREEN),
        ('只是问问题 · 改一段文字', '普通 AI 对话框', '杀鸡不用牛刀', (150, 140, 160)),
    ]
    y = 130
    for scene, prod, note, c in rows:
        d.rounded_rectangle((80, y, 780, y + 84), 12, fill=(34, 24, 54), outline=(120, 100, 150), width=2)
        d.text((110, y + 24), scene, font=FS, fill=TXT)
        arrow(d, 790, y + 42, 870, y + 42)
        d.rounded_rectangle((880, y, 1320, y + 84), 12, fill=(40, 30, 60), outline=c, width=4)
        d.text((910, y + 14), prod, font=F, fill=c)
        d.text((910, y + 52), note, font=font(21), fill=MUT)
        y += 108
    save(im, 'selection-flow.png')


# ② Skill 放哪里：三个 Agent 的技能目录对照
def skills_directory():
    im = Image.new('RGB', (1400, 760), (21, 14, 34))
    d = ImageDraw.Draw(im)
    d.text((70, 40), '同一个 SKILL.md，放进不同 Agent 的「技能口袋」', font=font(36), fill=TXT)
    d.text((70, 96), '技能文件就是纯文本 Markdown——复制、粘贴、即可用。这就是「会用一个 = 会用所有」。', font=FS, fill=MUT)
    cols = [
        ('WorkBuddy', '应用内「专家·技能」页直接启用\n或放入其技能目录', '新手首选，点点点就行', GOLD),
        ('Claude Code / ZCode', '项目里建 skills/ 文件夹\n放入 SKILL.md 即自动识别', '写代码做项目时用', (111, 179, 232)),
        ('Trae / 其他 Agent', '规则设置(Rules)里粘贴内容\n或按各自文档放技能目录', '同理迁移', GREEN),
    ]
    x = 70
    for name, how, note, c in cols:
        d.rounded_rectangle((x, 150, x + 410, 470), 16, fill=(34, 24, 54), outline=c, width=4)
        d.text((x + 26, 178), name, font=F, fill=c)
        d.text((x + 26, 240), how.split('\n')[0], font=font(22), fill=TXT)
        d.text((x + 26, 274), how.split('\n')[1], font=font(22), fill=TXT)
        d.text((x + 26, 330), '技能文件内容一模一样：', font=font(20), fill=MUT)
        d.rounded_rectangle((x + 26, 360, x + 384, 420), 8, fill=(18, 12, 30))
        d.text((x + 40, 372), 'SKILL.md', font=font(24, mono=True), fill=GOLD)
        d.text((x + 26, 432), note, font=font(20), fill=MUT)
        x += 445
    d.rounded_rectangle((70, 520, 1330, 700), 14, fill=(40, 30, 60), outline=GOLD, width=2)
    d.text((100, 545), '迁移三步（傻瓜版）：', font=F, fill=GOLD)
    d.text((100, 595), '① 在旧 Agent 里找到技能文件（一般在设置/技能页能导出）', font=font(25), fill=TXT)
    d.text((100, 635), '② 在新 Agent 里找到「技能/规则」入口 → 粘贴或上传同一份文件', font=font(25), fill=TXT)
    d.text((100, 668), '③ 发一句触发词测试 → 通过即迁移完成', font=font(25), fill=TXT)
    save(im, 'skills-directory.png')


# ③ 迁移六概念图
def transfer_map():
    im = Image.new('RGB', (1400, 640), (21, 14, 34))
    d = ImageDraw.Draw(im)
    d.text((70, 40), '任何桌面 Agent 都有这六个「部位」——认部位，不认品牌', font=font(34), fill=TXT)
    items = [
        ('任务 / 对话', '你下需求的地方', 'Session · Chat'),
        ('材料 / 工作空间', '喂给 AI 的文件夹', 'Workspace · 项目'),
        ('大脑 / 模型', '可替换，倍率即价格', 'Model · Provider'),
        ('权限', '自动干 or 每步问你', 'Approval · Auto-run'),
        ('技能 / 专家', '固化流程与角色', 'Skills · Rules · Agents'),
        ('产物', '交付文件，必验收', 'Artifacts · 输出'),
    ]
    x, y = 70, 130
    for i, (t, s, alt) in enumerate(items):
        d.rounded_rectangle((x, y, x + 400, y + 140), 16, fill=(34, 24, 54), outline=GOLD if i % 2 else PURPLE, width=3)
        d.text((x + 26, y + 22), t, font=F, fill=GOLD)
        d.text((x + 26, y + 72), s, font=font(22), fill=TXT)
        d.text((x + 26, y + 104), '别名：' + alt, font=font(19), fill=MUT)
        x += 440
        if (i + 1) % 3 == 0:
            x = 70
            y += 170
    d.text((70, 590), '换任何软件 = 把六个部位重新「认一遍门」。30 秒上手，剩下的你在 WorkBuddy 全练过。', font=font(27), fill=(254, 216, 120))
    save(im, 'transfer-map.png')


# ④ 演练文件夹结构（wb-03 第 1 步）
def folder_structure():
    im = Image.new('RGB', (1200, 560), (21, 14, 34))
    d = ImageDraw.Draw(im)
    d.text((70, 40), '先建好「演练文件夹」：练习文件都放这里，错了删掉重来', font=font(34), fill=TXT)
    tx = 100
    ty = 130
    rows = [
        ('桌面/', '', TXT),
        ('└─ workbuddy-练习/', '文件夹', GOLD),
        ('   ├─ 成绩.xlsx', '练习用的成绩表', TXT),
        ('   ├─ 周记/', '子文件夹：放 5-10 篇 txt', TXT),
        ('   └─ 成绩分析.xlsx', 'AI 产出的结果（自动生成）', GREEN),
    ]
    for text, note, c in rows:
        d.text((tx, ty), text, font=font(27, mono=True), fill=c)
        if note:
            d.text((620, ty + 2), '← ' + note, font=font(22), fill=MUT)
        ty += 56
    d.rounded_rectangle((70, 440, 1130, 520), 12, fill=(40, 30, 60), outline=GOLD, width=2)
    d.text((100, 462), '好处：练习和真实文件隔离；做坏了整文件夹删掉重来，零风险。', font=F, fill=(254, 216, 120))
    save(im, 'folder-structure.png')


selection_flow()
skills_directory()
transfer_map()
folder_structure()
print('all done')
