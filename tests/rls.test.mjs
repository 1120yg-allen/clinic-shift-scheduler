// 用 PGlite（瀏覽器版 Postgres）測 supabase/schema.sql 的權限規則。
// 執行：npm install && node tests/rls.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const ADMIN = '00000000-0000-0000-0000-0000000000aa';
const EMP1 = '00000000-0000-0000-0000-0000000000e1';
const EMP2 = '00000000-0000-0000-0000-0000000000e2';
const STRANGER = '00000000-0000-0000-0000-0000000000f0';

const db = new PGlite();
await db.exec(`
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create role anon; create role authenticated;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);
await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')); // 可重複執行
await db.exec(`insert into public.admins values ('boss@example.com'); insert into public.members values ('emp1@example.com'), ('emp2@example.com');`);

let failed = 0;
const ok = (cond, name) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failed++; };

async function as(role, sub, email, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claims', '${JSON.stringify({ sub, email })}', false); set role ${role};`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
const tryq = async (sql, params) => { try { return { rows: (await db.query(sql, params)).rows }; } catch (e) { return { err: String(e.message || e) }; } };
const put = (path, data = {}) => tryq(`insert into public.docs(path,data) values ($1,$2) on conflict (path) do update set data=excluded.data`, [path, JSON.stringify(data)]);
const get = async path => (await tryq(`select data from public.docs where path=$1`, [path])).rows ?? [];

// 管理者
await as('authenticated', ADMIN, 'boss@example.com', async () => {
  ok(!(await put('config/main', { v: 2 })).err, '管理者可以寫 config/main');
  ok(!(await put('notes/main', { byEmp: {} })).err, '管理者可以寫 notes/main');
  ok(!(await put('roster/2026-11', { cells: {} })).err, '管理者可以寫 roster');
  ok(!(await put(`data/users/${EMP1}/profile`, { phone: '0912' })).err, '管理者可以寫員工的個人資料');
  ok((await get(`data/users/${EMP1}/profile`)).length === 1, '管理者讀得到員工的個人資料');
  ok(!(await tryq(`insert into public.members values ('new@example.com')`)).err, '管理者可以新增 members');
});

// 員工
await as('authenticated', EMP1, 'emp1@example.com', async () => {
  ok((await get('config/main')).length === 1, '員工讀得到 config');
  ok((await get('roster/2026-11')).length === 1, '員工讀得到 roster');
  ok((await get('notes/main')).length === 0, '員工讀不到 notes（管理者備註）');
  await put('config/main', { hacked: true }); // 員工改 config：更新 0 列或報錯都算被擋下
  ok((await get('config/main'))[0].data.hacked === undefined, '員工不能改 config');
  ok((await put('roster/2026-11', { cells: { x: 1 } })).err !== undefined, '員工不能改 roster');
  ok((await put('notes/main', {})).err !== undefined, '員工不能寫 notes');
  ok(!(await put(`requests/${EMP1}`, { empId: 'e1', dates: {} })).err, '員工可以寫自己的 requests');
  ok((await put(`requests/${EMP2}`, { empId: 'e2', dates: {} })).err !== undefined, '員工不能寫別人的 requests');
  ok(!(await put(`swaps/${EMP1}`, { items: {} })).err, '員工可以寫自己的 swaps');
  ok((await put(`swaps/${EMP2}`, { items: {} })).err !== undefined, '員工不能寫別人的 swaps');
  ok(!(await put(`swapAcks/${EMP1}`, { byId: {} })).err, '員工可以寫自己的 swapAcks');
  ok(!(await put(`data/users/${EMP1}/profile`, { phone: '0988' })).err, '員工可以寫自己的個人資料');
  ok((await get(`data/users/${EMP1}/profile`)).length === 1, '員工讀得到自己的個人資料');
  ok((await put(`data/users/${EMP2}/profile`, { phone: 'x' })).err !== undefined, '員工不能寫別人的個人資料');
  ok((await get(`data/users/${EMP2}/profile`)).length === 0, '員工讀不到別人的個人資料');
  ok((await tryq(`insert into public.members values ('evil@example.com')`)).err !== undefined, '員工不能新增 members');
  ok((await get(`requests/${EMP1}`)).length === 1, '員工讀得到 requests');
});
await as('authenticated', EMP2, 'emp2@example.com', async () => {
  ok((await get(`requests/${EMP1}`)).length === 1, '另一位員工讀得到別人的 requests（排班頁要看全部畫休）');
  ok((await get(`data/users/${EMP1}/profile`)).length === 0, '另一位員工讀不到 emp1 的個人資料');
  await tryq(`delete from public.docs where path=$1`, [`requests/${EMP1}`]);
});
await as('authenticated', EMP1, 'emp1@example.com', async () => {
  ok((await get(`requests/${EMP1}`)).length === 1, '員工 2 刪不掉員工 1 的 requests');
});

// 登入成功但不在名單的人
await as('authenticated', STRANGER, 'stranger@example.com', async () => {
  ok((await tryq(`select 1 from public.docs`)).rows.length === 0, '不在名單的人讀不到任何資料');
  ok((await put(`requests/${STRANGER}`, {})).err !== undefined, '不在名單的人不能寫資料');
  ok((await tryq(`select 1 from public.members`)).rows.length === 0, '不在名單的人看不到 members');
});

// 沒登入
await db.exec(`reset role; set role anon;`);
ok((await tryq(`select 1 from public.docs`)).err !== undefined, '沒登入（anon）不能讀 docs');
await db.exec('reset role');

console.log(failed ? `\n${failed} 項失敗` : '\n全部通過');
process.exit(failed ? 1 : 0);
