#!/usr/bin/env python3
"""学科网站模板生成器：语文/数学/英语/科学 四套单文件 HTML 骨架。
老师（或 AI）从这套骨架开始改，比从零生成快且可控。
用法: python3 scripts/build_site_templates.py  → public/materials/site-templates.zip
"""
import zipfile
from pathlib import Path

OUT_DIR = Path('public/materials/_site-templates')
ZIP = Path('public/materials/site-templates.zip')

SUBJECTS = [
    dict(
        key='chinese', name='语文',
        theme='水墨书香', slogan='读经典 · 见众生',
        accent='#8c4a3c', accent2='#d8c8a8', bg='#faf7f0', ink='#2e2620',
        hero='每一篇课文，都是一个世界',
        sections=[
            ('课文精读', '把课文原文、朗读音频放在这里', 'md-anchor-book'),
            ('风采展示', '学生的读后感、书法、朗诵作品', 'md-pen'),
            ('互动专区', '名句填空、飞花令小游戏', 'md-chat'),
        ],
    ),
    dict(
        key='math', name='数学',
        theme='理性蓝', slogan='数形结合 · 万物皆数',
        accent='#1e5aa8', accent2='#9fc2e8', bg='#f5f8fc', ink='#1a2433',
        hero='把抽象的公式，变成看得见的图',
        sections=[
            ('知识图谱', '单元知识结构导图', 'md-grid'),
            ('典型例题', '例题 + 变式 + 交互演示', 'md-function'),
            ('挑战专区', '每日一题、错题闯关', 'md-flag'),
        ],
    ),
    dict(
        key='english', name='英语',
        theme='活力橙绿', slogan='Use it or lose it',
        accent='#0a8a6a', accent2='#ffd34d', bg='#f4fbf8', ink='#123328',
        hero='Speak it into life',
        sections=[
            ('Word Wall', '词汇卡 + 点读音频', 'md-volume'),
            ('Show Time', '学生配音、短剧作品', 'md-mic'),
            ('Game Zone', '图词配对、拼写挑战', 'md-joy'),
        ],
    ),
    dict(
        key='science', name='科学',
        theme='实验绿', slogan='观察 · 假设 · 验证',
        accent='#2e7d32', accent2='#a5d6a7', bg='#f4faf4', ink='#15301a',
        hero='每一个为什么，都值得动手试一次',
        sections=[
            ('实验工坊', '实验步骤 + 安全要点 + 模拟', 'md-flask'),
            ('观察日记', '学生的自然观察记录', 'md-eye'),
            ('问号墙', '学生提问 + 班级投票解答', 'md-help'),
        ],
    ),
]

