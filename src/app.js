/* ---------- 常數與日期工具 ---------- */
const WD=['一','二','三','四','五','六','日'];
const KINDS={work:'上班班別',fixed:'例假',rest:'休息日',holiday:'國定假日',leave:'其他假別'};
// 行政院人事行政總處辦公日曆表：平日(週一至週五)的放假日（含補假）。2026 年無補行上班日。
// 其他年度請在 config.js 的 holidays 補上，格式：{ 2027: ['0101', ...] }（月日，只填週一到週五的放假日）。
const HOL=Object.assign({2026:['0101','0216','0217','0218','0219','0220','0227','0403','0406','0501','0619','0925','0928','1009','1026','1225']},(window.APP_CONFIG&&window.APP_CONFIG.holidays)||{});
const REST_H=11, MAX_RUN=6, DAY_H=8, WEEK_H=40;
const pad=n=>String(n).padStart(2,'0');
const fmtD=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10));
const wdIdx=s=>(parse(s).getDay()+6)%7;
const addD=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return fmtD(d)};
const monthOf=s=>s.slice(0,7);
const monthDates=ym=>{const [y,m]=ym.split('-').map(Number);return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${ym}-${pad(i+1)}`)};
const shiftMonth=(ym,k)=>{const [y,m]=ym.split('-').map(Number);const d=new Date(y,m-1+k,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const md=s=>`${+s.slice(5,7)}/${+s.slice(8,10)}`;
const f1=n=>(Math.round(n*10)/10).toFixed(1);
const toMin=t=>{const [h,m]=(t||'00:00').split(':').map(Number);return h*60+m};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid8=()=>Math.random().toString(36).slice(2,8);
const CFG_V=2;
const APP_URL=(window.APP_CONFIG&&window.APP_CONFIG.appUrl)||location.href.split('#')[0].split('?')[0];
const PAY={full:'全薪',half:'半薪',none:'不給薪'};
// 勞基法、勞工請假規則、性別平等工作法的假別。天數與薪資都是預設值，管理者可以調整。
const LAW_LEAVES=[
 {id:'l_sick',label:'病假',kind:'leave',period:'year',quota:30,pay:'half',credit:4,color:1,selfPick:false,law:'普通傷病假：未住院一年內合計 30 日內，工資折半發給；住院 2 年內合計不得超過 1 年。（勞工請假規則第 4 條）'},
 {id:'l_personal',label:'事假',kind:'leave',period:'year',quota:14,pay:'none',credit:0,color:5,selfPick:true,law:'一年內合計不得超過 14 日，不給工資。（勞工請假規則第 7 條）'},
 {id:'l_marriage',label:'婚假',kind:'leave',period:'event',quota:8,pay:'full',credit:8,color:4,selfPick:true,law:'結婚給婚假 8 日，工資照給，應於結婚之日前 10 日起 3 個月內請畢。（勞工請假規則第 2 條）'},
 {id:'l_funeral8',label:'喪假8日',kind:'leave',period:'event',quota:8,pay:'full',credit:8,color:7,selfPick:false,law:'父母、養父母、繼父母、配偶喪亡：給喪假 8 日，工資照給。（勞工請假規則第 3 條）'},
 {id:'l_funeral6',label:'喪假6日',kind:'leave',period:'event',quota:6,pay:'full',credit:8,color:7,selfPick:false,law:'祖父母、子女、配偶之父母、配偶之養父母或繼父母喪亡：給喪假 6 日，工資照給。（勞工請假規則第 3 條）'},
 {id:'l_funeral3',label:'喪假3日',kind:'leave',period:'event',quota:3,pay:'full',credit:8,color:7,selfPick:false,law:'曾祖父母、兄弟姊妹、配偶之祖父母喪亡：給喪假 3 日，工資照給。（勞工請假規則第 3 條）'},
 {id:'l_official',label:'公假',kind:'leave',period:'year',quota:null,pay:'full',credit:8,color:2,selfPick:false,law:'依法令應給公假者，工資照給，天數視實際需要。（勞工請假規則第 8 條）'},
 {id:'l_injury',label:'公傷病假',kind:'leave',period:'year',quota:null,pay:'full',credit:8,color:5,selfPick:false,law:'職業災害的治療、休養期間，工資照給。（勞工請假規則第 6 條、勞基法第 59 條）'},
 {id:'l_menstrual',label:'生理假',kind:'leave',period:'year',quota:3,perMonth:1,pay:'half',credit:4,color:4,selfPick:true,law:'每月得請 1 日；全年 3 日內不併入病假，超過部分併入病假計算；薪資減半。（性別平等工作法第 14 條）'},
 {id:'l_maternity',label:'產假',kind:'leave',period:'event',quota:56,pay:'full',credit:8,color:4,selfPick:false,law:'分娩前後給產假 8 星期（約 56 日）；受僱 6 個月以上工資照給，未滿 6 個月減半。（性別平等工作法第 15 條）'},
 {id:'l_prenatal',label:'產檢假',kind:'leave',period:'event',quota:7,pay:'full',credit:8,color:4,selfPick:true,law:'妊娠期間給產檢假 7 日，工資照給。（性別平等工作法第 15 條）'},
 {id:'l_paternity',label:'陪產假',kind:'leave',period:'event',quota:7,pay:'full',credit:8,color:2,selfPick:false,law:'配偶分娩時，給陪產檢及陪產假 7 日，工資照給。（性別平等工作法第 15 條）'},
 {id:'l_family',label:'照顧假',kind:'leave',period:'year',quota:7,pay:'none',credit:0,color:5,countsAs:'l_personal',selfPick:true,law:'家庭照顧假每年 7 日，併入事假計算，不給工資。（性別平等工作法第 20 條）'}];
function leaveFields(o){
  if(o.annual) return '';
  const sel=(f,arr)=>arr.map(([v,l])=>`<option value="${v}" ${(o[f]||'')===v?'selected':''}>${l}</option>`).join('');
  return `<label class="field" style="width:100px">天數上限<input type="number" data-of="quota" min="0" max="400" step="0.5" value="${o.quota==null?'':o.quota}" placeholder="不限"></label>
      <label class="field" style="width:120px">計算方式<select data-of="period">${sel('period',[['year','每年累計'],['event','每次事件']])}</select></label>
      <label class="field" style="width:110px">薪資<select data-of="pay"><option value="" ${o.pay?'':'selected'}>未設定</option>${sel('pay',[['full','全薪'],['half','半薪'],['none','不給薪']])}</select></label>
      <label class="field" style="width:100px">每月上限<input type="number" data-of="perMonth" min="0" max="31" value="${o.perMonth||''}" placeholder="不限"></label>
      <label class="field" style="width:130px">併入計算<select data-of="countsAs"><option value="">不併入</option>${cfg.options.filter(x=>x.kind==='leave'&&!x.annual&&x.id!==o.id).map(x=>`<option value="${x.id}" ${o.countsAs===x.id?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label>
      ${o.law?`<div class="field" style="flex-basis:100%">依據<span style="font-size:12.5px;color:var(--ink)">${esc(o.law)}</span></div>`:''}`;
}

/* ---------- 狀態 ---------- */
let db=null,userCap=null,me=null,isAdmin=false,uid=null;
let swaps={},acks={},decisions={byId:{}};
let swapDraft={toEmp:'',type:'cover',dateA:'',dateB:'',reason:''};
let approved={byUid:{}};         // 管理者確認過的員工帳號
let people={},profileLoaded=false;   // 員工個人資料（管理者看得到全部，員工只看得到自己）
let downloadsCap=null;
const profileSubs=new Set();
let notes={byEmp:{}};            // 只有管理者讀得到：個人要求與備註
const noteOf=eid=>(isAdmin&&notes.byEmp&&notes.byEmp[eid])||{};
const touches=(o,s)=>!!o&&o.kind==='work'&&(o.ranges?o.ranges.some(r=>toMin(r.start)<toMin(s.end)&&toMin(r.end)>toMin(s.start)):(o.segs||[]).includes(s.id));
const bannedBy=(e,o)=>cfg.sessions.some(s=>(noteOf(e.id).noSessions||[]).includes(s.id)&&touches(o,s));
const prefOf=(e,ids)=>25*ids.filter(id=>(noteOf(e.id).prefSessions||[]).includes(id)).length;
const maxDaysOf=e=>Number(noteOf(e.id).maxDays)||0;
function personalOff(e,d){const n=noteOf(e.id);return (n.offDates||[]).includes(d)||((n.offWeekdays||[]).includes(wdIdx(d))&&isOpenDay(d))}
function weekWorkBefore(eid,d){let n=0;const st=addD(d,-wdIdx(d));for(let k=0;k<wdIdx(d);k++){const o=optOf(codeAt(eid,addD(st,k)));if(o&&o.kind==='work')n++}return n}
function noteSummary(n){
  const p=[],nm=id=>(cfg.sessions.find(s=>s.id===id)||{label:id}).label;
  if((n.offWeekdays||[]).length)p.push('固定休：週'+n.offWeekdays.map(i=>WD[i]).join('、'));
  if((n.noSessions||[]).length)p.push('不上：'+n.noSessions.map(nm).join('、'));
  if((n.prefSessions||[]).length)p.push('偏好：'+n.prefSessions.map(nm).join('、'));
  if((n.offDates||[]).length)p.push('指定休：'+n.offDates.map(md).join('、'));
  if(n.maxDays)p.push('每週最多上 '+n.maxDays+' 天');
  if(n.text&&n.text.trim())p.push(n.text.trim());
  return p.join('；');
}
const saveNotes=()=>writeDoc('notes/main',notes);
let cfg=undefined;               // undefined 載入中、null 尚未建立
let roster={};                   // ym -> {cells:{eid_date: optionId}}
let reqs={};                     // 使用者 id -> {empId, dates:{date:true}}
let profiles={};
let ym=fmtD(new Date()).slice(0,7), tab='pt', dbError='';

function defaultCfg(){
  return {
    v:CFG_V,
    sessions:[
      {id:'s1',label:'早診',start:'08:00',end:'12:00'},
      {id:'s2',label:'午診',start:'13:30',end:'17:30'},
      {id:'s3',label:'晚診',start:'17:30',end:'21:30'}],
    depts:[{id:'d_bone',label:'骨科'},{id:'d_peds',label:'小兒'}],
    demand:{
      wk:{d_bone:[2,3,2],d_peds:[1,2,1]},
      sat:{d_bone:[2,2,2],d_peds:[1,1,1]}},
    options:[
      {id:'o_bone_a',label:'骨早',kind:'work',dept:'d_bone',segs:['s1','s2'],credit:0,annual:false,color:0},
      {id:'o_bone_b',label:'骨晚',kind:'work',dept:'d_bone',segs:['s2','s3'],credit:0,annual:false,color:2},
      {id:'o_peds_a',label:'兒早',kind:'work',dept:'d_peds',segs:['s1','s2'],credit:0,annual:false,color:1},
      {id:'o_peds_b',label:'兒晚',kind:'work',dept:'d_peds',segs:['s2','s3'],credit:0,annual:false,color:4},
      {id:'o_manual',label:'徒手',kind:'work',dept:'',segs:['s2','s3'],credit:0,annual:false,color:4,selfPick:true},
      {id:'o_fixed',label:'例假',kind:'fixed',credit:0,annual:false,color:6,selfPick:true},
      {id:'o_rest',label:'休息日',kind:'rest',credit:0,annual:false,color:7,selfPick:true},
      {id:'o_hol',label:'國定假日',kind:'holiday',credit:0,annual:false,color:5},
      {id:'o_leave',label:'特休',kind:'leave',credit:8,annual:true,color:3,selfPick:true},...LAW_LEAVES.map(x=>({...x}))],
    asstDemand:{wk:[1,1,1],sat:[1,1,1]},
    employees:[],
    openDays:[0,1,2,3,4,5],
    holidayClosed:true,
    maxReq:8,
    maxManual:4,
    published:[],
    openMonths:[],
    dayOv:{}
  };
}

/* ---------- 行事曆、班別與時數 ---------- */
function dayType(s){
  const ov=cfg&&cfg.dayOv&&cfg.dayOv[s];
  if(ov==='work') return 'work';
  const w=wdIdx(s)>=5;
  if(ov==='off') return w?'weekend':'holiday';
  if(w) return 'weekend';
  const h=HOL[+s.slice(0,4)];
  return h&&h.includes(s.slice(5,7)+s.slice(8,10))?'holiday':'work';
}
const calendarKnown=ym=>!!HOL[+ym.slice(0,4)];
const workdaysOf=ym=>monthDates(ym).filter(d=>dayType(d)==='work').length;
const isClosedHoliday=d=>cfg.holidayClosed&&dayType(d)==='holiday';
const isOpenDay=d=>cfg.openDays.includes(wdIdx(d))&&!isClosedHoliday(d);
function optOf(id){
  if(!id) return undefined;
  if(id.startsWith('T:')){       // 助理用的診次組合，例如 T:s1+s3 = 早診＋晚診
    const ids=id.slice(2).split('+').filter(x=>cfg.sessions.some(s=>s.id===x));
    if(!ids.length) return undefined;
    const label=ids.length===cfg.sessions.length?'全':ids.map(x=>cfg.sessions.find(s=>s.id===x).label.slice(0,1)).join('');
    return {id,kind:'work',dept:null,segs:ids,label,color:8,credit:0,annual:false,asst:true};
  }
  if(id.startsWith('C:')){       // 助理的自訂時間，例如 C:09:00-13:00
    const [a,b]=id.slice(2).split('-');
    if(!a||!b||toMin(b)<=toMin(a)) return undefined;
    return {id,kind:'work',dept:null,segs:[],ranges:[{start:a,end:b}],label:'自訂',color:8,credit:0,annual:false,asst:true};
  }
  return cfg.options.find(o=>o.id===id);
}
const deptOf=id=>cfg.depts.find(x=>x.id===id);
const segsOf=o=>o&&o.ranges?o.ranges:(o&&o.segs||[]).map(id=>cfg.sessions.find(s=>s.id===id)).filter(Boolean);
const covers=(o,s)=>!!o&&o.kind==='work'&&(o.ranges?o.ranges.some(r=>toMin(r.start)<=toMin(s.start)&&toMin(r.end)>=toMin(s.end)):(o.segs||[]).includes(s.id));
const segHours=s=>(toMin(s.end)-toMin(s.start))/60;
const optHours=o=>o&&o.kind==='work'?segsOf(o).reduce((t,s)=>t+segHours(s),0):0;
function optSpan(o){const g=segsOf(o);return {start:Math.min(...g.map(s=>toMin(s.start))),end:Math.max(...g.map(s=>toMin(s.end)))}}
function optTimes(o){
  const g=segsOf(o).slice().sort((a,b)=>toMin(a.start)-toMin(b.start)),out=[];
  g.forEach(s=>{const l=out[out.length-1];if(l&&l[1]===s.start)l[1]=s.end;else out.push([s.start,s.end])});
  return out.map(x=>x.join('–')).join('、');
}
const demandFor=d=>wdIdx(d)>=5?cfg.demand.sat:cfg.demand.wk;
const canDo=(e,o)=>!o.dept||!e.depts||!e.depts.length||e.depts.includes(o.dept);
const isManual=o=>!!o&&o.kind==='work'&&!o.dept&&!o.asst;   // 徒手日：上班但不屬於任何科別
const codeAt=(eid,d)=>(roster[monthOf(d)]&&roster[monthOf(d)].cells&&roster[monthOf(d)].cells[eid+'_'+d])||'';
const reqOf=eid=>{const r=Object.values(reqs).filter(x=>x.empId===eid).pop();return (r&&r.dates)||{}};
const reqOpt=v=>v?((v===true?cfg.options.find(o=>o.kind==='rest'):cfg.options.find(o=>o.id===v))||null):null;
const reqCount=(eid,ym)=>Object.entries(reqOf(eid)).filter(([d,v])=>{const o=reqOpt(v);return monthOf(d)===ym&&o&&(o.kind==='fixed'||o.kind==='rest')}).length;
const manualCount=(eid,ym)=>Object.entries(reqOf(eid)).filter(([d,v])=>monthOf(d)===ym&&isManual(reqOpt(v))).length;
const myEmpId=()=>uid&&reqs[uid]?reqs[uid].empId:null;
const selfOptions=e=>cfg.options.filter(o=>o.selfPick&&(['fixed','rest','leave'].includes(o.kind)||(isManual(o)&&e.group==='pt')));
const isApproved=()=>!!(uid&&approved.byUid&&approved.byUid[uid]);
const myProfile=()=>uid?people[uid]:null;
const profileOk=p=>!!(p&&p.phone&&p.emName&&p.emPhone&&p.address);
function leaveDatesFor(e){
  const set={};
  annualCells(e).forEach(c=>set[c.date]=c.days);
  Object.entries(reqOf(e.id)).forEach(([d,v])=>{const o=reqOpt(v);if(o&&o.kind==='leave'&&o.annual)set[d]=(+o.credit||DAY_H)/DAY_H});
  return set;
}

function gapHours(p,c){return (1440-optSpan(p).end+optSpan(c).start)/60}
function runBefore(eid,d){
  let n=0,x=addD(d,-1);
  for(;;){const o=optOf(codeAt(eid,x));if(!o||o.kind!=='work')break;n++;x=addD(x,-1)}
  return n;
}
function weeksOfMonth(ym){
  const ds=monthDates(ym);let s=ds[0];s=addD(s,-wdIdx(s));
  const out=[];
  while(s<=ds[ds.length-1]){out.push(Array.from({length:7},(_,i)=>addD(s,i)));s=addD(s,7)}
  return out;
}

/* ---------- 年資與特休（勞基法第 38 條，週年制） ---------- */
function addMonthsD(s,k){
  const d=parse(s),day=d.getDate();
  d.setDate(1);d.setMonth(d.getMonth()+k);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));return fmtD(d);
}
function annualDays(n){return n>=10?Math.min(30,16+(n-10)):n>=5?15:n>=3?14:n>=2?10:n>=1?7:0}
// 回傳 ref 那天所在的特休年度：{start,end,days,years}。end 為下一個年度的第一天。
function leavePeriod(hire,ref){
  if(!hire||ref<hire) return null;
  const six=addMonthsD(hire,6);
  if(ref<six) return {start:hire,end:six,days:0,years:0,early:true};
  let n=0;while(addMonthsD(hire,12*(n+1))<=ref)n++;
  if(n===0) return {start:six,end:addMonthsD(hire,12),days:3,years:0};
  return {start:addMonthsD(hire,12*n),end:addMonthsD(hire,12*(n+1)),days:annualDays(n),years:n};
}
function tenure(hire,ref){
  if(!hire||ref<hire) return '–';
  const a=parse(hire),b=parse(ref);
  let m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth()-(b.getDate()<a.getDate()?1:0);
  return `${Math.floor(m/12)} 年 ${m%12} 個月`;
}
const manualLeave=e=>e&&e.leaveManual!=null&&e.leaveManual!==''&&!isNaN(+e.leaveManual)?+e.leaveManual:null;
const autoLeave=(e,p)=>p?p.days*Math.min(1,+e.ratio||1):0;   // 勞基法天數，部分工時依工時比例
const entitled=(e,p)=>{if(!p) return 0;const m=manualLeave(e);return m!=null?m:autoLeave(e,p)};   // 手動天數優先
function annualCells(e){
  const out=[];
  Object.keys(roster).forEach(m=>{
    const c=(roster[m]&&roster[m].cells)||{};
    Object.keys(c).forEach(k=>{
      if(!k.startsWith(e.id+'_')) return;
      const o=optOf(c[k]);
      if(o&&o.kind==='leave'&&o.annual) out.push({date:k.slice(e.id.length+1),days:(+o.credit||DAY_H)/DAY_H});
    });
  });
  return out.sort((a,b)=>a.date<b.date?-1:1);
}
function leaveInfo(e,ref){
  const p=leavePeriod(e.hire,ref);
  if(!p) return {p:null,total:0,auto:0,manual:null,used:0,left:0};
  const used=annualCells(e).filter(c=>c.date>=p.start&&c.date<p.end).reduce((t,c)=>t+c.days,0);
  const total=entitled(e,p);
  return {p,total,auto:autoLeave(e,p),manual:manualLeave(e),used,left:total-used};
}

