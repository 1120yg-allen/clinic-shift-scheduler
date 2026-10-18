/*
 * 本機模式：資料存在這個瀏覽器的 localStorage，使用者固定是管理者。
 * 適合單人試用或在一台電腦上排班。員工登入、畫休、換班需要用 Supabase 模式。
 */
(function () {
  var KEY = 'clinic-shift-data-v1';
  var store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
  var listeners = [];

  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 無痕模式等：只存在記憶體 */ } }
  function has(p) { return Object.prototype.hasOwnProperty.call(store, p); }
  function snapDoc(path) {
    var ex = has(path);
    return { id: path.split('/').pop(), exists: ex, data: function () { return ex ? clone(store[path]) : undefined; } };
  }
  function snapCol(prefix) {
    var docs = Object.keys(store)
      .filter(function (p) { return p.indexOf(prefix + '/') === 0 && p.slice(prefix.length + 1).indexOf('/') < 0; })
      .map(function (p) { return { id: p.slice(prefix.length + 1), exists: true, data: function () { return clone(store[p]); } }; });
    return { docs: docs, size: docs.length, empty: docs.length === 0 };
  }
  function fire(l) { l.cb(l.type === 'doc' ? snapDoc(l.path) : snapCol(l.path)); }
  function notify(path) {
    listeners.slice().forEach(function (l) {
      if (l.type === 'doc' ? l.path === path : path.indexOf(l.path + '/') === 0) fire(l);
    });
  }
  function listen(type, path, cb) {
    var l = { type: type, path: path, cb: cb };
    listeners.push(l);
    setTimeout(function () { fire(l); }, 0);
    return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
  }

  var db = {
    doc: function (path) {
      return {
        path: path,
        get: function () { return Promise.resolve(snapDoc(path)); },
        set: function (data) { store[path] = clone(data); persist(); notify(path); return Promise.resolve(); },
        delete: function () { delete store[path]; persist(); notify(path); return Promise.resolve(); },
        onSnapshot: function (cb) { return listen('doc', path, cb); }
      };
    },
    collection: function (path) {
      return { onSnapshot: function (cb) { return listen('col', path, cb); } };
    }
  };

  var me = { id: 'local-admin', name: '本機管理者', email: null, isOwner: true, canEdit: true };
  var user = {
    me: function () { return Promise.resolve(me); },
    id: function () { return Promise.resolve(me.id); },
    isOwner: function () { return Promise.resolve(true); },
    canEdit: function () { return Promise.resolve(true); },
    profiles: function (ids) {
      var out = {};
      ids.forEach(function (i) { out[i] = { id: i, name: '本機管理者' }; });
      return Promise.resolve(out);
    }
  };

  // 跨分頁同步
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    try { store = JSON.parse(e.newValue || '{}') || {}; } catch (err) { store = {}; }
    listeners.slice().forEach(fire);
  });

  window.LocalAdapter = {
    boot: function (view, cfg, downloads) {
      return Promise.resolve({
        db: db,
        user: user,
        downloads: downloads,
        mode: 'local',
        // 備份：匯出／匯入全部資料（JSON）
        backup: {
          exportJson: function () { return JSON.stringify({ app: 'clinic-shift-scheduler', version: 1, docs: store }, null, 2); },
          importJson: function (text) {
            var obj = JSON.parse(text);
            if (!obj || obj.app !== 'clinic-shift-scheduler' || typeof obj.docs !== 'object') throw new Error('這不是排班系統的備份檔');
            store = obj.docs; persist(); listeners.slice().forEach(fire);
          },
          clearAll: function () { store = {}; persist(); listeners.slice().forEach(fire); }
        }
      });
    }
  };
})();
