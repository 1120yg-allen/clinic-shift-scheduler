// 用假的 Supabase 用戶端測 src/adapters/supabase.js 的資料層（不連網路）。
// 執行：node tests/supabase-adapter.test.js
const fs = require('fs');
const path = require('path');

let failed = 0;
const ok = (c, name) => { console.log((c ? 'PASS ' : 'FAIL ') + name); if (!c) failed++; };

// ---- 假的 Supabase
const rows = {};          // path -> data
let onChange = null;      // realtime handler
const upserts = [], deletes = [];
function query() {
  const q = { f: null, like: null, eq: null };
  const api = {
    select() { return api; },
    eq(col, v) { q.eq = v; return api; },
    like(col, pat) { q.like = pat.replace(/%$/, ''); return api; },
    maybeSingle() { return Promise.resolve({ data: q.eq in rows ? { data: rows[q.eq] } : null, error: null }); },
    then(res, rej) {
      const out = Object.keys(rows).filter(p => p.indexOf(q.like) === 0).map(p => ({ path: p, data: rows[p] }));
      return Promise.resolve({ data: out, error: null }).then(res, rej);
    },
    upsert(row) { upserts.push(row); rows[row.path] = row.data; return Promise.resolve({ error: null }); },
    delete() { return { eq(col, v) { deletes.push(v); delete rows[v]; return Promise.resolve({ error: null }); } }; }
  };
  return api;
}
const fakeSb = {
  auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u-emp', email: 'emp@example.com' } } } }), signOut: () => Promise.resolve() },
  rpc: name => Promise.resolve({ data: name === 'is_member' }),   // 是員工、不是管理者
  from: () => query(),
  channel: () => ({ on(ev, opts, fn) { onChange = fn; return this; }, subscribe() { return this; } })
};

global.window = { supabase: { createClient: () => fakeSb } };
global.document = { addEventListener() {}, createElement() { return {}; }, head: { appendChild() {} } };
global.location = { reload() {} };
eval(fs.readFileSync(path.join(__dirname, '..', 'src', 'adapters', 'supabase.js'), 'utf8'));

(async () => {
  rows['config/main'] = { v: 2 };
  rows['requests/u1'] = { empId: 'e1' };
  rows['requests/u2'] = { empId: 'e2' };
  rows['requests/u2/deeper'] = { x: 1 };       // 不是直接子文件，集合不該包含

  const P = await window.SupabaseAdapter.boot({ innerHTML: '' }, { supabaseUrl: 'x', supabaseKey: 'y' }, { save() {} });
  ok(P.mode === 'supabase' && !P.members, '員工登入：沒有 email 名單管理');
  ok((await P.user.canEdit()) === false && (await P.user.me()).email === 'emp@example.com', '使用者資訊與權限');

  const d = await P.db.doc('config/main').get();
  ok(d.exists && d.data().v === 2, 'doc.get 讀得到資料');
  ok(!(await P.db.doc('nope/x').get()).exists, 'doc.get 不存在的文件 exists=false');

  await P.db.doc('requests/u-emp').set({ empId: 'e9', dates: {} });
  ok(upserts[0].path === 'requests/u-emp', 'doc.set 用 upsert 寫入');

  const docSnaps = [];
  P.db.doc('config/main').onSnapshot(s => docSnaps.push(s.data()));
  const colSnaps = [];
  P.db.collection('requests').onSnapshot(s => colSnaps.push(s.docs.map(x => x.id).sort()));
  await new Promise(r => setTimeout(r, 20));
  ok(docSnaps.length === 1 && docSnaps[0].v === 2, 'doc.onSnapshot 先給目前資料');
  ok(JSON.stringify(colSnaps[0]) === JSON.stringify(['u-emp', 'u1', 'u2']), 'collection.onSnapshot 只含直接子文件');

  onChange({ eventType: 'UPDATE', new: { path: 'config/main', data: { v: 3 } } });
  ok(docSnaps[docSnaps.length - 1].v === 3, 'Realtime 更新會推給 doc 監聽');
  onChange({ eventType: 'INSERT', new: { path: 'requests/u3', data: { empId: 'e3' } } });
  ok(colSnaps[colSnaps.length - 1].indexOf('u3') >= 0, 'Realtime 新增會推給 collection 監聽');
  onChange({ eventType: 'DELETE', old: { path: 'requests/u1' } });
  ok(colSnaps[colSnaps.length - 1].indexOf('u1') < 0, 'Realtime 刪除會推給 collection 監聽');

  await P.db.doc('requests/u-emp').delete();
  ok(deletes[0] === 'requests/u-emp', 'doc.delete');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
