/*
 * Supabase 模式：資料存在 Supabase（Postgres），員工用 email 驗證碼登入。
 * 資料表與權限（RLS）見 supabase/schema.sql；設定見 README。
 * 這個檔案把 Supabase 包成 app.js 使用的 db / user 介面：
 *   db.doc(path).get / set / delete / onSnapshot
 *   db.collection(path).onSnapshot
 *   user.me() / canEdit() / profiles(ids)
 */
(function () {
  var SB_VERSION = '2.45.4';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = function () { reject(new Error('載入失敗：' + src)); };
      document.head.appendChild(s);
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function isChild(prefix, path) { return path.indexOf(prefix + '/') === 0 && path.slice(prefix.length + 1).indexOf('/') < 0; }
  function mapErr(e) {
    var rls = e && (e.code === '42501' || /row-level security/i.test(e.message || ''));
    return { code: rls ? 'invalid_argument' : 'unavailable', message: (e && e.message) || '' };
  }
  function never() { return new Promise(function () {}); }

  /* ---------- 登入畫面：email → 驗證碼 ---------- */
  function loginFlow(view, sb) {
    return new Promise(function (resolve) {
      function stepEmail(prefill, msg) {
        view.innerHTML =
          '<div class="panel sec regform"><h2>登入排班系統</h2>' +
          '<p class="hint" style="margin:0 0 12px">輸入你的電子郵件，系統會寄一組驗證碼給你。第一次使用請先請管理者把你的信箱加入名單。</p>' +
          '<form id="loginEmailForm" class="rf"><label class="field" style="grid-column:1/-1">電子郵件' +
          '<input id="loginEmail" type="email" required autocomplete="email" inputmode="email" value="' + esc(prefill || '') + '"></label>' +
          '<div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<button class="btn primary" type="submit">寄送驗證碼</button><span id="loginErr" class="err" role="alert">' + esc(msg || '') + '</span></div></form></div>';
        view.querySelector('#loginEmailForm').addEventListener('submit', function (ev) {
          ev.preventDefault();
          var email = view.querySelector('#loginEmail').value.trim().toLowerCase();
          var err = view.querySelector('#loginErr'); err.textContent = '寄送中…';
          sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }).then(function (r) {
            if (r.error) { err.textContent = '寄送失敗：' + r.error.message; return; }
            stepCode(email, '');
          });
        });
      }
      function stepCode(email, msg) {
        view.innerHTML =
          '<div class="panel sec regform"><h2>輸入驗證碼</h2>' +
          '<p class="hint" style="margin:0 0 12px">驗證碼已寄到 <b>' + esc(email) + '</b>，通常一分鐘內會收到（也看看垃圾郵件匣）。</p>' +
          '<form id="loginCodeForm" class="rf"><label class="field" style="grid-column:1/-1">驗證碼' +
          '<input id="loginCode" type="text" required autocomplete="one-time-code" inputmode="numeric" maxlength="10"></label>' +
          '<div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<button class="btn primary" type="submit">登入</button>' +
          '<button class="btn" type="button" id="loginResend">重新寄送</button>' +
          '<button class="btn" type="button" id="loginBack">換一個 email</button>' +
          '<span id="loginErr" class="err" role="alert">' + esc(msg || '') + '</span></div></form></div>';
        view.querySelector('#loginCode').focus();
        view.querySelector('#loginCodeForm').addEventListener('submit', function (ev) {
          ev.preventDefault();
          var token = view.querySelector('#loginCode').value.replace(/\s/g, '');
          var err = view.querySelector('#loginErr'); err.textContent = '驗證中…';
          sb.auth.verifyOtp({ email: email, token: token, type: 'email' }).then(function (r) {
            if (r.error || !r.data || !r.data.session) { err.textContent = '驗證碼不對或已過期，請再試一次'; return; }
            resolve(r.data.session);
          });
        });
        view.querySelector('#loginResend').addEventListener('click', function () {
          sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } }).then(function (r) {
            view.querySelector('#loginErr').textContent = r.error ? '寄送失敗：' + r.error.message : '已重新寄送';
          });
        });
        view.querySelector('#loginBack').addEventListener('click', function () { stepEmail(email, ''); });
      }
      stepEmail('', '');
    });
  }

  /* ---------- 資料庫：docs 資料表 + Realtime ---------- */
  function makeDb(sb) {
    var listeners = [];
    var channel = null;

    function docSnap(path, data) {
      var ex = data != null;
      return { id: path.split('/').pop(), exists: ex, data: function () { return ex ? clone(data) : undefined; } };
    }
    function colSnap(l) {
      var docs = Object.keys(l.cache).sort().map(function (p) {
        var d = l.cache[p];
        return { id: p.slice(l.path.length + 1), exists: true, data: function () { return clone(d); } };
      });
      return { docs: docs, size: docs.length, empty: docs.length === 0 };
    }
    function fetchDoc(path) {
      return sb.from('docs').select('data').eq('path', path).maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        return r.data ? r.data.data : null;
      });
    }
    function fetchCol(prefix) {
      return sb.from('docs').select('path,data').like('path', prefix + '/%').then(function (r) {
        if (r.error) throw r.error;
        var o = {};
        (r.data || []).forEach(function (x) { if (isChild(prefix, x.path)) o[x.path] = x.data; });
        return o;
      });
    }
    function onChange(p) {
      var rec = p.eventType === 'DELETE' ? p.old : p.new;
      if (!rec || !rec.path) return;
      var data = p.eventType === 'DELETE' ? null : rec.data;
      listeners.slice().forEach(function (l) {
        if (l.type === 'doc') { if (l.path === rec.path) l.cb(docSnap(rec.path, data)); }
        else if (isChild(l.path, rec.path)) {
          if (data == null) delete l.cache[rec.path]; else l.cache[rec.path] = data;
          l.cb(colSnap(l));
        }
      });
    }
    function ensureChannel() {
      if (channel) return;
      channel = sb.channel('docs-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, onChange)
        .subscribe();
      // Realtime 斷線時的保險：定時重抓
      setInterval(refreshAll, 60000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshAll(); });
    }
    function refreshAll() { listeners.slice().forEach(function (l) { l.refresh(); }); }

    function listenDoc(path, cb, errCb) {
      var l = { type: 'doc', path: path, cb: cb };
      l.refresh = function () {
        fetchDoc(path).then(function (d) { cb(docSnap(path, d)); }).catch(function (e) { if (errCb) errCb(e); });
      };
      listeners.push(l); ensureChannel(); l.refresh();
      return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
    }
    function listenCol(path, cb, errCb) {
      var l = { type: 'col', path: path, cb: cb, cache: {} };
      l.refresh = function () {
        fetchCol(path).then(function (o) { l.cache = o; cb(colSnap(l)); }).catch(function (e) { if (errCb) errCb(e); });
      };
      listeners.push(l); ensureChannel(); l.refresh();
      return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
    }

    return {
      fetchDoc: fetchDoc,
      api: {
        doc: function (path) {
          return {
            path: path,
            get: function () { return fetchDoc(path).then(function (d) { return docSnap(path, d); }); },
            set: function (data) {
              return sb.from('docs').upsert({ path: path, data: data }).then(function (r) { if (r.error) throw mapErr(r.error); });
            },
            delete: function () {
              return sb.from('docs').delete().eq('path', path).then(function (r) { if (r.error) throw mapErr(r.error); });
            },
            onSnapshot: function (cb, errCb) { return listenDoc(path, cb, errCb); }
          };
        },
        collection: function (path) {
          return { onSnapshot: function (cb, errCb) { return listenCol(path, cb, errCb); } };
        }
      }
    };
  }

  function boot(view, cfg, downloads) {
    if (!cfg.supabaseUrl || !cfg.supabaseKey) {
      view.innerHTML = '<div class="notice bad">請先在 config.js 填入 supabaseUrl 與 supabaseKey（見 README）。</div>';
      return never();
    }
    var chain = window.supabase ? Promise.resolve() : loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@' + SB_VERSION + '/dist/umd/supabase.js');
    return chain.then(function () {
      var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
      return sb.auth.getSession().then(function (r) {
        return r.data && r.data.session ? r.data.session : loginFlow(view, sb);
      }).then(function (session) {
        return Promise.all([sb.rpc('is_admin'), sb.rpc('is_member')]).then(function (res) {
          var admin = !!res[0].data, member = !!res[1].data;
          if (!member) {
            view.innerHTML = '<div class="panel sec regform"><h2>還不能使用</h2><p class="hint" style="margin:0 0 12px">你的信箱 <b>' +
              esc(session.user.email) + '</b> 還沒有被管理者加入名單。請聯絡管理者後再重新整理。</p><button class="btn" id="sbOut">登出</button></div>';
            view.querySelector('#sbOut').addEventListener('click', function () { sb.auth.signOut().then(function () { location.reload(); }); });
            return never();
          }
          var d = makeDb(sb);
          var me = { id: session.user.id, name: session.user.email, email: session.user.email, isOwner: admin, canEdit: admin };
          var user = {
            me: function () { return Promise.resolve(me); },
            id: function () { return Promise.resolve(me.id); },
            isOwner: function () { return Promise.resolve(admin); },
            canEdit: function () { return Promise.resolve(admin); },
            profiles: function (ids) {
              var out = {};
              return Promise.all(ids.map(function (i) {
                return d.fetchDoc('data/users/' + i + '/profile')
                  .then(function (p) { out[i] = { id: i, name: (p && p.email) || '' }; })
                  .catch(function () { out[i] = { id: i, name: '' }; });
              })).then(function () { return out; });
            }
          };
          var out = {
            db: d.api, user: user, downloads: downloads, mode: 'supabase',
            signOut: function () { return sb.auth.signOut().then(function () { location.reload(); }); }
          };
          if (admin) {
            out.members = {
              list: function () {
                return sb.from('members').select('email').order('email').then(function (r) { if (r.error) throw r.error; return r.data.map(function (x) { return x.email; }); });
              },
              add: function (email) {
                return sb.from('members').insert({ email: String(email).trim().toLowerCase() }).then(function (r) { if (r.error) throw r.error; });
              },
              remove: function (email) {
                return sb.from('members').delete().eq('email', email).then(function (r) { if (r.error) throw r.error; });
              }
            };
          }
          return out;
        });
      });
    }).catch(function (e) {
      view.innerHTML = '<div class="notice bad">無法連線到 Supabase：' + esc(e && e.message) + '</div>';
      return never();
    });
  }

  window.SupabaseAdapter = { boot: boot };
})();
