// Cloudflare Pages Function: /api/analytics
// 代理查询 Cloudflare Web Analytics（GraphQL Analytics API）。
// 只读统计，Token 放在 Pages 环境变量 CF_ANALYTICS_TOKEN 里（wrangler pages secret put CF_ANALYTICS_TOKEN），
// 不出现在前端代码中；未配置时返回 503 unconfigured。
const ACCOUNT_ID = '3dd34aa042df8ac6edc8fbe8e4daa389';
const HOST = 'happyvibe.intelliedu.cc';
const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const F = (geq, leq) => `filter: {requestHost: "${HOST}", date_geq: "${geq}", date_leq: "${leq}"}`;

function reply(obj, status, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

export async function onRequestGet({ env, request }) {
  const token = env.CF_ANALYTICS_TOKEN;
  if (!token) {
    return reply({ ok: false, reason: 'unconfigured' }, 503, { 'Cache-Control': 'no-store' });
  }

  const days = new URL(request.url).searchParams.get('days') === '30' ? 30 : 7;
  const now = Date.now();
  const curStart = iso(now - (days - 1) * DAY);
  const curEnd = iso(now);
  const prevEnd = iso(now - days * DAY);
  const prevStart = iso(now - (2 * days - 1) * DAY);

  // hours 维度用于页面端还原「星期 × 小时」热力图和每日趋势（UTC，页面端换算北京时间）
  // 每行 n=浏览量、v=访问次数；v 落在访问开始的那个小时/页面/地区上
  const query = `query {
    viewer {
      accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {
        cur: rumPageloadEventsAdaptiveGroups(limit: 1, ${F(curStart, curEnd)}) { count sum { visits } }
        prev: rumPageloadEventsAdaptiveGroups(limit: 1, ${F(prevStart, prevEnd)}) { count sum { visits } }
        paths: rumPageloadEventsAdaptiveGroups(limit: 10, ${F(curStart, curEnd)}, orderBy: [count_DESC]) { dimensions { requestPath } count sum { visits } }
        countries: rumPageloadEventsAdaptiveGroups(limit: 12, ${F(curStart, curEnd)}, orderBy: [count_DESC]) { dimensions { countryName } count sum { visits } }
        hours: rumPageloadEventsAdaptiveGroups(limit: 800, ${F(curStart, curEnd)}) { dimensions { datetimeHour } count sum { visits } }
      }
    }
  }`;

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const j = await r.json();
    if (!j.data || j.errors) {
      return reply({ ok: false, reason: 'upstream', detail: j.errors?.[0]?.message || `HTTP ${r.status}` }, 502, { 'Cache-Control': 'no-store' });
    }
    const acc = j.data.viewer.accounts[0] || {};
    const one = (x) => (x && x[0]) || { count: 0, sum: { visits: 0 } };
    const cur = one(acc.cur);
    const prev = one(acc.prev);
    return reply(
      {
        ok: true,
        days,
        cur: { pv: cur.count, visits: cur.sum?.visits || 0 },
        prev: { pv: prev.count, visits: prev.sum?.visits || 0 },
        paths: (acc.paths || []).map((row) => ({ p: row.dimensions.requestPath, n: row.count, v: row.sum?.visits || 0 })),
        countries: (acc.countries || []).map((row) => ({ c: row.dimensions.countryName, n: row.count, v: row.sum?.visits || 0 })),
        hours: (acc.hours || []).map((row) => ({ h: row.dimensions.datetimeHour, n: row.count, v: row.sum?.visits || 0 })),
      },
      200,
      { 'Cache-Control': 'public, max-age=300' }
    );
  } catch {
    return reply({ ok: false, reason: 'fetch' }, 502, { 'Cache-Control': 'no-store' });
  }
}