function leaveMap(e,withReqs){
  const m={};
  Object.keys(roster).forEach(mo=>{const c=(roster[mo]&&roster[mo].cells)||{};Object.keys(c).forEach(k=>{if(!k.startsWith(e.id+'_'))return;const o=optOf(c[k]);if(o&&o.kind==='leave')m[k.slice(e.id.length+1)]=o})});
  if(withReqs) Object.entries(reqOf(e.id)).forEach(([d,v])=>{const o=reqOpt(v);if(o&&o.kind==='leave')m[d]=o});
  return m;
}
const countsFor=(o,x)=>x.id===o.id||x.countsAs===o.id;
function leaveQuota(e,o){const a=e.leaveAdj&&e.leaveAdj[o.id];if(a!=null&&a!=='') return Number(a);return o.quota==null||o.quota===''?null:Number(o.quota)}
function leaveUsedYear(e,o,year,withReqs,except){
  let n=0;
  Object.entries(leaveMap(e,withReqs)).forEach(([d,x])=>{if(d.slice(0,4)===String(year)&&d!==except&&countsFor(o,x))n++});
  return n;
}

/* ---------- 檢查 ---------- */
const GROUPS={pt:'物理治療師',asst:'助理'};
const asstDemandFor=d=>(wdIdx(d)>=5?cfg.asstDemand.sat:cfg.asstDemand.wk)||[];
function analyze(ym,group){
  const emps=cfg.employees.filter(e=>e.group===group);
  const ds=monthDates(ym),warn=new Map(),msgs=[];
  const flag=(k,m)=>warn.set(k,(warn.get(k)||[]).concat(m));
  emps.forEach(e=>{
    const rq=reqOf(e.id);
    ds.forEach(d=>{
      const code=codeAt(e.id,d),o=optOf(code),k=e.id+'_'+d;
      if(code&&!o){flag(k,'此選項已被刪除');return}
      const ro=reqOpt(rq[d]);
      if(ro&&code&&code!==ro.id){
        const bothOff=o&&o.kind!=='work'&&ro.kind!=='leave';
        if(!bothOff){flag(k,'與畫休不同');msgs.push(`${e.name} ${md(d)} 畫了「${ro.label}」，班表卻是「${o.label}」`)}
      }
      if(!o||o.kind!=='work') return;
      if(optHours(o)>12){flag(k,'工時過長');msgs.push(`${e.name} ${md(d)} 單日工時 ${f1(optHours(o))} 小時，超過 12 小時`)}
      if(!canDo(e,o)){flag(k,'非可上科別');msgs.push(`${e.name} ${md(d)} 排了${deptOf(o.dept)?deptOf(o.dept).label:''}，但不在可上科別內`)}
      const p=optOf(codeAt(e.id,addD(d,-1)));
      if(p&&p.kind==='work'&&gapHours(p,o)<REST_H){
        flag(k,'間隔不足');msgs.push(`${e.name} ${md(d)} 與前一天只間隔 ${f1(gapHours(p,o))} 小時，需至少 ${REST_H} 小時`)}
      const run=runBefore(e.id,d);
      if(run>=MAX_RUN){flag(k,'連續上班');msgs.push(`${e.name} 到 ${md(d)} 已連續上班 ${run+1} 天，需要休息`)}
      if(group==='asst'&&(o.dept||isManual(o))){flag(k,'助理不排治療師班別');msgs.push(`${e.name} ${md(d)} 是助理，不能排治療師班別或徒手日「${o.label}」（助理不支援小兒）`)}
      const nt=noteOf(e.id);
      const bs=cfg.sessions.filter(x=>(nt.noSessions||[]).includes(x.id)&&touches(o,x));
      if(bs.length){flag(k,'個人要求');msgs.push(`${e.name} ${md(d)} 的班包含${bs.map(x=>x.label).join('、')}，但個人要求不上`)}
      if((nt.offWeekdays||[]).includes(wdIdx(d))){flag(k,'個人要求');msgs.push(`${e.name} ${md(d)} 是週${WD[wdIdx(d)]}，個人要求固定休`)}
      if((nt.offDates||[]).includes(d)){flag(k,'個人要求');msgs.push(`${e.name} ${md(d)} 是個人要求休息的日子`)}
    });
    weeksOfMonth(ym).forEach(w=>{
      const codes=w.map(d=>optOf(codeAt(e.id,d)));
      const lastIn=w.filter(d=>monthOf(d)===ym).pop();
      const h=codes.reduce((t,o)=>t+optHours(o),0);
      if(h>WEEK_H) msgs.push(`${e.name} ${md(w[0])}–${md(w[6])} 這週工時 ${f1(h)} 小時，超過 ${WEEK_H} 小時`);
      const mx=maxDaysOf(e),wk=codes.filter(o=>o&&o.kind==='work').length;
      if(mx&&wk>mx){flag(e.id+'_'+lastIn,'個人要求');msgs.push(`${e.name} ${md(w[0])}–${md(w[6])} 上班 ${wk} 天，個人要求每週最多 ${mx} 天`)}
      if(group==='asst'){
        // 助理沒排班的日子就是休息：一週至少 2 天不上班（1 例假＋1 休息日）
        const off=codes.filter(o=>!o||o.kind!=='work').length;
        if(off<2){flag(e.id+'_'+lastIn,'休息不足');msgs.push(`${e.name} ${md(w[0])}–${md(w[6])} 這週只休 ${off} 天，需要例假與休息日各 1 天`)}
        return;
      }
      if(w.some(d=>!codeAt(e.id,d))) return;       // 還沒排滿的週不判斷
      const nF=codes.filter(o=>o&&o.kind==='fixed').length,nR=codes.filter(o=>o&&o.kind==='rest').length;
      if(!nF){flag(e.id+'_'+lastIn,'無例假');msgs.push(`${e.name} ${md(w[0])}–${md(w[6])} 這週沒有例假`)}
      else if(!nR){flag(e.id+'_'+lastIn,'無休息日');msgs.push(`${e.name} ${md(w[0])}–${md(w[6])} 這週沒有休息日`)}
    });
    // 特休：同一特休年度內排的天數不得超過法定天數
    const groups={};
    annualCells(e).forEach(c=>{
      const p=leavePeriod(e.hire,c.date),key=p?p.start:'none';
      (groups[key]=groups[key]||{p,days:0,inMonth:false}).days+=c.days;
      if(monthOf(c.date)===ym) groups[key].inMonth=true;
    });
    Object.values(groups).forEach(g=>{
      if(!g.inMonth) return;
      if(!g.p) msgs.push(`${e.name} 排了特休，但還沒設定到職日或尚未到職`);
      else if(g.days>entitled(e,g.p)+0.001) msgs.push(`${e.name} ${md(g.p.start)}起這個特休年度已排 ${f1(g.days)} 天，超過可休 ${f1(entitled(e,g.p))} 天`);
    });
    // 其他假別：天數上限、每月上限、單次事件天數
    cfg.options.filter(o=>o.kind==='leave'&&!o.annual).forEach(o=>{
      const ent=Object.entries(leaveMap(e,false)).filter(([,x])=>x.id===o.id).map(([dd])=>dd).sort();
      if(!ent.some(dd=>monthOf(dd)===ym)) return;
      const q=leaveQuota(e,o);
      if(o.period==='event'){
        if(q!=null){
          let run=0,mx=0,prev=null;
          ent.forEach(dd=>{run=prev&&(parse(dd)-parse(prev))/86400000<=3?run+1:1;mx=Math.max(mx,run);prev=dd});
          if(mx>q+0.001) msgs.push(`${e.name} 的${o.label}連續排了 ${mx} 天，超過單次上限 ${f1(q)} 天`);
        }
      } else {
        const y=+ym.slice(0,4),used=leaveUsedYear(e,o,y);
        if(q!=null&&used>q+0.001) msgs.push(`${e.name} ${y} 年${o.label}已排 ${f1(used)} 天（含併入的假別），超過 ${f1(q)} 天`);
        if(o.perMonth){const n=ent.filter(dd=>monthOf(dd)===ym).length;if(n>o.perMonth) msgs.push(`${e.name} ${+ym.slice(5)} 月${o.label}排了 ${n} 天，每月最多 ${o.perMonth} 天`)}
      }
    });
  });
  // 診次人力：治療師依科別，助理合計
  const rowsDef=group==='pt'?cfg.depts:[{id:'asst',label:'助理'}];
  const cov=ds.map(d=>{
    const open=isOpenDay(d);
    return rowsDef.map(dp=>{
      const dm=group==='pt'?(demandFor(d)[dp.id]||[]):asstDemandFor(d);
      const n=cfg.sessions.map(s=>emps.filter(e=>{const o=optOf(codeAt(e.id,d));return covers(o,s)&&(group==='asst'||o.dept===dp.id)}).length);
      const need=cfg.sessions.map((s,i)=>open?(dm[i]||0):0);
      return {dp,n,need,open,short:n.map((x,i)=>Math.max(0,need[i]-x))};
    });
  });
  cov.forEach((day,i)=>day.forEach(c=>c.short.forEach((sh,j)=>{
    if(sh) msgs.push(`${md(ds[i])}(${WD[wdIdx(ds[i])]}) ${c.dp.label}${cfg.sessions[j].label}少 ${sh} 人（需要 ${c.need[j]}，目前 ${c.n[j]}）`);
  })));
  return {warn,msgs,cov};
}

function summaryOf(e,ym){
  const ds=monthDates(ym);
  let work=0,credit=0,fx=0,rs=0,holWork=0;
  ds.forEach(d=>{
    const o=optOf(codeAt(e.id,d));if(!o)return;
    if(o.kind==='work'){work+=optHours(o);if(dayType(d)==='holiday')holWork++}
    else if(o.kind==='leave') credit+=+o.credit||0;
    else if(o.kind==='fixed') fx++;
    else if(o.kind==='rest') rs++;
  });
  const base=workdaysOf(ym)*DAY_H*(+e.ratio||1);
  const weekly=weeksOfMonth(ym).map(w=>{
    const inM=w.filter(d=>monthOf(d)===ym);
    return {label:`${md(inM[0])}–${md(inM[inM.length-1])}`,h:inM.reduce((t,d)=>t+optHours(optOf(codeAt(e.id,d))),0)};
  });
  return {work,credit,fx,rs,holWork,base,diff:work+credit-base,weekly,req:reqCount(e.id,ym)};
}

/* ---------- 寫入資料庫 ---------- */
const queues={};
function writeDoc(path,data){
  if(!db) return;
  const q=queues[path]||(queues[path]={busy:false,next:null});
  q.next=data;if(q.busy)return;q.busy=true;
  (async()=>{
    while(q.next){const d=q.next;q.next=null;
      try{await db.doc(path).set(d)}catch(err){writeFail(err)}}
    q.busy=false;
  })();
}
function writeFail(err){
  const c=err&&err.code;
  toast(c==='invalid_argument'?'沒有寫入權限，請洽管理者確認你的 email 已加入名單':c==='quota_exceeded'?'資料庫已滿':'儲存失敗，請稍後再試');
}
const saveCfg=()=>writeDoc('config/main',cfg);
function setLocal(eid,d,code){
  const m=monthOf(d);
  const cells={...((roster[m]&&roster[m].cells)||{})};
  if(code)cells[eid+'_'+d]=code;else delete cells[eid+'_'+d];
  roster[m]={cells};
}
const flushMonth=m=>writeDoc('roster/'+m,roster[m]||{cells:{}});

/* ---------- 自動排班 ---------- */
function autoMonth(group){
  const works=cfg.options.filter(o=>o.kind==='work'&&o.dept&&segsOf(o).length);
  const oF=cfg.options.find(o=>o.kind==='fixed'),oR=cfg.options.find(o=>o.kind==='rest');
  const oH=cfg.options.find(o=>o.kind==='holiday');
  const E=cfg.employees.filter(e=>e.group===group),ds=monthDates(ym);
  if((group==='pt'&&!works.length)||!oF||!oR||!E.length){toast('需要例假、休息日選項，以及這組至少一位人員（治療師還需要上班班別）');return}
  E.forEach(e=>ds.forEach(d=>{const o=optOf(codeAt(e.id,d));if(!o||o.kind!=='leave')setLocal(e.id,d,'')}));
  // 員工自己畫的例假、休息日、特休、徒手日：先照要求排進去
  E.forEach(e=>{const rq=reqOf(e.id);ds.forEach(d=>{const ro=reqOpt(rq[d]);if(!ro||!isOpenDay(d)) return;if(isManual(ro)&&e.group!=='pt') return;setLocal(e.id,d,ro.id)})});
  const hrs={},cnt={},target={};
  E.forEach(e=>{hrs[e.id]=ds.reduce((t,d)=>{const o=optOf(codeAt(e.id,d));return t+(isManual(o)?optHours(o):0)},0);cnt[e.id]={};target[e.id]=workdaysOf(ym)*DAY_H*(+e.ratio||1)});
  const offCount={},offG={};
  const grp=e=>e.depts&&e.depts.length===1?e.depts[0]:'any';
  const addOff=(e,d)=>{offCount[d]=(offCount[d]||0)+1;const k=d+'|'+grp(e);offG[k]=(offG[k]||0)+1};
  const totalOpen=ds.filter(isOpenDay).length||1;
  let doneOpen=0;
  // 助理可排的診次組合（一天最多 8 小時）
  const pats=[];
  for(let m=1;m<(1<<cfg.sessions.length);m++){
    const idx=cfg.sessions.map((s,i)=>i).filter(i=>m&(1<<i));
    const h=idx.reduce((t,i)=>t+segHours(cfg.sessions[i]),0);
    if(h<=DAY_H) pats.push({idx,h,o:optOf('T:'+idx.map(i=>cfg.sessions[i].id).join('+'))});
  }
  weeksOfMonth(ym).forEach(w=>{
    const inM=w.filter(d=>monthOf(d)===ym);
    const closed=inM.filter(d=>!isClosedHoliday(d)&&!cfg.openDays.includes(wdIdx(d)));
    const lastClosed=closed[closed.length-1];
    E.forEach((e,idx)=>{
      const preF=w.some(dd=>{const o=optOf(codeAt(e.id,dd));return o&&o.kind==='fixed'});
      let nF=0,nR=0;
      inM.forEach(d=>{
        if(codeAt(e.id,d)) {const o=optOf(codeAt(e.id,d));if(o&&o.kind==='fixed')nF++;if(o&&o.kind==='rest')nR++;if(o&&(o.kind==='fixed'||o.kind==='rest'||o.kind==='leave'))addOff(e,d);return}
        let o=null;
        if(isClosedHoliday(d)) o=oH||oR;
        else if(closed.includes(d)) o=(d===lastClosed&&!preF)?oF:oR;
        else if(personalOff(e,d)) o=oR;
        if(o){setLocal(e.id,d,o.id);addOff(e,d);if(o.kind==='fixed')nF++;if(o.kind==='rest')nR++}
      });
      // 跨月的那一週，把另一個月已排好的例假、休息日也算進來
      w.filter(d=>monthOf(d)!==ym).forEach(d=>{const o=optOf(codeAt(e.id,d));if(o&&o.kind==='fixed')nF++;if(o&&o.kind==='rest')nR++});
      const pick=(opt)=>{
        const c=inM.filter(d=>!codeAt(e.id,d)&&isOpenDay(d)).sort((a,b)=>(offG[a+'|'+grp(e)]||0)-(offG[b+'|'+grp(e)]||0)||(offCount[a]||0)-(offCount[b]||0)||((wdIdx(b)+idx)%7)-((wdIdx(a)+idx)%7))[0];
        if(c){setLocal(e.id,c,opt.id);addOff(e,c)}
      };
      // 延伸到下個月的那一週：下個月還有 2 個以上營業日時，留給下個月排班時補足
      if(w.filter(d=>d>ds[ds.length-1]&&isOpenDay(d)).length>=2) return;
      if(!nF)pick(oF);
      if(!nR)pick(oR);
    });
    inM.forEach(d=>{
      if(!isOpenDay(d)) return;
      doneOpen++;
      if(group==='pt'){
        const dm=demandFor(d),cover={};
        cfg.depts.forEach(x=>cover[x.id]=cfg.sessions.map(()=>0));
        let avail=E.filter(e=>{
          if(codeAt(e.id,d)) return false;
          if(runBefore(e.id,d)>=MAX_RUN||(maxDaysOf(e)&&weekWorkBefore(e.id,d)>=maxDaysOf(e))){setLocal(e.id,d,oR.id);return false}
          return true;
        });
        while(avail.length){
          let best=null;
          avail.forEach(e=>works.forEach(o=>{
            if(!canDo(e,o)||bannedBy(e,o)) return;
            const p=optOf(codeAt(e.id,addD(d,-1)));
            if(p&&p.kind==='work'&&gapHours(p,o)<REST_H) return;
            const need=dm[o.dept]||[];
            let gain=0,cov=0;
            cfg.sessions.forEach((s,i)=>{
              if(!o.segs.includes(s.id)) return;
              if((need[i]||0)-cover[o.dept][i]>0) gain++;
              cov+=cover[o.dept][i];
            });
            const flex=!e.depts||!e.depts.length||e.depts.length>1;   // 可跨科的人盡量留給缺人的科
            const sc=gain*1000-hrs[e.id]/(+e.ratio||1)-cov*0.5+(cnt[e.id][o.dept]||0)*0.05-(flex?30:0)+prefOf(e,o.segs);
            if(!best||sc>best.sc) best={e,o,sc};
          }));
          if(!best){avail.forEach(e=>setLocal(e.id,d,oR.id));break}
          setLocal(best.e.id,d,best.o.id);
          hrs[best.e.id]+=optHours(best.o);
          cnt[best.e.id][best.o.dept]=(cnt[best.e.id][best.o.dept]||0)+1;
          cfg.sessions.forEach((s,i)=>{if(best.o.segs.includes(s.id))cover[best.o.dept][i]++});
          avail=avail.filter(x=>x!==best.e);
        }
      } else {
        // 助理：先補各診次缺額，再依月進度補到應上班時數；沒排的日子就是休息
        const need=asstDemandFor(d),cover=cfg.sessions.map(()=>0),pace=doneOpen/totalOpen;
        let avail=E.filter(e=>!codeAt(e.id,d)&&runBefore(e.id,d)<MAX_RUN&&!(maxDaysOf(e)&&weekWorkBefore(e.id,d)>=maxDaysOf(e)));
        while(avail.length){
          let best=null;
          avail.forEach(e=>{
            const remain=target[e.id]-hrs[e.id];
            const prev=optOf(codeAt(e.id,addD(d,-1)));
            pats.forEach(p=>{
              if(!p.o||remain<p.h-2) return;
              if(p.idx.some(i=>(noteOf(e.id).noSessions||[]).includes(cfg.sessions[i].id))) return;
              if(prev&&prev.kind==='work'&&gapHours(prev,p.o)<REST_H) return;
              let gain=0,sc=0;
              p.idx.forEach(i=>{if((need[i]||0)-cover[i]>0)gain++;sc-=cover[i]*5});
              if(!gain&&hrs[e.id]+p.h>target[e.id]*pace+2) return;
              sc+=gain*1000-(p.idx.length-gain)*60+remain+prefOf(e,p.idx.map(i=>cfg.sessions[i].id));
              if(!best||sc>best.sc) best={e,p,sc};
            });
          });
          if(!best) break;
          setLocal(best.e.id,d,best.p.o.id);
          hrs[best.e.id]+=best.p.h;
          best.p.idx.forEach(i=>cover[i]++);
          avail=avail.filter(x=>x!==best.e);
        }
      }
    });
  });
  flushMonth(ym);
}

