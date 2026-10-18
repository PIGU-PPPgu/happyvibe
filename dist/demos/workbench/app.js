/* 教师智能工作台 · MVP 前端
 * 零依赖原生 JS。Demo 数据内置于 DATA，视图由 render 函数生成。
 * 设计：白底 / 克制蓝 / 细线 / Noto Sans SC（见 styles.css）。
 */

const DATA = {
  teacher: { name: "吴老师", subject: "初中数学", classes: ["七(2)班", "七(3)班", "七(4)班"], homeroom: "七(3)班" },
  date: "8月28日 周五",

  // 今日课程时间线
  courses: [
    { period: "第1节", time: "08:00–08:45", cls: "七(2)班", chapter: "一元一次方程（解法一）", status: "done", note: "已上 · 出勤42/42" },
    { period: "第3节", time: "10:20–11:05", cls: "七(3)班", chapter: "一元一次方程（解法二）", status: "now", note: "进行中 · 新授课" },
    { period: "第6节", time: "14:30–15:15", cls: "七(4)班", chapter: "一元一次方程（习题课）", status: "upcoming", note: "待上 · 需带练习册" },
  ],

  // 今日待办
  todos: [
    { id: "t1", type: "作业", typeCls: "blue", name: "批改七(3)班课后作业", meta: "练习册 P23 · 12 份 · 今天截止", done: false },
    { id: "t2", type: "事务", typeCls: "amber", name: "填写班级安全台账", meta: "七(3)班 · 今天 17:00 前", done: false },
    { id: "t3", type: "沟通", typeCls: "green", name: "回复 3 条家长留言", meta: "来自七(2)班家长 · 含 1 条请假", done: false },
    { id: "t4", type: "备课", typeCls: "gray", name: "备课下周《二元一次方程组》", meta: "下周二首节 · 待写教案", done: false },
  ],

  suggestions: [
    { tone: "", title: "学情提醒", text: "七(3)班张明近两次作业正确率从 86% 降到 71%，建议课后单独辅导 10 分钟。" },
    { tone: "amber", title: "课堂助手", text: "第3节是新授课，可生成课堂提问与随堂小测。" },
  ],

  // 教学中心
  teachingCourses: [
    { cls: "七(2)班", chapter: "一元一次方程（解法一）", plan: "已上", tag: "gray", res: "课件 / 练习 已备" },
    { cls: "七(3)班", chapter: "一元一次方程（解法二）", plan: "进行中", tag: "blue", res: "课堂活动待生成" },
    { cls: "七(4)班", chapter: "一元一次方程（习题课）", plan: "待上", tag: "green", res: "习题集已上传" },
  ],
  myResources: ["《一元一次方程》课件包", "易错题型 20 例", "课堂小测模板", "分层作业设计"],

  // AI 备课
  lessonCourses: [
    { id: "lp1", cls: "七(3)班", chapter: "一元一次方程（解法二）", active: true },
    { id: "lp2", cls: "七(4)班", chapter: "一元一次方程（习题课）", active: false },
    { id: "lp3", cls: "七(2)班", chapter: "二元一次方程组（新）", active: false },
  ],
  lessonPlan: [
    { h: "教学目标", p: "1. 掌握移项法则与去括号顺序；2. 能规范解 ax+b=cx+d 型方程；3. 体会化归思想。" },
    { h: "教学重难点", p: "重点：移项变号；难点：含括号与分母的方程化简，避免符号错误。" },
    { h: "教学过程", p: "复习导入(5′) → 例题精讲(15′) → 学生板演(12′) → 纠错总结(8′) → 巩固练习(5′)。" },
    { h: "课堂活动", p: "「找错小侦探」：投影典型错解，4 人小组讨论并抢答纠正，增强参与。" },
    { h: "核心素养", p: "运算能力、逻辑推理、模型观念——用方程刻画数量关系。" },
    { h: "评价方式", p: "课堂板演即时评分 + 随堂 3 题小测，正确率纳入过程性评价。" },
    { h: "课堂练习", p: "课本 P45 第 1–4 题（基础）+ 第 7 题（提升），分层布置。" },
    { h: "课后作业", p: "练习册 P23 第 1–10 题；选做 P24 探究题，鼓励拍照上传思路。" },
  ],

  // 学生中心
  studentStats: [
    { n: "142", l: "在册学生" },
    { n: "8", l: "需关注" },
    { n: "15", l: "本周进步" },
    { n: "0", l: "未交作业" },
  ],
  watchStudents: [
    { name: "张明", cls: "七(3)班", reason: "作业正确率连续下滑", tag: "amber" },
    { name: "李华", cls: "七(2)班", reason: "课堂参与度低", tag: "blue" },
  ],
  studentCard: {
    name: "张明", cls: "七(3)班", tags: ["数学", "近两周波动", "基础薄弱"],
    summary: "张明前四次单元测试稳定在 82–88 分，但近期两次作业正确率从 86% 降至 71%，主要错在去括号与移项变号。建议：1) 课后 10 分钟一对一梳理符号规则；2) 布置 5 道针对性变式题；3) 一周后复测。情绪状态平稳，配合度高。",
  },

  // 作业中心
  hwStats: [
    { n: "12", l: "待批改（份）" },
    { n: "3", l: "已布置（次）" },
    { n: "92%", l: "平均完成率" },
  ],
  hwTodo: [
    { cls: "七(3)班", name: "练习册 P23 第1–10题", count: "12 份待批", tag: "blue", due: "今天" },
    { cls: "七(2)班", name: "计算题 20 道", count: "8 份待批", tag: "amber", due: "明天" },
  ],

  // AI 助手
  aiContext: ["吴老师", "初中数学", "七(2)(3)(4)班", "班主任 七(3)", "人教版", "进度：一元一次方程"],
  aiEntries: [
    "出一道易错题", "生成课堂小结", "写家长群通知", "分析班级成绩", "帮我备《二元一次方程组》", "写一段评语",
  ],
  chat: [
    { who: "AI 助手", me: false, text: "已连接你的教学上下文：七(3)班当前进度《一元一次方程（解法二）》。想让我帮什么？" },
    { who: "我", me: true, text: "给张明出几道针对去括号的变式题。" },
    { who: "AI 助手", me: false, text: "好的，已基于张明近期错题生成 5 道去括号专项训练，难度递进，已加入他的待办。" },
  ],
};

