#!/usr/bin/env python3
"""一小时培训 PPT 素材：流程轴/痛点页/三问页/四格拆解单/话术卡/结束页（1920x1080，直接当 PPT 一页用）"""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path('docs/ppt-素材')
FONT_PATHS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']
MONO_PATHS = ['/System/Library/Fonts/Menlo.ttc', '/System/Library/Fonts/Monaco.dfont']

GOLD = (254, 179, 0)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
BG = (21, 14, 34)
PANEL = (34, 24, 54)
PANEL2 = (60, 45, 90)
GREEN = (126, 216, 138)
PURPLE = (201, 143, 191)
RED = (240, 100, 100)


def font(size=28, mono=False):
    for p in (MONO_PATHS if mono else FONT_PATHS):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def page(name):
    im = Image.new('RGB', (1920, 1080), BG)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1920, 14), fill=GOLD)
    d.rectangle((0, 1040, 1920, 1080), fill=PANEL)
    d.text((80, 1054), 'HappyVibe 数智学园 · happyvibe.intelliedu.cc', font=font(30), fill=MUT)
    return im, d


def save(im, name):
    im.convert('RGB').save(OUT / name, quality=90)
    print('→', name)


def agenda():
    im, d = page('agenda')
    d.text((80, 90), '今天一小时', font=font(92), fill=GOLD)
    d.text((80, 230), '走的时候，你手里会多一个自己做的工具', font=font(48), fill=TXT)
    items = [
        ('05', '认痛点', '被哪条折磨过的举手', GOLD),
        ('05', '见作品', '这些都是一句话做出来的', TXT),
        ('10', '装 WorkBuddy', '全场唯一的软件，三分钟', TXT),
        ('30', '拆解实操', '把你的痛点拆成四格，当场做掉', GOLD),
        ('10', '出路', '路线图 · 挑战 · 比赛', TXT),
    ]
    x = 80
    for t, name, sub, color in items:
        d.rounded_rectangle((x, 420, x + 340, 800), 16, fill=PANEL, outline=(254, 179, 0, 50) if color == GOLD else None, width=3 if color == GOLD else 0)
        d.text((x + 30, 450), t, font=font(64, mono=True), fill=MUT)
        d.text((x + 100, 455), '分钟', font=font(30), fill=MUT)
        d.text((x + 30, 570), name, font=font(48), fill=color)
        d.text((x + 30, 660), sub, font=font(28), fill=MUT)
        if x + 340 < 1840:
            d.text((x + 350, 590), '→', font=font(44), fill=MUT)
        x += 370
    save(im, '素材1-流程时间轴.png')


def pains():
    im, d = page('pains')
    d.text((80, 90), '你每天被什么折磨', font=font(92), fill=GOLD)
    d.text((80, 230), '被哪条折磨过的，举个手——今天只解决你举手的那条', font=font(44), fill=TXT)
    items = [
        '几百份答题卡的错题统计，占两个晚上',
        '六个班的成绩表，合并一次一晚上',
        '期末 45 份评语 + 素质手册 + 家长会材料',
        '学生出事当晚，四份材料等你写',
        '排座位改一版，全班挪一次',
        '周记读完只会写「都挺好」，共性抓不出来',
    ]
    y = 340
    for i, it in enumerate(items):
        d.rounded_rectangle((80, y, 1840, y + 90), 10, fill=PANEL if i % 2 == 0 else (28, 20, 46))
        d.text((120, y + 22), str(i + 1), font=font(40, mono=True), fill=GOLD)
        d.text((200, y + 22), it, font=font(40), fill=TXT)
        y += 106
    save(im, '素材2-痛点举手页.png')