/* ---------- 勞基法與診所規則（參考頁） ---------- */
const flow=steps=>`<div class="flow">${steps.map((s,i)=>`${i?'<b class="arr" aria-hidden="true">→</b>':''}<span>${s}</span>`).join('')}</div>`;
const rtable=(heads,rows)=>`<div class="scroll"><table class="rt"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const bullets=l=>`<ul class="bl">${l.map(x=>`<li>${x}</li>`).join('')}</ul>`;
const callout=t=>`<div class="callout">${t}</div>`;
const sect=(title,body,open)=>`<details class="rsec" ${open?'open':''}><summary>${title}</summary><div class="rbody">${body}</div></details>`;

function mdLite(src){
  const lines=String(src||'').split(/\r?\n/);let out='',inList=false,para=[];
  const flush=()=>{if(para.length){out+=`<p style="margin:0;font-size:14px;line-height:1.7">${para.join('<br>')}</p>`;para=[]}};
  const closeList=()=>{if(inList){out+='</ul>';inList=false}};
  lines.forEach(l=>{
    const t=l.trim();
    if(!t){flush();closeList();return}
    let m;
    if((m=t.match(/^#{1,3}\s+(.*)$/))){flush();closeList();out+=`<h4>${esc(m[1])}</h4>`}
    else if((m=t.match(/^[-*]\s+(.*)$/))){flush();if(!inList){out+='<ul class="bl">';inList=true}out+=`<li>${esc(m[1])}</li>`}
    else{closeList();para.push(esc(t))}
  });
  flush();closeList();return out;
}
function rulesHTML(){
  const law=sect('勞基法：工時、休息與例假',`
    ${rtable(['項目','規定','條文'],[
      ['正常工時','每日 8 小時、每週 40 小時','第 30 條'],
      ['延長工時','每日正常工時加延長工時不得超過 12 小時；每月延長工時以 46 小時為限','第 32 條'],
      ['休息時間','連續工作 4 小時，至少要有 30 分鐘休息','第 35 條'],
      ['輪班間隔','更換班次時，至少要有連續 11 小時休息','第 34 條'],
      ['一例一休','每 7 日中至少 2 日休息，其中 1 日是例假、1 日是休息日','第 36 條'],
      ['例假日','原則上不得出勤；天災、事變等法定情形才可，且要加倍發給工資並補假','第 36、40 條'],
      ['休息日出勤','前 2 小時加給 1.34 倍，第 3 小時起 1.67 倍；出勤 4 小時內以 4 小時計，逾 4 至 8 小時以 8 小時計，逾 8 至 12 小時以 12 小時計','第 24 條'],
      ['平日加班','延長工時前 2 小時加給 1.34 倍，再延長 1.67 倍','第 24 條'],
      ['國定假日','應放假；經勞工同意出勤，工資加倍發給','第 37、39 條']])}
    ${callout('診所的班別如果連續工作超過 4 小時（例如午診接晚診 13:30–21:30 共 8 小時），中間仍需要安排至少 30 分鐘休息。這個系統的工時照診次時間加總，不另外扣除休息。')}`,true);
  const leave=sect('勞基法：特別休假（第 38 條，週年制）',`
    ${rtable(['到職年資','特休天數'],[
      ['滿 6 個月未滿 1 年','3 天'],['滿 1 年未滿 2 年','7 天'],['滿 2 年未滿 3 年','10 天'],
      ['滿 3 年未滿 5 年','每年 14 天'],['滿 5 年未滿 10 年','每年 15 天'],
      ['滿 10 年以上','每多 1 年加 1 天，最多 30 天（滿 10 年 16 天）']])}
    ${bullets([
      '特休年度以到職日起算，每滿一個週年換新年度。',
      '年度結束或契約終止時沒休完的天數，雇主要發給工資。',
      '部分工時人員依工作時數比例計算特休。',
      '公司給的天數可以比法定多，不能比法定少。在「設定」每位人員可以手動填特休天數，留空就是依勞基法自動帶入。'])}`);
  const leaveLaw=sect('勞基法：各種假別（天數與薪資）',`
    ${rtable(['假別','天數','計算','薪資','依據'],LAW_LEAVES.map(x=>[x.label,x.quota==null?'依實際需要':x.quota+' 天',x.period==='event'?'每次事件':'每年累計',PAY[x.pay],x.law]))}
    ${callout('這些是法定的最低標準，公司給得比較多沒問題。在「設定」可以調整每個假別的天數、薪資與折算工時，也可以單獨調整每位人員。一年的計算方式這裡用曆年（1 月到 12 月），正式規定以勞動部公告為準。')}`);
  const system=sect('這個排班系統會檢查的規則',`
    ${rtable(['規則','內容'],[
      ['一例一休','每週（週一到週日）要有 1 天例假、1 天休息日。助理沒排班的日子視為休息，每週至少 2 天不上班'],
      ['連續上班','最多連續 6 天'],
      ['班次間隔','兩班之間至少休息 11 小時，晚診接隔天早診會被標紅'],
      ['每週工時','超過 40 小時會標紅'],
      ['特休','同一特休年度排的天數超過人員的特休天數會提醒'],
      ['最低人力','治療師依科別、診次檢查；助理只計入助理的最低人數'],
      ['助理','助理只做骨科的支援，不計入骨科治療師的最低人力，也不支援小兒'],
      ['個人要求','管理者在人員備註裡設定的固定休、不上的診次、指定日期，自動排班會優先照辦，違反時會標出來'],
      ['員工畫休','員工可以畫例假、休息日、特休、徒手日（管理者在設定裡決定開放哪些）。休息類有每月上限，特休不能超過剩餘天數，徒手日有每月上限；自動排班會先照畫的排進去'],
      ['班表公布','班表預設是草稿，員工看不到排班內容，只看得到畫休。按「公布本月班表」後員工才看得到'],
      ['換班','員工提出（代班或互換）→ 對方同意 → 管理者核准，核准後班表才會改。核准前會預覽有沒有新增違規'],
      ['通知','頁面不能自己發 LINE 或寄信。班表頁有「用 LINE 分享」和「複製」按鈕，內容幫你準備好，你送出就好']])}`);
  const mine=cfg.clinicRules&&cfg.clinicRules.trim()
    ?sect('診所內部規則',mdLite(cfg.clinicRules),true)
    :(isAdmin?'<div class="panel sec"><p class="hint" style="margin:0">還沒有診所內部規則。到「設定」的「診所內部規則」可以自己寫，會顯示在這裡。</p></div>':'');
  return `<div class="panel sec"><h2>勞基法與診所規則</h2>
    <p class="hint" style="margin:0">勞基法部分是整理後的重點，供排班時對照，正式內容以勞動部公告為準。點標題可以展開或收合。</p></div>
  ${law}${leave}${leaveLaw}${system}${mine}`;
}

/* ---------- 換班：員工提出、對方同意、管理者核准 ---------- */
const swapLabel={wait_peer:'等對方回覆',declined:'對方不同意',wait_admin:'等管理者核准',approved:'已核准',rejected:'已拒絕'};
const uidsOfEmp=eid=>Object.entries(reqs).filter(([,r])=>r.empId===eid).map(([u])=>u);
function allSwaps(){
  const out=[];
  Object.entries(swaps).forEach(([u,doc])=>Object.values((doc&&doc.items)||{}).forEach(p=>out.push({...p,uid:u})));
  return out.sort((a,b)=>a.createdAt<b.createdAt?1:-1);
}
function swapStatus(p){
  const dec=decisions.byId[p.id];
  if(dec) return dec.status;
  const v=uidsOfEmp(p.toEmp).map(u=>acks[u]&&acks[u].byId&&acks[u].byId[p.id]).filter(Boolean);
  if(v.includes('no')) return 'declined';
  return v.includes('yes')?'wait_admin':'wait_peer';
}
const empName=id=>(cfg.employees.find(e=>e.id===id)||{name:'（已刪除）'}).name;
const codeLabel=c=>{const o=optOf(c);return o?(o.kind==='work'?`${o.label}`:o.label):'休／未排'};
function swapCellsLocal(a,b,d){const ca=codeAt(a,d),cb=codeAt(b,d);setLocal(a,d,cb);setLocal(b,d,ca)}
function applySwapLocal(p){swapCellsLocal(p.fromEmp,p.toEmp,p.dateA);if(p.type==='swap'&&p.dateB&&p.dateB!==p.dateA)swapCellsLocal(p.fromEmp,p.toEmp,p.dateB)}
function swapStale(p){
  if(codeAt(p.fromEmp,p.dateA)!==p.fromCode||codeAt(p.toEmp,p.dateA)!==p.toCodeA) return true;
  if(p.type==='swap'&&p.dateB&&(codeAt(p.fromEmp,p.dateB)!==p.fromCodeB||codeAt(p.toEmp,p.dateB)!==p.toCodeB)) return true;
  return false;
}
function swapIssues(p){
  const grp=(cfg.employees.find(e=>e.id===p.fromEmp)||{}).group||'pt';
  const mo=[...new Set([monthOf(p.dateA),p.dateB?monthOf(p.dateB):monthOf(p.dateA)])];
  const before=new Set(mo.flatMap(m=>analyze(m,grp).msgs));
  const bak=JSON.stringify(roster);let after=[];
  try{applySwapLocal(p);after=mo.flatMap(m=>analyze(m,grp).msgs)}finally{roster=JSON.parse(bak)}
  return after.filter(m=>!before.has(m));
}
function workDatesOf(eid){
  const today=fmtD(new Date()),out=[];
  Object.keys(roster).sort().forEach(m=>{
    if(!cfg.published.includes(m)) return;
    monthDates(m).forEach(d=>{if(d>=today){const o=optOf(codeAt(eid,d));if(o&&o.kind==='work')out.push(d)}});
  });
  return out.slice(0,45);
}
function swapHTML(){
  const mine=myEmpId(),list=allSwaps();
  const visible=isAdmin?list:list.filter(p=>p.fromEmp===mine||p.toEmp===mine);
  const opt=(v,l,sel)=>`<option value="${v}" ${sel?'selected':''}>${esc(l)}</option>`;
  let form='';
  if(!isAdmin){
    if(!isApproved()) form='<div class="notice">資料要先經管理者確認綁定，才能申請換班。</div>';
    else{
      const me2=cfg.employees.find(e=>e.id===mine);
      const myDates=workDatesOf(mine);
      const partners=cfg.employees.filter(e=>e.group===me2.group&&e.id!==mine);
      const dr=swapDraft;
      const partnerDates=dr.toEmp?workDatesOf(dr.toEmp).filter(d=>d!==dr.dateA):[];
      form=`<div class="panel sec"><h2>申請換班</h2>
        <p class="hint" style="margin:0 0 10px">只能換已公布月份、今天以後的班。流程：你提出 → 對方同意 → 管理者核准，核准後班表才會改。</p>
        ${myDates.length?`<div class="rf">
          <label class="field">我要換掉哪天的班<select data-sw="dateA"><option value="">請選擇</option>${myDates.map(d=>opt(d,`${md(d)}（${WD[wdIdx(d)]}）${codeLabel(codeAt(mine,d))}`,dr.dateA===d)).join('')}</select></label>
          <label class="field">跟誰換<select data-sw="toEmp"><option value="">請選擇</option>${partners.map(e=>opt(e.id,e.name,dr.toEmp===e.id)).join('')}</select></label>
          <label class="field">方式<select data-sw="type">${opt('cover','代班：對方接我這天的班',dr.type==='cover')}${opt('swap','互換：我也接對方另一天的班',dr.type==='swap')}</select></label>
          ${dr.type==='swap'?`<label class="field">對方的哪一天<select data-sw="dateB"><option value="">請選擇</option>${partnerDates.map(d=>opt(d,`${md(d)}（${WD[wdIdx(d)]}）${codeLabel(codeAt(dr.toEmp,d))}`,dr.dateB===d)).join('')}</select></label>`:''}
          <label class="field" style="grid-column:1/-1">原因（選填）<input type="text" data-sw="reason" value="${esc(dr.reason||'')}" maxlength="60"></label>
          <div style="grid-column:1/-1"><button class="btn primary" data-swsubmit="1">送出申請</button></div></div>`
        :'<p class="hint">目前沒有已公布、今天以後的班可以換。</p>'}</div>`;
    }
  }
  const rows=visible.map(p=>{
    const st=swapStatus(p),mineP=p.fromEmp===mine,toMe=p.toEmp===mine;
    const desc=p.type==='swap'
      ?`${empName(p.fromEmp)} 的 ${md(p.dateA)}（${codeLabel(p.fromCode)}）換 ${empName(p.toEmp)} 的 ${md(p.dateB)}（${codeLabel(p.toCodeB)}）`
      :`${empName(p.toEmp)} 代 ${empName(p.fromEmp)} 的 ${md(p.dateA)}（${codeLabel(p.fromCode)}）`;
    let acts='';
    if(toMe&&st==='wait_peer') acts+=`<button class="btn primary" data-swack="${p.id}|yes">同意</button><button class="btn" data-swack="${p.id}|no">不同意</button>`;
    if(mineP&&(st==='wait_peer'||st==='wait_admin'||st==='declined')) acts+=`<button class="btn" data-swwd="${p.uid}|${p.id}">撤回</button>`;
    let adm='';
    if(isAdmin&&(st==='wait_admin'||st==='wait_peer')){
      const stale=swapStale(p),iss=stale?[]:swapIssues(p);
      adm=`${stale?'<div class="err">班表在申請後被改過，請拒絕，讓員工重新申請。</div>':iss.length?`<div class="callout">核准後會新增這些問題：<ul class="bl">${iss.map(m=>`<li>${esc(m)}</li>`).join('')}</ul></div>`:'<div class="okmsg">核准後沒有新增違規。</div>'}
        <div class="addrow" style="margin:0">${st==='wait_peer'?'<span class="hint">對方還沒回覆；你也可以先核准。</span>':''}<button class="btn primary" data-swok="${p.id}" ${stale?'disabled':''}>核准並改班表</button><button class="btn danger" data-swno="${p.id}">拒絕</button></div>`;
    }
    return `<div class="swrow"><div class="bh"><b>${esc(desc)}</b><span class="badge ${st==='approved'?'':'warn'}">${swapLabel[st]||st}</span></div>
      <div class="hint" style="margin:0">${esc(p.createdAt.slice(0,10))} 提出${p.reason?`　原因：${esc(p.reason)}`:''}</div>${adm}${acts?`<div class="addrow" style="margin:0">${acts}</div>`:''}</div>`;
  }).join('');
  return `${form}<div class="panel sec"><h2>${isAdmin?'所有換班申請':'我的換班'}</h2>${rows||'<p class="hint" style="margin:0">目前沒有換班申請。</p>'}</div>`;
}
function submitSwap(){
  const mine=myEmpId(),dr=swapDraft;
  if(!mine||!isApproved()) return;
  if(!dr.dateA||!dr.toEmp){toast('請選擇要換的班和對象');return}
  if(dr.type==='swap'&&!dr.dateB){toast('請選擇對方的哪一天');return}
  const to=cfg.employees.find(e=>e.id===dr.toEmp),me2=cfg.employees.find(e=>e.id===mine);
  const oa=optOf(codeAt(mine,dr.dateA));
  if(!to||!oa||oa.kind!=='work'){toast('那天你沒有班');return}
  if(!canDo(to,oa)){toast(`${to.name} 不能上${deptOf(oa.dept)?deptOf(oa.dept).label:'這個班'}`);return}
  const p={id:uid8(),fromEmp:mine,toEmp:dr.toEmp,type:dr.type,dateA:dr.dateA,dateB:dr.type==='swap'?dr.dateB:'',
    fromCode:codeAt(mine,dr.dateA),toCodeA:codeAt(dr.toEmp,dr.dateA),
    fromCodeB:dr.type==='swap'?codeAt(mine,dr.dateB):'',toCodeB:dr.type==='swap'?codeAt(dr.toEmp,dr.dateB):'',
    reason:(dr.reason||'').trim(),createdAt:new Date().toISOString()};
  const cur=(swaps[uid]&&swaps[uid].items)||{};
  swaps={...swaps,[uid]:{items:{...cur,[p.id]:p}}};
  writeDoc('swaps/'+uid,swaps[uid]);
  swapDraft={toEmp:'',type:'cover',dateA:'',dateB:'',reason:''};
  toast('已送出，等對方回覆');render();
}
function ackSwap(id,v){
  if(!uid) return;
  const cur=(acks[uid]&&acks[uid].byId)||{};
  acks={...acks,[uid]:{byId:{...cur,[id]:v}}};
  writeDoc('swapAcks/'+uid,acks[uid]);render();
}
function withdrawSwap(u,id){
  if(u!==uid) return;
  const cur={...((swaps[u]&&swaps[u].items)||{})};delete cur[id];
  swaps={...swaps,[u]:{items:cur}};writeDoc('swaps/'+u,swaps[u]);render();
}
function decideSwap(id,ok){
  if(!isAdmin) return;
  const p=allSwaps().find(x=>x.id===id);if(!p) return;
  if(ok){
    if(swapStale(p)){toast('班表已變動，請拒絕後重新申請');return}
    applySwapLocal(p);
    [...new Set([monthOf(p.dateA),p.dateB?monthOf(p.dateB):monthOf(p.dateA)])].forEach(flushMonth);
  }
  decisions={...decisions,byId:{...decisions.byId,[id]:{status:ok?'approved':'rejected',at:new Date().toISOString()}}};
  writeDoc('swapDecisions/main',decisions);
  toast(ok?'已核准，班表已更新':'已拒絕');render();
}
function swapBadge(){
  if(isAdmin) return allSwaps().filter(p=>swapStatus(p)==='wait_admin').length;
  const m=myEmpId();return m?allSwaps().filter(p=>p.toEmp===m&&swapStatus(p)==='wait_peer').length:0;
}

/* ---------- 通知：LINE 分享與複製（頁面沒辦法自己發送） ---------- */
const lineUrl=t=>'https://line.me/R/msg/text/?'+encodeURIComponent(t);
function announceText(){
  const [y,m]=ym.split('-');
  const cn=(cfg.clinic&&cfg.clinic.name)||'';
  return `【${cn?cn+' ':''}${y} 年 ${+m} 月班表${cfg.published.includes(ym)?'已公布':'尚未公布'}】\n請到排班系統查看班表，有要換班或畫休也在系統上申請：\n${APP_URL}`;
}
function personalText(e){
  const [y,m]=ym.split('-'),s=summaryOf(e,ym);
  const cn=(cfg.clinic&&cfg.clinic.name)||'';
  const lines=[`【${cn?cn+' ':''}${e.name}　${y} 年 ${+m} 月班表】`];
  monthDates(ym).forEach(d=>{const o=optOf(codeAt(e.id,d));lines.push(`${md(d)}(${WD[wdIdx(d)]}) ${o?(o.kind==='work'?o.label+' '+optTimes(o):o.label):'未排'}`)});
  lines.push(`本月排班工時 ${f1(s.work)} 小時`,`系統：${APP_URL}`);
  return lines.join('\n');
}
function allText(){
  const [y,m]=ym.split('-'),ds=monthDates(ym),lines=[`【${y} 年 ${+m} 月班表】`];
  cfg.employees.forEach(e=>{
    const parts=ds.map(d=>{const o=optOf(codeAt(e.id,d));return o&&o.kind==='work'?`${+d.slice(8)}${o.label}`:''}).filter(Boolean);
    lines.push(`${e.name}：${parts.join(' ')||'無'}`);
  });
  return lines.join('\n');
}
function emailList(){
  return cfg.employees.flatMap(e=>uidsOfEmp(e.id).map(u=>people[u]&&people[u].email)).filter(Boolean).join(', ');
}
/* ---------- 班表圖片（給員工用 LINE 傳送） ---------- */
const IMG_COL={0:['#d3eef4','#0b5568'],1:['#fdecc8','#7a4a00'],2:['#e0e1fb','#3b3fa8'],3:['#dcf1d9','#1f6b2a'],4:['#f9dbe7','#8b1e4d'],5:['#f3d9d6','#8a2a22'],6:['#e3e6ea','#46535d'],7:['#e8e1f3','#5a3d8a'],8:['#d6efe6','#116244']};
const imgFont=(w,s)=>`${w} ${s}px "Noto Sans TC","PingFang TC","Microsoft JhengHei","Noto Sans CJK TC",sans-serif`;
async function fontsReady(){
  try{await Promise.all([document.fonts.load(imgFont(700,28),'班表早午晚休'),document.fonts.load(imgFont(400,18),'班表0123 :–')])}catch(e){}
}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const x=c.getContext('2d');x.scale(2,2);x.textBaseline='middle';return [c,x]}
const canvasBlob=c=>new Promise(r=>c.toBlob(r,'image/png'));
function rrect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
const optLine=o=>o?(o.kind==='work'?`${o.label} ${optTimes(o)}`:o.label):'';

let logoImg=null,logoSrc='';
function loadLogo(){
  const src=(cfg.clinic&&cfg.clinic.logo)||'';
  if(!src) return Promise.resolve(null);
  if(logoSrc===src&&logoImg) return Promise.resolve(logoImg);
  return new Promise(r=>{const i=new Image();i.onload=()=>{logoImg=i;logoSrc=src;r(i)};i.onerror=()=>r(null);i.src=src});
}
async function drawBand(x,W,bandH,title,size,P){
  const name=(cfg.clinic&&cfg.clinic.name)||'',logo=await loadLogo();
  x.fillStyle='#0f6e66';x.fillRect(0,0,W,bandH);
  let tx=P;const box=bandH-28;
  if(logo){
    x.fillStyle='#ffffff';rrect(x,P,14,box,box,12);x.fill();
    const r=Math.min((box-12)/logo.width,(box-12)/logo.height),w=logo.width*r,h=logo.height*r;
    x.drawImage(logo,P+(box-w)/2,14+(box-h)/2,w,h);tx=P+box+18;
  }
  x.textAlign='left';x.fillStyle='#ffffff';
  if(name){x.font=imgFont(500,Math.round(size*0.56));x.fillText(name,tx,bandH*0.3);x.font=imgFont(700,size);x.fillText(title,tx,bandH*0.69)}
  else{x.font=imgFont(700,size);x.fillText(title,tx,bandH/2)}
}
function legendLayout(x,items,maxW){
  x.font=imgFont(500,18);
  const rows=[[]];let cur=0;
  items.forEach(o=>{
    const t=o.kind==='work'?`${o.label} ${optTimes(o).split('、').join(' ')}`:o.label;
    const w=x.measureText(t).width+44;
    if(cur+w>maxW&&rows[rows.length-1].length){rows.push([]);cur=0}
    rows[rows.length-1].push({o,t,w});cur+=w+10;
  });
  return rows;
}
function drawLegend(x,rows,left,top){
  rows.forEach((r,i)=>{let px=left;r.forEach(it=>{
    const c=IMG_COL[it.o.color%9];
    x.fillStyle=c[0];rrect(x,px,top+i*34,22,22,6);x.fill();
    x.fillStyle='#15222b';x.font=imgFont(500,18);x.textAlign='left';x.fillText(it.t,px+30,top+i*34+11);
    px+=it.w+10;
  })});
}

async function personalImage(e){
  await fontsReady();
  const [y,m]=ym.split('-'),weeks=weeksOfMonth(ym),W=1080,P=36,cw=(W-P*2)/7,ch=140,dowH=40,headH=156;
  const usedIds=new Set();
  monthDates(ym).forEach(d=>{const o=optOf(codeAt(e.id,d));if(o)usedIds.add(o.id)});
  const items=[...usedIds].map(optOf).filter(Boolean);
  const [,sx]=mkCanvas(10,10);
  const lg=legendLayout(sx,items,W-P*2);
  const s=summaryOf(e,ym);
  const leaveLines=cfg.options.filter(o=>o.kind==='leave').map(o=>{const n=monthDates(ym).filter(d=>codeAt(e.id,d)===o.id).length;return n?`${o.label} ${n} 天`:''}).filter(Boolean);
  const foot=96+lg.length*34+(leaveLines.length?34:0);
  const H=headH+dowH+weeks.length*ch+foot+P;
  const [c,x]=mkCanvas(W,H);
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  // 標題
  await drawBand(x,W,116,`${e.name}　${y} 年 ${+m} 月班表`,40,P);
  x.fillStyle='#15222b';x.textAlign='left';x.font=imgFont(500,22);
  x.fillText(`${e.role}　排班工時 ${f1(s.work)} 小時　應上班 ${f1(s.base)} 小時`,P,142);
  // 星期
  const top=headH;
  WD.forEach((d,i)=>{x.fillStyle=i>=5?'#b4281f':'#5d6b75';x.font=imgFont(500,20);x.textAlign='center';x.fillText('週'+d,P+i*cw+cw/2,top+dowH/2)});
  // 日期格
  weeks.forEach((w,r)=>w.forEach((d,i)=>{
    const px=P+i*cw,py=top+dowH+r*ch,inM=monthOf(d)===ym;
    x.strokeStyle='#d9e0e5';x.lineWidth=1;
    if(!inM){x.fillStyle='#f6f8f9';x.fillRect(px,py,cw,ch);x.strokeRect(px+.5,py+.5,cw-1,ch-1);return}
    const o=optOf(codeAt(e.id,d)),t=dayType(d);
    x.fillStyle=o?IMG_COL[o.color%9][0]:(t==='weekend'?'#f2f4f5':t==='holiday'?'#fbe6e3':'#ffffff');
    x.fillRect(px,py,cw,ch);x.strokeRect(px+.5,py+.5,cw-1,ch-1);
    x.textAlign='left';x.fillStyle=t==='holiday'||wdIdx(d)===6?'#b4281f':'#5d6b75';x.font=imgFont(700,20);x.fillText(String(+d.slice(8)),px+10,py+18);
    if(t==='holiday'){x.textAlign='right';x.font=imgFont(500,15);x.fillStyle='#b4281f';x.fillText('放假',px+cw-8,py+18)}
    if(o){
      const fg=IMG_COL[o.color%9][1];
      x.textAlign='center';x.fillStyle=fg;x.font=imgFont(700,o.label.length>3?24:30);
      const times=o.kind==='work'?optTimes(o).split('、'):[];
      const cy=py+ch/2+(times.length?-8:6);
      x.fillText(o.label,px+cw/2,cy);
      x.font=imgFont(400,16);
      times.slice(0,2).forEach((tm,k)=>x.fillText(tm,px+cw/2,cy+28+k*20));
    }
  }));
  // 底部
  let fy=top+dowH+weeks.length*ch+24;
  drawLegend(x,lg,P,fy);fy+=lg.length*34+8;
  x.textAlign='left';x.fillStyle='#15222b';x.font=imgFont(400,20);
  if(leaveLines.length){x.fillText('本月假別：'+leaveLines.join('、'),P,fy+12);fy+=34}
  x.fillStyle='#5d6b75';x.font=imgFont(400,18);
  x.fillText('有要畫休或換班，請到排班系統申請。',P,fy+14);
  x.fillText(`製作日期 ${fmtD(new Date())}`,P,fy+44);
  return c;
}

async function rosterImage(group){
  await fontsReady();
  const ds=monthDates(ym),emps=cfg.employees.filter(e=>e.group===group),[y,m]=ym.split('-');
  const P=24,nameW=150,cw=50,rh=46,headH=130,dh=56;
  const used=new Set();emps.forEach(e=>ds.forEach(d=>{const o=optOf(codeAt(e.id,d));if(o)used.add(o.id)}));
  const [,sx]=mkCanvas(10,10);
  const W=P*2+nameW+ds.length*cw;
  const lg=legendLayout(sx,[...used].map(optOf).filter(Boolean),W-P*2);
  const H=headH+dh+emps.length*rh+lg.length*34+60;
  const [c,x]=mkCanvas(W,H);
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  await drawBand(x,W,96,`${GROUPS[group]}　${y} 年 ${+m} 月班表`,32,P);
  x.fillStyle='#5d6b75';x.textAlign='left';x.font=imgFont(400,18);x.fillText(`診次：${cfg.sessions.map(s=>`${s.label} ${s.start}–${s.end}`).join('　')}`,P,114);
  const top=headH;
  ds.forEach((d,i)=>{
    const px=P+nameW+i*cw,t=dayType(d);
    x.fillStyle=t==='holiday'?'#fbe6e3':t==='weekend'?'#f2f4f5':'#ffffff';x.fillRect(px,top,cw,dh);
    x.strokeStyle='#d9e0e5';x.strokeRect(px+.5,top+.5,cw-1,dh-1);
    x.textAlign='center';x.fillStyle=t==='holiday'||wdIdx(d)===6?'#b4281f':'#15222b';
    x.font=imgFont(700,18);x.fillText(String(+d.slice(8)),px+cw/2,top+19);
    x.font=imgFont(400,14);x.fillText(WD[wdIdx(d)],px+cw/2,top+41);
  });
  emps.forEach((e,r)=>{
    const py=top+dh+r*rh;
    x.fillStyle='#ffffff';x.fillRect(P,py,nameW,rh);x.strokeStyle='#d9e0e5';x.strokeRect(P+.5,py+.5,nameW-1,rh-1);
    x.textAlign='left';x.fillStyle='#15222b';x.font=imgFont(700,20);x.fillText(e.name,P+10,py+rh/2);
    ds.forEach((d,i)=>{
      const px=P+nameW+i*cw,o=optOf(codeAt(e.id,d));
      x.fillStyle=o?IMG_COL[o.color%9][0]:(dayType(d)==='holiday'?'#fbe6e3':dayType(d)==='weekend'?'#f2f4f5':'#ffffff');
      x.fillRect(px,py,cw,rh);x.strokeStyle='#d9e0e5';x.strokeRect(px+.5,py+.5,cw-1,rh-1);
      if(o){x.textAlign='center';x.fillStyle=IMG_COL[o.color%9][1];x.font=imgFont(700,16);x.fillText(o.label.slice(0,2),px+cw/2,py+rh/2)}
    });
  });
  drawLegend(x,lg,P,top+dh+emps.length*rh+22);
  return c;
}

async function saveImage(blob,name){
  if(!downloadsCap){toast('這個環境無法下載檔案');return}
  try{await downloadsCap.save({filename:name,data:blob});toast('已下載，到 LINE 選這張圖片傳送')}
  catch(err){if(!err||err.code!=='declined')toast('無法下載圖片')}
}
async function imgAction(kind){
  try{
    toast('產生圖片中…');
    if(kind==='roster'){await saveImage(await canvasBlob(await rosterImage(tab)),`班表總表-${GROUPS[tab]}-${ym}.png`);return}
    if(kind==='all'){
      if(!window.JSZip){toast('壓縮功能沒有載入，請改成一位一位下載');return}
      const z=new JSZip();
      for(const e of cfg.employees) z.file(`${e.name}-${ym}.png`,await canvasBlob(await personalImage(e)));
      await saveImage(await z.generateAsync({type:'blob'}),`班表圖片-${ym}.zip`);return;
    }
    const e=cfg.employees.find(x=>x.id===kind.slice(2));if(!e) return;
    await saveImage(await canvasBlob(await personalImage(e)),`班表-${e.name}-${ym}.png`);
  }catch(err){toast('產生圖片失敗，請再試一次')}
}
function copyImage(id){
  const e=cfg.employees.find(x=>x.id===id);if(!e) return;
  if(!window.ClipboardItem||!navigator.clipboard||!navigator.clipboard.write){toast('這個瀏覽器不支援複製圖片，請改用下載');return}
  // Safari 要求在點擊當下就建立 ClipboardItem，所以把「還在產生中的圖片」直接交給它
  const blobPromise=personalImage(e).then(canvasBlob);
  navigator.clipboard.write([new ClipboardItem({'image/png':blobPromise})]).then(()=>toast('圖片已複製，到 LINE 的對話框貼上'),()=>toast('無法複製圖片，請改用下載'));
}

function noticeHTML(group){
  const emps=cfg.employees.filter(e=>e.group===group);
  const dl=!!downloadsCap;
  const rows=emps.map(e=>{
    const us=uidsOfEmp(e.id),p=us.map(u=>people[u]).find(Boolean)||{};
    return `<tr><td>${esc(e.name)}</td><td>${esc(p.lineId||'')||'<span class="muted">未填</span>'}</td><td>${esc(p.phone||'')||'<span class="muted">未填</span>'}</td><td class="nbtn">${dl?`<button class="btn" data-img="p:${e.id}">下載圖片</button>`:''}<button class="btn" data-imgcopy="${e.id}">複製圖片</button><button class="btn" data-copy="p:${e.id}">複製文字</button></td></tr>`;
  }).join('');
  return `<div class="panel sec"><h2>通知員工</h2>
    <p class="hint" style="margin:0 0 10px">頁面沒辦法自己發 LINE。流程：先下載（或複製）班表圖片，再到 LINE 選好對象，把圖片傳出去。LINE 的分享連結沒辦法附圖片，所以圖片要手動選。</p>
    <div class="addrow" style="margin:0 0 12px">${dl?`<button class="btn primary" data-img="all">下載全部員工圖片（zip）</button><button class="btn" data-img="roster">下載${GROUPS[group]}總表圖片</button>`:''}<a class="btn" href="${lineUrl(announceText())}" target="_blank" rel="noopener" style="display:inline-block">用 LINE 分享公布通知（文字）</a><button class="btn" data-copy="all">複製整月班表文字</button><button class="btn" data-copy="emails">複製員工信箱</button></div>
    ${rows?`<div class="scroll"><table class="rt"><thead><tr><th>人員</th><th>LINE ID</th><th>手機</th><th>個人班表</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}
    <p class="hint">圖片是每位員工自己這個月的班表（一格一天，有班別與時間）。「全部員工圖片」會把每個人的圖片打包成一個 zip，解壓縮後逐一傳給對應的人。</p></div>`;
}

