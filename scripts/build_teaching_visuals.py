#!/usr/bin/env python3
"""教学图生成：① 模型能力×价格矩阵 ② 网页解剖图（源码↔页面对照）"""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path('public/images/lessons')
FONT_PATHS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']
MONO_PATHS = ['/System/Library/Fonts/Menlo.ttc', '/System/Library/Fonts/Monaco.dfont']


def font(size=28, mono=False):
    paths = MONO_PATHS if mono else FONT_PATHS
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


F = font(28)
FS = font(23)
FT = font(38)
FM = font(22, mono=True)
GOLD = (254, 179, 0)
PURPLE = (166, 61, 151)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
BG = (21, 14, 34)
GREEN = (126, 216, 138)
BLUE = (111, 179, 232)


def save(im, name):
    im.convert('RGB').save(OUT / name, quality=88)
    print('→', name)


# ① 模型能力 × 价格矩阵
def models_matrix():
    im = Image.new('RGB', (1240, 860), BG)
    d = ImageDraw.Draw(im)
    d.text((70, 36), 'WorkBuddy 货架上的「脑子」速查（倍率 ≈ 价格档，以实际为准）', font=font(32), fill=TXT)

    cols = ['模型', '价格档', '最擅长', '适合谁']
    rows = [
        ('Hy4 / Hy3', '限时免费', '日常问答 · 尝鲜', '所有人，先白嫖'),
        ('GLM-5.3-Flash', '0.06x 超低价', '快问快答 · 批量小任务', '高频使用者'),
        ('Deepseek-V4-Flash', '0.17x 夜间折扣', '长文档阅读 · 总结', '读材料、写综述'),
        ('MiniMax-M3', '0.25x', '通用任务 · 性价比', '日常办公'),
        ('Kimi-K2.6 / K2.7', '0.5x 左右', '写作 · 文件处理', '文字工作者'),
        ('GLM-5.2 / 5.3', '0.79x 订阅优先', '综合能力强', '主力脑子'),
        ('Kimi-K3', '1.62x', '写代码 · 看图 · 设计感', '做网站做课件'),
        ('Deepseek-V4-Pro', '0.51x 夜间折扣', '深度推理 · 复杂分析', '难题攻坚'),
        ('GLM-5v-Turbo', '0.71x（V=视觉）', '看图看表 · 图像理解', '有图的任务'),
    ]
    x0, y0 = 70, 110
    colw = [300, 230, 330, 300]
    rowh = 70
    # 表头
    cx = x0
    for i, c in enumerate(cols):
        d.rounded_rectangle((cx, y0, cx + colw[i] - 8, y0 + 52), 8, fill=(60, 45, 90))
        d.text((cx + 16, y0 + 10), c, font=FS, fill=GOLD)
        cx += colw[i]
    # 行
    for r, row in enumerate(rows):
        y = y0 + 64 + r * rowh
        if r % 2 == 0:
            d.rounded_rectangle((x0, y - 6, x0 + sum(colw) - 8, y + rowh - 14), 8, fill=(34, 24, 54))
        cx = x0
        for i, cell in enumerate(row):
            color = TXT if i == 0 else (GOLD if i == 1 else (GREEN if i == 2 else MUT))
            d.text((cx + 16, y + 14), cell, font=font(24 if i else 26), fill=color)
            cx += colw[i]
    d.text((70, 760), '倍率 = 干活时的积分计费系数：0.2x 打 2 折，1.6x 是 1.6 倍价。', font=FS, fill=MUT)
    d.text((70, 800), '选脑口诀：先免费 → 不行上中档 → 难题再上贵脑。看图任务认准「V」。', font=FS, fill=GOLD)
    save(im, 'models-matrix.png')


# ② 网页解剖图：左源码 / 右页面 / 连线标注
def anatomy():
    from PIL import Image as PImage
    shot = PImage.open('public/images/demos/fenceng.webp').convert('RGB')
    shot = shot.resize((560, int(shot.height * 560 / shot.width)))
    W = 1240
    H = max(760, shot.height + 120)
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((70, 36), '解剖一个网页：左边是「代码」，右边是「你看到的页面」', font=font(30), fill=TXT)

    # 左：源码面板
    code_lines = [
        ('<h1>分层作业</h1>', '页面大标题', (254, 179, 0)),
        ('', None, None),
        ('<div class="tier">', '一个「卡片板块」开始', (166, 61, 151)),
        ('  <h2>A · 基础巩固</h2>', '板块的小标题', (201, 143, 191)),
        ('  <ol>', '有序列表（1. 2. 3.）', (201, 143, 191)),
        ('    <li>第 1 题…</li>', '列表里的每一项', (169, 156, 192)),
        ('  </ol>', '', None),
        ('</div>', '板块结束', (166, 61, 151)),
        ('', None, None),
        ('button { 背景色: 金色 }', '样式：按钮长什么样', (254, 179, 0)),
        ('onclick="展开答案"', '行为：点击后做什么', (126, 216, 138)),
    ]
    d.rounded_rectangle((70, 100, 590, 100 + 34 * len(code_lines) + 40), 14, fill=(18, 12, 30),
                        outline=(166, 61, 151), width=2)
    d.text((90, 112), 'index.html（AI 写的代码）', font=font(22), fill=MUT)
    for i, (line, note, color) in enumerate(code_lines):
        y = 152 + i * 34
        if line:
            mono_ok = all(ord(ch) < 128 for ch in line)
            d.text((92, y), line, font=font(20, mono=mono_ok), fill=(220, 230, 240))
        if note:
            d.text((330, y), '← ' + note, font=font(19), fill=color)
    # 右：页面截图
    sx = 640
    sy = 100
    im.paste(shot, (sx, sy))
    d.rectangle((sx, sy, sx + 560, sy + shot.height), outline=(120, 100, 150), width=2)
    d.text((sx, 76), '浏览器打开 index.html = 你看到的页面', font=font(22), fill=MUT)
    # 底部结论
    d.rounded_rectangle((70, H - 90, W - 70, H - 30), 12, fill=(40, 30, 60), outline=GOLD, width=2)
    d.text((95, H - 74), 'HTML = 骨架（内容是什么）　CSS = 皮肤（长什么样）　JS = 动作（能做什么）', font=F, fill=(254, 216, 120))
    d.text((95, H - 118), '你不需要会写它们——你只需要看得懂「哪段管哪块」，然后让 AI 去改。', font=font(22), fill=MUT)
    save(im, 'anatomy.png')


models_matrix()
anatomy()
