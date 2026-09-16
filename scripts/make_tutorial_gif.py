#!/usr/bin/env python3
"""教程 GIF 加工器：全景帧 → 聚焦放大 + 高亮框 + 点击波纹 + 字幕条。
用法示例见文件底部 main()。坐标用 CSS 屏幕点，脚本内换算 retina。
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

A = Path('assets/demos')
OUT = Path('public/images/demos')
WIN_ORIGIN = (0, 33)   # WorkBuddy 窗口左上角（屏幕点）
SCALE = 2              # retina


def font(size=34, mono=False):
    paths = ['/System/Library/Fonts/Menlo.ttc'] if mono else \
            ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/Hiragino Sans GB.ttc']
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


FCAP = font(38)
FNOTE = font(26)


def css_to_px(v, is_x=True):
    """CSS 屏幕点 → 窗口 retina 像素"""
    x0, y0 = WIN_ORIGIN
    return (int(v * SCALE)) if is_x else (int((v - y0) * SCALE))


def zoom_crop(im, rect_css, out_w=1280):
    """裁剪 zoom 区域并放大到输出宽度。rect_css=(x,y,w,h) 屏幕点。"""
    x, y, w, h = rect_css
    px = (css_to_px(x), css_to_px(y), css_to_px(x + w), css_to_px(y + h))
    crop = im.crop(px)
    return crop.resize((out_w, int(crop.height * out_w / crop.width)))


def draw_click(im, cx, cy, color=(254, 179, 0)):
    """在 (cx,cy) 画点击波纹 + 实心点（im 内像素坐标）"""
    d = ImageDraw.Draw(im, 'RGBA')
    r = 46
    for rr, alpha in [(r, 200), (int(r * 0.62), 230)]:
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=color + (alpha,), width=7)
    d.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), fill=color + (255,))


def draw_focus_box(im, rect_px, color=(254, 179, 0)):
    """目标区域画金色圆角高亮框"""
    d = ImageDraw.Draw(im, 'RGBA')
    x0, y0, x1, y1 = rect_px
    pad = 10
    d.rounded_rectangle((x0 - pad, y0 - pad, x1 + pad, y1 + pad), 14,
                        outline=color + (235,), width=6)
    d.rounded_rectangle((x0 - pad, y0 - pad, x1 + pad, y1 + pad), 14,
                        fill=color + (36,))


def caption_frame(im, cap_main, cap_sub=None):
    bar = 150 if cap_sub else 108
    canvas = Image.new('RGB', (im.width, im.height + bar), (21, 14, 34))
    canvas.paste(im.convert('RGB'), (0, bar))
    d = ImageDraw.Draw(canvas)
    d.text((36, 24), cap_main, font=FCAP, fill=(254, 179, 0))
    if cap_sub:
        d.text((36, 86), cap_sub, font=FNOTE, fill=(169, 156, 192))
    return canvas


def build(frames, out, durations):
    """frames: 已处理好的 PIL 帧序列; durations 与帧等长"""
    frames[0].save(OUT / out, save_all=True, append_images=frames[1:], duration=durations, loop=0)
    print('→', OUT / out, (OUT / out).stat().st_size // 1024, 'KB')


def zoom_frame(src_png, zoom_rect_css, click_css, cap_main, cap_sub=None, out_w=1280):
    im = Image.open(A / src_png).convert('RGB')
    big = zoom_crop(im, zoom_rect_css, out_w)
    # click 点换算到放大图坐标
    cx = (css_to_px(click_css[0]) - css_to_px(zoom_rect_css[0])) * out_w / (css_to_px(zoom_rect_css[2]) - css_to_px(zoom_rect_css[0]))
    cy = (css_to_px(click_css[1], False) - css_to_px(zoom_rect_css[1], False)) * big.height / (css_to_px(zoom_rect_css[3], False) - css_to_px(zoom_rect_css[1], False))
    draw_click(big, int(cx), int(cy))
    return caption_frame(big, cap_main, cap_sub)


def full_frame(src_png, cap_main, cap_sub=None, focus_rect_css=None, click_css=None):
    im = Image.open(A / src_png).convert('RGB')
    if focus_rect_css:
        x, y, w, h = focus_rect_css
        rect_px = (css_to_px(x), css_to_px(y), css_to_px(x + w), css_to_px(y + h))
        draw_focus_box(im, rect_px)
    if click_css:
        cx, cy = css_to_px(click_css[0]), css_to_px(click_css[1], False)
        draw_click(im, cx, cy)
    return caption_frame(im, cap_main, cap_sub)


# ============ v2：放大镜推近-波纹-拉回 & 红框箭头标注 ============

def push_in_frames(src_png, target_css, steps=(1.0, 0.55, 0.3), click_css=None):
    """从全景渐进推近到目标区域，返回推近帧序列（不含波纹）。target_css=(x,y,w,h)"""
    im = Image.open(A / src_png).convert('RGB')
    W, H = im.size
    tx, ty, tw, th = target_css
    tx, ty = tx * SCALE, (ty - WIN_ORIGIN[1]) * SCALE
    tw, th = tw * SCALE, th * SCALE
    cx, cy = tx + tw / 2, ty + th / 2
    frames = []
    for s in steps:
        vw, vh = W * s, H * s
        # 目标中心尽量居中，但裁剪框不超出画布
        x0 = min(max(cx - vw / 2, 0), W - vw)
        y0 = min(max(cy - vh / 2, 0), H - vh)
        crop = im.crop((int(x0), int(y0), int(x0 + vw), int(y0 + vh)))
        crop = crop.resize((1280, int(crop.height * 1280 / crop.width)))
        frames.append(crop)
    return frames


def ripple_on(im, click_css):
    """在图上画点击波纹（css 坐标 → 图内像素按比例）"""
    im = im.convert('RGB')
    W, H = im.size
    cx, cy = click_css[0] * SCALE, (click_css[1] - WIN_ORIGIN[1]) * SCALE
    # 若是推近帧，坐标不在原图尺度——调用方应先换算。此处按「图=原图等比」处理
    draw_click(im, int(cx * W / 3024) if W < 3024 else int(cx), int(cy * H / 1898) if H < 1898 else int(cy))
    return im


def annotate(src_png, out_name, boxes, notes=None, arrow_from=None):
    """静态图标注：红框 + 箭头 + 标签。
    boxes: [(x0,y0,x1,y1)] 图内像素；notes: [(文字, 文字左上角)]；arrow_from: (x,y) 箭头起点→指向最后一个框"""
    src = Path('public/images/lessons') / src_png if not (A / src_png).exists() else A / src_png
    im = Image.open(src).convert('RGB')
    d = ImageDraw.Draw(im, 'RGBA')
    RED = (226, 61, 61)
    for b in boxes:
        x0, y0, x1, y1 = b
        d.rounded_rectangle((x0 - 6, y0 - 6, x1 + 6, y1 + 6), 10, outline=RED + (255,), width=6)
    if arrow_from:
        tx = boxes[-1][0] - 10
        ty = (boxes[-1][1] + boxes[-1][3]) // 2
        d.line([arrow_from, (tx, ty)], fill=RED + (255,), width=7)
        d.polygon([(tx - 4, ty - 14), (tx - 4, ty + 14), (tx + 26, ty)], fill=RED + (255,))
    if notes:
        for text, pos in notes:
            d.text(pos, text, font=font(30), fill=RED + (255,))
    im.convert('RGB').save(OUT / out_name, quality=88)
