// 排班邏輯測試：不開瀏覽器，用假的 DOM 載入 src/app.js，直接呼叫排班與檢查函式。
// 執行：node tests/logic.test.js
const fs = require('fs');
const path = require('path');

const el = () => ({ addEventListener() {}, set innerHTML(v) {}, get innerHTML() { return ''; }, querySelector() { return null }, hidden: true, style: {}, dataset: {} });
global.window = { Platform: { boot: () => new Promise(() => {}) } };
global.document = { getElementById: () => el(), addEventListener() {}, activeElement: { closest() { return null; } } };
global.innerWidth = 1000; global.innerHeight = 800;
global.location = { href: 'http://localhost/' };
global.localStorage = { getItem() { return null; }, setItem() {} };

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const tests = `
let failed = 0;
const ok = (c, name) => { console.log((c ? 'PASS ' : 'FAIL ') + name); if (!c) failed++; };

cfg = normalizeCfg({ ...defaultCfg(), employees: demoEmployees(), published: ['2026-11'] });
isAdmin = true;
const months = ['2026-10', '2026-11', '2026-12'];
for (const m of months) {
  ym = m;
  [shiftMonth(m, -1), m, shiftMonth(m, 1)].forEach(x => { roster[x] = roster[x] || { cells: {} }; });
  autoMonth('pt'); autoMonth('asst');
}
const bad = /間隔|連續|沒有例假|沒有休息日|工時.*超過|只休/;
for (const m of months) for (const g of ['pt', 'asst']) {
  const msgs = analyze(m, g).msgs.filter(x => bad.test(x));
  ok(msgs.length === 0, '自動排班 ' + m + ' ' + GROUPS[g] + ' 沒有勞基法違規' + (msgs.length ? '：' + msgs[0] : ''));
}
// 助理的月工時接近應上班時數
const a1 = cfg.employees.find(e => e.group === 'asst');
const s1 = summaryOf(a1, '2026-11');
ok(Math.abs(s1.work - s1.base) <= 4, '助理 11 月工時接近應上班時數（' + f1(s1.work) + ' / ' + f1(s1.base) + '）');
// 基本工時 = 上班日 × 8
ok(workdaysOf('2026-10') === 20 && workdaysOf('2026-11') === 21, '2026 年 10、11 月上班日 20、21 天');
// 特休天數（週年制）
const e1 = cfg.employees[0]; // 2016-03-01 到職
ok(leavePeriod(e1.hire, '2026-10-31').days === 16, '滿 10 年特休 16 天');
ok(leavePeriod('2026-04-01', '2026-10-31').days === 3, '滿 6 個月特休 3 天');
ok(leavePeriod('2025-11-01', '2026-11-01').days === 7, '滿 1 年特休 7 天');
// 員工畫休優先
reqs = { u1: { empId: e1.id, dates: { '2026-11-04': 'o_manual', '2026-11-05': 'o_leave', '2026-11-10': 'o_fixed' } } };
ym = '2026-11'; autoMonth('pt');
ok(codeAt(e1.id, '2026-11-04') === 'o_manual' && codeAt(e1.id, '2026-11-05') === 'o_leave' && codeAt(e1.id, '2026-11-10') === 'o_fixed', '員工畫的徒手日、特休、例假會排進去');
ok(analyze('2026-11', 'pt').msgs.filter(x => bad.test(x)).length === 0, '有畫休時仍然沒有勞基法違規');
// 假別檢查
for (let i = 1; i <= 12; i++) setLocal(e1.id, '2026-11-' + String(i + 12).padStart(2, '0'), 'l_personal');
for (let i = 1; i <= 4; i++) setLocal(e1.id, '2026-12-' + String(i).padStart(2, '0'), 'l_family');
ok(analyze('2026-11', 'pt').msgs.some(x => /事假/.test(x) && /超過/.test(x)), '事假加照顧假超過 14 天會提醒');
cfg.employees[0].leaveAdj = { l_personal: 30 };
ok(!analyze('2026-11', 'pt').msgs.some(x => /事假.*超過/.test(x)), '管理者調高個人事假上限後不再提醒');
// 換班
const d1 = monthDates('2026-11').find(d => { const o = optOf(codeAt('e4', d)); return o && o.kind === 'work' && o.dept; });
const p = { id: 't', fromEmp: 'e4', toEmp: 'e5', type: 'cover', dateA: d1, dateB: '', fromCode: codeAt('e4', d1), toCodeA: codeAt('e5', d1), fromCodeB: '', toCodeB: '', createdAt: '2026-11-01T00:00:00Z' };
const before = [codeAt('e4', d1), codeAt('e5', d1)];
applySwapLocal(p);
ok(codeAt('e4', d1) === before[1] && codeAt('e5', d1) === before[0], '代班後兩人的班互換');
// 輔助
ok(f1(8) === '8.0' && f1(7.96) === '8.0', '時數顯示到小數點後一位');
ok(mdLite('# 標題\\n- 一\\n- 二').includes('<li>二</li>'), '自訂規則的簡易 markdown');
process.exit(failed ? 1 : 0);
`;
// eslint-disable-next-line no-eval
eval(src + tests);