TEMPLATE = '''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- ================================================= -->
<!-- 【学科网站模板 · {name}（{theme}）】               -->
<!-- 怎么用：                                           -->
<!--   1. 全局搜索「改」字，所有要替换的地方都有标记       -->
<!--   2. 把这整个文件发给 AI，说"按我的内容改"也行        -->
<!--   3. 改完双击用浏览器打开即可预览                    -->
<!-- ================================================= -->
<title>{name}学科站 · {slogan}</title>
<style>
  :root {{ --accent: {accent}; --accent2: {accent2}; --bg: {bg}; --ink: {ink}; }}
  * {{ margin: 0; box-sizing: border-box; }}
  body {{ font-family: 'PingFang SC','Microsoft YaHei',sans-serif; background: var(--bg); color: var(--ink); line-height: 1.8; }}
  header {{ background: var(--accent); color: #fff; padding: 14px 6%; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }}
  header .logo {{ font-size: 20px; font-weight: 700; letter-spacing: .1em; }}
  nav a {{ color: #ffffffcc; text-decoration: none; margin-right: 16px; font-size: 15px; }}
  nav a:hover {{ color: #fff; }}
  .hero {{ padding: 72px 6% 64px; text-align: center; background: linear-gradient(160deg, var(--accent2)33, var(--bg)); }}
  .hero h1 {{ font-size: clamp(30px, 5vw, 46px); color: var(--accent); margin-bottom: 14px; }}
  .hero p {{ font-size: 17px; color: var(--ink); opacity: .75; }}
  section {{ max-width: 960px; margin: 48px auto; padding: 0 5%; }}
  h2 {{ font-size: 24px; color: var(--accent); border-left: 5px solid var(--accent2); padding-left: 12px; margin-bottom: 18px; }}
  .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }}
  .card {{ background: #fff; border: 1px solid var(--accent2); border-radius: 12px; padding: 20px; }}
  .card h3 {{ color: var(--accent); margin-bottom: 8px; }}
  .card p {{ font-size: 14.5px; opacity: .8; }}
  .placeholder {{ border: 2px dashed var(--accent2); border-radius: 12px; padding: 36px 20px; text-align: center; color: var(--accent); opacity: .7; font-size: 14px; }}
  footer {{ text-align: center; padding: 28px; font-size: 13px; opacity: .6; border-top: 1px solid var(--accent2); }}
  @media (max-width: 600px) {{ .hero {{ padding: 48px 6%; }} }}
</style>
</head>
<body>
<header>
  <span class="logo">{name}学科站</span>
  <nav>
    <a href="#sec1">{sec1_title}</a>
    <a href="#sec2">{sec2_title}</a>
    <a href="#sec3">{sec3_title}</a>
  </nav>
</header>

<div class="hero">
  <!-- 改：主标题（你的学科口号） -->
  <h1>{hero}</h1>
  <!-- 改：副标题（一句话介绍这个站） -->
  <p>{slogan} —— 这里是{name}学科的班级学习站</p>
</div>

<section id="sec1">
  <h2>{sec1_title}</h2>
  <!-- 改：这一栏放{sec1_desc}。下面是占位样式，替换成你的内容 -->
  <div class="cards">
    <div class="card"><h3>条目一</h3><p>改：换成你的内容（文字/图片/音频都可以）</p></div>
    <div class="card"><h3>条目二</h3><p>改：换成你的内容</p></div>
    <div class="card"><h3>条目三</h3><p>改：换成你的内容</p></div>
  </div>
</section>

<section id="sec2">
  <h2>{sec2_title}</h2>
  <!-- 改：这一栏放{sec2_desc} -->
  <div class="placeholder">改：这里放学生作品（图片墙 / 作品卡片）</div>
</section>

<section id="sec3">
  <h2>{sec3_title}</h2>
  <!-- 改：这一栏放{sec3_desc}（可以让 AI 做成互动小游戏） -->
  <div class="placeholder">改：这里放互动内容（填空 / 配对 / 投票）</div>
</section>

<footer>
  改：XX学校 · XX老师 · {name}学科站
</footer>
</body>
</html>
'''

README = '''【学科网站模板 · 使用说明】

这个文件夹里有 4 套模板：
  chinese/index.html  语文（水墨书香）
  math/index.html     数学（理性蓝）
  english/index.html  英语（活力橙绿）
  science/index.html  科学（实验绿）

怎么用（三选一）：
  方法 A（最快）：双击打开 index.html 看效果 → 用文本编辑器打开 → 搜索「改」字逐个替换
  方法 B（推荐）：把整个文件夹拖进 WorkBuddy，说：
      "读取模板，按我的学科内容改：栏目一放……，栏目二放……"
  方法 C：跟着网站《任务一》七步走，每一步只改一个东西

提示：
  - 模板是单文件，无依赖，手机电脑都能打开
  - 想换配色：改文件顶部 :root 里的 --accent 等变量
  - 做好后整个文件夹发给学生/挂到班级群即可
'''


def main():
    import shutil
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    for subj in SUBJECTS:
        d = OUT_DIR / subj['key']
        d.mkdir(parents=True)
        s1, s2, s3 = subj['sections']
        html = (TEMPLATE
                .replace('{name}', subj['name'])
                .replace('{theme}', subj['theme'])
                .replace('{slogan}', subj['slogan'])
                .replace('{accent}', subj['accent'])
                .replace('{accent2}', subj['accent2'] + '" style="--x:{bg}')
                .replace('{bg}', subj['bg'])
                .replace('{ink}', subj['ink'])
                .replace('{hero}', subj['hero'])
                .replace('{sec1_title}', s1[0]).replace('{sec1_desc}', s1[1])
                .replace('{sec2_title}', s2[0]).replace('{sec2_desc}', s2[1])
                .replace('{sec3_title}', s3[0]).replace('{sec3_desc}', s3[1]))
        (d / 'index.html').write_text(html, encoding='utf-8')
    (OUT_DIR / 'README.txt').write_text(README, encoding='utf-8')

    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(OUT_DIR.rglob('*')):
            if p.is_file():
                z.write(p, p.relative_to(OUT_DIR))
    print('→', ZIP, ZIP.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
