// 统一验收入口：一条命令跑完整套 harness（构建 → 预览图 → 十项闸门 → 无头自测）
// 用法：npm run verify（全部）；--fast 跳过预览图重生成（只查现有图的新鲜度）
import { spawnSync } from 'node:child_process';

const fast = process.argv.includes('--fast');
const stages = [
  {
    name: '单文件构建',
    desc: 'esbuild 树摇打包 + 模板注入（港中深紫 UI / 检测引擎 / 键盘翻环节）',
    cmd: ['node', 'scripts/build_interactives.mjs'],
  },
  ...(fast
    ? []
    : [{
        name: '卡片预览图',
        desc: '无头 Chrome 实拍每个资源首环节界面 → 720 宽 JPEG（资源库卡片用）',
        cmd: ['node', 'scripts/build_resource_previews.mjs'],
      }]),
  {
    name: '十项产物闸门',
    desc: '体积 / 零外链 / 无 emoji / title / 全屏 / 双主题 / 教材锚点 / 操作提示 / 预览新鲜度 / 交互绑定',
    cmd: ['node', 'scripts/check_interactives.mjs'],
  },
  {
    name: '无头自测 harness',
    desc: '真浏览器加载 ?selftest=1：JS 零报错 / 场景断言 / 画布主体占比 / 教研契约 v2 / 检测作答流程',
    cmd: ['node', 'scripts/test_interactives.mjs'],
  },
];

console.log('happyvibe 资源验收 · ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
for (let i = 0; i < stages.length; i++) {
  const st = stages[i];
  console.log(`\n[${i + 1}/${stages.length}] ${st.name} —— ${st.desc}`);
  const r = spawnSync(st.cmd[0], st.cmd.slice(1), { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nverify: 第 ${i + 1} 阶段「${st.name}」未过，验收中止。`);
    process.exit(1);
  }
}
console.log('\nverify: 全链路通过。');
