#!/usr/bin/env python3
"""部署课示意图：买服务器/控制台三要素/终端/防火墙/手机验证（紫金风格，红框标注）"""
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path('public/images/lessons')
FONT_PATHS = ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']
MONO_PATHS = ['/System/Library/Fonts/Menlo.ttc', '/System/Library/Fonts/Monaco.dfont']


def font(size=28, mono=False):
    for p in (MONO_PATHS if mono else FONT_PATHS):
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


GOLD = (254, 179, 0)
PURPLE = (166, 61, 151)
TXT = (242, 236, 248)
MUT = (169, 156, 192)
BG = (21, 14, 34)
PANEL = (34, 24, 54)
PANEL2 = (60, 45, 90)
GREEN = (126, 216, 138)
RED = (240, 100, 100)
TERM = (12, 8, 20)


def save(im, name):
    im.convert('RGB').save(OUT / name, quality=88)
    print('→', name)


def title(d, text, sub=None):
    d.text((70, 40), text, font=font(42), fill=TXT)
    if sub:
        d.text((70, 100), sub, font=font(28), fill=MUT)


def tip(d, y, text, color=GOLD):
    d.text((70, y), text, font=font(29), fill=color)


def redbox(d, box, label=None, label_pos='right', width=5):
    d.rounded_rectangle(box, 10, outline=RED, width=width)
    if label:
        lw = d.textlength(label, font=font(27)) + 24
        if label_pos == 'right':
            x, y = box[2] + 14, (box[1] + box[3]) // 2 - 18
        elif label_pos == 'left':
            x, y = box[0] - 14 - lw, (box[1] + box[3]) // 2 - 18
        else:  # top
            x, y = box[0], box[1] - 46
        d.rounded_rectangle((x, y, x + lw, y + 38), 8, fill=RED)
        d.text((x + 12, y + 5), label, font=font(27), fill=(20, 8, 8))


def arrow(d, start, end, label=None):
    d.line([start, end], fill=RED, width=5)
    # 箭头头
    import math
    ang = math.atan2(end[1] - start[1], end[0] - start[0])
    for da in (2.6, -2.6):
        d.line([end, (end[0] + 22 * math.cos(ang + da), end[1] + 22 * math.sin(ang + da))], fill=RED, width=5)
    if label:
        d.text(((start[0] + end[0]) / 2 + 10, (start[1] + end[1]) / 2 - 40), label, font=font(27), fill=RED)


# ① 购买页
def buy():
    im = Image.new('RGB', (1480, 950), BG)
    d = ImageDraw.Draw(im)
    title(d, '第一步：买一台轻量应用服务器', '腾讯云 / 阿里云搜索「轻量应用服务器」，四个选项照着选')
    items = [
        ('地域', '就近选（广州 / 上海）', '离得近，访问快', False),
        ('套餐', '2 核 2G 最低档', '新人价一般每年几十元', False),
        ('镜像', '系统镜像 · Ubuntu 22.04', '别选「应用镜像」——AI 最熟纯系统', True),
        ('时长', '先买 1 个月试水', '用得起来再续，别一次买一年', False),
    ]
    y = 170
    for name, val, note, hot in items:
        d.rounded_rectangle((70, y, 1410, y + 130), 14, fill=PANEL, outline=(254, 179, 0, 60) if not hot else GOLD, width=2 if not hot else 4)
        d.rounded_rectangle((100, y + 28, 300, y + 100), 10, fill=PANEL2)
        d.text((120, y + 44), name, font=font(33), fill=GOLD)
        d.text((330, y + 30), val, font=font(35), fill=TXT)
        d.text((330, y + 78), note, font=font(27), fill=MUT if not hot else RED)
        if hot:
            redbox(d, (84, y + 12, 1396, y + 118), '最容易选错的一格', 'top')
        y += 160
    tip(d, 860, '付款后你拿到三样东西：公网 IP（控制台首页）· 初始密码（站内信或自己重置）· 系统版本（就是 Ubuntu 22.04 这一句）')
    save(im, 'deploy-buy.png')


