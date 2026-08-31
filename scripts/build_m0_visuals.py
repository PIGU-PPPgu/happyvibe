#!/usr/bin/env python3
"""M0 认知入门 · 图文并茂素材生成器（紫金风格，深紫底金色线，两种主题下都可读）"""
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path('public/images/lessons')
FONT_PATHS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']


def font(size=30):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


F = font(30)
FS = font(24)
FT = font(40)
GOLD = (254, 179, 0)
PURPLE = (166, 61, 151)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
BG = (21, 14, 34)


def new(w=1200, h=520):
    im = Image.new('RGB', (w, h), BG)
    return im, ImageDraw.Draw(im)


def save(im, name):
    im.convert('RGB').save(OUT / name, quality=88)
    print('→', name)


# 1. AI 使用五阶段 · 失望曲线（GIF：曲线逐段延伸 + 标注渐显）
def five_stages_frames():
    W, H = 1200, 640
    pts_x = [90, 320, 550, 780, 1030]
    pts_y = [150, 210, 300, 400, 470]  # 先升后降的失望曲线
    labels = [
        ('① 神奇期', '什么都想试', GOLD),
        ('② 失望期', '回答不稳定', (230, 130, 190)),
        ('③ 疲惫期', '还得自己核对', (210, 130, 190)),
        ('④ 收缩期', '只用来写通知', (190, 120, 180)),
        ('⑤ 放弃期', '「AI 也就这样」', (150, 110, 150)),
    ]
    frames = []
    total_steps = 5
    for step in range(1, total_steps + 1):
        im, d = new(W, H)
        d.text((90, 40), 'AI 使用的五个阶段：大多数老师滑向第 5 步', font=font(34), fill=TXT)
        # 坐标轴
        d.line((80, 520, 1120, 520), fill=(120, 100, 150), width=3)
        d.line((80, 520, 80, 110), fill=(120, 100, 150), width=3)
        # 曲线（到 step 段，段内插值 8 个点）
        all_pts = []
        for seg in range(min(step, 4)):
            for k in range(9):
                tt = k / 8
                x = pts_x[seg] + (pts_x[seg + 1] - pts_x[seg]) * tt
                y = pts_y[seg] + (pts_y[seg + 1] - pts_y[seg]) * tt
                all_pts.append((x, y))
        all_pts.append((pts_x[min(step, 4)], pts_y[min(step, 4)]))
        d.line(all_pts, fill=GOLD, width=6)
        for p in all_pts[::8]:
            d.ellipse((p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6), fill=GOLD)
        # 已达阶段标注
        for seg in range(step):
            lx, ly, c = labels[seg]
            anchor_x = pts_x[seg] - 10
            d.text((anchor_x, pts_y[seg] - 66), lx, font=FS, fill=c)
            d.text((anchor_x, pts_y[seg] - 34), labels[seg][1], font=font(21), fill=MUT)
            d.ellipse((pts_x[seg] - 9, pts_y[seg] - 9, pts_x[seg] + 9, pts_y[seg] + 9), fill=c)
        # 当前阶段提示
        cur = labels[step - 1]
        d.text((760, 120), f'你在这里：{cur[0]}', font=F, fill=cur[2])
        frames.append(im)
    # 帧间重复末帧增强可读性
    seq = frames + [frames[-1]] * 2
    seq[0].save(OUT / 'five-stages.gif', save_all=True, append_images=seq[1:], duration=[900] + [520] * 4 + [1600, 900], loop=0)
    save(frames[-1], 'five-stages-cover.png')


# 2. 坏问 vs 好问 对比
def why_hard_compare():
    im, d = new(1200, 620)
    d.text((90, 40), '同一个需求，两种问法', font=font(36), fill=TXT)
    # 左：坏问
    d.rounded_rectangle((80, 120, 560, 300), 16, fill=(46, 26, 46), outline=(200, 90, 90), width=3)
    d.text((105, 145), '× 普通问法', font=F, fill=(230, 130, 130))
    d.text((105, 200), '帮我写个通知', font=FS, fill=(220, 200, 210))
    d.text((105, 250), '→ AI 只能瞎猜，产出一堆套话', font=font(21), fill=(180, 150, 160))
    # 右：好问
    d.rounded_rectangle((640, 120, 1120, 300), 16, fill=(26, 40, 34), outline=(90, 180, 120), width=3)
    d.text((665, 145), '√ 三句话问法', font=F, fill=(130, 220, 160))
    for i, line in enumerate(['【身份】你是经验丰富的班主任', '【任务】写一份秋游告家长书', '【要求】500 字内，亲切，含回执截止日']):
        d.text((665, 186 + i * 32), line, font=font(21), fill=(200, 230, 210))
    d.text((665, 288), '→ 一次到位，只微调', font=font(21), fill=(150, 190, 165))
    # 底部结论条
    d.rounded_rectangle((80, 360, 1120, 470), 16, fill=(40, 30, 60), outline=PURPLE, width=2)
    d.text((110, 385), '差别不在 AI，在表达：', font=F, fill=TXT)
    d.text((110, 425), '身份（它是谁） + 任务（做什么） + 要求（多长/语气/必须含什么）', font=FS, fill=(254, 179, 0))
    save(im, 'why-hard-compare.png')