def threeq():
    im, d = page('threeq')
    d.text((80, 90), '什么活能交给 AI：三问', font=font(92), fill=GOLD)
    qs = [('大量重复？', '每学期都做，每次格式都一样'),
          ('有固定流程？', '有模板、有套路、有章可循'),
          ('要当面人情？', '要你的判断、分寸、眼睛看着眼睛')]
    x = 80
    for i, (q, sub) in enumerate(qs):
        c = GREEN if i < 2 else PURPLE
        d.rounded_rectangle((x, 330, x + 560, 660), 16, fill=PANEL, outline=c, width=4)
        d.text((x + 40, 380), q, font=font(60), fill=c)
        d.text((x + 40, 500), sub, font=font(34), fill=MUT)
        if i < 2:
            d.text((x + 580, 460), '是', font=font(48), fill=GREEN)
            d.text((x + 580, 540), '↓', font=font(48), fill=GREEN)
        else:
            d.text((x + 580, 460), '否', font=font(48), fill=PURPLE)
            d.text((x + 580, 540), '↓', font=font(48), fill=PURPLE)
        x += 640
    d.text((80, 740), '前两问「是」、第三问「否」→ 交出去', font=font(48), fill=GREEN)
    d.text((80, 820), '第三问「是」的活，永远留给自己', font=font(48), fill=PURPLE)
    save(im, '素材3-三问页.png')


def fourgrid():
    im, d = page('fourgrid')
    d.text((80, 80), '把痛点拆成四格', font=font(88), fill=GOLD)
    d.text((80, 210), '会聊天的人满街都是；能把事拆成四格的人，AI 才真正替他干活', font=font(42), fill=TXT)
    cells = [
        ('① 做什么', '写动词：我要「统计」「合并」\n「提炼」「生成」——不写名词', GOLD),
        ('② 输入什么', 'AI 要拿到的东西：\n成绩表 / 周记文字 / 名单', GREEN),
        ('③ 要什么输出', '你要拿到的东西：\n排序表 / 共性清单 / 话术文档', GREEN),
        ('④ 怎么验收', '抽哪个数、核哪句话\n——验收写进话术里', PURPLE),
    ]
    pos = [(80, 320), (990, 320), (80, 670), (990, 670)]
    for (t, sub, c), (x, y) in zip(cells, pos):
        d.rounded_rectangle((x, y, x + 850, y + 320), 16, fill=PANEL, outline=c, width=4)
        d.text((x + 40, y + 30), t, font=font(56), fill=c)
        for j, line in enumerate(sub.split('\n')):
            d.text((x + 40, y + 130 + j * 60), line, font=font(38), fill=TXT)
    d.text((80, 1010 - 60), '四格填完，把四句话连起来发给 AI——这就是话术', font=font(40), fill=GOLD)
    save(im, '素材4-四格拆解单.png')


def prompt_card():
    im, d = page('prompt')
    d.text((80, 80), '话术就长这样', font=font(88), fill=GOLD)
    d.text((80, 210), '四格连起来，抄进 WorkBuddy，改空格', font=font(42), fill=TXT)
    d.rounded_rectangle((80, 320, 1840, 900), 16, fill=(12, 8, 20), outline=GOLD, width=3)
    lines = [
        ('我每次要【统计六个班的成绩】，', GOLD),
        ('输入是【我发给你的这份数学月考成绩表】，', TXT),
        ('请帮我【算每个班的平均分和排名，标出退步超过10名的学生】，', TXT),
        ('输出【一张排序表】，', TXT),
        ('我用【随机抽3个学生的分数手动核对】来检查。', PURPLE),
        ('', TXT),
        ('（示例可换：提炼30篇周记共性 / 生成家长会讲稿 / 合并多表）', MUT),
    ]
    y = 380
    for text, color in lines:
        d.text((140, y), text, font=font(44, mono=True), fill=color)
        y += 80
    save(im, '素材5-话术模板卡.png')


def ending():
    im, d = page('ending')
    d.text((960 - d.textlength('AI 不一定非要呈现在面前', font=font(92)) / 2, 340), 'AI 不一定非要呈现在面前', font=font(92), fill=TXT)
    d.text((960 - d.textlength('也可以是在我们的身后', font=font(92)) / 2, 500), '也可以是在我们的身后', font=font(92), fill=GOLD)
    d.line((700, 680, 1220, 680), fill=MUT, width=2)
    d.text((960 - d.textlength('happyvibe.intelliedu.cc · 随时回看', font=font(40)) / 2, 720), 'happyvibe.intelliedu.cc · 随时回看', font=font(40), fill=MUT)
    save(im, '素材6-结束页.png')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    agenda()
    pains()
    threeq()
    fourgrid()
    prompt_card()
    ending()
    print('done')
