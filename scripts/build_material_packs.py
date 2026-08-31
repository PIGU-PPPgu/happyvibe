#!/usr/bin/env python3
"""学科材料包生成器。
读取 scripts/material_data.py 的 15 学科数据，为每个学科生成：
  public/materials/<slug>/
    ├── materials.txt   文字素材
    ├── 任务卡.txt       使用说明
    ├── 任务话术.txt     可直接发给 WorkBuddy 的第一句话
    ├── images/         程序绘制的学科示意图（+ GIF 动画）
    └── audio/          TTS 生成 / 合成的音频
  public/materials/<slug>-<name>.zip    打包下载
  public/materials/qr/<slug>.png        下载二维码
用法：
  python3 scripts/build_material_packs.py            # 全部生成
  python3 scripts/build_material_packs.py math music # 只生成指定学科
环境变量 MATERIALS_BASE_URL：二维码指向的站点根地址（默认 GitHub Pages 路径）
"""
import math
import os
import sys
import wave
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from material_data import SUBJECTS  # noqa: E402

ROOT = Path('public/materials')
QR_BASE = os.environ.get('MATERIALS_BASE_URL', 'https://pigupppgu.github.io/happyvibe/materials')

FONT_PATHS = [
    '/System/Library/Fonts/PingFang.ttc',
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
    '/System/Library/Fonts/STHeiti Light.ttc',
]


def font(size=30):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


F = font(32)
FS = font(24)


def save_img(im, path):
    im.convert('RGB').save(path, quality=90)


# ---------------- 示意图绘制 ----------------

def img_chinese(path):
    im = Image.new('RGB', (1200, 620), (18, 24, 58))
    d = ImageDraw.Draw(im)
    d.ellipse((900, 60, 1030, 190), fill=(250, 235, 160))
    d.rectangle((140, 300, 640, 570), outline=(210, 190, 120), width=7)
    d.line((390, 300, 390, 570), fill=(210, 190, 120), width=7)
    d.line((140, 435, 640, 435), fill=(210, 190, 120), width=7)
    for x in range(60, 1140, 110):
        d.point((x, 70 + x % 70), fill='white')
        d.point((x + 40, 120 + x % 50), fill=(230, 230, 245))
    d.text((700, 300), '床前明月光', font=font(44), fill=(240, 240, 225))
    d.text((700, 360), '疑是地上霜', font=font(44), fill=(240, 240, 225))
    d.text((700, 420), '举头望明月', font=font(44), fill=(240, 240, 225))
    d.text((700, 480), '低头思故乡', font=font(44), fill=(240, 240, 225))
    d.text((80, 40), '《静夜思》意境图', font=F, fill=(200, 200, 190))
    save_img(im, path)


def img_math(path):
    im = Image.new('RGB', (1200, 520), 'white')
    d = ImageDraw.Draw(im)
    d.text((100, 40), '相向而行 · 相遇问题线段图', font=F, fill='black')
    d.line((80, 280, 1120, 280), fill='black', width=4)
    for x in range(80, 1121, 80):
        d.line((x, 268, x, 292), fill='black', width=3)
    d.text((90, 300), '甲地', font=F, fill='black')
    d.text((1050, 300), '乙地', font=F, fill='black')
    d.ellipse((120, 230, 165, 275), fill=(216, 60, 120))
    d.ellipse((1035, 230, 1080, 275), fill=(40, 110, 200))
    d.text((100, 180), '甲：5 米/秒', font=font(28), fill=(216, 60, 120))
    d.text((950, 180), '乙：4 米/秒', font=font(28), fill=(40, 110, 200))
    d.text((500, 380), '900 米', font=font(36), fill='black')
    d.line((520, 360, 700, 360), fill='black', width=3)
    d.polygon([(700, 352), (700, 368), (718, 360)], fill='black')
    save_img(im, path)