# 3. Agent vs LLM：脑子 vs 完整的人
def agent_vs_llm():
    im, d = new(1200, 620)
    d.text((90, 40), 'LLM = 脑子　｜　Agent = 完整的人', font=font(36), fill=TXT)
    # 左：只有脑子
    d.rounded_rectangle((90, 130, 540, 540), 20, fill=(40, 30, 60), outline=(166, 61, 151), width=3)
    d.text((130, 160), '普通 AI 对话框', font=F, fill=(230, 200, 230))
    d.ellipse((250, 240, 380, 350), fill=(166, 61, 151))  # 脑子
    d.text((262, 275), '脑子', font=F, fill='white')
    d.text((130, 400), '只能「说」', font=F, fill=(254, 179, 0))
    d.text((130, 450), '你问一句 · 它答一句', font=FS, fill=MUT)
    # 右：完整的人
    d.rounded_rectangle((660, 130, 1110, 540), 20, fill=(30, 40, 34), outline=(254, 179, 0), width=3)
    d.text((700, 160), 'Agent 智能体', font=F, fill=(255, 230, 170))
    d.ellipse((800, 230, 900, 310), fill=(254, 179, 0))  # 头/脑
    d.text((815, 252), '脑', font=FS, fill='#2a1c00')
    d.line((850, 310, 850, 420), fill=(254, 179, 0), width=8)  # 身体
    d.line((850, 330, 770, 400), fill=(254, 179, 0), width=8)
    d.line((850, 330, 930, 400), fill=(254, 179, 0), width=8)
    d.line((850, 420, 790, 500), fill=(254, 179, 0), width=8)
    d.line((850, 420, 910, 500), fill=(254, 179, 0), width=8)
    d.text((700, 430), '有手有脚', font=F, fill=(254, 179, 0))
    d.text((700, 480), '能读文件 · 能执行 · 能交付', font=FS, fill=MUT)
    save(im, 'agent-vs-llm.png')


# 4. 什么时候值得用 AI：决策流程图
def when_to_use(path):
    im, d = new(1200, 640)
    d.text((90, 40), '一件事要不要交给 AI？三问决策图', font=font(36), fill=TXT)
    # 起点
    d.rounded_rectangle((430, 110, 770, 180), 14, fill=(60, 45, 90), outline=(254, 179, 0), width=3)
    d.text((480, 128), '手上有一件事', font=F, fill=TXT)
    # 三问
    qs = [
        ('是大量重复劳动吗？', '是 → 交给 AI', 250),
        ('有固定流程/模板吗？', '是 → 交给 AI', 350),
        ('需要教育判断/情感吗？', '是 → 留给自己', 450),
    ]
    for i, (q, a, y) in enumerate(qs):
        x = 130 + (i % 2) * 30
        d.rounded_rectangle((250, y, 700, y + 70), 12, fill=(40, 30, 60), outline=(166, 61, 151), width=2)
        d.text((280, y + 18), f'问{i + 1}：{q}', font=F, fill=TXT)
        d.text((730, y + 18), a, font=FS, fill=(254, 179, 0) if '交给' in a else (130, 220, 160))
        if i < 2:
            d.line((475, y + 70, 475, y + 100), fill=(120, 100, 150), width=3)
    d.line((250, 430, 200, 500), fill=(120, 100, 150), width=3)
    d.text((110, 510), '自己干，AI 打下手', font=F, fill=(130, 220, 160))
    d.text((730, 510), '原则：格式给 AI，判断留给自己', font=FS, fill=MUT)
    save(im, 'when-to-use.png')


if __name__ == '__main__':
    five_stages_frames()
    why_hard_compare()
    agent_vs_llm()
    when_to_use('unused')
    print('M0 visuals done')