/* ---------- 工具 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ---------- 视图渲染 ---------- */
const Views = {
  home() {
    const c = DATA.courses.map(co => {
      const cls = co.status === "upcoming" ? "course upcoming" : "course";
      const statTag = co.status === "done" ? `<span class="tag green">${co.note}</span>`
        : co.status === "now" ? `<span class="tag">${co.note}</span>`
        : `<span class="tag gray">${co.note}</span>`;
      const actions = co.status === "now"
        ? `<div class="course-actions"><button class="btn btn-primary btn-sm" onclick="ACT.genQuestions()">生成课堂提问</button><button class="btn btn-outline btn-sm">开始上课</button></div>`
        : co.status === "upcoming"
        ? `<div class="course-actions"><button class="btn btn-outline btn-sm">查看课件</button><button class="btn btn-ghost btn-sm">备课</button></div>`
        : `<div class="course-actions"><button class="btn btn-outline btn-sm">回看</button></div>`;
      if (co.status === "upcoming") {
        return `<div class="${cls}">
          <div class="course-top">
            <div class="course-time"><span class="t">${co.time.split("–")[0]}</span><span class="d">${co.period}</span></div>
            <div class="course-info"><div class="course-meta"><span class="tag gray">${co.cls}</span><span class="tag">数学</span></div><div class="course-chap">${co.chapter}</div></div>
            ${actions}
          </div>
          <div class="course-meta">${statTag}</div>
        </div>`;
      }
      return `<div class="${cls}">
        <div class="course-time"><span class="t">${co.time.split("–")[0]}</span><span class="d">${co.period}</span></div>
        <div class="course-info"><div class="course-chap">${co.chapter}</div><div class="course-meta"><span class="tag gray">${co.cls}</span><span class="tag">数学</span>${statTag}</div></div>
        ${actions}
      </div>`;
    }).join("");

    const todos = DATA.todos.map(t => `
      <div class="task" id="${t.id}">
        <div class="task-type ${t.typeCls}">${t.type}</div>
        <div class="task-info"><div class="task-name">${t.name}</div><div class="task-meta">${t.meta}</div></div>
        <div class="task-actions">
          <button class="btn btn-link" onclick="ACT.aiHandle('${t.id}')">交给 AI</button>
          <button class="btn btn-outline btn-sm" onclick="ACT.done('${t.id}')">完成</button>
        </div>
      </div>`).join("");

    const sugg = DATA.suggestions.map(s => `
      <div class="suggest ${s.tone}"><div class="section-title" style="font-size:14px">${s.title}</div><p>${s.text}</p></div>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">上午好，吴老师</div><div class="header-sub">今天是 ${DATA.date} · 你今天有 3 节课、4 项待办，2 名学生需关注。</div></div>
        <div class="header-actions"><button class="btn btn-primary" onclick="ACT.genPlan()">一键生成今日教案</button></div>
      </div>
      <div class="grid cols-2">
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">今日课程</div><span class="count">3 节</span></div>${c}</div>
          <div class="section"><div class="section-head"><div class="section-title">今日待办</div><span class="count amber">4 项</span></div>${todos}</div>
        </div>
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">AI 今日建议</div></div>${sugg}</div>
          <div class="section">
            <div class="section-head"><div class="section-title">今日概览</div></div>
            <div class="stats">
              <div class="stat"><span class="n">3</span><span class="l">今日上课</span></div>
              <div class="stat"><span class="n">12</span><span class="l">待批改作业</span></div>
              <div class="stat"><span class="n">4</span><span class="l">待办事项</span></div>
              <div class="stat"><span class="n">2</span><span class="l">需关注学生</span></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  teaching() {
    const cards = DATA.teachingCourses.map(c => `
      <div class="card">
        <div class="course-meta" style="margin-bottom:8px"><span class="tag gray">${c.cls}</span><span class="tag ${c.tag}">${c.plan}</span></div>
        <div class="course-chap">${c.chapter}</div>
        <div class="task-meta" style="margin-top:6px">${c.res}</div>
        <div class="quick-actions" style="margin-top:12px">
          <button class="btn btn-outline btn-sm">备课</button>
          <button class="btn btn-ghost btn-sm">课件</button>
          <button class="btn btn-ghost btn-sm">作业</button>
        </div>
      </div>`).join("");

    const res = DATA.myResources.map(r => `<span class="chip">${r}</span>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">教学中心</div><div class="header-sub">你的课程与教学资源，按教学流组织。</div></div>
        <div class="header-actions"><div class="tabs"><button class="tab active">今日课程</button><button class="tab">本周课程</button><button class="tab">我的资源</button></div></div>
      </div>
      <div class="grid cols-2">
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">我的课程</div><span class="count">3 个班</span></div>
            <div class="grid" style="grid-template-columns:1fr">${cards}</div>
          </div>
        </div>
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">我的教学资源</div></div><div class="chips" style="margin-top:4px">${res}</div></div>
          <div class="section"><div class="card tint-blue"><div class="section-title" style="font-size:15px">备课助手</div><p class="task-meta" style="margin-top:6px">选课程后由 AI 生成教案、练习与评价方案，无需从空白开始。</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="NAV.go('lesson-plan')">去备课</button></div></div>
        </div>
      </div>`;
  },

  "lesson-plan"() {
    const pick = DATA.lessonCourses.map(c => `
      <div class="card ${c.active ? "tint-blue" : ""}" style="cursor:pointer" onclick="ACT.pickLesson('${c.id}')">
        <div class="course-meta" style="margin-bottom:6px"><span class="tag gray">${c.cls}</span>${c.active ? '<span class="tag">备课中</span>' : ""}</div>
        <div class="course-chap">${c.chapter}</div>
      </div>`).join("");

    const plan = DATA.lessonPlan.map(p => `
      <div class="plan">
        <h4>${p.h}</h4><p>${p.p}</p>
        <button class="btn btn-link" onclick="ACT.regen('${p.h}')">重新生成</button>
      </div>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">AI 备课</div><div class="header-sub">已读取七(3)班进度与人教版教材，自动生成教案框架，可逐块调整。</div></div>
        <div class="header-actions"><button class="btn btn-primary" onclick="ACT.exportPlan()">导出教案</button></div>
      </div>
      <div class="grid cols-2">
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">选择课程</div></div>
            <div class="grid" style="grid-template-columns:1fr">${pick}</div>
          </div>
        </div>
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">AI 生成教案</div><span class="count">8 块</span></div>
            <div class="plan-grid">${plan}</div>
          </div>
        </div>
      </div>`;
  },

  students() {
    const stats = DATA.studentStats.map(s => `<div class="stat"><span class="n">${s.n}</span><span class="l">${s.l}</span></div>`).join("");
    const watch = DATA.watchStudents.map(s => `
      <div class="card"><div class="student-head"><span class="student-name" style="font-size:16px">${s.name}</span><span class="tag ${s.tag}">${s.cls}</span></div><div class="task-meta">${s.reason}</div><div class="row-actions" style="margin-top:10px"><button class="btn btn-outline btn-sm">查看学情</button><button class="btn btn-ghost btn-sm">联系家长</button></div></div>`).join("");
    const sc = DATA.studentCard;
    const tags = sc.tags.map(t => `<span class="tag tint">${t}</span>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">学生中心</div><div class="header-sub">以「学习卡」呈现每位学生的状态，AI 自动汇总学情。</div></div>
        <div class="header-actions"><button class="btn btn-outline">导出名单</button><button class="btn btn-primary">AI 学情分析</button></div>
      </div>
      <div class="grid cols-2">
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">班级概览</div></div><div class="stats">${stats}</div></div>
          <div class="section"><div class="section-head"><div class="section-title">需关注学生</div><span class="count amber">${DATA.watchStudents.length} 人</span></div>${watch}</div>
        </div>
        <div class="col">
          <div class="student-card">
            <div class="student-head"><div><div class="student-name">${sc.name}</div><div class="student-class">${sc.cls}</div></div><div class="tags">${tags}</div></div>
            <div class="ai-summary"><div class="h">AI 学情摘要</div><p>${sc.summary}</p></div>
            <div class="row-actions"><button class="btn btn-primary btn-sm" onclick="toast('已生成针对性训练，加入张明待办')">生成针对性训练</button><button class="btn btn-outline btn-sm">约谈记录</button></div>
          </div>
        </div>
      </div>`;
  },

  homework() {
    const stats = DATA.hwStats.map(s => `<div class="stat"><span class="n">${s.n}</span><span class="l">${s.l}</span></div>`).join("");
    const todo = DATA.hwTodo.map(h => `
      <div class="hw-card"><div class="task-type ${h.tag}">作业</div>
        <div class="task-info"><div class="task-name">${h.cls} · ${h.name}</div><div class="task-meta">${h.count} · 截止 ${h.due}</div></div>
        <div class="task-actions"><button class="btn btn-outline btn-sm" onclick="toast('开始批改 ${h.cls}')">批改</button><button class="btn btn-ghost btn-sm">查看提交</button></div>
      </div>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">作业中心</div><div class="header-sub">布置、批改、分析一体，AI 自动生成讲评与分层作业。</div></div>
        <div class="header-actions"><button class="btn btn-outline">布置作业</button><button class="btn btn-primary">智能批改</button></div>
      </div>
      <div class="grid cols-2">
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">作业概览</div></div><div class="stats">${stats}</div></div>
          <div class="section"><div class="section-head"><div class="section-title">待批改作业</div><span class="count blue">${DATA.hwTodo.length} 项</span></div>${todo}</div>
        </div>
        <div class="col">
          <div class="section"><div class="section-head"><div class="section-title">作业分析</div></div>
            <div class="card tint-blue"><div class="section-title" style="font-size:15px">共性错题</div><p class="task-meta" style="margin-top:6px">去括号符号错误占比 38%，建议下节课重点讲评。</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="toast('已生成讲评课提纲')">生成讲评课</button></div>
          </div>
        </div>
      </div>`;
  },

  ai() {
    const ctx = DATA.aiContext.map(c => `<span class="chip">${c}</span>`).join("");
    const entries = DATA.aiEntries.map(e => `<button class="entry" onclick="ACT.send('${e}')">${e}</button>`).join("");
    const chat = DATA.chat.map(m => `<div class="bubble ${m.me ? "user" : ""}"><div class="who">${m.who}</div><p>${m.text}</p></div>`).join("");

    return `
      <div class="header">
        <div><div class="header-title">AI 助手</div><div class="header-sub">已默认连接你的教学上下文，无需重复说明背景。</div></div>
      </div>
      <div class="section"><div class="section-head"><div class="section-title" style="font-size:15px">已连接上下文</div></div><div class="chips" style="margin-top:4px">${ctx}</div></div>
      <div class="section"><div class="section-head"><div class="section-title" style="font-size:15px">快捷入口</div></div><div class="quick-entries" style="margin-top:4px">${entries}</div></div>
      <div class="section">
        <div class="chat" id="chatBox">${chat}</div>
        <div class="input-bar">
          <input id="aiInput" placeholder="直接说需求，例如：给七(3)班出一份单元测试" onkeydown="if(event.key==='Enter')ACT.send()" />
          <button class="btn btn-primary btn-sm" onclick="ACT.send()">发送</button>
        </div>
      </div>`;
  },

  profile() { return `<div class="header"><div class="header-title">个人设置</div></div><div class="placeholder">教师资料、任教学科与班级、教材版本、AI 上下文偏好将在此配置。（MVP 占位）</div>`; },
  help() { return `<div class="header"><div class="header-title">帮助与反馈</div></div><div class="placeholder">使用指引与问题反馈入口。（MVP 占位）</div>`; },
};

/* ---------- 交互 ---------- */
const ACT = {
  genQuestions() { toast("已为第3节生成 6 道课堂提问 + 随堂小测"); },
  genPlan() { toast("正在生成今日 3 节课教案…"); },
  aiHandle(id) {
    const t = DATA.todos.find(x => x.id === id);
    if (t) toast(`已把「${t.name}」交给 AI 处理`);
  },
  done(id) {
    const node = document.getElementById(id);
    if (node) { node.style.opacity = ".45"; node.querySelector(".task-actions").innerHTML = '<span class="task-meta">已完成 ✓</span>'; }
    toast("已完成，已归档");
  },
  pickLesson(id) {
    DATA.lessonCourses.forEach(c => c.active = c.id === id);
    NAV.render();
  },
  regen(h) { toast(`正在重新生成「${h}」…`); },
  exportPlan() { toast("教案已导出为文档"); },
  send(preset) {
    const input = $("#aiInput");
    const text = (preset || (input && input.value.trim()));
    if (!text) return;
    const box = $("#chatBox");
    if (box) {
      box.appendChild(el(`<div class="bubble user"><div class="who">我</div><p>${text}</p></div>`));
      setTimeout(() => {
        box.appendChild(el(`<div class="bubble"><div class="who">AI 助手</div><p>收到，已基于你的教学上下文处理「${text}」，结果已生成在对应模块。</p></div>`));
        box.scrollTop = box.scrollHeight;
      }, 500);
      box.scrollTop = box.scrollHeight;
    }
    if (input) input.value = "";
  },
};

/* ---------- 导航 ---------- */
const NAV = {
  go(view) {
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
    NAV.render(view);
  },
  render(view) {
    const v = view || document.querySelector(".nav-item.active").dataset.view;
    $("#content").innerHTML = Views[v]();
  },
};

/* ---------- 启动 ---------- */
document.querySelectorAll(".nav-item").forEach(n => {
  n.addEventListener("click", () => NAV.go(n.dataset.view));
});

const fab = $("#fab"), fabMenu = $("#fabMenu");
fab.addEventListener("click", () => fabMenu.classList.toggle("open"));
fabMenu.querySelectorAll("button").forEach(b => {
  b.addEventListener("click", () => {
    fabMenu.classList.remove("open");
    const a = b.dataset.action;
    if (a === "备课") NAV.go("lesson-plan");
    else if (a === "提问") NAV.go("ai");
    else toast(`已打开「${a}」（MVP 演示）`);
  });
});
document.addEventListener("click", (e) => {
  if (!fab.contains(e.target) && !fabMenu.contains(e.target)) fabMenu.classList.remove("open");
});

NAV.render("home");
