/*
 * 設定檔。預設是「本機模式」：資料存在這個瀏覽器，直接開啟就能試用。
 * 要讓員工登入、畫休、換班，請改用 Supabase 模式（見 README）。
 */
window.APP_CONFIG = {
  // 'local'    資料存在這個瀏覽器（單人使用）
  // 'supabase' 資料存在 Supabase，員工用 email 驗證碼登入
  mode: 'local',

  // Supabase 模式才需要。這兩個值可以公開（anon key 本來就設計給前端用），
  // 資料的安全由 supabase/schema.sql 的 Row Level Security 負責。
  supabaseUrl: '',
  supabaseKey: '',

  // 通知文字裡的系統網址。留空就用目前網址。
  appUrl: '',

  // 補充政府行政機關辦公日曆（只填週一到週五的放假日，月日四碼），例如：
  // holidays: { 2027: ['0101', '0208', '0209'] },
  holidays: {}
};