# ② 控制台三要素
def console():
    im = Image.new('RGB', (1480, 900), BG)
    d = ImageDraw.Draw(im)
    title(d, '买完先在控制台认三个地方', '云控制台首页（示意）——把这三样交给 AI 就够了')
    # 侧栏
    d.rounded_rectangle((70, 160, 380, 820), 12, fill=PANEL)
    d.text((110, 190), '概览', font=font(30), fill=TXT)
    for i, s in enumerate(['服务器', '快照', '防火墙', '域名']):
        yy = 260 + i * 70
        if s == '防火墙':
            d.rounded_rectangle((90, yy - 12, 360, yy + 44), 8, fill=(254, 179, 0, 40))
            d.text((120, yy), '· ' + s, font=font(29), fill=GOLD)
        else:
            d.text((120, yy), '· ' + s, font=font(29), fill=MUT)
    # 主区：服务器卡片
    d.rounded_rectangle((420, 160, 1410, 460), 12, fill=PANEL)
    d.text((460, 190), '我的服务器', font=font(32), fill=TXT)
    d.rounded_rectangle((460, 250, 900, 320), 8, fill=TERM)
    d.text((490, 264), 'IP  101.32.xx.xx', font=font(31, mono=True), fill=GREEN)
    redbox(d, (448, 238, 912, 332), '① 公网 IP，抄下来', 'top')
    d.rounded_rectangle((460, 360, 900, 430), 8, fill=(40, 28, 64))
    d.text((490, 374), '重置密码', font=font(31), fill=TXT)
    redbox(d, (448, 348, 912, 442), '② 先改成临时专用密码', 'right')
    # 防火墙标签
    d.rounded_rectangle((420, 500, 640, 560), 8, fill=(254, 179, 0, 50), outline=GOLD, width=3)
    d.text((455, 512), '防火墙', font=font(31), fill=GOLD)
    redbox(d, (408, 490, 652, 570), '③ 外网访问的开关在这', 'right')
    # 提示
    d.rounded_rectangle((700, 520, 1410, 700), 12, fill=(30, 20, 48))
    d.text((730, 545), '为什么先改临时密码？', font=font(30), fill=GOLD)
    d.text((730, 595), '给 AI 的密码部署完就作废，', font=font(28), fill=TXT)
    d.text((730, 635), '永远不要把你常用的任何密码交给 AI。', font=font(28), fill=TXT)
    tip(d, 780, '三样东西凑齐（IP · 临时密码 · Ubuntu 22.04），就可以进下一步：发话术给 AI。')
    save(im, 'deploy-console.png')


# ③ 终端
def ssh():
    im = Image.new('RGB', (1480, 980), BG)
    d = ImageDraw.Draw(im)
    title(d, 'AI 会让你打开「终端」，输一条命令登录', 'Mac：聚焦搜索输 terminal；Windows：输 cmd 或用 AI 推荐的工具')
    d.rounded_rectangle((70, 160, 1410, 700), 14, fill=TERM)
    # 终端标题栏
    d.rounded_rectangle((70, 160, 1410, 220), 14, fill=(40, 28, 64))
    for i, c in enumerate([(240, 100, 100), (254, 179, 0), (126, 216, 138)]):
        d.ellipse((100 + i * 36, 178, 122 + i * 36, 200), fill=c)
    d.text((220, 175), '终端 — ssh', font=font(26), fill=MUT)
    lines = [
        ('$ ssh root@101.32.xx.xx', GOLD),
        ('root@101.32.xx.xx 的密码：', TXT),
        ('（打字时屏幕不显示，是正常的，打完回车）', MUT),
        ('', TXT),
        ('Welcome to Ubuntu 22.04 LTS', GREEN),
        ('root@localhost:~# _', TXT),
    ]
    y = 250
    for text, color in lines:
        d.text((110, y), text, font=font(31, mono=True), fill=color)
        y += 62
    redbox(d, (95, 235, 660, 320), 'AI 给你的登录命令', 'right')
    tip(d, 740, '登录成功就长右边这样（Welcome + 闪烁光标）。之后 AI 给的每条命令都在这个黑窗口里输。', color=GOLD)
    tip(d, 790, '你的任务只有两件事：照输命令，把屏幕上出现的文字原样复制回给 AI。', color=TXT)
    tip(d, 860, '连不上？九成是防火墙没开 22 端口，或 IP 抄错一位——对着课里「常见坑」查。', color=RED)
    save(im, 'deploy-ssh.png')


