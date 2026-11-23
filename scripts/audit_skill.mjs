// 技能静态审查（只读）：node scripts/audit_skill.mjs <技能目录> [--json <输出文件>]
// 把目录里的文件当纯文本读，不执行任何文件。
// 输出：文件清单、SKILL.md 概况、构成、许可证识别、外部域名、风险模式命中（文件与行号）、学生信息线索。
// 风险模式命中只是线索，是不是问题由通读全部文件的人来判断。
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, extname, basename, relative, resolve } from 'node:path';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
if (!dir) {
  console.error('用法：node scripts/audit_skill.mjs <技能目录> [--json <输出文件>]');
  process.exit(2);
}
const ROOT = resolve(dir);
const jsonIdx = args.indexOf('--json');
const jsonOut = jsonIdx >= 0 ? args[jsonIdx + 1] : null;

const CODE = new Set(['.py', '.sh', '.js', '.mjs', '.cjs', '.ts', '.ps1', '.bat']);
const TEXT = new Set([...CODE, '.md', '.json', '.yaml', '.yml', '.toml', '.html', '.css', '.txt', '.xml', '.csv']);
const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', '.venv']);

/** 风险模式。编号用于评测档案里引用。 */
const RISK = [
  { id: 'R1', name: '联网下载 curl/wget', re: /\b(curl|wget)\b/i },
  { id: 'R2', name: '网络请求', re: /\b(fetch\(|requests\.(get|post|put|delete)|urllib|httpx|axios|XMLHttpRequest|WebSocket|socket\.|urlopen|urllib3|http\.request|\.urlopen)/ },
  { id: 'R3', name: '删除文件或目录', re: /(\brm\s+-rf|\brmdir\b|rimraf|unlink\(|os\.remove|shutil\.rmtree|Remove-Item|\bfs\.(unlink|rm|rmSync|rmdir|rmdirSync)\b)/ },
  { id: 'R4', name: '动态执行或起子进程', re: /(\beval\(|\bexec\(|execSync|spawn\(|subprocess|child_process|os\.system|os\.popen)/ },
  { id: 'R5', name: '编码或混淆', re: /(base64|atob\(|btoa\(|fromhex|fromCharcode|\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2})/i },
  { id: 'R6', name: '触碰凭据与敏感路径', re: /(~\/\.(ssh|aws|gnupg|kube|docker)|\.env\b|\.npmrc|\.netrc|id_rsa|\.git-credentials|cookies?\.sqlite|keychain|Login Data|credentials\.json)/i },
  { id: 'R7', name: '索取密钥', re: /((api[_-]?key|secret[_-]?key|access[_-]?token|password)\s*[:=]|需要.{0,8}(API\s*Key|密钥)|require[sd]?\s+.{0,20}(API\s*key|token))/i },
  { id: 'R8', name: '提权', re: /\b(sudo|chmod\s+777|chown\s+-R|setuid)\b/ },
  { id: 'R9', name: '隐藏指令痕迹', re: /(ignore (all |any )?(previous|prior|above) instructions|disregard (the )?above|you are now|忽略(之前|上面|以上|先前).{0,6}(指令|要求|设定)|无视.{0,6}(指令|规则))/i },
];

/** 学生信息线索：出现不等于有问题，但要写进评测档案的「放心用」依据。 */
const STUDENT_DATA = [
  { id: 'S1', name: '保存到记忆或档案文件', re: /(MEMORY\.md|USER\.md|SOUL\.md|memory\/|\.workbuddy\/memory|learner[_-]?profile|student[_-]?profile)/i },
  { id: 'S2', name: '提到学生姓名、成绩、学号', re: /(学生姓名|真实姓名|孩子的姓名|学号|成绩单|考试卷|作业照片)/ },
];

const walk = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.DS_Store') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
};

const files = walk(ROOT);
const rel = (p) => relative(ROOT, p);
const skillMd = files.find((f) => basename(f) === 'SKILL.md' && rel(f) === 'SKILL.md');

// ---- SKILL.md 概况 ----
const FM_KEYS = ['name', 'description', 'license', 'compatibility', 'version', 'allowed-tools', 'author'];
let fm = {};
let skillLines = 0;
if (skillMd) {
  const text = readFileSync(skillMd, 'utf8');
  skillLines = text.split('\n').length;
  const parsed = parseFrontmatter(text).data;
  for (const key of FM_KEYS) {
    const v = parsed[key];
    fm[key] = v == null ? null : String(v).replace(/\s+/g, ' ').trim();
  }
}

// ---- 构成 ----
const code = files.filter((f) => CODE.has(extname(f)));
const extras = files.filter((f) => f !== skillMd);
const composition = code.length ? 'scripts' : extras.length ? 'resources' : 'prompt';

// ---- 许可证 ----
const licenseFile = files.find((f) => /^(LICENSE|LICENCE|NOTICE)(\.[A-Za-z]+)?$/i.test(basename(f)));

// ---- 风险模式、外部域名、学生信息线索 ----
const hits = [];
const hosts = new Map();
const studentHints = [];
for (const f of files) {
  if (!TEXT.has(extname(f))) continue;
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/https?:\/\/[^\s"'<>`)\\]+/g)) {
      try {
        const h = new URL(m[0]).hostname;
        hosts.set(h, (hosts.get(h) || 0) + 1);
      } catch {}
    }
    for (const r of RISK) {
      if (r.re.test(line)) hits.push({ id: r.id, name: r.name, file: rel(f), line: i + 1, text: line.trim().slice(0, 160) });
    }
    for (const s of STUDENT_DATA) {
      if (s.re.test(line)) studentHints.push({ id: s.id, name: s.name, file: rel(f), line: i + 1, text: line.trim().slice(0, 160) });
    }
  });
}

const bytes = files.reduce((s, f) => s + statSync(f).size, 0);
const report = {
  dir: ROOT,
  files: files.map((f) => ({ path: rel(f), bytes: statSync(f).size })).sort((a, b) => a.path.localeCompare(b.path)),
  totalBytes: bytes,
  skillMd: skillMd
    ? { lines: skillLines, frontmatter: fm, descriptionChars: (fm.description || '').length, nameValid: /^[a-z0-9][a-z0-9-]{0,63}$/.test(fm.name || '') }
    : null,
  composition,
  license: { frontmatter: fm.license || null, file: licenseFile ? rel(licenseFile) : null },
  hosts: [...hosts].sort((a, b) => b[1] - a[1]).map(([host, count]) => ({ host, count })),
  riskHits: hits,
  studentDataHints: studentHints,
};

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 2) + '\n');

// ---- 人读报告 ----
const out = console.log;
out(`技能目录：${ROOT}`);
out(`文件 ${files.length} 个，共 ${(bytes / 1024).toFixed(1)} KB`);
out(`SKILL.md：${report.skillMd ? `${skillLines} 行` : '没有'}`);
if (report.skillMd) {
  out('  frontmatter：' + FM_KEYS
    .map((k) => `${k}=${fm[k] ? (k === 'description' ? `${fm.description.length} 字` : fm[k]) : '无'}`).join('｜'));
  out(`  name 规范：${report.skillMd.nameValid ? '合规' : '不合规'}（小写字母、数字、连字符，最长 64）`);
}
out(`构成：${composition}${code.length ? `（代码文件 ${code.length} 个）` : extras.length ? `（附属文件 ${extras.length} 个）` : ''}`);
out(`许可证：frontmatter ${report.license.frontmatter || '无'}；目录内许可文件 ${report.license.file || '无'}`);
out(`外部域名 ${report.hosts.length} 个` + (report.hosts.length ? '：' + report.hosts.map((h) => `${h.host} ×${h.count}`).join('，') : ''));
out(`风险模式命中 ${hits.length} 处`);
for (const h of hits) out(`  [${h.id} ${h.name}] ${h.file}:${h.line}  ${h.text}`);
out(`学生信息线索 ${studentHints.length} 处`);
for (const h of studentHints) out(`  [${h.id} ${h.name}] ${h.file}:${h.line}  ${h.text}`);
if (jsonOut) out(`JSON 已写入 ${jsonOut}`);