def img_english(path):
    im = Image.new('RGB', (1200, 560), (255, 250, 240))
    d = ImageDraw.Draw(im)
    d.ellipse((420, 120, 640, 330), fill=(220, 60, 60))
    d.ellipse((445, 145, 560, 260), fill=(240, 120, 120))
    d.ellipse((600, 95, 660, 160), fill=(90, 160, 60))
    d.rectangle((618, 70, 638, 120), fill=(120, 80, 40))
    d.text((420, 370), 'apple  /ˈæpl/  n. 苹果', font=font(40), fill='black')
    d.text((330, 460), '单词卡示例（可替换为实物照片）', font=FS, fill=(150, 140, 130))
    save_img(im, path)


def img_physics(path):
    im = Image.new('RGB', (1200, 560), 'white')
    d = ImageDraw.Draw(im)
    d.line((0, 280, 1200, 280), fill=(190, 190, 190), width=2)
    d.ellipse((560, 100, 610, 460), outline=(60, 60, 200), width=7)
    d.line((585, 100, 585, 460), fill=(60, 60, 200), width=2)
    d.rectangle((230, 240, 280, 330), fill=(230, 150, 40))
    d.polygon([(230, 240), (280, 240), (255, 185)], fill=(230, 150, 40))
    d.rectangle((890, 255, 940, 315), outline=(200, 60, 60), width=5)
    d.polygon([(890, 255), (940, 255), (915, 212)], outline=(200, 60, 60), width=5)
    d.text((225, 350), '物', font=font(36), fill=(230, 150, 40))
    d.text((898, 350), '像', font=font(36), fill=(200, 60, 60))
    d.text((560, 480), 'f', font=font(36), fill=(60, 60, 200))
    d.text((120, 40), '凸透镜成像光路示意（u > 2f：倒立、缩小、实像）', font=F, fill='black')
    save_img(im, path)


def img_chemistry(path):
    im = Image.new('RGB', (1200, 560), 'white')
    d = ImageDraw.Draw(im)
    d.rectangle((520, 140, 620, 390), outline='black', width=6)
    d.line((500, 230, 470, 120), fill='black', width=5)
    d.rectangle((300, 420, 840, 460), fill=(150, 90, 60))
    d.ellipse((535, 330, 605, 388), fill=(90, 60, 140))
    d.polygon([(690, 460), (810, 460), (750, 380)], fill=(235, 170, 60))
    d.rectangle((720, 460, 780, 530), fill=(90, 90, 90))
    d.text((150, 60), '操作七字诀：查 → 装 → 定 → 点 → 收 → 离 → 熄', font=F, fill='black')
    d.text((150, 500), '高锰酸钾制氧气装置示意（试管口略向下倾斜）', font=FS, fill=(120, 120, 120))
    save_img(im, path)


def img_biology(path):
    im = Image.new('RGB', (1200, 640), (250, 248, 240))
    d = ImageDraw.Draw(im)
    d.ellipse((300, 90, 900, 560), outline=(90, 140, 70), width=10)
    d.ellipse((510, 240, 700, 410), fill=(120, 160, 220), outline=(70, 100, 160), width=6)
    d.ellipse((570, 295, 640, 360), fill=(70, 100, 180))
    for x, y in [(370, 170), (760, 160), (350, 450), (780, 440)]:
        d.ellipse((x, y, x + 58, y + 58), fill=(160, 200, 120))
    d.text((555, 305), '细胞核', font=FS, fill='white')
    d.text((120, 40), '植物细胞结构示意（细胞壁/细胞膜/细胞核/液泡…）', font=F, fill='black')
    save_img(im, path)


def img_science(path):
    im = Image.new('RGB', (1200, 640), (225, 242, 250))
    d = ImageDraw.Draw(im)
    d.ellipse((880, 50, 1000, 170), fill=(255, 210, 60))
    d.rectangle((0, 500, 1200, 640), fill=(70, 140, 200))
    d.ellipse((240, 110, 460, 180), fill='white')
    d.ellipse((370, 140, 580, 210), fill='white')
    d.polygon([(540, 360), (660, 360), (600, 260)], fill=(140, 110, 80))
    for y in range(510, 560, 14):
        d.arc((180, y, 420, y + 46), 180, 360, fill='white', width=4)
    d.text((70, 50), '蒸发 ↑', font=font(36), fill=(30, 90, 140))
    d.text((530, 230), '降水 ↓', font=font(36), fill=(30, 90, 140))
    d.text((80, 380), '水循环示意', font=font(40), fill=(30, 60, 120))
    save_img(im, path)