# ④ 防火墙
def firewall():
    im = Image.new('RGB', (1480, 940), BG)
    d = ImageDraw.Draw(im)
    title(d, '最后一步：开门，让外面的人访问', '控制台 → 你的服务器 → 防火墙 / 安全组')
    # 页签
    d.rounded_rectangle((70, 160, 320, 220), 8, fill=PANEL2)
    d.text((120, 172), '概览', font=font(28), fill=MUT)
    d.rounded_rectangle((330, 160, 580, 220), 8, fill=(254, 179, 0, 50), outline=GOLD, width=3)
    d.text((380, 172), '防火墙', font=font(28), fill=GOLD)
    # 规则表
    d.rounded_rectangle((70, 250, 1410, 700), 12, fill=PANEL)
    cols = ['应用', '协议', '端口', '来源', '策略']
    colx = [110, 420, 610, 830, 1130]
    for c, x in zip(cols, colx):
        d.text((x, 280), c, font=font(27), fill=GOLD)
    rows = [
        ('SSH', 'TCP', '22', '你的 IP', '允许'),
        ('HTTP', 'TCP', '80', '0.0.0.0/0', '允许'),
        ('HTTPS', 'TCP', '443', '0.0.0.0/0', '允许'),
    ]
    y = 340
    for app, proto, port, src, policy in rows:
        hot = app == 'HTTP'
        if hot:
            d.rounded_rectangle((90, y - 12, 1390, y + 56), 8, fill=(254, 179, 0, 25))
        vals = [app, proto, port, src, policy]
        for v, x in zip(vals, colx):
            d.text((x, y), v, font=font(29, mono=('0.0.0.0/0' in v or v.isdigit())), fill=(GOLD if hot else TXT))
        y += 86
    redbox(d, (100, 330, 1390, 420), '网页就能访问的这条规则（端口 80）', 'top')
    # 添加规则按钮
    d.rounded_rectangle((70, 730, 380, 800), 10, fill=(254, 179, 0), outline=GOLD)
    d.text((110, 748), '＋ 添加规则', font=font(32), fill=(20, 12, 0))
    arrow(d, (420, 765), (900, 765), '端口填 80 · 协议 TCP · 来源 0.0.0.0/0（所有人）')
    tip(d, 850, '保存后马上验证：手机关掉 Wi-Fi 用流量，浏览器输 http://你的IP —— 出来就是上线了。')
    save(im, 'deploy-firewall.png')


# ⑤ 手机验证
def phone():
    im = Image.new('RGB', (1480, 860), BG)
    d = ImageDraw.Draw(im)
    title(d, '验证成功的样子', '手机 · 关掉 Wi-Fi · 用流量打开')
    # 手机
    d.rounded_rectangle((180, 150, 520, 780), 40, fill=TERM, outline=PANEL2, width=6)
    d.rounded_rectangle((300, 168, 400, 192), 12, fill=PANEL2)
    # 地址栏
    d.rounded_rectangle((205, 215, 495, 275), 16, fill=(30, 20, 48))
    d.text((222, 228), 'http://101.32.xx.xx', font=font(26, mono=True), fill=GREEN)
    # 页面内容（点名器示意）
    d.rounded_rectangle((215, 300, 485, 420), 12, fill=(60, 45, 90))
    d.text((250, 330), '三年二班 点名器', font=font(30), fill=TXT)
    d.rounded_rectangle((260, 390, 440, 440), 10, fill=GOLD)
    d.text((300, 400), '开始点名', font=font(27), fill=(20, 12, 0))
    d.text((240, 470), '王小雨', font=font(38), fill=GOLD)
    d.text((300, 540), '✓', font=font(60), fill=GREEN)
    # 标注
    redbox(d, (195, 205, 505, 285), '输入你的服务器 IP', 'right')
    arrow(d, (620, 400), (560, 400))
    d.text((660, 330), '这就是「上线」：', font=font(40), fill=TXT)
    d.text((660, 395), '不注册、不下载、不限内网——', font=font(32), fill=TXT)
    d.text((660, 445), '任何人输入这个网址就能用。', font=font(32), fill=TXT)
    d.rounded_rectangle((660, 520, 1400, 640), 12, fill=(30, 20, 48))
    d.text((690, 545), '想更好记？三件事：买域名 → 解析 A 记录指向 IP', font=font(28), fill=MUT)
    d.text((690, 590), '→ 国内需备案（约十天，期间先用 IP）', font=font(28), fill=MUT)
    tip(d, 750, '安全收尾：部署完立刻改掉临时密码；真实学生数据不上公网；用不到的端口全关。', color=RED)
    save(im, 'deploy-phone.png')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    buy()
    console()
    ssh()
    firewall()
    phone()
    print('done')