function importBackup(file){
  if(!file||!platform||!platform.backup) return;
  const fr=new FileReader();
  fr.onload=()=>{try{platform.backup.importJson(String(fr.result));toast('已匯入備份')}catch(err){toast(err.message||'匯入失敗')}};
  fr.readAsText(file);
}
function demoEmployees(){
  const pt=[['A',['d_bone'],'2016-03-01'],['B',['d_bone'],'2019-07-15'],['C',['d_bone'],'2021-02-01'],['D',[],'2023-05-10'],['E',[],'2024-11-01'],['F',['d_peds'],'2025-06-01'],['G',['d_peds'],'2020-09-01'],['H',['d_peds'],'2026-04-01'],['I',['d_bone'],'2018-01-15'],['J',['d_bone'],'2022-08-22']];
  const out=pt.map(([n,d,h],i)=>({id:'e'+(i+1),name:'範例治療師'+n,role:'物理治療師',group:'pt',ratio:1,hire:h,depts:d}));
  [['A','2024-03-01'],['B','2025-09-01'],['C','2023-01-16']].forEach(([n,h],i)=>out.push({id:'e'+(11+i),name:'範例助理'+n,role:'助理（兼職）',group:'asst',ratio:0.5,hire:h,depts:[]}));
  return out;
}
function readLogo(file){
  if(!file) return;
  const fr=new FileReader();
  fr.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const fit=max=>{const r=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*r));c.height=Math.max(1,Math.round(im.height*r));c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/png')};
      let url=fit(256);if(url.length>140000) url=fit(160);
      if(url.length>200000){toast('圖片檔太大，請換一張簡單一點的 logo');return}
      cfg={...cfg,clinic:{...(cfg.clinic||{}),logo:url}};saveCfg();render();toast('已更新 logo');
    };
    im.onerror=()=>toast('讀不到這個圖片檔');
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}
function legacyCopy(t){
  return new Promise((res,rej)=>{
    try{
      const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');
      ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);
      ta.select();ta.setSelectionRange(0,t.length);
      const ok=document.execCommand('copy');document.body.removeChild(ta);ok?res():rej(new Error('copy'));
    }catch(e){rej(e)}
  });
}
function copyToClipboard(t){
  if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(()=>legacyCopy(t));
  return legacyCopy(t);
}
function copyText(kind){
  let t='';
  if(kind==='announce') t=announceText();
  else if(kind==='all') t=allText();
  else if(kind==='emails') t=emailList();
  else if(kind.startsWith('p:')){const e=cfg.employees.find(x=>x.id===kind.slice(2));if(e)t=personalText(e)}
  if(!t){toast('沒有可複製的內容（員工還沒填信箱？）');return}
  copyToClipboard(t).then(()=>toast('已複製'),()=>toast('無法自動複製，請改用 LINE 分享'));
}

