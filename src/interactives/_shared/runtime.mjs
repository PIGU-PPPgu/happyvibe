// 资源共享运行时：主题、全屏、resize、教学面板（教研契约：定位/环节/引导/讲解/小结）、随堂检测、键盘翻环节、自测
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
    const guide = txt('#g-tip');
    const summary = txt('#summary');
    // 「合计」语义：面板 DOM 只含激活环节的引导语/讲解，从 teaching 配置取全量求和
    const allGuides = teach && teach.steps ? teach.steps.map((s) => s.guide || '').join('') : guide;
    const allNotes = teach && teach.steps ? teach.steps.map((s) => s.note || '').join('') : '';
    const quiz = teach && teach.quiz ? teach.quiz : null;
    return {
      metaChars: txt('#meta').length,
      steps: steps.length,
      stepNames: steps.slice(0, 6).map((s) => s.textContent.trim()),
      guideCount: steps.length ? 1 : 0,
      guideChars: allGuides.length,
      guideLens: teach && teach.steps ? teach.steps.map((s) => (s.guide || '').length) : [],
      noteChars: allNotes.length,
      noteLens: teach && teach.steps ? teach.steps.map((s) => (s.note || '').length) : [],
      summaryChars: summary.length,
      quizCount: quiz ? quiz.length : 0,
      quizChars: quiz ? quiz.map((q) => (q.q || '') + (q.why || '')).join('').length : 0,
    };
  }

  function sampleCanvas() {
    const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * b.height)[0];
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
    // 内容包围盒：与背景色亮度差 >14 的像素范围（占整幅比例）
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

  // ---------- 教学面板（教研契约）：定位 / 环节 / 引导 / 讲解 / 小结 / 检测 ----------
  const teach = opts.teaching;
  const overlays = []; // Esc 逐个收起
  function toggleOverlay(node) {
    const open = node.style.display === 'none' || !node.style.display;
    closeOverlays();
    if (open) node.style.display = 'block';
    return open;
  }
  function closeOverlays() {
    for (const n of overlays) n.style.display = 'none';
    const tip = document.getElementById('guide-tip');
    if (tip) tip.classList.remove('dim');
  }

  if (teach && teach.steps && teach.steps.length) {
    const metaEl = document.getElementById('meta');
    metaEl.textContent = teach.meta || '';
    metaEl.dataset.hvMeta = '';
    const rail = document.getElementById('rail');
    rail.hidden = false;
    const headEl = document.getElementById('stage-head');
    headEl.hidden = false;
    const tipEl = document.getElementById('guide-tip');
    tipEl.hidden = false;
    const stepsEl = document.getElementById('steps');
    const guideEl = document.getElementById('g-tip');
    const progFill = document.querySelector('#rail-prog i');

    // 讲解弹层：每个环节一段知识讲解（WeduLab 章节内容的对应物）
    const noteEl = document.getElementById('note');
    const hasNotes = teach.steps.some((s) => s.note && String(s.note).trim());
    const noteBtn = document.getElementById('note-btn-top');
    if (hasNotes) {
      noteEl.dataset.hvNote = '';
      overlays.push(noteEl);
      noteBtn.hidden = false;
      noteBtn.addEventListener('click', () => {
      toggleOverlay(noteEl);
      tipEl.classList.toggle('dim', noteEl.style.display === 'block');
    });
    }

    const stepBtns = teach.steps.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail-step';
      b.dataset.hvStep = '';
      const no = document.createElement('b');
      no.className = 'no';
      no.textContent = String(i + 1).padStart(2, '0');
      b.appendChild(no);
      b.appendChild(document.createTextNode(' ' + s.name));
      b.addEventListener('click', () => setStep(i));
      stepsEl.appendChild(b);
      return b;
    });
    let cur = 0;
    function setStep(i, keepOverlays) {
      cur = Math.max(0, Math.min(teach.steps.length - 1, i));
      stepBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === cur)));
      guideEl.textContent = teach.steps[cur].guide || '';
      if (hasNotes) noteEl.textContent = teach.steps[cur].note || '';
      if (progFill) progFill.style.width = ((cur + 1) / teach.steps.length * 100) + '%';
      const frac = headEl.querySelector('.frac');
      if (frac) frac.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(teach.steps.length).padStart(2, '0');
      const sname = headEl.querySelector('.sname');
      if (sname) sname.textContent = teach.steps[cur].name || '';
      if (!keepOverlays) closeOverlays();
      if (teach.steps[cur].apply) teach.steps[cur].apply();
    }
    const prevBtn = document.getElementById('step-prev');
    const nextBtn = document.getElementById('step-next');
    prevBtn.hidden = false; nextBtn.hidden = false;
    prevBtn.addEventListener('click', () => setStep(cur - 1));
    nextBtn.addEventListener('click', () => setStep(cur + 1));
    // 首个环节的预设延迟到 mount 之后：资源场景对象在 mount 里才创建
    window.__hvApplyStep0 = () => setStep(0);
    const summaryEl = document.getElementById('summary');
    summaryEl.textContent = teach.summary || '';
    summaryEl.dataset.hvSummary = '';
    overlays.push(summaryEl);
    const sumBtn = document.getElementById('sum-btn-top');
    sumBtn.addEventListener('click', () => toggleOverlay(summaryEl));
    // 章节栏专项：检测 / 小结（教学流程的收口环节入列，WeduLab 08 随堂检测范式）
    const extra = document.getElementById('rail-extra');
    const mkExtra = (label, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail-step';
      const no = document.createElement('b');
      no.className = 'no';
      no.textContent = label.no;
      b.appendChild(no);
      b.appendChild(document.createTextNode(' ' + label.name));
      b.addEventListener('click', fn);
      extra.appendChild(b);
      return b;
    };

    // 键盘 ←/→ 翻环节（投屏讲解）；Esc 收起浮层
    window.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.getElementById('quiz-wrap').style.display === 'flex' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      if (e.key === 'ArrowRight') setStep(cur + 1);
      else if (e.key === 'ArrowLeft') setStep(cur - 1);
      else if (e.key === 'Escape') closeOverlays();
    });

    buildQuiz();
    const quizTop = document.getElementById('quiz-btn');
    if (!quizTop.hidden) mkExtra({ no: '◆', name: '随堂检测' }, () => quizTop.click());
    mkExtra({ no: '≡', name: '课堂小结' }, () => sumBtn.click());
  }

  // ---------- 随堂检测：逐题作答 + 解析 + 得分 ----------
  function buildQuiz() {
    const quiz = teach && teach.quiz;
    if (!quiz || !quiz.length) return;
    const wrap = document.getElementById('quiz-wrap');
    const prog = document.getElementById('quiz-prog');
    const qEl = document.getElementById('quiz-q');
    const optsEl = document.getElementById('quiz-opts');
    const whyEl = document.getElementById('quiz-why');
    const scoreEl = document.getElementById('quiz-score');
    const nextBtn = document.getElementById('quiz-next');
    const redoBtn = document.getElementById('quiz-redo');
    overlays.push(wrap);
    document.getElementById('quiz-btn').hidden = false;
    document.getElementById('quiz-btn').addEventListener('click', () => {
      const open = wrap.style.display !== 'flex';
      closeOverlays();
      if (open) wrap.style.display = 'flex';
    });
    document.getElementById('quiz-close').addEventListener('click', () => { wrap.style.display = 'none'; });
    let idx = 0, score = 0;
    const answered = new Array(quiz.length).fill(false);
    function renderQ() {
      const q = quiz[idx];
      nextBtn.hidden = true;
      redoBtn.hidden = true;
      whyEl.style.display = 'none';
      scoreEl.textContent = '';
      prog.textContent = `第 ${idx + 1} / ${quiz.length} 题`;
      qEl.textContent = q.q;
      qEl.dataset.hvQ = '';
      optsEl.textContent = '';
      q.opts.forEach((opt, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'qopt';
        b.textContent = String.fromCharCode(65 + k) + '. ' + opt;
        b.addEventListener('click', () => {
          if (answered[idx]) return;
          answered[idx] = true;
          const right = k === q.a;
          if (right) score++;
          [...optsEl.children].forEach((c, j) => {
            c.disabled = true;
            if (j === q.a) c.classList.add('ok');
            else if (j === k) c.classList.add('no');
          });
          whyEl.textContent = q.why || '';
          whyEl.style.display = 'block';
          scoreEl.textContent = right ? '答对了' : '答错了';
          if (idx < quiz.length - 1) nextBtn.hidden = false;
          else {
            redoBtn.hidden = false;
            scoreEl.textContent = `共 ${score} / ${quiz.length} 题答对`;
          }
        });
        optsEl.appendChild(b);
      });
    }
    nextBtn.addEventListener('click', () => { idx++; renderQ(); });
    redoBtn.addEventListener('click', () => {
      idx = 0; score = 0;
      answered.fill(false);
      renderQ();
    });
    wrap.style.display = 'none';
    renderQ();
    // 配置级自检：题目结构合法（缺项在这里暴露，harness 收集）
    if (SELFTEST && typeof window.__hvPushCheck === 'function') {
      const bad = [];
      quiz.forEach((q, i) => {
        if (!q.q || !Array.isArray(q.opts) || q.opts.length < 2) bad.push(`第${i + 1}题题干或选项缺失`);
        if (!Number.isInteger(q.a) || q.a < 0 || !q.opts || q.a >= q.opts.length) bad.push(`第${i + 1}题答案下标越界`);
        if (!q.why || q.why.length < 10) bad.push(`第${i + 1}题解析不足10字`);
      });
      if (quiz.length < 3) bad.push(`仅 ${quiz.length} 题，少于 3 题`);
      window.__hvPushCheck('quiz-valid', bad.length === 0, bad.join('；') || `${quiz.length} 题结构合法，均含题干、选项、答案与解析`);
      // 场景级：模拟作答第 1 题，解析必须真的显示出来（视觉级回归防线）
      wrap.style.display = 'flex';
      optsEl.children[0].click();
      const whyShown = getComputedStyle(whyEl).display !== 'none' && whyEl.getBoundingClientRect().height > 0;
      const feedback = scoreEl.textContent || '';
      const allDisabled = [...optsEl.children].every((c) => c.disabled);
      wrap.style.display = 'none';
      window.__hvPushCheck('quiz-answer-flow', whyShown && feedback.length > 0 && allDisabled,
        `作答后解析${whyShown ? '已显示' : '未显示'}，反馈「${feedback.slice(0, 12)}」，选项${allDisabled ? '已锁定' : '未锁定'}`);
    }
  }

  // 首次上手引导：只在正常访问且从未看过时出现（自测与预览截图一律抑制）
  const EMBED = new URLSearchParams(location.search).has('embed');
  if (EMBED) document.body.classList.add('embed');
  const ob = document.getElementById('onboard');
  if (ob && !SELFTEST && !EMBED && !new URLSearchParams(location.search).has('pv')) {
    let seen = false;
    try { seen = localStorage.getItem('hv-onboard') === '1'; } catch (e) {}
    if (!seen) {
      ob.hidden = false;
      const close = () => {
        ob.hidden = true;
        try { localStorage.setItem('hv-onboard', '1'); } catch (e) {}
      };
      document.getElementById('ob-ok').addEventListener('click', close);
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ob.hidden) close(); });
    }
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
  // 视觉取证用：?step=N 在挂载后切到指定环节（越界自动收敛到最后一个）
  const stepParam = new URLSearchParams(location.search).get('step');
  if (stepParam !== null && teach && teach.steps && teach.steps.length) {
    const n = Math.max(0, Math.min(teach.steps.length - 1, parseInt(stepParam, 10) || 0));
    const btns = [...document.querySelectorAll('[data-hv-step]')];
    if (btns[n]) btns[n].click();
  }
  return api;
}
