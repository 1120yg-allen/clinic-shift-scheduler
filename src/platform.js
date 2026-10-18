/*
 * Platform：把「資料庫、使用者、下載」三件事包成同一組介面，app.js 不需要知道資料存在哪裡。
 *   mode: 'local'    資料存在這個瀏覽器（單人試用、離線使用）
 *   mode: 'supabase' 資料存在 Supabase，員工用 email 驗證碼登入
 * 設定在 config.js。
 */
(function () {
  var browserDownloads = {
    save: function (req) {
      return new Promise(function (resolve, reject) {
        try {
          var blob = req.data instanceof Blob ? req.data : new Blob([req.data], { type: 'text/plain;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = req.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          resolve({ status: 'saved' });
        } catch (e) {
          reject({ code: 'unavailable', message: String(e) });
        }
      });
    }
  };

  window.Platform = {
    downloads: browserDownloads,
    boot: function (viewEl) {
      var cfg = window.APP_CONFIG || {};
      var mode = cfg.mode || 'local';
      if (mode === 'supabase') return window.SupabaseAdapter.boot(viewEl, cfg, browserDownloads);
      return window.LocalAdapter.boot(viewEl, cfg, browserDownloads);
    }
  };
})();
