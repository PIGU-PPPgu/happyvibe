// 资源共享运行时：主题（跟随站内 hv-theme 键与 ?theme= 参数）、全屏、resize、自测
const SELFTEST = new URLSearchParams(location.search).has('selftest');

export function init(opts) {
  const el = document.getElementById('stage');
  const param = new URLSearchParams(location.search).get('theme');

  if (SELFTEST) {
    const report = { errors: [], checks: [], canvas: null };
    window.addEventListener('error', (e) => report.errors.push(String(e.message).slice(0, 200)));
    window.addEventListener('unhandledrejection', (e) => report.errors.push('rejection: ' + String(e.reason).slice(0, 200)));
    // 资源在 mount 过程中可通过 pushCheck 注入场景级断言
    window.__hvPushCheck = (name, pass, detail) => report.checks.push({ name, pass, detail: String(detail ?? '') });
    setTimeout(() => {
      try { report.canvas = sampleCanvas(); } catch (e) { report.errors.push('canvas-sample: ' + e.message); }
      const pre = document.createElement('pre');
      pre.id = 'hv-selftest';
      pre.textContent = '__HV__' + JSON.stringify(report) + '__HV__';
      document.body.appendChild(pre);
    }, 2500);
  }

  function sampleCanvas() {
    const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!cv) return null;
    const off = document.createElement('canvas');
    off.width = 360; off.height = 225;
    const c = off.getContext('2d');
    c.drawImage(cv, 0, 0, off.width, off.height);
    const d = c.getImageData(0, 0, off.width, off.height).data;
    // 3×3 区域灰阶方差（内容覆盖度）+ 前景主色
    const regions = [];
    const colors = new Map();
    for (let ry = 0; ry < 3; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        let sum = 0, sum2 = 0, n = 0;
        for (let y = ry * 75; y < (ry + 1) * 75; y += 3) {
          for (let x = rx * 120; x < (rx + 1) * 120; x += 3) {
            const i = (y * off.width + x) * 4;
            const g = (d[i] + d[i + 1] + d[i + 2]) / 3;
            sum += g; sum2 += g * g; n++;
            const k = ((d[i] >> 5) << 10) | ((d[i + 1] >> 5) << 5) | (d[i + 2] >> 5);
            colors.set(k, (colors.get(k) || 0) + 1);
          }
        }
        regions.push(Math.round(Math.sqrt(sum2 / n - (sum / n) ** 2)));
      }
    }
    const top = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k.toString(16), v]);
    // 内容包围盒：与背景色亮度差 >25 的像素范围（占整幅比例）
    const bgKey = [...colors.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const bgLum = (((bgKey >> 10) & 31) * 8 + ((bgKey >> 5) & 31) * 8 + ((bgKey & 31) * 8)) / 3;
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0, hit = 0;
    for (let y = 0; y < off.height; y += 2) {
      for (let x = 0; x < off.width; x += 2) {
        const i = (y * off.width + x) * 4;
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (Math.abs(lum - bgLum / 1) > 25) {
          hit++;
          const fx = x / off.width, fy = y / off.height;
          if (fx < x0) x0 = fx;
          if (fx > x1) x1 = fx;
          if (fy < y0) y0 = fy;
          if (fy > y1) y1 = fy;
        }
      }
    }
    const bbox = hit ? [round2(x0), round2(y0), round2(x1), round2(y1)] : null;
    return { regions, topColors: top, bbox };
  }
  function round2(v) { return Math.round(v * 100) / 100; }
  let theme = param === 'light' || param === 'dark' ? param : 'dark';
  try {
    const saved = localStorage.getItem('hv-theme');
    if ((saved === 'light' || saved === 'dark') && !param) theme = saved;
  } catch (e) {}
  document.documentElement.dataset.theme = theme;

  const api = { onTheme: null, onResize: null };
  document.getElementById('theme').addEventListener('click', () => {
    theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('hv-theme', theme); } catch (e) {}
    if (api.onTheme) api.onTheme(theme);
  });
  document.getElementById('fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });
  window.addEventListener('resize', () => { if (api.onResize) api.onResize(); });
  // 视口就绪晚于挂载（全屏切换/iframe/无头环境）时持续跟随舞台实际尺寸
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { if (api.onResize) api.onResize(); }).observe(el);
  }
  opts.mount(el, api);
  return api;
}