/* ---------- 畫面 ---------- */
const view=document.getElementById('view');
let tabPicked=false;
const openNotes=new Set();
const isRosterTab=t=>t==='pt'||t==='asst';
function setHeader(){
  const ttl=document.getElementById('ttl');
  if(ttl){const c=(cfg&&cfg.clinic)||{};ttl.innerHTML=(c.logo?`<img class="logo" src="${esc(c.logo)}" alt="">`:'')+esc((c.name||'復健診所')+'排班')}
  const who=document.getElementById('who');
  let t='';
  if(isAdmin) t='<span class="badge">管理者</span>';
  else if(myEmpId()&&cfg){const e=cfg.employees.find(x=>x.id===myEmpId());t=`<span class="badge">員工 ${esc(e?e.name:'')}</span>`}
  else t='<span class="badge">檢視</span>';
  who.innerHTML=t+'<span>排班、畫休、特休與工時統整</span>'+(platform&&platform.signOut?'<button class="btn" data-act="signout" style="padding:3px 10px">登出</button>':'');
  const tabs=[['pt','物理治療師'],['asst','助理'],['hours','時數與特休']];
  if(isAdmin||(uid&&myEmpId())) tabs.push(['swap','換班']);
  tabs.push(['rules','勞基法與診所規則']);
  if(isAdmin) tabs.push(['settings','設定']);
  else if(uid) tabs.push(['me','我的資料']);
  const cnt=k=>k==='swap'?swapBadge():(k==='settings'&&isAdmin)?Object.keys(reqs).filter(u=>!approved.byUid[u]).length:0;
  document.getElementById('tabs').innerHTML=tabs.map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}${cnt(k)?`<i class="cnt">${cnt(k)}</i>`:''}</button>`).join('');
}
function render(){
  closeMenu();
  setHeader();
  if(!db){view.innerHTML='<div class="notice bad">無法連線到資料庫，請檢查 config.js 的設定與網路，然後重新整理。如果是在 LINE 裡點開的，請按右上角選「用瀏覽器開啟」。</div>';return}
  if(dbError){view.innerHTML=`<div class="notice bad">${esc(dbError)}</div>`;return}
  if(cfg===undefined){view.innerHTML='<div class="notice">載入中…</div>';return}
  if(cfg===null||cfg.v!==CFG_V){
    view.innerHTML=isAdmin
      ?`<div class="panel sec"><h2>${cfg===null?'尚未建立診所設定':'設定格式已更新'}</h2><p class="hint">${cfg===null?'':'診所設定有改版，需要重新建立。這會取代現有的班別設定，人員會保留。<br>'}會建立早診 08:00–12:00、午診 13:30–17:30、晚診 17:30–21:30 三個診次，骨科、小兒兩科，以及例假、休息日、國定假日、特休等選項。</p><div class="addrow"><button class="btn primary" data-act="init">${cfg===null?'建立初始設定':'重新建立設定'}</button>${cfg===null?'<button class="btn" data-act="initdemo">建立初始設定並加入範例人員</button>':''}</div></div>`
      :'<div class="notice">管理者還沒有建立班表。</div>';
    return;
  }
  if(!tabPicked&&myEmpId()){
    tabPicked=true;
    const me2=cfg.employees.find(x=>x.id===myEmpId());
    if(me2&&me2.group==='asst') tab='asst';
  }
  if(tab==='settings'&&!isAdmin) tab='pt';
  if(!isAdmin&&uid){
    if(!profileLoaded){view.innerHTML='<div class="notice">載入中…</div>';return}
    if(!myEmpId()||!profileOk(myProfile())||tab==='me'){tab='me';setHeader();view.innerHTML=meHTML();return}
  }
  view.innerHTML=isRosterTab(tab)?rosterHTML(tab):tab==='hours'?hoursHTML():tab==='rules'?rulesHTML():tab==='swap'?swapHTML():settingsHTML();
  if(tab==='settings'){loadProfiles();if(!membersLoaded)loadMembers()}
}

function monthBar(extra){
  const [y,m]=ym.split('-');
  return `<div class="bar">
    <button class="btn" data-act="pm" aria-label="上個月">‹</button>
    <div class="month">${y} 年 ${+m} 月</div>
    <button class="btn" data-act="nm" aria-label="下個月">›</button>
    <button class="btn" data-act="tm">本月</button>
    <span class="grow"></span>${extra||''}</div>`;
}
function metaLine(){
  const wd=workdaysOf(ym);
  return `<div class="meta"><span>行政院辦公日曆上班日 <b>${wd}</b> 天</span><span>基本工時 <b>${f1(wd*DAY_H)}</b> 小時（${wd} × ${DAY_H}）</span>${calendarKnown(ym)?'':'<span class="badge warn">尚未收錄這一年的辦公日曆，國定假日請點日期手動標示</span>'}</div>`;
}
const sessLine=()=>cfg.sessions.map(s=>`${esc(s.label)} ${s.start}–${s.end}`).join('　');

function rosterHTML(group){
  const emps=cfg.employees.filter(e=>e.group===group);
  const ds=monthDates(ym),a=analyze(ym,group),today=fmtD(new Date());
  const mine=myEmpId();
  const monthOpen=cfg.openMonths.includes(ym),published=cfg.published.includes(ym);
  const hideSched=!isAdmin&&!published;
  let extra='';
  if(isAdmin){
    extra=`<button class="btn" data-act="toggleopen">${monthOpen?'關閉畫休':'開放畫休'}</button>
      <button class="btn ${published?'':'primary'}" data-act="publish">${published?'取消公布':'公布本月班表'}</button>
      <button class="btn" data-act="copyprev" title="把 4 週前（同樣的星期）的班表複製過來，再手動微調">套用 4 週前</button>
      ${downloadsCap?'<button class="btn" data-act="exportroster">匯出 CSV</button>':''}
      <button class="btn danger" data-act="clear">清空本月</button>
      <button class="btn primary" data-act="auto">自動排班</button>`;
  }
  let note='';
  const stat=`<span class="badge ${published?'':'warn'}">${published?'本月班表已公布':'本月班表是草稿，員工看不到排班內容'}</span>`;
  if(!isAdmin&&uid){
    const n=mine?reqCount(mine,ym):0,m2=mine?manualCount(mine,ym):0;
    if(!isApproved()) note='<div class="notice">你的資料已送出，等管理者確認綁定後才能畫休。</div>';
    else if(monthOpen) note=`<div class="notice"><b>畫休開放中</b><span>點自己那一列的日期，選擇例假、休息日、特休或徒手日。休息類畫休 ${n} / ${cfg.maxReq} 天，徒手日 ${m2} / ${cfg.maxManual} 天；特休不能超過剩餘天數。</span></div>`;
    else note='<div class="notice">這個月還沒有開放畫休。</div>';
    if(hideSched) note+='<div class="notice">這個月的班表還沒公布，目前只看得到大家的畫休。</div>';
  } else if(isAdmin){
    const total=emps.reduce((t,e)=>t+Object.keys(reqOf(e.id)).filter(d=>monthOf(d)===ym).length,0);
    const pend=Object.keys(reqs).filter(u=>!approved.byUid[u]).length;
    note=`<div class="meta">${stat}<span>畫休：${monthOpen?'<b>開放中</b>':'尚未開放'}，這組本月已收到 <b>${total}</b> 筆</span>${pend?`<span class="badge warn">${pend} 位員工等待確認綁定，到「設定」處理</span>`:''}</div>`;
  }
  const head=ds.map(d=>{
    const t=dayType(d),w=wdIdx(d);
    const cls=[t==='weekend'?'wkend':'',t==='holiday'?'hol':'',w===0?'mon':'',d===today?'today':''].join(' ');
    const inner=`${WD[w]}<b>${+d.slice(8)}</b>`;
    return `<th class="${cls}">${isAdmin?`<button data-day="${d}" title="調整這天是否為上班日">${inner}</button>`:inner}</th>`;
  }).join('');
  const rows=emps.map(e=>{
    const rq=reqOf(e.id),isMe=e.id===mine;
    const cells=ds.map(d=>{
      const code=hideSched?'':codeAt(e.id,d),o=optOf(code),k=e.id+'_'+d,w=wdIdx(d);
      const ro=reqOpt(rq[d]);
      const warn=isAdmin&&a.warn.has(k)?' warn':'',req=ro&&code?' req':'';
      const canReq=isMe&&!isAdmin&&isApproved()&&monthOpen&&d>=today;
      let txt='',cls='';
      if(o){
        txt=group==='asst'&&o.kind==='work'?`<span>${esc(o.label.slice(0,3))}<small>${f1(optHours(o))}h</small></span>`:esc(o.label.slice(0,3));
        cls=` c${o.color%9}`;
      } else if(code) txt='?';
      else if(ro){txt=`<span class="rtx">${esc(ro.label.slice(0,3))}</span>`;cls=' preq'}
      const title=`${e.name} ${md(d)} ${o?o.label+(o.kind==='work'?' '+optTimes(o):''):(hideSched?'':'未排')}${ro?`（畫休：${ro.label}）`:''}${isAdmin&&a.warn.has(k)?'：'+a.warn.get(k).join('、'):''}`;
      const dis=!(isAdmin||canReq);
      return `<td class="${w===0?'mon':''}"><div class="cellwrap"><button class="cell${cls}${warn}${req}${canReq?' mine':''}" ${dis?'disabled':''} data-cell="${e.id}|${d}" title="${esc(title)}" aria-label="${esc(title)}">${txt}</button></div></td>`;
    }).join('');
    return `<tr><th class="name${isMe?' me':''}" scope="row"><strong>${esc(e.name)}${noteSummary(noteOf(e.id))?`<i class="nb" title="${esc(noteSummary(noteOf(e.id)))}">備註</i>`:''}</strong><span>${esc(e.role)}${e.group==='asst'?' · '+f1(workdaysOf(ym)*DAY_H*(+e.ratio||1))+'h':''}</span></th>${cells}</tr>`;
  }).join('');
  const cov=hideSched?'':`<tr class="cov"><th class="name" scope="row">${group==='pt'?'各科人數':'助理人數'}<br>${cfg.sessions.map(s=>esc(s.label.slice(0,1))).join('·')}</th>${ds.map((d,i)=>`<td class="${wdIdx(d)===0?'mon':''}">${a.cov[i].map(c=>c.open?`<div class="covitem ${isAdmin&&c.short.some(x=>x)?'short':''}" title="${esc(c.dp.label+'：'+cfg.sessions.map((s,j)=>s.label+' '+c.n[j]+'/'+c.need[j]).join('，'))}">${group==='pt'?esc(c.dp.label.slice(0,1))+' ':''}${c.n.join('·')}</div>`:'').join('')}</td>`).join('')}</tr>`;
  const legendOpts=cfg.options.filter(o=>group==='pt'||o.kind!=='work');
  const legend=(group==='asst'?cfg.sessions.map(s=>`<span><i class="sw c8"></i>${esc(s.label)} ${s.start}–${s.end}（${f1(segHours(s))}h）</span>`).join(''):'')
    +legendOpts.map(o=>`<span><i class="sw c${o.color%9}"></i>${esc(o.label)}${o.kind==='work'?` ${optTimes(o)}（${f1(optHours(o))}h）`:o.kind==='leave'&&o.credit?`（折算 ${f1(o.credit)}h）`:''}</span>`).join('')
    +'<span><i class="sw" style="border:1px dashed var(--muted)"></i>虛線＝畫休、尚未排入</span><span><i class="sw" style="background:var(--accent);border-radius:50%;width:9px;height:9px"></i>畫休已排入</span>'+(isAdmin?'<span><i class="sw" style="border:2px solid var(--bad)"></i>違規</span>':'')+'<span><i class="sw" style="background:var(--bad-soft)"></i>國定假日</span>';
  const issues=!isAdmin?'':a.msgs.length
    ?`<div class="panel sec issues"><h2>待處理（${a.msgs.length}）</h2><ul>${a.msgs.slice(0,15).map(m=>`<li>${esc(m)}</li>`).join('')}</ul>${a.msgs.length>15?`<p class="hint">還有 ${a.msgs.length-15} 項，先處理上面的。</p>`:''}</div>`
    :`<div class="panel sec issues"><h2>待處理</h2><div class="okmsg">目前沒有違規，各${group==='pt'?'科':''}診次人數也足夠。</div></div>`;
  const rule=group==='pt'
    ?`每週（週一到週日）要有 1 天例假與 1 天休息日；連續上班最多 ${MAX_RUN} 天；兩班之間至少休息 ${REST_H} 小時；每週正常工時 ${WEEK_H} 小時。每科每個診次的最低人數在設定頁調整。`
    :`助理只做骨科的支援，不計入骨科治療師的最低人力，也不支援小兒。點格子可選早、午、晚診的任意組合，或輸入自訂時間。沒排班的日子視為休息，每週至少要有 2 天不上班（1 例假＋1 休息日）；兩班之間至少休息 ${REST_H} 小時，所以晚診接隔天早診會被標紅。每天各診次的助理最低人數在設定頁調整。`;
  return `${monthBar(extra)}${metaLine()}<div class="meta"><span>診次：${sessLine()}</span></div>${note}
  <div class="panel scroll"><table class="grid"><thead><tr><th class="name"></th>${head}</tr></thead><tbody>${rows||`<tr><td colspan="${ds.length+1}" style="padding:20px">這組還沒有人員。請到「設定」新增。</td></tr>`}${cov}</tbody></table></div>
  <div class="legend">${legend}</div>
  ${issues}
  ${isAdmin?noticeHTML(group):''}
  <div class="panel sec"><h2>${group==='pt'?'一例一休與排班規則':'助理排班規則'}</h2><p class="hint" style="margin:0">${rule} 員工畫的休假，自動排班時會優先排進去。</p></div>`;
}

/* ---------- 員工登入後的個人資料（信箱由登入時的驗證碼驗證） ---------- */
function meHTML(){
  const claimed=myEmpId(),p=myProfile()||{};
  const taken=new Set(Object.entries(reqs).filter(([u])=>u!==uid).map(([,r])=>r.empId));
  const free=cfg.employees.filter(e=>!taken.has(e.id));
  const emp=cfg.employees.find(e=>e.id===claimed);
  const email=(me&&me.email)||p.email||'',verified=!!(me&&me.email);
  const first=!claimed||!profileOk(p);
  return `<div class="panel sec regform"><h2>${first?'第一次登入：請先填寫個人資料':'我的資料'}</h2>
    <p class="hint" style="margin:0 0 12px">你是用電子郵件驗證碼登入的。這些資料只有管理者看得到，用於緊急聯絡與人事管理。${isApproved()?'':'送出後要等管理者確認，才能畫休。'}</p>
    <form id="meForm" class="rf">
      ${claimed?`<div class="field">姓名<span class="ro">${esc(emp?emp.name:'')}</span></div>`:
        `<label class="field">我是誰<select id="meEmp" required>${free.length?free.map(e=>`<option value="${e.id}">${esc(e.name)}（${GROUPS[e.group]}）</option>`).join(''):'<option value="">沒有可認領的人員</option>'}</select></label>`}
      <div class="field">登入信箱${verified?`<span class="ro">${esc(email)} <span class="badge">已驗證</span></span>`:`<input id="meEmail" type="email" value="${esc(email)}" placeholder="name@example.com" required>`}</div>
      <label class="field">個人手機<input id="mePhone" type="tel" inputmode="tel" value="${esc(p.phone||'')}" placeholder="0912345678" required></label>
      <label class="field">緊急聯絡人姓名<input id="meEmName" type="text" value="${esc(p.emName||'')}" required></label>
      <label class="field">緊急聯絡人電話<input id="meEmPhone" type="tel" inputmode="tel" value="${esc(p.emPhone||'')}" required></label>
      <label class="field">LINE ID（選填）<input id="meLine" type="text" value="${esc(p.lineId||'')}" placeholder="方便管理者聯絡"></label>
      <label class="field" style="grid-column:1/-1">居住地址<input id="meAddr" type="text" value="${esc(p.address||'')}" placeholder="縣市、區、路街、號、樓" required></label>
      <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn primary" type="submit">${first?'送出':'儲存'}</button><span id="meErr" class="err" role="alert"></span></div>
    </form></div>`;
}
const validPhone=s=>/^09\d{8}$/.test(String(s).replace(/[\s-]/g,''));
const validTel=s=>/^[0-9+()\-\s]{8,18}$/.test(String(s));
function submitMe(){
  const err=t=>{document.getElementById('meErr').textContent=t;return false};
  const claimed=myEmpId();
  const empId=claimed||(document.getElementById('meEmp')||{}).value;
  if(!empId) return err('請選擇你是哪一位人員');
  const phone=document.getElementById('mePhone').value.trim(),emName=document.getElementById('meEmName').value.trim();
  const emPhone=document.getElementById('meEmPhone').value.trim(),address=document.getElementById('meAddr').value.trim();
  const verified=!!(me&&me.email);
  const email=verified?me.email:(document.getElementById('meEmail')||{value:''}).value.trim();
  if(!email||!/^\S+@\S+\.\S+$/.test(email)) return err('請填正確的電子郵件');
  if(!validPhone(phone)) return err('個人手機請填 09 開頭的 10 碼，例如 0912345678');
  if(!emName) return err('請填緊急聯絡人姓名');
  if(!validTel(emPhone)) return err('緊急聯絡人電話格式不正確');
  if(address.length<6) return err('請填完整的居住地址');
  const prof={phone:phone.replace(/[\s-]/g,''),emName,emPhone,address,email,emailVerified:verified,lineId:(document.getElementById('meLine')||{value:''}).value.trim(),updatedAt:new Date().toISOString()};
  people[uid]=prof;profileLoaded=true;
  writeDoc('data/users/'+uid+'/profile',prof);
  if(!claimed){reqs[uid]={empId,dates:{}};writeDoc('requests/'+uid,reqs[uid])}
  toast(isApproved()?'已儲存':'已送出，等管理者確認');
  if(tab==='me') tab='pt';
  render();
  return true;
}

/* ---------- 員工自己畫休（例假、休息日、特休、徒手日） ---------- */
function openReqMenu(btn,eid,d){
  const emp=cfg.employees.find(x=>x.id===eid);if(!emp) return;
  const cur=reqOpt(reqOf(eid)[d]);
  const opts=selfOptions(emp);
  let h=`<div class="mt">${md(d)}（${WD[wdIdx(d)]}）要畫什麼？</div>`;
  if(!opts.length) h+='<div class="mt">管理者還沒有開放可以畫的項目</div>';
  opts.forEach(o=>{
    const hint=o.kind==='leave'?'特休':o.kind==='work'?optTimes(o):KINDS[o.kind];
    h+=`<button data-rq="${o.id}"><span><i class="sw c${o.color%9}" style="vertical-align:-2px;margin-right:8px"></i>${esc(o.label)}${cur&&cur.id===o.id?' ✓':''}</span><small>${hint}</small></button>`;
  });
  if(cur) h+=`<hr><button data-rqclear="1"><span>取消畫休</span><small></small></button>`;
  menu.innerHTML=h;menu.dataset.eid=eid;menu.dataset.date=d;menu.dataset.mode='req';
  placeMenu(btn);
}
function setReq(eid,d,optId){
  if(!uid||eid!==myEmpId()||!isApproved()) return;
  const emp=cfg.employees.find(x=>x.id===eid),r=reqs[uid],dates={...(r.dates||{})},mo=monthOf(d);
  if(optId){
    const o=cfg.options.find(x=>x.id===optId);
    if(!o||!selfOptions(emp).some(x=>x.id===o.id)) return;
    const others=Object.entries(dates).filter(([x])=>x!==d);
    if(o.kind==='fixed'||o.kind==='rest'){
      const n=others.filter(([x,v])=>{const q=reqOpt(v);return monthOf(x)===mo&&q&&(q.kind==='fixed'||q.kind==='rest')}).length;
      if(n>=cfg.maxReq){toast(`每月休息類畫休最多 ${cfg.maxReq} 天`);return}
    } else if(isManual(o)){
      const n=others.filter(([x,v])=>{const q=reqOpt(v);return monthOf(x)===mo&&isManual(q)}).length;
      if(n>=cfg.maxManual){toast(`每月徒手日最多 ${cfg.maxManual} 天`);return}
    } else if(o.kind==='leave'&&o.annual){
      const p=leavePeriod(emp.hire,d);
      if(!p){toast('請先請管理者設定你的到職日');return}
      const set=leaveDatesFor(emp);delete set[d];
      const used=Object.entries(set).filter(([x])=>x>=p.start&&x<p.end).reduce((t,[,v])=>t+v,0);
      const add=(+o.credit||DAY_H)/DAY_H;
      if(used+add>entitled(emp,p)+0.001){toast(`特休不夠：這個年度可休 ${f1(entitled(emp,p))} 天，已排與已畫 ${f1(used)} 天`);return}
    } else if(o.kind==='leave'){
      const q=leaveQuota(emp,o);
      if(q!=null&&o.period!=='event'){
        const used=leaveUsedYear(emp,o,+d.slice(0,4),true,d);
        if(used+1>q+0.001){toast(`${o.label}今年上限 ${f1(q)} 天，已排與已畫 ${f1(used)} 天`);return}
      }
      if(o.perMonth){
        const n=Object.entries(dates).filter(([x,v])=>x!==d&&monthOf(x)===mo&&reqOpt(v)&&reqOpt(v).id===o.id).length;
        if(n+1>o.perMonth){toast(`${o.label}每月最多 ${o.perMonth} 天`);return}
      }
    }
    dates[d]=o.id;
  } else delete dates[d];
  reqs[uid]={empId:eid,dates};
  writeDoc('requests/'+uid,reqs[uid]);
  render();
}
function copyPrev(group){
  const hol=cfg.options.find(o=>o.kind==='holiday');
  cfg.employees.filter(e=>e.group===group).forEach(e=>monthDates(ym).forEach(d=>{
    const cur=optOf(codeAt(e.id,d));if(cur&&cur.kind==='leave') return;
    const src=codeAt(e.id,addD(d,-28)),so=optOf(src);
    let code=src;
    if(so&&(so.kind==='leave'||so.kind==='holiday')) code='';
    if(isClosedHoliday(d)) code=hol?hol.id:'';
    setLocal(e.id,d,code);
  }));
  flushMonth(ym);
}
async function exportCsv(kind){
  if(!downloadsCap) return;
  const q=v=>{v=String(v==null?'':v);return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=[];
  if(kind==='roster'){
    const ds=monthDates(ym);
    rows.push(['人員','職稱',...ds.map(d=>`${md(d)}(${WD[wdIdx(d)]})`)]);
    cfg.employees.filter(e=>e.group===tab).forEach(e=>rows.push([e.name,e.role,...ds.map(d=>{const o=optOf(codeAt(e.id,d));return o?(o.kind==='work'?`${o.label} ${optTimes(o)}`:o.label):''})]));
  } else {
    const wk=weeksOfMonth(ym).map(w=>{const i=w.filter(d=>monthOf(d)===ym);return `${md(i[0])}–${md(i[i.length-1])} 週工時`});
    rows.push(['人員','分頁','應上班(h)','排班工時(h)','假別折算(h)','差額(h)','例假(天)','休息日(天)','假日出勤(天)',...wk]);
    cfg.employees.forEach(e=>{const s=summaryOf(e,ym);rows.push([e.name,GROUPS[e.group],f1(s.base),f1(s.work),f1(s.credit),f1(s.diff),s.fx,s.rs,s.holWork,...s.weekly.map(x=>f1(x.h))])});
  }
  const data='﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n');
  try{await downloadsCap.save({filename:kind==='roster'?`班表-${ym}-${GROUPS[tab]}.csv`:`工時統整-${ym}.csv`,data});toast('已匯出')}
  catch(err){if(!err||err.code!=='declined') toast('這個環境無法匯出檔案')}
}

function hoursHTML(){
  const weeks=weeksOfMonth(ym).map(w=>{const i=w.filter(d=>monthOf(d)===ym);return `${md(i[0])}–${md(i[i.length-1])}`});
  const wd=workdaysOf(ym);
  const cls=n=>n>0.04?'pos':n<-0.04?'neg':'';
  const sign=n=>(n>0.04?'+':'')+f1(n);
  const hide=!isAdmin&&!cfg.published.includes(ym);
  const vis=e=>isAdmin||e.id===myEmpId();
  const table=group=>{
    if(hide) return '';
    const rows=cfg.employees.filter(e=>e.group===group&&vis(e)).map(e=>({e,s:summaryOf(e,ym)}));
    if(!rows.length) return '';
    const tot=rows.reduce((t,r)=>({work:t.work+r.s.work,credit:t.credit+r.s.credit,base:t.base+r.s.base,diff:t.diff+r.s.diff}),{work:0,credit:0,base:0,diff:0});
    return `<div class="panel sec"><h2>${GROUPS[group]}的月工時（小時）</h2>
    <div class="scroll"><table class="sum"><thead><tr><th>人員</th><th>應上班</th><th>排班工時</th><th>假別折算</th><th>差額</th><th>例假</th><th>休息日</th><th>假日出勤</th><th>畫休</th>${weeks.map(w=>`<th>${w}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(({e,s})=>`<tr><td>${esc(e.name)}</td><td>${f1(s.base)}</td><td>${f1(s.work)}</td><td>${f1(s.credit)}</td><td class="${cls(s.diff)}">${sign(s.diff)}</td><td>${s.fx}</td><td>${s.rs}</td><td>${s.holWork}</td><td>${s.req}</td>${s.weekly.map(x=>`<td class="${x.h>WEEK_H?'neg':''}">${f1(x.h)}</td>`).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><td>合計</td><td>${f1(tot.base)}</td><td>${f1(tot.work)}</td><td>${f1(tot.credit)}</td><td class="${cls(tot.diff)}">${sign(tot.diff)}</td><td colspan="${4+weeks.length}"></td></tr></tfoot></table></div></div>`;
  };
  const ref=monthDates(ym).pop();
  const lrows=cfg.employees.filter(vis).map(e=>{
    const li=leaveInfo(e,ref);
    const msg=t=>`<tr><td>${esc(e.name)}</td><td>${e.hire||'–'}</td><td colspan="7" style="text-align:left;font-family:var(--font);color:var(--muted)">${t}</td></tr>`;
    if(!e.hire) return msg('尚未設定到職日');
    if(!li.p) return msg(e.hire>ref?'尚未到職':'');
    const p=li.p,low=li.manual!=null&&li.manual<li.auto-0.001;
    return `<tr><td>${esc(e.name)}</td><td>${e.hire}</td><td>${tenure(e.hire,ref)}</td><td>${md(p.start)}–${md(addD(p.end,-1))}</td><td>${f1(li.auto)}</td><td class="${low?'neg':''}">${f1(li.total)}${li.manual!=null?(low?' 低於法定':' 手動'):''}</td><td>${f1(li.used)}</td><td class="${li.left<-0.04?'neg':''}">${f1(li.left)}</td><td>${f1(li.left*DAY_H)}</td></tr>`;
  }).join('');
  const lt=cfg.options.filter(o=>o.kind==='leave'&&!o.annual),yr=+ym.slice(0,4);
  const lurows=cfg.employees.filter(vis).map(e=>`<tr><td>${esc(e.name)}</td>${lt.map(o=>{const q=leaveQuota(e,o),u=leaveUsedYear(e,o,yr,false);return `<td class="${q!=null&&u>q+0.001?'neg':''}">${u?f1(u):'–'}${q!=null?' / '+f1(q):''}</td>`}).join('')}</tr>`).join('');
  return `${monthBar(isAdmin&&downloadsCap?'<button class="btn" data-act="exporthours">匯出工時 CSV</button>':'')}${metaLine()}
  ${hide?'<div class="notice">這個月的班表還沒公布，工時統整公布後才看得到。</div>':''}${table('pt')}${table('asst')}
  <p class="hint" style="padding:0 2px">應上班 = 行政院人事行政總處辦公日曆的上班日 ${wd} 天 × ${DAY_H} 小時 × 人員的工時比例（助理以兼職比例計）。差額 = 排班工時 + 假別折算 − 應上班，正數代表超過基本工時。排班工時依診次或自訂時間實際加總，不扣中間休息。週工時只計入本月內的日子，超過 ${WEEK_H} 小時會標紅。</p>
  <div class="panel sec"><h2>年資與特休（勞基法第 38 條，週年制）</h2>
  <div class="scroll"><table class="sum"><thead><tr><th>人員</th><th>到職日</th><th>年資（至 ${md(ref)}）</th><th>本特休年度</th><th>勞基法天數</th><th>可休天數</th><th>已排天數</th><th>剩餘天數</th><th>剩餘小時</th></tr></thead><tbody>${lrows||''}</tbody></table></div>
  <p class="hint">「勞基法天數」依到職週年自動帶入；「可休天數」是公司實際給的天數，預設等於勞基法天數，老闆給得比較多時，在「設定」該員工的「特休天數」手動填寫。手動天數低於勞基法天數會標紅。依到職週年計算：滿 6 個月 3 天、滿 1 年 7 天、滿 2 年 10 天、滿 3 年 14 天、滿 5 年 15 天、滿 10 年起每年加 1 天，最多 30 天。「已排天數」是本特休年度內，班表上標為特休的天數（含未來已排的日子）。部分工時人員依工時比例折算。特休年度結束時沒休完的天數，雇主要發給工資。</p></div>
  ${lt.length?`<div class="panel sec"><h2>其他假別使用（${yr} 年，天）</h2><div class="scroll"><table class="sum"><thead><tr><th>人員</th>${lt.map(o=>`<th>${esc(o.label)}</th>`).join('')}</tr></thead><tbody>${lurows}</tbody></table></div><p class="hint">格子是「已排天數 / 上限」，沒有上限的只顯示已排天數。事假和家庭照顧假的天數合併計算。每月、每年的上限與薪資規則在「勞基法與診所規則」分頁，天數可以在「設定」調整。</p></div>`:''}`;
}

let platform=null,memberList=[],membersLoaded=false;
function extraPanels(){
  let h=`<div class="panel sec"><h2>診所內部規則（自訂）</h2><p class="hint" style="margin:0 0 10px">這裡寫的內容會顯示在「勞基法與診所規則」分頁，例如診所的作業流程、儀器注意事項。可用 # 標題、- 條列，空一行分段。</p><textarea id="clinicRules" rows="10" placeholder="# 標題&#10;- 條列內容">${esc(cfg.clinicRules||'')}</textarea></div>`;
  if(platform&&platform.members) h+=`<div class="panel sec"><h2>允許登入的 email</h2><p class="hint" style="margin:0 0 10px">只有加入名單的 email 能登入。員工用 email 驗證碼登入後，會自己認領姓名並填個人資料，再由你「確認綁定」。</p>
    <div class="chips" style="gap:8px">${memberList.map(m=>`<span class="dchip">${esc(m)}<button data-memdel="${esc(m)}" aria-label="移除 ${esc(m)}">×</button></span>`).join('')||'<span class="hint">還沒有加入任何 email。</span>'}</div>
    <form class="addrow" id="addMember"><label class="field" style="flex:1;min-width:220px">電子郵件<input id="newMember" type="email" required autocomplete="off"></label><button class="btn primary" type="submit" style="align-self:flex-end">加入</button></form></div>`;
  if(platform&&platform.backup) h+=`<div class="panel sec"><h2>資料備份（本機模式）</h2><p class="hint" style="margin:0 0 10px">本機模式的資料只存在這個瀏覽器。清除瀏覽器資料、換電腦前，請先匯出備份。</p>
    <div class="addrow" style="margin:0"><button class="btn" data-act="bkexport">匯出備份（JSON）</button><label class="btn" style="cursor:pointer">匯入備份<input id="bkimport" type="file" accept="application/json,.json" style="display:none"></label><button class="btn danger" data-act="bkclear">清除本機全部資料</button></div></div>`;
  return h;
}
function loadMembers(){
  if(!platform||!platform.members) return;
  platform.members.list().then(l=>{memberList=l;membersLoaded=true;if(tab==='settings')render()}).catch(()=>toast('讀不到 email 名單'));
}
function settingsHTML(){
  const colorPick=(o)=>`<div class="colors" role="radiogroup" aria-label="顏色">${[0,1,2,3,4,5,6,7].map(c=>`<label><input type="radio" name="col-${o.id}" data-of="color" data-v="${c}" ${(o.color%9)===c?'checked':''}><span class="c${c}" title="顏色 ${c+1}"></span></label>`).join('')}</div>`;
  const orows=cfg.options.map(o=>{
    const w=o.kind==='work',l=o.kind==='leave';
    return `<div class="orow" data-opt="${o.id}">
      <label class="field" style="width:96px">名稱<input type="text" data-of="label" value="${esc(o.label)}" maxlength="4"></label>
      <label class="field" style="width:120px">類型<select data-of="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}" ${o.kind===k?'selected':''}>${v}</option>`).join('')}</select></label>
      ${w?`<label class="field" style="width:150px">科別<select data-of="dept"><option value="" ${o.dept?'':'selected'}>徒手日（不計入科別）</option>${cfg.depts.map(x=>`<option value="${x.id}" ${o.dept===x.id?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label>
      <div class="field">上班診次（${f1(optHours(o))} 小時）<div class="chips">${cfg.sessions.map(s=>`<label><input type="checkbox" data-seg="${s.id}" ${o.segs&&o.segs.includes(s.id)?'checked':''}><span>${esc(s.label)}</span></label>`).join('')}</div></div>`:''}
      ${l?`<label class="field" style="width:110px">折算(小時)<input type="number" data-of="credit" min="0" max="24" step="0.5" value="${o.credit||0}"></label>
      <label class="field" style="width:130px">計入特休<select data-of="annual"><option value="0" ${o.annual?'':'selected'}>否</option><option value="1" ${o.annual?'selected':''}>是，扣特休天數</option></select></label>${leaveFields(o)}`:''}
      ${(!w||!o.dept)&&o.kind!=='holiday'?`<label class="field" style="width:140px">員工可自己畫<select data-of="selfPick"><option value="1" ${o.selfPick?'selected':''}>是，開放畫休</option><option value="0" ${o.selfPick?'':'selected'}>否</option></select></label>`:''}
      <button class="btn danger" data-delopt="${o.id}" style="align-self:flex-end">刪除</button>${colorPick(o)}</div>`;
  }).join('');
  const leaveAdjBlock=e=>{
    const lt=cfg.options.filter(o=>o.kind==='leave'&&!o.annual);
    if(!lt.length) return '';
    return `<details class="notes"><summary>各假別天數（留空依預設）</summary><p class="hint" style="margin:0 0 10px">特休請在上面的「特休天數（手動）」調整。這裡可以單獨調整這位人員其他假別的天數上限，留空就用假別預設值。</p><div class="setgrid">${lt.map(o=>`<label class="field">${esc(o.label)}（預設 ${o.quota==null?'不限':f1(o.quota)} 天）<input type="number" data-lq="${o.id}" min="0" step="0.5" value="${e.leaveAdj&&e.leaveAdj[o.id]!=null?e.leaveAdj[o.id]:''}"></label>`).join('')}</div></details>`;
  };
  const bindBlock=u=>{
    const p=people[u]||{},ap=!!approved.byUid[u];
    const row=(k,v)=>`<dt>${k}</dt><dd>${v?esc(v):'<span class="muted">未填</span>'}</dd>`;
    return `<div class="bind"><div class="bh"><b>${esc((profiles[u]&&profiles[u].name)||'員工')}</b><span class="badge ${ap?'':'warn'}">${ap?'已確認':'待確認'}</span><button class="btn" data-approve="${u}" style="padding:4px 10px">${ap?'撤銷確認':'確認綁定'}</button></div>
      <dl class="pi">${row('登入信箱',(p.email||'')+(p.email&&p.emailVerified?'（已驗證）':''))}${row('LINE ID',p.lineId)}${row('個人手機',p.phone)}${row('緊急聯絡人',p.emName)}${row('緊急聯絡電話',p.emPhone)}${row('居住地址',p.address)}</dl></div>`;
  };
  const notesBlock=e=>{
    const n=notes.byEmp[e.id]||{},sum=noteSummary(n);
    const chips=(attr,list,sel)=>`<div class="chips">${list.map(([v,l])=>`<label><input type="checkbox" ${attr}="${v}" ${sel.includes(v)?'checked':''}><span>${esc(l)}</span></label>`).join('')}</div>`;
    const sess=cfg.sessions.map(x=>[x.id,x.label]);
    return `<details class="notes" data-notes="${e.id}" ${openNotes.has(e.id)?'open':''}><summary>備註與個人要求（只有管理者看得到）${sum?`<span class="nsum">${esc(sum.length>40?sum.slice(0,40)+'…':sum)}</span>`:''}</summary>
      <p class="hint" style="margin:0 0 10px">自動排班會先照這裡的要求安排，再補人力缺額。手動排班違反時會標紅。這些內容員工看不到。</p>
      <div class="setgrid">
        <div class="field">固定休息的星期${chips('data-nwd',WD.map((x,i)=>[i,'週'+x]),n.offWeekdays||[])}</div>
        <div class="field">不能上的診次${chips('data-nss',sess,n.noSessions||[])}</div>
        <div class="field">偏好的診次${chips('data-nps',sess,n.prefSessions||[])}</div>
        <label class="field">每週最多上班天數（留空不限）<input type="number" data-nf="maxDays" min="1" max="7" value="${n.maxDays||''}"></label>
        <div class="field">指定不排班的日期<div class="chips" style="align-items:center">${(n.offDates||[]).map(x=>`<span class="dchip">${md(x)}<button data-ndel="${x}" aria-label="移除 ${md(x)}">×</button></span>`).join('')}<input type="date" data-nd style="width:150px"><button class="btn" data-ndadd="${e.id}" style="padding:5px 10px">加入</button></div></div>
      </div>
      <label class="field" style="margin-top:12px">備註<textarea data-nf="text" rows="3" placeholder="例如：每週三下午要接送小孩；考試週希望少排晚診">${esc(n.text||'')}</textarea></label>
    </details>`;
  };
  const erow=e=>{
    const bound=Object.entries(reqs).filter(([,r])=>r.empId===e.id).map(([u])=>u);
    const who='';
    const ds=e.depts||[];
    return `<div class="erow" data-emp="${e.id}">
      <label class="field" style="width:120px">姓名<input type="text" data-ef="name" value="${esc(e.name)}"></label>
      <label class="field" style="width:110px">職稱<input type="text" data-ef="role" value="${esc(e.role)}"></label>
      <label class="field" style="width:120px">分頁<select data-ef="group">${Object.entries(GROUPS).map(([k,v])=>`<option value="${k}" ${e.group===k?'selected':''}>${v}</option>`).join('')}</select></label>
      <label class="field" style="width:150px">到職日<input type="date" data-ef="hire" value="${e.hire||''}"></label>
      <label class="field" style="width:80px">工時比例<input type="number" data-ef="ratio" min="0.1" max="1" step="0.1" value="${e.ratio||1}"></label>
      <label class="field" style="width:150px">特休天數（手動）<input type="number" data-ef="leaveManual" min="0" max="60" step="0.5" value="${manualLeave(e)!=null?manualLeave(e):''}" placeholder="自動 ${f1(leaveInfo(e,fmtD(new Date())).auto)}" aria-label="特休天數，留空依勞基法自動帶入"></label>
      ${e.group==='pt'?`<div class="field">可上科別<div class="chips">${cfg.depts.map(x=>`<label><input type="checkbox" data-ed="${x.id}" ${!ds.length||ds.includes(x.id)?'checked':''}><span>${esc(x.label)}</span></label>`).join('')}</div></div>`:''}
      <div style="display:flex;gap:6px;align-self:flex-end">${bound.length?`<button class="btn" data-unbind="${e.id}">解除綁定</button>`:''}<button class="btn danger" data-delemp="${e.id}">刪除</button></div>
      ${bound.length?bound.map(u=>bindBlock(u)).join(''):'<div class="bind muted">尚未綁定帳號。員工用 email 登入後會自己認領並填寫個人資料。</div>'}${leaveAdjBlock(e)}${notesBlock(e)}</div>`;
  };
  const dmTable=(key,title)=>`<div><div class="field" style="margin-bottom:6px">${title}</div><div class="scroll"><table class="sum"><thead><tr><th></th>${cfg.sessions.map(s=>`<th>${esc(s.label)}</th>`).join('')}</tr></thead><tbody>${cfg.depts.map(dp=>`<tr><td>${esc(dp.label)}</td>${cfg.sessions.map((s,i)=>`<td><input class="num" type="number" min="0" max="30" data-dm="${key}|${dp.id}|${i}" value="${((cfg.demand[key]||{})[dp.id]||[])[i]||0}" aria-label="${esc(title+' '+dp.label+' '+s.label+' 最少人數')}"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  const adTable=(key,title)=>`<div><div class="field" style="margin-bottom:6px">${title}</div><div class="scroll"><table class="sum"><thead><tr><th></th>${cfg.sessions.map(s=>`<th>${esc(s.label)}</th>`).join('')}</tr></thead><tbody><tr><td>助理</td>${cfg.sessions.map((s,i)=>`<td><input class="num" type="number" min="0" max="30" data-adm="${key}|${i}" value="${(cfg.asstDemand[key]||[])[i]||0}" aria-label="${esc(title+' 助理 '+s.label+' 最少人數')}"></td>`).join('')}</tr></tbody></table></div></div>`;
  const list=g=>{const l=cfg.employees.filter(e=>e.group===g);return `<h3>${GROUPS[g]}（${l.length}）</h3>${l.map(erow).join('')||'<p class="hint">這組還沒有人員。</p>'}`};
  const cl=cfg.clinic||{};
  return `
  <div class="panel sec"><h2>診所名稱與 Logo</h2>
    <p class="hint" style="margin:0 0 10px">名稱和 logo 會出現在頁面標題、傳給員工的班表圖片和通知文字上。</p>
    <div class="rf" style="max-width:640px">
      <label class="field">診所名稱<input id="clinicName" type="text" value="${esc(cl.name||'')}" maxlength="30" placeholder="例如：○○復健科診所"></label>
      <div class="field">Logo（建議正方形、背景透明的 PNG）<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${cl.logo?`<img src="${esc(cl.logo)}" alt="目前的 logo" style="height:52px;width:52px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#fff">`:''}<input id="clinicLogo" type="file" accept="image/*" aria-label="上傳 logo">${cl.logo?'<button class="btn" data-act="rmlogo">移除</button>':''}</div></div>
    </div></div>
  <div class="panel sec"><h2>診所時段與科別</h2>
    <p class="hint" style="margin:0 0 8px">診所分成三個診次，排班工時直接加總各診次時間，不扣中間休息。</p>
    ${cfg.sessions.map(s=>`<div class="srow" data-ses="${s.id}"><label class="field" style="width:100px">名稱<input type="text" data-sf="label" value="${esc(s.label)}" maxlength="4"></label><label class="field" style="width:120px">開始<input type="time" data-sf="start" value="${s.start}"></label><label class="field" style="width:120px">結束<input type="time" data-sf="end" value="${s.end}"></label><div class="field">時數<span style="font-size:14px;color:var(--ink);font-family:var(--mono)">${f1(segHours(s))} h</span></div></div>`).join('')}
    <h3>科別</h3>
    <div class="chips" style="gap:10px">${cfg.depts.map(x=>`<span style="display:inline-flex;gap:4px;align-items:center" data-dept="${x.id}"><input class="num" style="width:90px;text-align:left" type="text" data-df="label" value="${esc(x.label)}" maxlength="4" aria-label="科別名稱"><button class="btn danger" data-deldept="${x.id}" aria-label="刪除科別">×</button></span>`).join('')}<button class="btn" data-act="adddept">新增科別</button></div></div>
  <div class="panel sec"><h2>各診次最低人數</h2>
    <p class="hint" style="margin:0 0 10px">營業日每天每個診次最少要有幾位人員在班。治療師依科別設定，助理不分科、合計計算。自動排班會照這些數字安排，班表下方的缺額也用它計算。</p>
    <h3 style="margin-top:0">物理治療師（每科）</h3>
    <div class="setgrid">${dmTable('wk','週一到週五')}${dmTable('sat','週六、週日（有營業的話）')}</div>
    <h3>骨科助理（合計）</h3><p class="hint" style="margin:0 0 8px">助理只支援骨科，不計入上面骨科治療師的最低人力，也不支援小兒。</p>
    <div class="setgrid">${adTable('wk','週一到週五')}${adTable('sat','週六、週日（有營業的話）')}</div></div>
  <div class="panel sec"><h2>治療師班別與休假選項</h2>
    <p class="hint" style="margin:0 0 6px">這些就是治療師班表點格子時的選項，可以自由新增與修改。上班班別 = 一個科別加上要上的診次，例如「骨科 早診＋午診」是 08:00–17:30，共 8 小時。助理不用這裡的上班班別，直接在班表上選診次組合或自訂時間；例假、休息日、國定假日、特休兩組共用。</p>
    ${orows}
    <div class="addrow"><button class="btn primary" data-act="addopt">新增選項</button><button class="btn" data-act="addlaw">加入勞基法假別</button></div></div>
  <div class="panel sec"><h2>人員</h2>
    <p class="hint" style="margin:0 0 6px">「分頁」決定這個人出現在治療師還是助理的班表。到職日用來計算年資與特休。可上科別沒勾的科，自動排班不會排給這位治療師。員工用自己的帳號開啟頁面後，會選擇「這是我」來綁定姓名，之後只能在自己那一列畫休。工時比例 1 代表全職，兼職可填 0.5。</p>
    ${list('pt')}${list('asst')}
    <form class="addrow" id="addEmp"><label class="field" style="flex:1;min-width:120px">姓名<input id="newName" required></label><label class="field" style="width:120px">分頁<select id="newGroup"><option value="pt">物理治療師</option><option value="asst">助理</option></select></label><label class="field" style="flex:1;min-width:120px">職稱<input id="newRole" value="物理治療師"></label><label class="field" style="width:150px">到職日<input id="newHire" type="date"></label><button class="btn primary" type="submit" style="align-self:flex-end">新增人員</button></form></div>
  ${extraPanels()}
  <div class="panel sec"><h2>診所設定</h2>
    <div class="setgrid">
      <div><div class="field">營業日（沒勾的日子全員放假，最後一天算例假）</div><div class="chips" style="margin-top:6px">${WD.map((d,i)=>`<label><input type="checkbox" data-open="${i}" ${cfg.openDays.includes(i)?'checked':''}><span>${d}</span></label>`).join('')}</div></div>
      <div><label class="field">國定假日是否休診<select id="holClosed"><option value="1" ${cfg.holidayClosed?'selected':''}>休診，自動排國定假日</option><option value="0" ${cfg.holidayClosed?'':'selected'}>照常看診</option></select></label></div>
      <div><label class="field">每人每月休息類畫休上限（天）<input id="maxReq" type="number" min="0" max="31" value="${cfg.maxReq}"></label></div>
      <div><label class="field">每人每月徒手日上限（天）<input id="maxManual" type="number" min="0" max="31" value="${cfg.maxManual}"></label></div>
    </div>
    <h3>權限</h3>
    <p class="hint">員工要先在上面的「允許登入的 email」名單裡，才能用 email 驗證碼登入。員工看得到全部班表，但只能改自己的畫休、換班與個人資料。只有管理者能改班表與設定。</p>
    <h3>辦公日曆</h3>
    <p class="hint">${Object.keys(HOL).join('、')} 年已內建行政院人事行政總處辦公日曆。其他年度與臨時調整，請在班表頁點日期欄位，手動設定那天是上班日或放假日。已手動調整的日期：${Object.keys(cfg.dayOv).length?Object.entries(cfg.dayOv).sort().map(([d,v])=>`${md(d)}（${v==='work'?'上班':'放假'}）`).join('、'):'無'}。</p></div>`;
}

async function loadProfiles(){
  if(!userCap) return;
  const ids=Object.keys(reqs).filter(u=>!profiles[u]);
  if(!ids.length) return;
  try{const p=await userCap.profiles(ids);Object.assign(profiles,p);if(tab==='settings'&&!document.activeElement.closest('#view input,#view select')) render()}catch(e){}
}

/* ---------- 選單與提示 ---------- */
const menu=document.getElementById('menu');
function closeMenu(){menu.hidden=true;menu.innerHTML=''}
function placeMenu(btn){
  menu.hidden=false;
  const r=btn.getBoundingClientRect(),mw=menu.offsetWidth,mh=menu.offsetHeight;
  menu.style.left=Math.max(8,Math.min(innerWidth-mw-8,r.left+r.width/2-mw/2))+'px';
  menu.style.top=(r.bottom+6+mh<innerHeight?r.bottom+6:Math.max(8,r.top-mh-6))+'px';
  const f=menu.querySelector('button');if(f)f.focus();
}
function openCellMenu(btn,eid,d){
  const cur=codeAt(eid,d),emp=cfg.employees.find(x=>x.id===eid);
  const asst=emp&&emp.group==='asst';
  let h='';
  if(asst){
    h+='<div class="mt">上班時段</div>';
    for(let m=1;m<(1<<cfg.sessions.length);m++){
      const ss=cfg.sessions.filter((x,i)=>m&(1<<i));
      const code='T:'+ss.map(x=>x.id).join('+'),hh=ss.reduce((t,x)=>t+segHours(x),0);
      if(hh>DAY_H) continue;
      h+=`<button data-pick="${code}"><span>${ss.map(x=>esc(x.label.slice(0,1))).join('＋')}${cur===code?' ✓':''}</span><small>${optTimes(optOf(code))} · ${f1(hh)}h</small></button>`;
    }
    const cc=cur.startsWith('C:')?cur.slice(2).split('-'):['09:00','13:00'];
    h+=`<div class="mt">自訂時間</div><div style="display:flex;gap:6px;align-items:center;padding:2px 8px 6px"><input id="cStart" type="time" value="${cc[0]}" aria-label="開始時間" style="width:94px"><span>–</span><input id="cEnd" type="time" value="${cc[1]}" aria-label="結束時間" style="width:94px"><button class="btn" data-custom="1" style="padding:5px 10px">套用</button></div><hr>`;
  }
  ['work','fixed','rest','holiday','leave'].forEach(k=>{
    if(asst&&k==='work') return;
    cfg.options.filter(o=>o.kind===k).forEach(o=>{
      const off=k==='work'&&emp&&!canDo(emp,o);
      h+=`<button data-pick="${o.id}"><span><i class="sw c${o.color%9}" style="vertical-align:-2px;margin-right:8px"></i>${esc(o.label)}${cur===o.id?' ✓':''}${off?' ⚠':''}</span><small>${k==='work'?optTimes(o):KINDS[k]}</small></button>`;
    });
  });
  h+=`<hr><button data-pick=""><span>清除${cur===''?' ✓':''}</span><small>${asst?'不排班':'未排'}</small></button>`;
  menu.innerHTML=h;menu.dataset.eid=eid;menu.dataset.date=d;menu.dataset.mode='cell';
  placeMenu(btn);
}
function openDayMenu(btn,d){
  const cur=(cfg.dayOv&&cfg.dayOv[d])||'';
  menu.innerHTML=`<div class="mt">${md(d)}（${WD[wdIdx(d)]}）</div>
    <button data-ov=""><span>依辦公日曆${cur===''?' ✓':''}</span></button>
    <button data-ov="work"><span>設為上班日${cur==='work'?' ✓':''}</span></button>
    <button data-ov="off"><span>設為放假日${cur==='off'?' ✓':''}</span></button>`;
  menu.dataset.date=d;menu.dataset.mode='day';
  placeMenu(btn);
}
let toastT;
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2600)}

/* ---------- 事件 ---------- */
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;render()}});
document.addEventListener('click',e=>{
  const pick=e.target.closest('#menu [data-pick]');
  if(pick){setLocal(menu.dataset.eid,menu.dataset.date,pick.dataset.pick);flushMonth(monthOf(menu.dataset.date));render();return}
  const rqb=e.target.closest('#menu [data-rq]');
  if(rqb){setReq(menu.dataset.eid,menu.dataset.date,rqb.dataset.rq);return}
  if(e.target.closest('#menu [data-rqclear]')){setReq(menu.dataset.eid,menu.dataset.date,'');return}
  const apv=e.target.closest('[data-approve]')?.dataset.approve;
  if(apv){const b={...approved.byUid};if(b[apv])delete b[apv];else b[apv]=true;approved={...approved,byUid:b};writeDoc('approvals/main',approved);render();return}
  const cust=e.target.closest('#menu [data-custom]');
  if(cust){
    const a=document.getElementById('cStart').value,b=document.getElementById('cEnd').value;
    if(!a||!b||toMin(b)<=toMin(a)){toast('結束時間要晚於開始時間');return}
    setLocal(menu.dataset.eid,menu.dataset.date,'C:'+a+'-'+b);flushMonth(monthOf(menu.dataset.date));render();return;
  }
  const ov=e.target.closest('#menu [data-ov]');
  if(ov){const d=menu.dataset.date;cfg={...cfg,dayOv:{...cfg.dayOv}};if(ov.dataset.ov)cfg.dayOv[d]=ov.dataset.ov;else delete cfg.dayOv[d];saveCfg();render();return}
  const cell=e.target.closest('[data-cell]');
  if(cell&&!cell.disabled){
    const [eid,d]=cell.dataset.cell.split('|');
    if(isAdmin){openCellMenu(cell,eid,d)}
    else openReqMenu(cell,eid,d);
    return;
  }
  const day=e.target.closest('[data-day]');
  if(day){openDayMenu(day,day.dataset.day);return}
  if(!e.target.closest('#menu')) closeMenu();
  if(e.target.closest('[data-swsubmit]')){submitSwap();return}
  const swa=e.target.closest('[data-swack]')?.dataset.swack;if(swa){const [i,v]=swa.split('|');ackSwap(i,v);return}
  const swd=e.target.closest('[data-swwd]')?.dataset.swwd;if(swd){const [u,i]=swd.split('|');withdrawSwap(u,i);return}
  const swo=e.target.closest('[data-swok]')?.dataset.swok;if(swo){decideSwap(swo,true);return}
  const swn=e.target.closest('[data-swno]')?.dataset.swno;if(swn){decideSwap(swn,false);return}
  const cpy=e.target.closest('[data-copy]')?.dataset.copy;if(cpy){copyText(cpy);return}
  const imgk=e.target.closest('[data-img]')?.dataset.img;if(imgk){imgAction(imgk);return}
  const imgc=e.target.closest('[data-imgcopy]')?.dataset.imgcopy;if(imgc){copyImage(imgc);return}
  const ndadd=e.target.closest('[data-ndadd]')?.dataset.ndadd;
  if(ndadd){
    const inp=e.target.closest('[data-notes]').querySelector('[data-nd]');
    if(!inp.value){toast('先選一個日期');return}
    const cur=(notes.byEmp[ndadd]||{}).offDates||[];
    if(!cur.includes(inp.value)) updNote(ndadd,{offDates:[...cur,inp.value].sort()});
    openNotes.add(ndadd);render();return;
  }
  const ndel=e.target.closest('[data-ndel]')?.dataset.ndel;
  if(ndel){const eid=e.target.closest('[data-notes]').dataset.notes;updNote(eid,{offDates:((notes.byEmp[eid]||{}).offDates||[]).filter(x=>x!==ndel)});openNotes.add(eid);render();return}
  const act=e.target.closest('[data-act]')?.dataset.act;
  if(act==='pm'){ym=shiftMonth(ym,-1);render()}
  else if(act==='nm'){ym=shiftMonth(ym,1);render()}
  else if(act==='tm'){ym=fmtD(new Date()).slice(0,7);render()}
  else if(act==='auto'){autoMonth(tab);render();toast('已重新排好本月')}
  else if(act==='clear'){cfg.employees.filter(e=>e.group===tab).forEach(e=>monthDates(ym).forEach(d=>setLocal(e.id,d,'')));flushMonth(ym);render();toast('已清空本月')}
  else if(act==='toggleopen'){const s=new Set(cfg.openMonths);s.has(ym)?s.delete(ym):s.add(ym);cfg={...cfg,openMonths:[...s].sort()};saveCfg();render()}
  else if(act==='init'){
    const old=cfg&&cfg.employees?cfg.employees:[];
    cfg=defaultCfg();cfg.employees=old.map(x=>({...x,hire:x.hire||'',depts:x.depts||[]}));cfg.asstDemand=cfg.asstDemand;
    if(roster[ym]) { /* 班表內容保留，選項 id 改變的格子會顯示「?」 */ }
    saveCfg();render();
  }
  else if(act==='publish'){const s=new Set(cfg.published);s.has(ym)?s.delete(ym):s.add(ym);cfg={...cfg,published:[...s].sort()};saveCfg();render();toast(s.has(ym)?'已公布，員工現在看得到排班':'已改回草稿')}
  else if(act==='copyprev'){copyPrev(tab);render();toast('已套用 4 週前的班表，請檢查假日與缺額')}
  else if(act==='rmlogo'){cfg={...cfg,clinic:{...(cfg.clinic||{}),logo:''}};saveCfg();render()}
  else if(act==='signout'){platform.signOut()}
  else if(act==='bkexport'){platform.downloads.save({filename:`排班備份-${fmtD(new Date())}.json`,data:platform.backup.exportJson()}).then(()=>toast('已匯出備份'),()=>{})}
  else if(act==='bkclear'){if(confirm('確定要清除這個瀏覽器裡的全部排班資料嗎？建議先匯出備份。')){platform.backup.clearAll();roster={};toast('已清除')}}
  else if(act==='initdemo'){cfg=defaultCfg();cfg.employees=demoEmployees();saveCfg();render()}
  else if(act==='addlaw'){const miss=LAW_LEAVES.filter(x=>!cfg.options.some(o=>o.id===x.id));if(!miss.length){toast('勞基法假別都已經加入了');return}cfg={...cfg,options:[...cfg.options,...miss.map(x=>({...x}))]};saveCfg();render();toast(`已加入 ${miss.length} 個假別`)}
  else if(act==='exportroster') exportCsv('roster');
  else if(act==='exporthours') exportCsv('hours');
  else if(act==='addopt'){cfg={...cfg,options:[...cfg.options,{id:'o_'+uid8(),label:'新班別',kind:'work',dept:cfg.depts[0]?cfg.depts[0].id:'',segs:['s1','s2'],credit:0,annual:false,selfPick:false,color:cfg.options.length%8}]};saveCfg();render()}
  else if(act==='adddept'){cfg={...cfg,depts:[...cfg.depts,{id:'d_'+uid8(),label:'新科別'}]};saveCfg();render()}
  const delopt=e.target.closest('[data-delopt]')?.dataset.delopt;
  if(delopt){cfg={...cfg,options:cfg.options.filter(o=>o.id!==delopt)};saveCfg();render();toast('已刪除。班表裡用到它的格子會顯示「?」')}
  const deldept=e.target.closest('[data-deldept]')?.dataset.deldept;
  if(deldept){cfg={...cfg,depts:cfg.depts.filter(x=>x.id!==deldept)};saveCfg();render();toast('已刪除科別。用到它的班別請重新指定科別')}
  const memdel=e.target.closest('[data-memdel]')?.dataset.memdel;
  if(memdel){platform.members.remove(memdel).then(loadMembers).catch(()=>toast('移除失敗'));return}
  const delemp=e.target.closest('[data-delemp]')?.dataset.delemp;
  if(delemp){cfg={...cfg,employees:cfg.employees.filter(x=>x.id!==delemp)};saveCfg();if(notes.byEmp[delemp]){const b={...notes.byEmp};delete b[delemp];notes={...notes,byEmp:b};saveNotes()}render()}
  const unbind=e.target.closest('[data-unbind]')?.dataset.unbind;
  if(unbind){Object.entries(reqs).filter(([,r])=>r.empId===unbind).forEach(async([u])=>{try{await db.doc('requests/'+u).delete();if(approved.byUid[u]){const b={...approved.byUid};delete b[u];approved={...approved,byUid:b};writeDoc('approvals/main',approved)}}catch(err){writeFail(err)}})}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

view.addEventListener('toggle',e=>{const n=e.target.closest&&e.target.closest('[data-notes]');if(!n)return;if(n.open)openNotes.add(n.dataset.notes);else openNotes.delete(n.dataset.notes)},true);
function updNote(eid,patch){
  const cur=notes.byEmp[eid]||{};
  const nx={...cur,...patch};
  Object.keys(nx).forEach(k=>{const v=nx[k];if(v==null||v===''||(Array.isArray(v)&&!v.length))delete nx[k]});
  notes={...notes,byEmp:{...notes.byEmp,[eid]:nx}};
  saveNotes();
}
view.addEventListener('change',e=>{
  const swk=e.target.dataset&&e.target.dataset.sw;
  if(swk){swapDraft[swk]=e.target.value;if(swk==='toEmp'||swk==='dateA'||swk==='type')swapDraft.dateB='';render();return}
  if(!isAdmin||!cfg) return;
  const nb=e.target.closest('[data-notes]');
  if(nb){
    const eid=nb.dataset.notes,t=e.target;
    const pickList=(attr,num)=>[...nb.querySelectorAll('['+attr+']')].filter(c=>c.checked).map(c=>num?+c.getAttribute(attr):c.getAttribute(attr));
    if(t.hasAttribute('data-nwd')) updNote(eid,{offWeekdays:pickList('data-nwd',true)});
    else if(t.hasAttribute('data-nss')) updNote(eid,{noSessions:pickList('data-nss')});
    else if(t.hasAttribute('data-nps')) updNote(eid,{prefSessions:pickList('data-nps')});
    else if(t.dataset.nf==='maxDays') updNote(eid,{maxDays:Math.min(7,Math.max(0,Number(t.value)||0))||null});
    else if(t.dataset.nf==='text') updNote(eid,{text:t.value.trim()});
    return;
  }
  const t=e.target,orow=t.closest('[data-opt]'),erow=t.closest('[data-emp]'),srow=t.closest('[data-ses]'),drow=t.closest('[data-dept]');
  if(erow&&t.dataset.lq!==undefined){
    const emp=cfg.employees.find(x=>x.id===erow.dataset.emp);if(!emp) return;
    const adj={...(emp.leaveAdj||{})};
    if(t.value==='') delete adj[t.dataset.lq];else adj[t.dataset.lq]=Math.max(0,Number(t.value)||0);
    cfg={...cfg,employees:cfg.employees.map(x=>x.id===emp.id?{...x,leaveAdj:adj}:x)};saveCfg();
  } else if(orow&&(t.dataset.of||t.dataset.seg)){
    let patch;
    if(t.dataset.seg){patch={segs:[...orow.querySelectorAll('[data-seg]')].filter(c=>c.checked).map(c=>c.dataset.seg)}}
    else{
      const f=t.dataset.of;let v=t.dataset.v!==undefined?+t.dataset.v:t.value;
      if(f==='credit') v=Math.max(0,Number(v)||0);
      if(f==='annual'||f==='selfPick') v=v==='1';
      if(f==='quota'||f==='perMonth') v=v===''?null:Math.max(0,Number(v)||0);
      if(f==='label'&&!String(v).trim()) return;
      patch={[f]:v};
    }
    cfg={...cfg,options:cfg.options.map(o=>o.id===orow.dataset.opt?{...o,...patch}:o)};
    saveCfg();if(t.dataset.of==='kind'||t.dataset.seg)render();
  } else if(erow&&(t.dataset.ef||t.dataset.ed)){
    let patch;
    if(t.dataset.ed){
      const sel=[...erow.querySelectorAll('[data-ed]')].filter(c=>c.checked).map(c=>c.dataset.ed);
      patch={depts:sel.length===cfg.depts.length?[]:sel};
    } else {
      const f=t.dataset.ef;let v=t.value;
      if(f==='ratio') v=Math.min(1,Math.max(0.1,Number(v)||1));
      else if(f==='leaveManual') v=v===''?null:Math.max(0,Number(v)||0);
      else if(f!=='hire'&&!v.trim()) return;
      patch={[f]:v};
      if(f==='group') patch.depts=[];
    }
    cfg={...cfg,employees:cfg.employees.map(x=>x.id===erow.dataset.emp?{...x,...patch}:x)};
    saveCfg();if(t.dataset.ef==='group')render();
  } else if(t.dataset.adm){
    const [key,i]=t.dataset.adm.split('|');
    const arr=[...(cfg.asstDemand[key]||cfg.sessions.map(()=>0))];arr[+i]=Math.max(0,Math.min(30,Number(t.value)||0));
    cfg={...cfg,asstDemand:{...cfg.asstDemand,[key]:arr}};saveCfg();
  } else if(srow&&t.dataset.sf){
    const f=t.dataset.sf;if(!t.value) return;
    cfg={...cfg,sessions:cfg.sessions.map(s=>s.id===srow.dataset.ses?{...s,[f]:t.value}:s)};saveCfg();render();
  } else if(drow&&t.dataset.df){
    if(!t.value.trim()) return;
    cfg={...cfg,depts:cfg.depts.map(x=>x.id===drow.dataset.dept?{...x,label:t.value.trim()}:x)};saveCfg();
  } else if(t.dataset.dm){
    const [key,dept,i]=t.dataset.dm.split('|');
    const arr=[...((cfg.demand[key]||{})[dept]||cfg.sessions.map(()=>0))];arr[+i]=Math.max(0,Math.min(30,Number(t.value)||0));
    cfg={...cfg,demand:{...cfg.demand,[key]:{...(cfg.demand[key]||{}),[dept]:arr}}};saveCfg();
  } else if(t.dataset.open!==undefined){
    cfg={...cfg,openDays:[...view.querySelectorAll('[data-open]')].filter(c=>c.checked).map(c=>+c.dataset.open)};saveCfg();
  } else if(t.id==='holClosed'){cfg={...cfg,holidayClosed:t.value==='1'};saveCfg()}
  else if(t.id==='maxReq'){cfg={...cfg,maxReq:Math.max(0,Math.min(31,Number(t.value)||0))};saveCfg()}
  else if(t.id==='clinicRules'){cfg={...cfg,clinicRules:t.value};saveCfg()}
  else if(t.id==='bkimport'){importBackup(t.files&&t.files[0])}
  else if(t.id==='clinicName'){cfg={...cfg,clinic:{...(cfg.clinic||{}),name:t.value.trim()}};saveCfg();setHeader()}
  else if(t.id==='clinicLogo'){readLogo(t.files&&t.files[0])}
  else if(t.id==='maxManual'){cfg={...cfg,maxManual:Math.max(0,Math.min(31,Number(t.value)||0))};saveCfg()}
});
view.addEventListener('submit',e=>{
  if(e.target.id==='meForm'){e.preventDefault();submitMe();return}
  if(e.target.id==='addMember'){
    e.preventDefault();
    const inp=document.getElementById('newMember'),em=inp.value.trim().toLowerCase();
    if(!em) return;
    platform.members.add(em).then(()=>{inp.value='';loadMembers();toast('已加入')}).catch(err=>toast('加入失敗：'+((err&&err.message)||'')));
    return;
  }
  if(e.target.id!=='addEmp') return;
  e.preventDefault();
  const name=document.getElementById('newName').value.trim();if(!name) return;
  cfg={...cfg,employees:[...cfg.employees,{id:'e'+uid8(),name,role:document.getElementById('newRole').value.trim()||'物理治療師',group:document.getElementById('newGroup').value,ratio:document.getElementById('newGroup').value==='asst'?0.5:1,hire:document.getElementById('newHire').value||'',depts:[]}]};
  saveCfg();render();
});

/* ---------- 資料訂閱 ---------- */
function normalizeCfg(c){
  if(!c) return null;
  const n={...c};
  n.openDays=n.openDays||[];n.openMonths=n.openMonths||[];n.dayOv=n.dayOv||{};n.options=n.options||[];
  n.clinic=n.clinic||{name:'',logo:''};
  n.clinicRules=n.clinicRules||'';
  n.published=n.published||[];n.maxManual=n.maxManual==null?4:n.maxManual;
  n.options=n.options.map(o=>o.selfPick!==undefined?o:{...o,selfPick:['fixed','rest','leave'].includes(o.kind)||(o.kind==='work'&&!o.dept)});
  n.sessions=n.sessions||[];n.depts=n.depts||[];n.demand=n.demand||{wk:{},sat:{}};
  n.asstDemand=n.asstDemand||{wk:n.sessions.map(()=>1),sat:n.sessions.map(()=>1)};
  n.employees=(n.employees||[]).map(e=>({...e,group:e.group||(/助理/.test(e.role||'')?'asst':'pt')}));
  return n;
}
async function init(){
  platform=await window.Platform.boot(view);
  db=platform.db;userCap=platform.user;downloadsCap=platform.downloads;
  me=await userCap.me();isAdmin=await userCap.canEdit();uid=me.id;
  if(!isAdmin){
    if(uid) db.doc('data/users/'+uid+'/profile').onSnapshot(snap=>{
      const next=snap.exists?snap.data():null;
      if(JSON.stringify(next)===JSON.stringify(people[uid]||null)&&profileLoaded) return;
      if(next) people[uid]=next;
      profileLoaded=true;render();
    },()=>{profileLoaded=true;render()});
    else profileLoaded=true;
  } else profileLoaded=true;
  db.doc('approvals/main').onSnapshot(snap=>{
    const next={byUid:{},...(snap.exists?snap.data():{})};
    if(JSON.stringify(next)===JSON.stringify(approved)) return;
    approved=next;render();
  },()=>{});
  db.doc('config/main').onSnapshot(snap=>{
    const next=normalizeCfg(snap.exists?snap.data():null);
    if(JSON.stringify(next)===JSON.stringify(cfg)) return;
    cfg=next;
    render();
  },err=>{dbError='讀取班表失敗，請重新整理頁面。';render()});
  db.collection('requests').onSnapshot(snap=>{
    const next={};snap.docs.forEach(d=>next[d.id]=d.data());
    if(JSON.stringify(next)===JSON.stringify(reqs)) return;
    reqs=next;
    if(isAdmin) Object.keys(reqs).forEach(u=>{
      if(profileSubs.has(u)) return;
      profileSubs.add(u);
      db.doc('data/users/'+u+'/profile').onSnapshot(sn=>{people[u]=sn.exists?sn.data():{};if(tab==='settings'&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#view input,#view select,#view textarea')))render()},()=>{});
    });
    render();
  },()=>{});
  if(isAdmin) db.doc('notes/main').onSnapshot(snap=>{
    const next=snap.exists?snap.data():{byEmp:{}};
    if(JSON.stringify(next)===JSON.stringify(notes)) return;
    notes={byEmp:{},...next};render();
  },()=>{});
  db.collection('swaps').onSnapshot(snap=>{const next={};snap.docs.forEach(x=>next[x.id]=x.data());if(JSON.stringify(next)===JSON.stringify(swaps))return;swaps=next;render()},()=>{});
  db.collection('swapAcks').onSnapshot(snap=>{const next={};snap.docs.forEach(x=>next[x.id]=x.data());if(JSON.stringify(next)===JSON.stringify(acks))return;acks=next;render()},()=>{});
  db.doc('swapDecisions/main').onSnapshot(snap=>{const next={byId:{},...(snap.exists?snap.data():{})};if(JSON.stringify(next)===JSON.stringify(decisions))return;decisions=next;render()},()=>{});
  db.collection('roster').onSnapshot(snap=>{
    const next={};snap.docs.forEach(d=>next[d.id]=d.data());
    if(JSON.stringify(next)===JSON.stringify(roster)) return;
    roster=next;render();
  },()=>{});
  render();
}
render();
init();
