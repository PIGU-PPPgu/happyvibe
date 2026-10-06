// 资源共享运行时：主题、全屏、resize、教学面板（教研契约）、自测
const SELFTEST = new URLSearchParams(location.search).has('selftest');

export function init(opts) {
  const el = document.getElementById('stage');
  const param = new URLSearchParams(location.search).get('theme');
  let theme = param === 'light' || param === 'dark' ? param : 'dark';
  try {
    const saved = localStorage.getItem('hv-theme');
    if ((saved === 'light' || saved === 'dark') && !param) theme = saved;
  } catch (e) {}
  document.documentElement.dataset.theme = theme;

  if (SELFTEST) {
    const selfReport = { errors: [], checks: [], canvas: null, pedagogy: null };
    window.addEventListener('error', (e) => selfReport.errors.push(String(e.message).slice(0, 200)));
    window.addEventListener('unhandledrejection', (e) => selfReport.errors.push('rejection: ' + String(e.reason).slice(0, 200)));
    // 资源在 mount 过程中可通过 pushCheck 注入场景级断言
    window.__hvPushCheck = (name, pass, detail) => selfReport.checks.push({ name, pass, detail: String(detail ?? '') });
    setTimeout(() => {
      try { selfReport.canvas = sampleCanvas(); } catch (e) { selfReport.errors.push('canvas-sample: ' + e.message); }
      try { selfReport.pedagogy = samplePedagogy(); } catch (e) { selfReport.errors.push('pedagogy-sample: ' + e.message); }
      const pre = document.createElement('pre');
      pre.id = 'hv-selftest';
      pre.textContent = '__HV__' + JSON.stringify(selfReport) + '__HV__';
      document.body.appendChild(pre);
    }, 2500);
  }

  function samplePedagogy() {
    const txt = (sel) => {
      const el = document.querySelector(sel);
      return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    };
    const steps = [...document.querySelectorAll('[data-hv-step]')];
    const guide = txt('#guide');
    const summary = txt('#summary');
    // 「合计」语义：面板迁移后 DOM 只含激活环节的引导语，从 teaching 配置取全量求和
    const allGuides = teach && teach.steps ? teach.steps.map((s) => s.guide || '').join('') : guide;
    return {
      metaChars: txt('#meta').length,
      steps: steps.length,
      stepNames: steps.slice(0, 6).map((s) => s.textContent.trim()),
      guideCount: steps.length ? 1 : 0,
      guideChars: allGuides.length,
      summaryChars: summary.length,
    };
  }

  function sampleCanvas() {
    const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!cv) return null;
    const off = document.createElement('canvas');
    off.width = 360; off.height = 225;
    const c = off.getContext('2d');
    c.drawImage(cv, 0, 0, off.width, off.height);
    const d = c.getImageData(0, 0, off.width, off.height).data;
    // 3×3 区域灰阶方差（内容覆盖度）+ 前景主色 + 内容包围盒
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
        if (Math.abs(lum - bgLum) > 14) {
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

  // ---------- 教学面板（教研契约）：meta / 环节 / 引导 / 小结 ----------
  const teach = opts.teaching;
  if (teach && teach.steps && teach.steps.length) {
    el.classList.remove('pad');
    el.classList.add('pad2');
    const metaEl = document.getElementById('meta');
    metaEl.textContent = teach.meta || '';
    const teachBar = document.getElementById('teach');
    teachBar.hidden = false;
    const stepsEl = document.getElementById('steps');
    const guideEl = document.getElementById('guide');
    const stepBtns = teach.steps.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.dataset.hvStep = '';
      b.textContent = s.name;
      b.addEventListener('click', () => setStep(i));
      stepsEl.appendChild(b);
      return b;
    });
    function setStep(i) {
      stepBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      guideEl.textContent = teach.steps[i].guide || '';
      if (teach.steps[i].apply) teach.steps[i].apply();
    }
    // 首个环节的预设延迟到 mount 之后：资源场景对象在 mount 里才创建
    window.__hvApplyStep0 = () => setStep(0);
    const summaryEl = document.getElementById('summary');
    summaryEl.textContent = teach.summary || '';
    summaryEl.dataset.hvSummary = '';
    document.getElementById('summary-btn').addEventListener('click', () => {
      summaryEl.style.display = summaryEl.style.display === 'none' ? '' : 'none';
    });
  }

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
  if (window.__hvApplyStep0) window.__hvApplyStep0();
  return api;
}
