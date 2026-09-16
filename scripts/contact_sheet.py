#!/usr/bin/env python3
"""把目录里的图片拼成带文件名标签的触表单，便于批量审阅。
用法: python3 scripts/contact_sheet.py <输入目录> <输出png> [每格宽=460] [列数=3] [行数=4] [起=1] [止=99999]
输入文件名形如 p007.png 或 s007-02.png，按名称排序后分页。
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

try:
    FONT = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 22)
except Exception:
    FONT = ImageFont.load_default()

COLS = int(sys.argv[4]) if len(sys.argv) > 4 else 3
ROWS = int(sys.argv[5]) if len(sys.argv) > 5 else 4
START = int(sys.argv[6]) if len(sys.argv) > 6 else 1
END = int(sys.argv[7]) if len(sys.argv) > 7 else 99999


def main(src: str, out: str) -> None:
    tile_w = int(sys.argv[3]) if len(sys.argv) > 3 else 460
    files = sorted(
        p for p in Path(src).iterdir()
        if p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}
    )
    files = files[START - 1:END]
    per_sheet = COLS * ROWS
    label_h = 34
    tmp = Path('/tmp/hv_tiles')
    tmp.mkdir(exist_ok=True)

    for sheet_i in range(0, len(files), per_sheet):
        batch = files[sheet_i:sheet_i + per_sheet]
        tiles = []
        for f in batch:
            im = Image.open(f).convert('RGB')
            ratio = tile_w / im.width
            th = max(1, int(im.height * ratio))
            im = im.resize((tile_w, th))
            tiles.append((f.stem, im))
        row_heights = []
        for r in range(0, len(tiles), COLS):
            row_heights.append(max(t[1].height for t in tiles[r:r + COLS]) + label_h)
        W = COLS * (tile_w + 8) + 8
        H = sum(row_heights) + 8 * (len(row_heights) + 1)
        sheet = Image.new('RGB', (W, H), (18, 12, 30))
        draw = ImageDraw.Draw(sheet)
        y = 8
        for r, row_h in enumerate(row_heights):
            for c in range(COLS):
                idx = r * COLS + c
                if idx >= len(tiles):
                    break
                stem, im = tiles[idx]
                x = 8 + c * (tile_w + 8)
                draw.text((x + 2, y + 2), stem, fill=(255, 211, 77), font=FONT)
                sheet.paste(im, (x, y + label_h))
            y += row_h + 8
        out_path = out.replace('.png', f'-{sheet_i // per_sheet + 1}.png')
        sheet.save(out_path)
        print(out_path, sheet.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
