/* =============================================================
   app.js — 共通ロジック（Firebase Firestore 読み書き・集計）
   経営ビュー(exec.html)・実務ビュー(ops.html) の両方から使う。
   データベースは1つ（Firestore の doc: projects/PJ-OSAKI-001）。
   ============================================================= */

// ---- 定数（マスタ）----
const PROJECT_ID = "PJ-OSAKI-001";
const PHASES = ["土地・契約","全体配置・敷地","インフラ","設計・承認","申請","工務・施工","販促・広告","営業準備","購買・調達"];
const BLDGS  = ["全体共通","仮設コンテナ","平屋MH","2階建MH","店舗"];
const DEPTS  = ["営業","工務","IC","設計","CX","工事部","アフター","管理部","社長室","総務","経理","企画開発"];
const STATUSES = ["未着手","進行中","完了","保留","対象外"];
const APPRS  = ["該当なし","準備中","個別相談済","会社承認待ち","社長承認済"];
const PRIS   = ["高","中","低"];

// ---- Firebase 初期化（v10 モジュールCDN）----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db = null, docRef = null, initErr = null;
try {
  if (!window.FIREBASE_CONFIG || String(window.FIREBASE_CONFIG.apiKey).includes("ここに")) {
    throw new Error("firebase-config.js が未設定です。README STEP2 を参照して値を貼ってください。");
  }
  const app = initializeApp(window.FIREBASE_CONFIG);
  db = getFirestore(app);
  docRef = doc(db, "projects", PROJECT_ID);
} catch (e) { initErr = e.message; }

// ---- 初回シード（DBが空なら初期データを投入）----
async function ensureSeed() {
  if (!docRef) return;
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const seed = window.SEED_DATA || { meta:{}, tasks:[], items:[] };
    seed.meta = seed.meta || {};
    seed.meta.updated = new Date().toISOString();
    await setDoc(docRef, seed);
  }
}

// ---- リアルタイム購読（変更が即両ビューに反映）----
function subscribe(onData, onError) {
  if (initErr) { onError && onError(initErr); return () => {}; }
  return onSnapshot(docRef,
    (snap) => { if (snap.exists()) onData(snap.data()); },
    (err)  => onError && onError(err.message));
}

// ---- 保存（実務ビューから）----
async function saveData(data) {
  if (initErr) throw new Error(initErr);
  const pass = window.WRITE_PASSPHRASE || "";
  if (pass) {
    const input = sessionStorage.getItem("wpass") || prompt("保存用の合言葉を入力してください");
    if (input !== pass) { throw new Error("合言葉が違います。保存を中止しました。"); }
    sessionStorage.setItem("wpass", input);
  }
  data.meta = data.meta || {};
  data.meta.updated = new Date().toISOString();
  await setDoc(docRef, data);
}

// ---- 集計ユーティリティ ----
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
function summarize(tasks) {
  const by = (k,v) => tasks.filter(t => t[k]===v);
  const done = by("status","完了").length;
  const prog = by("status","進行中").length;
  const need4 = tasks.filter(t => t.need4==="要");
  const apprLeft = need4.filter(t => t.appr!=="社長承認済").length;
  return { total:tasks.length, done, prog, todo:tasks.length-done-prog,
           rate:pct(done,tasks.length), need4:need4.length, apprLeft, need4List:need4 };
}
function byBuilding(tasks) {
  return BLDGS.map(b => {
    const g = tasks.filter(t=>t.bldg===b);
    const d = g.filter(t=>t.status==="完了").length;
    const p = g.filter(t=>t.status==="進行中").length;
    return { name:b, total:g.length, done:d, prog:p, todo:g.length-d-p, rate:pct(d,g.length) };
  }).filter(x=>x.total>0);
}
function byDept(tasks) {
  return DEPTS.map(dp => {
    const g = tasks.filter(t=>t.dept===dp);
    const d = g.filter(t=>t.status==="完了").length;
    const p = g.filter(t=>t.status==="進行中").length;
    return { name:dp, total:g.length, prog:p, done:d, rate:pct(d,g.length) };
  }).filter(x=>x.total>0);
}
function itemStats(items) {
  const done = items.filter(i=>i.done==="完了").length;
  const amount = items.reduce((s,i)=>s+(Number(i.amount)||0),0);
  return { total:items.length, done, todo:items.length-done, amount };
}
const esc = s => String(s??"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

export {
  PROJECT_ID, PHASES, BLDGS, DEPTS, STATUSES, APPRS, PRIS,
  initErr, ensureSeed, subscribe, saveData,
  pct, summarize, byBuilding, byDept, itemStats, esc
};
