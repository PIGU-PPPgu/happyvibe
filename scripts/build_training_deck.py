#!/usr/bin/env python3
"""周五培训：教师课前清单（竖版手机图）+ 9 张投屏转场卡（1920x1080）"""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path('docs/slides')
FONT_PATHS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']
MONO_PATHS = ['/System/Library/Fonts/Menlo.ttc', '/System/Library/Fonts/Monaco.dfont']


def font(size=28, mono=False, bold=False):
    paths = MONO_PATHS if mono else FONT_PATHS
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


GOLD = (254, 179, 0)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
BG = (21, 14, 34)
PANEL = (34, 24, 54)
PANEL2 = (60, 45, 90)
GREEN = (126, 216, 138)
PURPLE = (201, 143, 191)

W, H = 1080, 1920


def wrap(d, x, y, text, f, fill, maxw):
    line = ''
    for ch in text:
        if d.textlength(line + ch, font=f) > maxw:
            d.text((x, y), line, font=f, fill=fill)
            y += f.size + 14
            line = ch
        else:
            line += ch
    if line:
        d.text((x, y), line, font=f, fill=fill)
    return y + f.size + 14


def checklist():
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 16), fill=GOLD)
    d.text((70, 70), '周五 AI 培训', font=font(66), fill=GOLD)
    d.text((70, 170), '课前准备清单', font=font(52), fill=TXT)
    d.text((70, 250), '两小时后，你手里会多一个自己做的课堂工具', font=font(34), fill=MUT)

    y = 340
    def block(title, items, color=GOLD):
        nonlocal y
        d.rounded_rectangle((70, y, W - 70, y + 66), 12, fill=PANEL2)
        d.text((100, y + 12), title, font=font(40), fill=color)
        y += 96
        for it in items:
            d.ellipse((95, y + 18, 115, y + 38), fill=color)
            y = wrap(d, 145, y, it, font(34), TXT, W - 260) + 16
        y += 30

    block('必须带', [
        '笔记本电脑 + 充电器（没有就提前说，跟邻座拼一台）',
        '手机（扫码进群、领材料、测试）',
    ])
    block('提前做 · 能省 15 分钟', [
        '浏览器用 Chrome 或 Edge',
        '打开学习站 → 第 1 课 → 跟着「三分钟装好」装好 WorkBuddy 并登录；装好的现场直接开工',
    ], color=GREEN)
    block('选带 · 现场用你的真数据', [
        '一份成绩表 Excel（姓名改成化名）',
        '两三段学生周记或作业文字（同样化名）',
        '带真材料的，现场第一单就干自己的活',
    ], color=PURPLE)
    block('心里有数', [
        '全程 2 小时，不用会代码，不用记笔记',
        '网站随时回看，右上角「教程」有导览',
        '现场提供网络，卡了有备用热点',
    ], color=MUT)

    d.rectangle((0, H - 90, W, H), fill=PANEL)
    d.text((70, H - 66), 'HappyVibe 数智学园 · happyvibe.intelliedu.cc', font=font(30), fill=MUT)
    im.convert('RGB').save(OUT / 'prep-checklist.png', quality=90)
    print('→ prep-checklist.png')


SLIDES = [
    ('00', '你每天被什么折磨', '先举手，对号入座——今天只解决你举手的那件事', '00:00-10'),
    ('01', '这些都是一句话做出来的', '太阳系、钢琴、会朗读的课文——散场前你也做一个', '10-20'),
    ('02', '全场唯一要装的软件', 'WorkBuddy，三分钟；装不上跟邻座拼一台', '20-35'),
    ('03', '第一单：三分钟干完一晚上的活', '话术照抄屏幕，结果当场验收——AI 干活，你核对', '35-60'),
    ('04', '领你学科的弹药包', '15 个学科材料包，扫码带走', '60-75'),
    ('05', '做一个明天就能用的东西', '点名器（零基础）或学科网站（进阶），二选一', '75-105'),
    ('06', '作品墙', '截图发群里，互相看看做出来的东西', '105-115'),
    ('07', '做完之后呢', '路线图七站 · 21 天挑战 · 比赛到 10 月 15 日截止', '115-120'),
    ('08', '加时：让全世界访问你的作品', '买台服务器交给 AI，一小时上线（自愿留下）', '加时 60 分钟'),
]


def slides():
    for num, title, sub, time in SLIDES:
        im = Image.new('RGB', (1920, 1080), BG)
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 1920, 14), fill=GOLD)
        d.text((110, 150), num, font=font(210, mono=True), fill=(60, 45, 90))
        d.text((110, 460), title, font=font(96), fill=GOLD if num != '05' else GOLD)
        wrap(d, 110, 640, sub, font(52), TXT, 1700)
        d.rectangle((0, 1000, 1920, 1080), fill=PANEL)
        d.text((110, 1028), f'{time}', font=font(36, mono=True), fill=GOLD)
        d.text((700, 1028), 'HappyVibe 数智学园', font=font(36), fill=MUT)
        d.text((1500, 1028), 'happyvibe.intelliedu.cc', font=font(36, mono=True), fill=MUT)
        im.convert('RGB').save(OUT / f'slide-{num}.png', quality=90)
        print(f'→ slide-{num}.png')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    checklist()
    slides()
    print('done')