def img_geography(path):
    im = Image.new('RGB', (1200, 640), 'white')
    d = ImageDraw.Draw(im)
    temps = [16, 17, 20, 24, 27, 29, 30, 30, 29, 27, 23, 18]
    rains = [25, 45, 70, 120, 200, 290, 320, 360, 230, 80, 35, 25]
    ox, oy, w, h = 120, 540, 960, 440
    d.line((ox, oy, ox + w, oy), fill='black', width=3)
    d.line((ox, oy, ox, oy - h), fill='black', width=3)
    bw = 46
    for i in range(12):
        x = ox + 60 + i * 76
        rh = rains[i] / 360 * (h - 80)
        d.rectangle((x, oy - rh, x + bw, oy), fill=(90, 150, 220))
        d.text((x + 4, oy + 10), f'{i + 1}月', font=font(22), fill='black')
    pts = []
    for i, t in enumerate(temps):
        x = ox + 60 + i * 76 + bw // 2
        y = oy - t / 35 * (h - 80)
        pts.append((x, y))
    d.line(pts, fill=(230, 90, 60), width=6)
    for p in pts:
        d.ellipse((p[0] - 7, p[1] - 7, p[0] + 7, p[1] + 7), fill=(230, 90, 60))
    d.text((120, 40), '深圳气温（红线 ℃）与降水（蓝柱 mm）年变化', font=font(38), fill='black')
    d.text((120, 100), '读图结论：雨热同期 —— 亚热带季风气候', font=font(30), fill=(90, 90, 90))
    save_img(im, path)


def img_history(path):
    im = Image.new('RGB', (1200, 520), (248, 242, 230))
    d = ImageDraw.Draw(im)
    pts = [(140, 340), (360, 290), (580, 340), (800, 270), (1040, 220)]
    names = ['长安', '敦煌', '西域', '波斯', '罗马']
    d.line(pts, fill=(180, 120, 40), width=8)
    for (x, y), n in zip(pts, names):
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(160, 40, 40))
        d.text((x - 32, y + 24), n, font=F, fill='black')
    d.text((140, 70), '丝绸之路路线示意（汉代）', font=font(40), fill='black')
    d.text((140, 440), '长安 → 河西走廊 → 西域 → 中亚 → 欧洲', font=font(28), fill=(120, 90, 40))
    save_img(im, path)


def img_politics(path):
    im = Image.new('RGB', (1200, 560), 'white')
    d = ImageDraw.Draw(im)
    d.ellipse((460, 50, 740, 160), fill=(80, 130, 200))
    d.text((530, 85), '遇到冲突', font=font(38), fill='white')
    d.line((380, 190, 290, 280), fill='black', width=5)
    d.line((820, 190, 910, 280), fill='black', width=5)
    d.rounded_rectangle((140, 280, 480, 380), 14, fill=(235, 245, 240), outline=(90, 160, 120), width=4)
    d.rounded_rectangle((760, 280, 1100, 380), 14, fill=(250, 238, 235), outline=(200, 110, 90), width=4)
    d.text((205, 305), '✓ 冷静沟通 / 告诉老师', font=font(30), fill=(60, 120, 80))
    d.text((830, 305), '✗ 冲回去 / 忍气吞声', font=font(30), fill=(160, 60, 50))
    d.text((215, 400), '后果：问题解决，获得帮助', font=font(28), fill=(60, 120, 80))
    d.text((830, 400), '后果：矛盾升级，都可能受伤', font=font(28), fill=(160, 60, 50))
    d.text((140, 480), '情境选择 → 后果 分支图（课上让学生先选，再揭示）', font=font(28), fill=(130, 130, 130))
    save_img(im, path)


