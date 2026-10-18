# refine 循环截图：playwright chromium（无头 Chrome CLI 的合成器对 WebGL 拍出空帧）
# 用法：python3 scripts/refine_shot.py <资源名或路径> <输出.png> [宽] [高] [等待秒]
# 路径可以是 src/interactives/<学科>/<名>/index.mjs 的目录名，或 public/interactives/*.html 的名字
import sys, pathlib
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
name = args[0] if args else "history-bronze"
out = args[1] if len(args) > 1 else "/tmp/refine-shot.png"
vw, vh = int(args[2]) if len(args) > 2 else 1440, int(args[3]) if len(args) > 3 else 900
wait = float(args[4]) if len(args) > 4 else 4.0

root = pathlib.Path(__file__).resolve().parent.parent
cand = root / "public" / "interactives" / f"{name}.html"
url = cand.as_uri() if cand.exists() else pathlib.Path(name).resolve().as_uri()
if not cand.exists() and not name.startswith("/"):
    print(f"WARN {name} 未找到，按绝对路径处理")

errors = []
import glob, os
# 默认版本匹配失败时回退到缓存的 headless_shell（ms-playwright 缓存被别的工具动过时照样能跑）
FALLBACK = sorted(glob.glob(os.path.expanduser(
    "~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell")))[-1:]
with sync_playwright() as pw:
    try:
        b = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    except Exception:
        b = pw.chromium.launch(executable_path=FALLBACK[0],
                               args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=2)
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url + ("&" if "?" in url else "?") + "pv=1&embed=1", wait_until="load")
    pg.wait_for_timeout(int(wait * 1000))
    pg.screenshot(path=out)
    b.close()

from PIL import Image, ImageStat
from collections import Counter
im = Image.open(out); w, h = im.size
rgb = im.convert("RGB").crop((int(w * .2), int(h * .2), int(w * .8), int(h * .8)))
gray = im.convert("L").crop((int(w * .2), int(h * .2), int(w * .8), int(h * .8)))
c = Counter()
for p in list(rgb.getdata())[::7]:
    c[(p[0] // 40, p[1] // 40, p[2] // 40)] += 1
buckets, std = min(len(c), 999), round(ImageStat.Stat(gray).stddev[0], 1)
print(f"shot {out} {w}x{h} buckets={buckets} std={std}" + ("  [空白!]" if buckets < 8 and std < 8 else ""))
if errors:
    print("console errors:")
    for e in errors[:6]:
        print("  -", e[:160])
