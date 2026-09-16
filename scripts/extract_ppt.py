#!/usr/bin/env python3
"""从两份培训 PPT 提取图片素材。
用法: python3 scripts/extract_ppt.py <pptx路径> <输出目录前缀>
输出: assets/raw/<前缀>/s<三位页码>-<序号>.<ext>
跳过小于 120x120 的装饰性小图（logo/图标/分隔线）。
"""
import sys
import hashlib
from pathlib import Path
from pptx import Presentation
from pptx.util import Emu

MIN_W = 120
MIN_H = 120


def iter_pics(shapes):
    for s in shapes:
        if s.shape_type == 6:  # GROUP
            yield from iter_pics(s.shapes)
        elif s.shape_type == 13:  # PICTURE
            yield s


def main(pptx_path: str, out_prefix: str) -> None:
    prs = Presentation(pptx_path)
    out_dir = Path('assets/raw') / out_prefix
    out_dir.mkdir(parents=True, exist_ok=True)
    seen = set()
    count = 0
    for i, slide in enumerate(prs.slides, 1):
        for j, pic in enumerate(iter_pics(slide.shapes), 1):
            try:
                blob = pic.image.blob
                ext = pic.image.ext
            except Exception:
                continue
            # 跳过重复与极小图
            h = hashlib.md5(blob).hexdigest()
            if h in seen:
                continue
            try:
                w, h_px = pic.image.size
            except Exception:
                w, h_px = 999, 999
            if w < MIN_W or h_px < MIN_H:
                continue
            seen.add(h)
            # 优先用显示尺寸排序（大图通常是主截图）
            name = f's{i:03d}-{j:02d}.{ext}'
            (out_dir / name).write_bytes(blob)
            count += 1
    print(f'{out_prefix}: {count} images -> {out_dir}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