def img_music(path):
    im = Image.new('RGB', (1200, 460), 'white')
    d = ImageDraw.Draw(im)
    for i in range(5):
        y = 120 + i * 48
        d.line((100, y, 1100, y), fill='black', width=2)
    notes = [(170, 264), (270, 264), (370, 240), (470, 216), (570, 216),
             (670, 240), (770, 264), (870, 288), (970, 288)]
    for x, y in notes:
        d.ellipse((x - 19, y - 14, x + 19, y + 14), fill='black')
        d.line((x + 17, y, x + 17, y - 84), fill='black', width=5)
    d.text((110, 360), '《欢乐颂》主题片段（E E F G | G F E D）· 五线谱示意', font=font(30), fill='black')
    save_img(im, path)


def img_art(path):
    im = Image.new('RGB', (860, 860), 'white')
    d = ImageDraw.Draw(im)
    cx, cy, r = 430, 400, 290
    palette = [(228, 50, 50), (238, 126, 40), (245, 214, 60), (140, 200, 70),
               (60, 180, 170), (60, 110, 220), (120, 70, 200), (200, 60, 170),
               (228, 50, 50), (238, 126, 40), (245, 214, 60), (140, 200, 70)]
    for i, c in enumerate(palette[:12]):
        d.pieslice((cx - r, cy - r, cx + r, cy + r), start=i * 30 - 90, end=(i + 1) * 30 - 90, fill=c)
    d.ellipse((cx - 85, cy - 85, cx + 85, cy + 85), fill='white')
    d.text((cx - 72, cy - 24), '三原色', font=font(40), fill='black')
    d.text((cx - 58, cy + 22), '红 黄 蓝', font=font(30), fill=(90, 90, 90))
    d.text((210, 800), '十二色相环（红黄蓝三原色推演）', font=font(32), fill='black')
    save_img(im, path)


