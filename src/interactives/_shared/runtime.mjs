// 资源共享运行时：主题（跟随站内 hv-theme 键与 ?theme= 参数）、全屏、resize
export function init(opts) {
  const el = document.getElementById('stage');
  const param = new URLSearchParams(location.search).get('theme');
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
  opts.mount(el, api);
  return api;
}