def img_pe(path):
    im = Image.new('RGB', (1200, 480), 'white')
    d = ImageDraw.Draw(im)
    poses = [(150, 300, -20), (580, 265, 10), (1010, 320, 40)]
    labels = ['① 预摆', '② 起跳', '③ 落地']
    for (x, y, ang), lab in zip(poses, labels):
        d.ellipse((x - 21, y - 106, x + 21, y - 64), fill='black')
        d.line((x, y - 64, x, y), fill='black', width=7)
        d.line((x, y - 48, x - 40 + ang, y - 12), fill='black', width=6)
        d.line((x, y - 48, x + 40 + ang, y - 12), fill='black', width=6)
        d.line((x, y, x - 28 + ang // 2, y + 72), fill='black', width=7)
        d.line((x, y, x + 28 + ang // 2, y + 72), fill='black', width=7)
        d.text((x - 46, y + 96), lab, font=F, fill='black')
    d.line((100, 410, 1100, 410), fill=(40, 130, 60), width=10)
    d.text((120, 40), '立定跳远动作分解（预摆 → 起跳 → 落地）', font=font(38), fill='black')
    save_img(im, path)


def img_it(path):
    im = Image.new('RGB', (1200, 560), (30, 30, 46))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((150, 120, 530, 270), 12, fill=(50, 60, 90), outline=(120, 200, 160), width=4)
    d.text((185, 170), 'age = 12', font=font(40), fill=(230, 230, 230))
    d.rounded_rectangle((680, 120, 1050, 270), 12, fill=(60, 45, 90), outline=(210, 140, 220), width=4)
    d.text((730, 140), 'age', font=font(36), fill=(230, 180, 240))
    d.text((830, 195), '12', font=font(46), fill=(240, 240, 240))
    d.line((530, 195, 680, 195), fill=(120, 200, 160), width=5)
    d.polygon([(680, 185), (680, 205), (702, 195)], fill=(120, 200, 160))
    d.text((545, 145), '赋值 =', font=font(30), fill=(120, 200, 160))
    d.text((150, 360), '变量就像一个贴了名字的盒子：age 这个盒子里装着 12', font=font(36), fill=(225, 225, 225))
    d.text((150, 430), 'age = age + 1 之后，盒子里就变成 13', font=font(28), fill=(160, 200, 190))
    save_img(im, path)


def img_labor(path):
    im = Image.new('RGB', (1200, 480), 'white')
    d = ImageDraw.Draw(im)
    steps = ['① 备料\n洗切', '② 热锅\n打蛋', '③ 下番茄\n翻炒', '④ 调味\n出锅']
    for i, s in enumerate(steps):
        x = 70 + i * 285
        d.rounded_rectangle((x, 120, x + 210, 300), 16, outline=(230, 120, 60), width=5)
        d.multiline_text((x + 45, 165), s, font=font(32), fill=(120, 70, 40), spacing=14)
        if i < 3:
            d.line((x + 215, 210, x + 280, 210), fill=(230, 120, 60), width=6)
            d.polygon([(x + 280, 198), (x + 280, 222), (x + 302, 210)], fill=(230, 120, 60))
    d.text((100, 390), '番茄炒蛋流程图（课堂让学生按步骤勾选打卡）', font=font(30), fill=(120, 90, 70))
    save_img(im, path)


IMG = {
    'chinese': img_chinese, 'math': img_math, 'english': img_english,
    'physics': img_physics, 'chemistry': img_chemistry, 'biology': img_biology,
    'science': img_science, 'geography': img_geography, 'history': img_history,
    'politics': img_politics, 'music': img_music, 'art': img_art,
    'pe': img_pe, 'it': img_it, 'labor': img_labor,
}
IMG_NAME = {
    'chinese': 'yijing.png', 'math': 'xiantu.png', 'english': 'apple-card.png',
    'physics': 'guanglu.png', 'chemistry': 'zhuangzhi.png', 'biology': 'xibao.png',
    'science': 'shuidaxunhuan.png', 'geography': 'qihou.png', 'history': 'luxian.png',
    'politics': 'fenchi.png', 'music': 'wuxianpu.png', 'art': 'sehuan.png',
    'pe': 'fenjie.png', 'it': 'hezi.png', 'labor': 'liucheng.png',
}


def gif_math(path):
    frames = []
    for i in range(30):
        t = i / 29
        im = Image.new('RGB', (760, 340), 'white')
        d = ImageDraw.Draw(im)
        d.line((50, 210, 710, 210), fill='black', width=4)
        d.text((56, 222), '甲地', font=FS, fill='black')
        d.text((640, 222), '乙地', font=FS, fill='black')
        x1 = 70 + int((330 - 70) * t * 1.25)
        x2 = 660 - int((660 - 430) * t)
        x1 = min(x1, 330)
        x2 = max(x2, 430)
        d.ellipse((x1, 165, x1 + 46, 211), fill=(216, 60, 120))
        d.ellipse((x2, 165, x2 + 46, 211), fill=(40, 110, 200))
        d.text((40, 50), f'甲走了 {t * 1.25 * 100:.0f} 米    乙走了 {t * 100:.0f} 米', font=font(28), fill='black')
        if i == 29:
            d.text((300, 250), '相遇！', font=font(40), fill=(200, 30, 30))
        frames.append(im)
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=120, loop=0)


def gif_physics(path):
    frames = []
    f = 100
    for i in range(30):
        u = 130 + i * 14
        im = Image.new('RGB', (760, 340), 'white')
        d = ImageDraw.Draw(im)
        d.line((0, 170, 760, 170), fill=(190, 190, 190), width=2)
        d.ellipse((370, 70, 394, 270), outline=(60, 60, 200), width=6)
        d.rectangle((u - 16, 140, u + 16, 200), fill=(230, 150, 40))
        if u > f:
            vx = 385 + (u - f) * 0.9
            vs = max(16, min(58, int(2400 / (u - f))))
            d.rectangle((vx - 13, 170 - vs // 2, vx + 13, 170 + vs // 2), outline=(200, 60, 60), width=4)
            d.text((vx - 12, 280), '像', font=FS, fill=(200, 60, 60))
        d.text((u - 18, 240), '物', font=FS, fill=(230, 150, 40))
        d.text((36, 24), f'物距 u={u}px（连续改变 u，观察像的大小与倒正）', font=font(24), fill='black')
        frames.append(im)
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=150, loop=0)


GIF_FUNCS = {'math': (gif_math, 'xiangyu.gif'), 'physics': (gif_physics, 'chengxiang.gif')}


# ---------------- 音频 ----------------

def tts(text, voice, out_mp3, rate=185):
    aiff = str(out_mp3).replace('.mp3', '.aiff')
    subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', aiff, text], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', aiff,
                    '-codec:a', 'libmp3lame', '-q:a', '4', str(out_mp3)], check=True)
    os.remove(aiff)


def synth_ode_to_joy(out_wav):
    notes = [('E4', .35), ('E4', .35), ('F4', .35), ('G4', .35), ('G4', .35), ('F4', .35),
             ('E4', .35), ('D4', .35), ('C4', .35), ('C4', .35), ('D4', .35), ('E4', .35),
             ('E4', .5), ('D4', .25), ('D4', .7)]
    freq = {'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.0}
    sr = 22050
    buf = bytearray()
    for n, dur in notes:
        f = freq[n]
        n_samples = int(sr * dur)
        for i in range(n_samples):
            t = i / sr
            env = min(1, i / 200, (n_samples - i) / 900)
            v = int(11000 * env * (math.sin(2 * math.pi * f * t) + 0.3 * math.sin(4 * math.pi * f * t)))
            buf += int(v).to_bytes(2, 'little', signed=True)
    with wave.open(str(out_wav), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(bytes(buf))


import subprocess  # noqa: E402


# ---------------- 组装 ----------------

def build_pack(s):
    slug = s['slug']
    d = ROOT / slug
    (d / 'images').mkdir(parents=True, exist_ok=True)
    (d / 'audio').mkdir(exist_ok=True)

    (d / 'materials.txt').write_text(s['text'], encoding='utf-8')

    card = (f'【学科材料包 · {s["name"]}】\n'
            f'任务：{s["task"]}\n\n'
            '【使用方法】\n'
            '1. 把整个文件夹（或 zip 解压后）拖进 WorkBuddy 输入框\n'
            '2. 打开 prompt.txt，复制里面的话发给它\n'
            '3. 按网站《学科课件任务》七步迭代法逐步完善\n\n'
            '【文件夹内容】\n'
            'README.txt     使用说明 + 文件夹内容清单\n'
            'materials.txt  本课文字素材（知识点/课文/题目）\n'
            'images/        示意图与动画（可直接用，也可替换为自己的图片）\n'
            'audio/         朗读/示范音频（TTS 合成，可替换真人录音）\n')
    (d / 'README.txt').write_text(card, encoding='utf-8')
    (d / 'prompt.txt').write_text(s['prompt'], encoding='utf-8')

    IMG[s['img_key']](d / 'images' / IMG_NAME[s['img_key']])
    if s['slug'] in GIF_FUNCS:
        gfn, gname = GIF_FUNCS[s['slug']]
        gfn(d / 'images' / gname)

    for fname, voice, rate, text in s.get('tts', []):
        tts(text, voice, d / 'audio' / fname, rate)
    if s.get('special_audio') == 'ode_to_joy':
        synth_ode_to_joy(d / 'audio' / 'ode-to-joy.wav')


def main():
    only = set(sys.argv[1:])
    ROOT.mkdir(parents=True, exist_ok=True)
    qr_dir = ROOT / 'qr'
    qr_dir.mkdir(exist_ok=True)
    import qrcode

    for s in SUBJECTS:
        if only and s['slug'] not in only and s['name'] not in only:
            continue
        print('··', s['name'], s['slug'])
        build_pack(s)
        zpath = ROOT / f'{s["slug"]}-{s["name"]}.zip'
        d = ROOT / s['slug']
        if zpath.exists():
            zpath.unlink()
        with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
            for p in sorted(d.rglob('*')):
                if p.is_file():
                    z.write(p, p.relative_to(d))
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(f'{QR_BASE}/{s["slug"]}-{s["name"]}.zip')
        qr.make(fit=True)
        qr.make_image(fill_color='black', back_color='white').save(qr_dir / f'{s["slug"]}.png')

    print(f'done: {ROOT}')


if __name__ == '__main__':
    main()
