import { app, auth, db } from "./core/firebase.js";
import { loginWithGoogle, logout, observeAuthState } from "./services/authService.js";
import { addLesson, updateLesson, deleteLesson } from "./services/lessonService.js";
import { addStudent, updateStudent, deleteStudent } from "./services/studentService.js";
import {
  calculateTotalRevenueFromLessons,
  extractUniqueStudentIdsFromLessons,
  calculateAveragePerStudent,
  calculateTotalRevenueForStudent,
  calculateMonthlyRevenueFromLessons,
  calculateForecastRevenueForLessons,
  calculateRealizedRevenueForLessons,
  calculateLessonCount,
  calculateYearlyStudentReport,
  calculateYearlyStudentRanking,
  calculateYearComparison
} from './services/reportService.js';
import { parseISODateLocal } from "./utils/dateService.js";
import { formatBRL, formatBRLFromCents, parseBRLToNumber } from "./utils/formatService.js";
import { $, els, pad2, ymdKey } from "./utils/uiHelpers.js";





import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


let isShiftPressed = false;

window.addEventListener("keydown", (e)=>{
  if(e.key === "Shift") isShiftPressed = true;
});

window.addEventListener("keyup", (e)=>{
  if(e.key === "Shift") isShiftPressed = false;
});


/* ======================= Config ======================= */
// Assinatura usada nas mensagens de WhatsApp
const BRAND_NAME = "Edson Silva";

// interpreta "YYYY-MM-DD" como data LOCAL (sem deslocamento de fuso)
// interpreta "YYYY-MM-DD" ou "YYYY-MM-DDTHH:MM" como data LOCAL
document.addEventListener("DOMContentLoaded", () => {
const btnToggleHistory = $("btnToggleHistory");
const historyContent  = $("historyContent");

if (btnToggleHistory && historyContent) {

  btnToggleHistory.addEventListener("click", () => {

    const isHidden = historyContent.style.display === "none";

    historyContent.style.display = isHidden ? "block" : "none";
    btnToggleHistory.textContent = isHidden ? "Ocultar" : "Mostrar";

  });

}

  const studentFormWrap = document.getElementById("studentFormWrap");
  const btnToggleStudentForm = document.getElementById("btnToggleStudentForm");

  if (btnToggleStudentForm && studentFormWrap) {
    btnToggleStudentForm.addEventListener("click", () => {

  const isOpen = studentFormWrap.classList.contains("form-open");

  studentFormWrap.classList.toggle("form-open");
  studentFormWrap.classList.toggle("form-collapsed");

  btnToggleStudentForm.textContent = isOpen ? "+ Novo Aluno" : "Fechar";
});
  }
// ===== EVOLUÇÃO - Modal =====
const evoModal = document.getElementById("evoModal");
const btnToggleEvoForm = document.getElementById("btnToggleEvoForm");
const btnCloseEvoModal = document.getElementById("btnCloseEvoModal");

if (evoModal && btnToggleEvoForm) {

  // Abrir modal
  btnToggleEvoForm.addEventListener("click", () => {
    evoModal.classList.add("show");
  });

  // Fechar pelo botão X
  if (btnCloseEvoModal) {
    btnCloseEvoModal.addEventListener("click", () => {
      evoModal.classList.remove("show");
    });
  }

  // Fechar clicando fora
  evoModal.addEventListener("click", (e) => {
    if (e.target === evoModal) {
      evoModal.classList.remove("show");
    }
  });

  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      evoModal.classList.remove("show");
    }
  });

}
});


function hasActivePackage(s){
  return (Number(s.totalLessons||0) > 0) && !!s.packageStart && !!s.packageEnd;
}

const toInputDate = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function showAlert(txt, kind="ok"){ const a=$("appAlert"); a.textContent=txt; a.style.display="block"; setTimeout(()=>a.style.display="none", 1800); }
/* ===== Máscara BRL on-type ===== */

function onlyDigits(s){ return String(s||"").replace(/\D+/g,''); }
function maskBRLInput(e){
  const cents = Number(onlyDigits(e.target.value) || 0);
  e.target.value = formatBRLFromCents(cents);
}


/* Liga a máscara nos inputs (uma vez) */
(function bindBRLMasks(){
  const ids = ["lessonPrice","recAvulsaValue"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    // valor inicial bonito
    if(!el.value) el.value = formatBRLFromCents(0);
    // máscara a cada digito
    el.addEventListener('input', maskBRLInput);
    // ao colar, também normaliza
    el.addEventListener('paste', (ev)=>{
      setTimeout(()=> maskBRLInput({target: el}), 0);
    });
    // ao focar vazio, mostra 0
    el.addEventListener('focus', ()=>{
      if(!el.value) el.value = formatBRLFromCents(0);
    });
  });
})();

/* Constrói string local YYYY-MM-DDTHH:MM a partir de Date */
function toLocalDateTimeString(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function hhmmLocal(iso){
  const s = String(iso||"");
  if (s.length >= 16) return s.slice(11,16); // "YYYY-MM-DDTHH:MM"
  const d = parseISODateLocal(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
// --- WhatsApp helpers ---
function firstName(full="") {
  const t=(full||"").trim().split(/\s+/)[0]||"";
  // capitaliza só a primeira letra
  return t.charAt(0).toUpperCase()+t.slice(1);
}
function normalizePhoneBR(raw="") {
  // mantém só dígitos e garante DDI 55 (ex.: "(21) 9xxxx-xxxx" -> "5521....")
  const d = String(raw).replace(/\D+/g,"");
  if (!d) return "";                // sem telefone, abriremos só o texto
  if (d.startsWith("55")) return d; // já está com DDI
  return "55"+d;
}
function buildWhatsAppMessage({studentName, when, style, level, place}) {
  // when: Date em horário local
  const dia = pad2(when.getDate())+"/"+pad2(when.getMonth()+1)+"/"+when.getFullYear();
  const hora = pad2(when.getHours())+":"+pad2(when.getMinutes());
  return (
`Oi, ${firstName(studentName)}! Tudo bem? 😊

Confirmação da sua aula:
• Data: ${dia} às ${hora}
• Estilo: ${style||"—"} — Nível: ${level||"—"}
• Local: ${place||"—"}

Nos vemos em breve!
— ${BRAND_NAME}`
  );
}
/* ======================= Estado ======================= */
let user=null;
let students=[], lessons=[], evolutions=[];
let unsubS=null, unsubL=null, unsubE=null;
let editingEvolutionId = null;

const colStudents = collection(db,"alunos");
const colLessons  = collection(db,"aulas");
const colEvol     = collection(db,"evolucoes");
const withId = (d)=>({id:d.id, ...d.data()});

/* ======================= Tema ======================= */
(function(){
  const saved=localStorage.getItem("theme")||"dark";
  document.documentElement.setAttribute("data-theme", saved);
  $("btnTheme").textContent = saved==="dark"?"🌙 Tema":"☀️ Tema";
})();
$("btnTheme").onclick=()=>{
  const cur=document.documentElement.getAttribute("data-theme")||"dark";
  const next=cur==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-theme",next);
  localStorage.setItem("theme",next);
  $("btnTheme").textContent = next==="dark"?"🌙 Tema":"☀️ Tema";
};

/* ======================= Abas ======================= */
const sections={agenda:$("agenda"), alunos:$("alunos"), evolucao:$("evolucao"), relatorios:$("relatorios"), backup:$("backup")};
function hideAllSections(){ Object.values(sections).forEach(s=>s.classList.remove("show")); els("#tabs a").forEach(a=>a.classList.remove("active")); }
function showCover(){ hideAllSections(); $("tabs").style.display="none"; $("hero").style.display="block"; try{ window.scrollTo({top:0, behavior:"instant"}); }catch{} }
function showTab(name){ hideAllSections(); sections[name]?.classList.add("show"); els("#tabs a").forEach(a=>a.classList.toggle("active", a.dataset.tab===name)); if(user) $("hero").style.display="none"; 
if(name==="relatorios"){setTimeout(()=>{try{initReportMonthPatch()}catch(e){console.error(e)}},0);} }
els("#tabs a").forEach(a=>a.onclick=(e)=>{e.preventDefault(); showTab(a.dataset.tab);});
$("btnEnterSystem").onclick = ()=> $("btnGoogle").click();

/* ======================= Auth ======================= */
const provider=new GoogleAuthProvider();
$("btnGoogle").onclick=async()=>{ try{ await signInWithPopup(auth,provider);}catch(e){console.error(e);} };
$("btnSignout").onclick=async()=>{ try{ await signOut(auth);}catch{} };
/* =============== Filtro de Mês (Relatórios) — Bloco Isolado =============== */


  // 1) Preenche <select id="repMonth"> (uma vez)
function setupReportMonthFilter(){

  var sel = document.getElementById("repMonth");
  var yearSel = document.getElementById("repYear");

  if (!sel) return;
  if (sel.dataset._filled === "1") return;

  var meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  sel.innerHTML = "";

  for (var i=0;i<12;i++){
    var o = document.createElement("option");
    o.value = String(i);
    o.textContent = meses[i];
    sel.appendChild(o);
  }

  // ✅ Define mês atual
  var now = new Date();
  sel.value = String(now.getMonth());

  // ✅ Define ano atual
  if (yearSel){
    yearSel.value = String(now.getFullYear());
  }

  sel.dataset._filled = "1";

  // Eventos
  if (sel.dataset._bound !== "1"){
    sel.addEventListener("change", renderReportMonthKPIs);
    sel.dataset._bound = "1";
  }

  if (yearSel && yearSel.dataset._repYearBound !== "1"){
    yearSel.addEventListener("change", renderReportMonthKPIs);
    yearSel.dataset._repYearBound = "1";
  }
}

function _repYear(){
  var el = document.getElementById("repYear");
  return Number(el && el.value) || (new Date()).getFullYear();
}
function _repMonth(){
  var el = document.getElementById("repMonth");
  return Number(el && el.value !== "" ? el.value : (new Date()).getMonth());
}


function renderReportMonthKPIs(){
  var y = _repYear();
  var m = _repMonth();

  var arr = Array.isArray(lessons) ? lessons.filter(function(l){
    var d = parseISODateLocal(l.date);
    return d.getFullYear() === y && d.getMonth() === m;
  }) : [];

  var monthCount   = arr.length;
 var monthRevenue = calculateRealizedRevenueForLessons(
  arr,
  parseBRLToNumber
);
    var paidLessonsMonth = arr.filter(function(l){
  return String(l.status) === "2";
}).length;

var elPaid = document.getElementById("kpiMonthPaid");
if (elPaid) elPaid.textContent = String(paidLessonsMonth);

var monthAvg = paidLessonsMonth > 0
  ? (monthRevenue / paidLessonsMonth)
  : 0;
var activeStudents = Number(
  document.getElementById("kpiActiveStudents")?.textContent || 0
);

var revPerActive = activeStudents > 0
  ? (monthRevenue / activeStudents)
  : 0;

var elRevPerActive = document.getElementById("kpiRevPerActive");
if (elRevPerActive) elRevPerActive.textContent = fmtBRL(revPerActive);

var elAvg = document.getElementById("kpiMonthAvg");
if (elAvg) elAvg.textContent = fmtBRL(monthAvg);


  var elCount = document.getElementById("kpiMonth");
  var elRev   = document.getElementById("kpiMonthRev");
  if (elCount) elCount.textContent = String(monthCount);
  if (elRev)   elRev.textContent   = fmtBRL(monthRevenue);

// 🔵 KPI Hoje (aulas e receita do dia atual)
var today = new Date();
today.setHours(0,0,0,0);

var todayArr = Array.isArray(lessons) ? lessons.filter(function(l){
  var d = parseISODateLocal(l.date);
  d.setHours(0,0,0,0);
  return d.getTime() === today.getTime();
}) : [];

var todayCount = todayArr.length;

var todayRevenue = todayArr
  .filter(function(l){ return String(l.status) === "2"; })
  .reduce(function(acc,l){
    return acc + parseBRLToNumber(l.price);
  }, 0);

var elDay = document.getElementById("kpiDay");
if (elDay){
  elDay.textContent = todayCount + " aula(s) • " + fmtBRL(todayRevenue);
}



// 🔵 Receita prevista (mês)
// status 0 = Agendada
// status 1 = Confirmada
// status 2 = Realizada

var forecastRevenue = arr
  .filter(function(l){
    return ["0","1","2"].includes(String(l.status));
  })
  .reduce(function(acc,l){
    return acc + parseBRLToNumber(l.price);
  }, 0);

var elForecast = document.getElementById("kpiMonthForecast");
if (elForecast){
  elForecast.textContent = fmtBRL(forecastRevenue);
}


// 🔵 Descobre mês anterior automaticamente
var prevMonth = m - 1;
var prevYear  = y;

if (prevMonth < 0){
  prevMonth = 11;
  prevYear  = y - 1;
}

// 🔵 Receita do mês anterior
var prevArr = Array.isArray(lessons) ? lessons.filter(function(l){
  var d = parseISODateLocal(l.date);
  return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
}) : [];

var prevRevenue = prevArr
  .filter(function(l){ return String(l.status) === "2"; })
  .reduce(function(acc,l){ return acc + parseBRLToNumber(l.price); }, 0);

// 🔵 Crescimento MoM
var growth = prevRevenue > 0
  ? ((monthRevenue - prevRevenue) / prevRevenue) * 100
  : 0;
// 🔵 Variação absoluta em R$
var absDiff = monthRevenue - prevRevenue;

var elGrowth = document.getElementById("kpiMonthGrowth");
if (elGrowth){
  elGrowth.textContent = growth.toFixed(1) + "%";

  elGrowth.classList.remove("kpi-up","kpi-down","kpi-neutral");

  var elRef = document.getElementById("kpiMonthGrowthRef");
if (elRef){
  var monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  var sign = absDiff > 0 ? "+" : "";
  elRef.textContent = "vs " + monthNames[prevMonth] + " " + prevYear + 
                      " (" + sign + fmtBRL(absDiff) + ")";
}

  if (growth > 5){
    elGrowth.classList.add("kpi-up");
  } else if (growth < -5){
    elGrowth.classList.add("kpi-down");
  } else {
    elGrowth.classList.add("kpi-neutral");
  }
}
// 🔵 Operação do dia (card Hoje)

var today = new Date();
today.setHours(0,0,0,0);

var tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

var todayArr = Array.isArray(lessons) ? lessons.filter(function(l){
  var d = parseISODateLocal(l.date);
  return d >= today && d < tomorrow &&
         String(l.status) !== "3"; // exclui canceladas
}) : [];

var todayCount = todayArr.length;

var todayRevenue = todayArr.reduce(function(acc,l){
  return acc + parseBRLToNumber(l.price);
}, 0);

var elToday = document.getElementById("kpiToday");
if (elToday){
  elToday.textContent = todayCount + " aula(s) • " + fmtBRL(todayRevenue);
}


}

function initReportMonthPatch(){
  setupReportMonthFilter();
  renderReportMonthKPIs();
}

// dispara uma vez (caso a aba já esteja montada)
setTimeout(initReportMonthPatch, 0);




/* ==== Preenche ANOS da aba Evolução (repYearInvest) ==== */
function fillRepYearInvest(){
  const sel = document.getElementById("repYearInvest");
  if (!sel) return;

  // Coleta anos a partir de "lessons" (fallback: ano atual)
  const years = new Set();
  if (Array.isArray(lessons) && lessons.length){
    for (const l of lessons){
      const d = parseISODateLocal(l.date);
      if (!isNaN(d)) years.add(d.getFullYear());
    }
  }
  const curY = (new Date()).getFullYear();
  if (years.size === 0) years.add(curY);

  // Intervalo contínuo: do menor ano encontrado até (ano atual + 3)
  const minY = Math.min(...years);
  const maxY = Math.max(curY + 3, ...years);
  const arr = [];
  for (let y=minY; y<=maxY; y++) arr.push(y);
  arr.sort((a,b)=>b-a); // mostra do maior para o menor

  // Repreenche select preservando escolha anterior quando possível
  const prev = sel.value;
  sel.innerHTML = "";
  for (const y of arr){
    const o = document.createElement("option");
    o.value = String(y);
    o.textContent = String(y);
    sel.appendChild(o);
  }
  sel.value = arr.includes(Number(prev)) ? prev : String(curY);
}

/* Attach/Detach listeners */
function attach(){
  const qS = query(colStudents, orderBy("createdAt","desc"));
  const qL = query(colLessons,  orderBy("date","asc"));     // 'date' é string local "YYYY-MM-DDTHH:MM"
  const qE = query(colEvol,     orderBy("date","desc"));

  unsubS = onSnapshot(qS,(snap)=>{ students = snap.docs.map(withId);$("kpiActiveStudents").textContent = students.filter(s => s.active === true).length;
 fillStudentSelects(); renderStudentFilter(); fillRepStudentSelect(); initRepStudentArea(); 
 renderStudents(); renderDashboard(); buildEvoTree();});
  unsubL = onSnapshot(qL,(snap)=>{ lessons  = snap.docs.map(withId); renderCalendar(); renderUpcoming(); renderDayDetails( state.selKey ); renderDashboard(); renderKPIs(); renderEvoKPIs(); renderStudents();renderReportMonthKPIs();fillRepYearInvest();
 });
  unsubE = onSnapshot(qE,(snap)=>{ evolutions = snap.docs.map(withId); renderEvolutions(); renderEvoKPIs(); buildEvoTree(); initRepStudentArea();   // recalcula o relatório quando as aulas mudam
 });
}
function detach(){ unsubS?.(); unsubL?.(); unsubE?.(); }
onAuthStateChanged(auth,(u)=>{
  user=u||null;
  const logged=!!user;
  $("btnGoogle").style.display = logged?"none":"inline-flex";
  $("btnSignout").style.display = logged?"inline-flex":"none";
  $("authEmail").style.display = logged?"inline-flex":"none";
  $("authEmail").textContent = logged?user.email:"";
  if(!logged){ showCover(); detach(); return; }
  $("hero").style.display="none"; $("tabs").style.display="flex"; attach(); showTab("agenda");
});
function renderUpcoming(){
  const days = +$("upcomingRange").value || 30;
  const s = $("filterStudent")?.value || "";
  const t = $("filterStatus")?.value  || "";

  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(end.getDate() + days);

  const items = lessons
    .filter(l => {
      const d = parseISODateLocal(l.date);
      return d >= start && d < end;
    })
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a,b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  const box = $("upcomingList");
  if (!items.length){
    box.innerHTML = `<div class="muted">Sem aulas neste período.</div>`;
    return;
  }

  box.innerHTML = "";
  for (const a of items){
    const st  = students.find(s=>s.id===a.studentId);
    const nm  = st?.name || "(Aluno)";
    const stat= ["Agendada","Confirmada","Realizada","Cancelada"][a.status||0];
    const d   = parseISODateLocal(a.date);

    const row = document.createElement("div");
    row.className="day-card";
    row.innerHTML = `
      <div>
        <div><span class="who">${nm}</span> — ${a.style||""}${a.level?" • "+a.level:""}</div>
        <div class="muted">
          ${d.toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
          • ${a.place||"—"} • ${stat} • ${fmtBRL(a.price||0)}
        </div>
      </div>
      <div>${a.duration||60}'</div>`;
    box.appendChild(row);
  }

// 🔵 Recalcular relatório quando filtros mudarem
const elYear    = document.getElementById("repYear");
const elMonth   = document.getElementById("repMonth");
const elCompare = document.getElementById("repCompare");

if (elYear)    elYear.addEventListener("change", renderReportMonthKPIs);
if (elMonth)   elMonth.addEventListener("change", renderReportMonthKPIs);
if (elCompare) elCompare.addEventListener("change", renderReportMonthKPIs);

}
/* ======================= Calendário ======================= */
const months=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const state={ y:(new Date()).getFullYear(), m:(new Date()).getMonth(), selKey: ymdKey(new Date()) };

function renderCalendar(){ 
  const filterStudent = ($("filterStudent")?.value ?? "");
const filterStatus  = ($("filterStatus")?.value ?? "");
  $("calTitle").textContent = `${months[state.m]} ${state.y}`;
  const ysel=$("selYear");
  if(ysel.childElementCount===0){ const now=(new Date()).getFullYear(); for(let y=now-3;y<=now+3;y++){ const o=document.createElement("option"); o.value=y; o.textContent=y; ysel.appendChild(o);} }
  $("selMonth").selectedIndex = state.m; $("selYear").value=String(state.y);

  const grid=$("calGrid"); grid.innerHTML="";
  const first=new Date(state.y,state.m,1);
  const start=new Date(first);
  /* IMPORTANTE: iniciar na DOMINGO (0) para alinhar com D O M ... S Á B */
  start.setDate(1 - first.getDay()); // começa no domingo da semana da 1ª data

 for(let i=0;i<42;i++){

  const d = new Date(start);
  d.setDate(start.getDate()+i);

  const key = ymdKey(d);
  const cell = document.createElement("div");
  cell.className = "cal-cell";

  const todayKey = ymdKey(new Date());
  if(key === todayKey) cell.classList.add("today");
  if(key === state.selKey) cell.classList.add("sel");

  cell.innerHTML = `<div class="cal-num">${d.getDate()}</div>`;

  const list = lessons
    .filter(l=>{
      const nd = parseISODateLocal(l.date);
      return ymdKey(nd) === key;
    })
    .filter(l => !filterStudent || l.studentId === filterStudent)
    .filter(l => !filterStatus  || String(l.status) === filterStatus)
    .sort((a,b)=> parseISODateLocal(a.date) - parseISODateLocal(b.date));

  // ===============================
  // SE EXISTEM AULAS
  // ===============================
  if(list.length){

    const b = document.createElement("div");
    b.className = "cal-dot";
    b.textContent = list.length;
    cell.appendChild(b);

    for(const a of list){

      const st = students.find(s => s.id === a.studentId);
      const nm = st?.name || "(Aluno)";
      const hhmm = hhmmLocal(a.date);

      const chip = document.createElement("div");
      chip.className = "chip" + (a.status==2 ? " done" : (a.status==3 ? " cancel" : ""));
      chip.textContent = nm;

      chip.title = `${nm} — ${a.style||""}${a.level?" • "+a.level:""} • ${hhmm}`;

      chip.onclick = (ev)=>{
        ev.stopPropagation();
        editLesson(a.id);
      };

      chip.setAttribute("draggable","true");

      chip.addEventListener("dragstart", (e)=>{
        e.dataTransfer.setData("text/lessonId", a.id);
      });

      cell.appendChild(chip);
    }
  }

  // ===============================
  // DRAGOVER (TODAS AS CÉLULAS)
  // ===============================
  cell.addEventListener("dragover", (e)=>{
    e.preventDefault();
  });

  // ===============================
  // DROP (TODAS AS CÉLULAS)
  // ===============================
  cell.addEventListener("drop", async (e)=>{
    e.preventDefault();

    const id = e.dataTransfer.getData("text/lessonId");
    const origin = lessons.find(x => x.id === id);
    if(!origin) return;

    const time = hhmmLocal(origin.date);
    const dropDateStr = key + "T" + time;

    const isCopy = e.shiftKey;

    try{
  if(isCopy){
    const {id:_, ...rest} = origin;

    await addLesson({
      ...rest,
      date: dropDateStr
    });

  }else{

    await updateLesson(id,{
      date: dropDateStr
    });

  }

  showAlert(isCopy ? "Aula copiada." : "Aula movida.");

}catch(err){
  console.error(err);
  showAlert("Erro ao mover aula","error");
}

  });

  cell.onclick = ()=>{
    state.selKey = key;
    renderCalendar();
    renderDayDetails(key);
  };

  grid.appendChild(cell);
}
}

$("calPrev").onclick=()=>{ state.m--; if(state.m<0){state.m=11; state.y--;} renderCalendar(); };
$("calNext").onclick=()=>{ state.m++; if(state.m>11){state.m=0; state.y++;} renderCalendar(); };
$("selMonth").onchange=()=>{ state.m=$("selMonth").selectedIndex; renderCalendar(); };
$("selYear").onchange=()=>{ state.y=+$("selYear").value; renderCalendar(); };
$("btnCalRefresh").onclick=()=>{ renderCalendar(); renderUpcoming(); };
$("btnToday").onclick = () => {
  const now = new Date();
  state.y = now.getFullYear();
  state.m = now.getMonth();
  state.selKey = ymdKey(now);
  renderCalendar();
  renderDayDetails(state.selKey);
  renderFilterEcho();
};

$("btnClearFilters").onclick = () => {
  const fs = $("filterStudent");
  const ft = $("filterStatus");
  if (fs) fs.value = "";
  if (ft) ft.value = "";
  renderCalendar();
  renderUpcoming();
  renderDayDetails(state.selKey);
  renderFilterEcho();
};

// filtro por aluno
$("filterStudent").onchange = () => {
  renderCalendar();
  renderUpcoming();
  renderDayDetails(state.selKey);
  renderFilterEcho();
};

// filtro por status
$("filterStatus").onchange = () => {
  renderCalendar();
  renderUpcoming();
  renderDayDetails(state.selKey);
  renderFilterEcho();
};
function renderFilterEcho(){
  const s = $("filterStudent")?.value || "";
  const t = $("filterStatus")?.value  || "";
  const span = $("calFiltersEcho"); if(!span) return;

  const sTxt = s ? (students.find(x=>x.id===s)?.name || "Aluno") : "";
  const tTxt = t==="" ? "" : ["Agendada","Confirmada","Realizada","Cancelada"][Number(t)||0];
  const parts = [sTxt, tTxt].filter(Boolean);

  if(parts.length===0){ span.style.display="none"; span.textContent=""; return; }
  span.textContent = "Filtro: " + parts.join(" • ") + "  (Esc limpa)";
  span.style.display="inline-flex";
}
// Esc limpa filtros
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const fs = $("filterStudent");
    const ft = $("filterStatus");
    if (fs) fs.value = "";
    if (ft) ft.value = "";
    renderCalendar();
    renderUpcoming();
    renderDayDetails(state.selKey);
    renderFilterEcho();
    showAlert("Filtros limpos (Esc)");
  }
});

/* Lateral do dia */
function renderDayDetails(key){
  const box=$("dayDetails");
  if(!key){ box.innerHTML=`<span class="muted">Nenhum dia selecionado.</span>`; return; }

  const s = $("filterStudent")?.value || "";
  const t = $("filterStatus")?.value  || "";

  let list=lessons
    .filter(l=> ymdKey(parseISODateLocal(l.date))===key)
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a,b)=> parseISODateLocal(a.date) - parseISODateLocal(b.date));

  if(!list.length){ box.innerHTML=`<span class="muted">Sem aulas neste dia.</span>`; return; }

  box.innerHTML="";
  for(const a of list){
    const st=students.find(s=>s.id===a.studentId); const nm=st?.name||"(Aluno)";
    const stat=["Agendada","Confirmada","Realizada","Cancelada"][a.status||0];
    const hhmm = hhmmLocal(a.date);
    const row=document.createElement("div"); row.className="day-card";

    row.innerHTML=`<div><div><span class="who">${nm}</span> — ${a.style||""}${a.level?" • "+a.level:""}</div>
      <div class="muted">${hhmm} • ${a.place||"—"} • ${stat} • ${fmtBRL(a.price||0)}</div></div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end">
        <button class="btn small" data-act="wa">WhatsApp</button>
        <button class="btn small" data-act="rec">Recibo</button>
        <button class="btn small" data-act="edit">Editar</button>
        <button class="btn small" data-act="del">Excluir</button>
      </div>`;
    row.querySelector('[data-act="edit"]').onclick=(ev)=>{ ev.stopPropagation(); editLesson(a.id); };
    row.querySelector('[data-act="del"]').onclick=(ev)=>{ ev.stopPropagation(); deleteLesson(a.id); };
    row.querySelector('[data-act="rec"]').onclick=(ev)=>{ ev.stopPropagation(); openReceiptFromLesson(a); };
    box.appendChild(row);
    row.querySelector('[data-act="wa"]').onclick = (ev)=>{
  ev.stopPropagation();
  const when  = parseISODateLocal(a.date);
  const msg   = buildWhatsAppMessage({
    studentName: nm,
    when,
    style: a.style,
    level: a.level,
    place: a.place
  });

  const phone = normalizePhoneBR(st?.phone || "");
  const encoded = encodeURIComponent(msg);

  // se tiver telefone -> abre conversa com número; senão -> só o texto (usuário escolhe o contato)
  const url = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, "_blank");
};
  }
}

/* Próximos dias */
$("upcomingRange").onchange=()=>renderUpcoming();


/* ======================= Alunos ======================= */
let editingStudentId=null;
$("btnSaveStudent").onclick=async()=>{
  const base={
    name:$("studentName").value.trim(),
    phone:$("studentPhone").value.trim(),
    email:$("studentEmail").value.trim(),
    active:$("studentActive").value==="true",
    packageStart:$("studentPackageStart").value,
    packageEnd:$("studentPackageEnd").value,
    totalLessons:+$("studentTotalLessons").value||0,
    notes:$("studentNotes").value,
    ownerUid:user?.uid||"dev",
    updatedAt:serverTimestamp()
  };
  try{
    if(editingStudentId){
      await updateDoc(doc(db,"alunos",editingStudentId), base);
      showAlert("Salvo com sucesso.");
    }else{
      await addDoc(colStudents,{...base, orderIndex: (students?.length||0)+1, createdAt:serverTimestamp()});
      showAlert("Salvo com sucesso.");
    }
    clearStudentForm();
  }catch(e){ console.error(e); showAlert("Falha ao salvar aluno.","error"); }
};
$("btnClearStudent").onclick=clearStudentForm;
function clearStudentForm(){
  ["studentName","studentPhone","studentEmail","studentPackageStart","studentPackageEnd","studentTotalLessons","studentNotes"].forEach(id=>$(id).value="");
  $("studentActive").value="true"; editingStudentId=null;
}
function inPkgRange(a, s){
  const d = parseISODateLocal(a.date);

  // Preferir o reset com data/hora (zera a contagem imediatamente ao salvar o pacote)
  const iDT = s.packageResetAt ? parseISODateLocal(s.packageResetAt) : null;

  // Se não houver reset, cair para o início do pacote (data cheia)
  const i = iDT || (s.packageStart ? parseBR(s.packageStart) : null);

  // Fim do pacote (inclui o dia inteiro)
  const f = s.packageEnd ? parseBR(s.packageEnd) : null;

  if (i && d < i) return false;
  if (f && d > new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59)) return false;
  return true;
}

function renderStudents(){
  try {

  // Toggle da área de INATIVOS (bind uma vez)
const _tgl = $("toggleInactive");
if (_tgl && !_tgl.dataset.bound){
  _tgl.dataset.bound = "1";
  _tgl.onclick = () => {
    const list = $("inactiveList");
    const isOpen = list?.style.display !== "none";
    list.style.display = isOpen ? "none" : "block";
    _tgl.textContent = isOpen ? "Mostrar" : "Ocultar";
  };
}

  const box = $("studentsList");
  const ibox = $("inactiveList");
  const iwrap = $("inactiveWrap");
  if (!box) return;

  box.innerHTML = "";
  if (ibox) ibox.innerHTML = "";
// === Atualiza contagem e visibilidade da seção Inativos ===

  const safeStudents = Array.isArray(students) ? students : [];
const ordered = [...safeStudents].sort(

    (a,b)=>(a.orderIndex??1e9)-(b.orderIndex??1e9) || (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)
  );

  const actives   = ordered.filter(s => s.active !== false);
  const inactives = ordered.filter(s => s.active === false);
  $("inactiveCount").textContent = `(${inactives.length})`;
$("inactiveWrap").style.display = inactives.length ? "block" : "none";

 const buildItem = (s, inactive = false) => {
  if (!s || !s.id) {
  console.warn("Aluno inválido detectado:", s);
  return null;
}

  const it = document.createElement("div");
  it.className = "student-item";
  it.dataset.id = s.id;
  if (!inactive) it.setAttribute("draggable","true");

  const pkgOn = hasActivePackage(s);
  const safeLessons = Array.isArray(lessons) ? lessons : [];

  const total = pkgOn ? (+s.totalLessons || 0) : 0;
  const done  = pkgOn ? safeLessons.filter(
  a=> a.studentId===s.id && a.status===2 && inPkgRange(a,s)).length : 0;
  const rest  = pkgOn ? Math.max(0, total - done) : 0;
  const pct   = pkgOn && total>0 ? Math.min(100, Math.round((done/total)*100)) : 0;

  const yearNow = (new Date()).getFullYear();
  const investYear = lessons
    .filter(l => l.studentId===s.id && l.status===2 && parseISODateLocal(l.date).getFullYear()===yearNow)
    .reduce((sum,l)=> sum + (+l.price||0), 0);

  let cls="ok";
  if (pkgOn){
    if (rest<=2) cls="warn";
    if (rest<=0) cls="danger";
  }

  it.innerHTML = `
  <div class="student-head">
    <div>
      <div class="who">${s.name || "Sem nome"}</div>
      <div class="muted">${s.phone || ""} ${s.email ? "• "+s.email : ""}</div>
    </div>
    <div class="badge ${pkgOn ? "" : "warn"}">
      ${pkgOn ? "Pacote ativo" : "Sem pacote"}
    </div>
  </div>

  <div class="pkgbar">
    <div class="fill ${cls}" style="width:${pct}%"></div>
  </div>

  <div class="muted" style="margin-top:8px;">
    ${pkgOn 
      ? `Aulas: ${done}/${total} • Restam: ${rest}`
      : "Sem pacote ativo"}
  </div>

  <div style="display:flex; gap:6px; margin-top:12px;">
    <button class="btn small" data-act="edit">Editar</button>
    <button class="btn small" data-act="newpkg">Novo Pacote</button>
    ${inactive 
      ? `<button class="btn small" data-act="activate">Ativar</button>`
      : `<button class="btn small" data-act="deactivate">Inativar</button>`}
    <button class="btn small" data-act="del">Excluir</button>
  </div>
`;


// PATCH: confirmação e exclusão de aluno
function confirmDeleteStudent(id, name){
  if(!id) return;
  if(!confirm(`Excluir o aluno "${name || "(sem nome)"}"? Esta ação é permanente e NÃO remove aulas já registradas.`)) return;
  handleDeleteStudent(id);

}

async function handleDeleteStudent(id){
  try{
    await deleteStudent(id);
  // usa os mesmos imports já presentes no arquivo
    showAlert("Aluno excluído com sucesso.");
  }catch(e){
    console.error(e);
    showAlert("Erro ao excluir aluno.", "error");
  }
} 
    // ações comuns
    it.querySelector('[data-act="edit"]')?.addEventListener("click", ()=>{
      editingStudentId=s.id;
      $("studentName").value=s.name||"";
      $("studentPhone").value=s.phone||"";
      $("studentEmail").value=s.email||"";
      $("studentActive").value=String(!!s.active);
      $("studentPackageStart").value=s.packageStart||"";
      $("studentPackageEnd").value=s.packageEnd||"";
      $("studentTotalLessons").value=s.totalLessons??0;
      $("studentNotes").value=s.notes||"";
      showAlert("Modo edição: "+(s.name||""));
      window.scrollTo({top: $("alunos").offsetTop - 60, behavior:"smooth"});
    });
    
    // ações de ATIVOS
    it.querySelector('[data-act="receipt"]')?.addEventListener("click", ()=> openReceiptFromStudent(s));
    it.querySelector('[data-act="newpkg"]')?.addEventListener("click", ()=> openPkgModal(s.id));
    it.querySelector('[data-act="deactivate"]')?.addEventListener("click", async ()=>{
      try{
        await updateDoc(doc(db,"alunos",s.id), { active:false, updatedAt:serverTimestamp() });
        showAlert("Aluno inativado.");
      }catch(e){ console.error(e); showAlert("Erro ao inativar.","error"); }
    });

    // ações de INATIVOS
    it.querySelector('[data-act="activate"]')?.addEventListener("click", async ()=>{
      try{
        await updateDoc(doc(db,"alunos",s.id), { active:true, updatedAt:serverTimestamp() });
        showAlert("Aluno ativado.");
      }catch(e){ console.error(e); showAlert("Erro ao ativar.","error"); }
    });
// ação EXCLUIR (ativos e inativos)
it.querySelector('[data-act="del"]')?.addEventListener("click", (ev)=>{
  ev.stopPropagation();
  confirmDeleteStudent(s.id, s.name);
});

    return it;
  };

  // renderiza ATIVOS (com drag)
  for (const s of actives) {
  try {
    const el = buildItem(s, false);
    if (el) box.appendChild(el);
  } catch (err) {
    console.error("Erro ao renderizar aluno ativo:", s, err);
  }
}


  // renderiza INATIVOS (sem drag)
  if (iwrap){
    if (inactives.length){
      iwrap.style.display = "block";
      $("inactiveCount").textContent = `(${inactives.length})`;
      for (const s of inactives) {
  try {
    const el = buildItem(s, true);
    if (el) ibox.appendChild(el);
  } catch (err) {
    console.error("Erro ao renderizar aluno inativo:", s, err);
  }
}

    }else{
      iwrap.style.display = "none";
    }
  }

  // drag somente para ativos
  enableStudentDrag(box);

  } catch (err) {
    console.error("ERRO GERAL EM renderStudents:", err);
    showAlert("Erro ao renderizar alunos.", "error");
  }
}


/* Drag & drop para reordenar alunos */
function enableStudentDrag(container){

  let draggingEl = null;

  // Eventos individuais apenas para start e end
  container.querySelectorAll(".student-item[draggable='true']")
    .forEach(el => {

      el.addEventListener("dragstart", ()=>{
        draggingEl = el;
        el.classList.add("dragging");
      });

      el.addEventListener("dragend", ()=>{
        draggingEl = null;
        el.classList.remove("dragging");
      });

    });

  // Evento único no container (mais estável)
  container.addEventListener("dragover", (e)=>{
    e.preventDefault();

    if(!draggingEl) return;

    const afterElement = getDragAfterElement(container, e.clientY);

    if(afterElement == null){
      container.appendChild(draggingEl);
    } else {
      container.insertBefore(draggingEl, afterElement);
    }
  });

  // Salvar ordem no Firestore
  container.ondrop = async ()=>{

    const ids = [...container.querySelectorAll(".student-item[draggable='true']")]
      .map(n=>n.dataset.id);

    for(let i=0; i<ids.length; i++){
      try{
        await updateDoc(
          doc(db,"alunos",ids[i]),
          { orderIndex:i+1, updatedAt:serverTimestamp() }
        );
      }catch(e){
        console.error(e);
      }
    }

    showAlert("Salvo com sucesso.");
  };

}
function getDragAfterElement(container, y){
  const draggableElements = [
    ...container.querySelectorAll(".student-item[draggable='true']:not(.dragging)")
  ];

  return draggableElements.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if(offset < 0 && offset > closest.offset){
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}


/* Modal Novo Pacote */
let pkgTargetId=null;
function openPkgModal(studentId){
  pkgTargetId=studentId;
  const s=students.find(x=>x.id===studentId);
  const today=new Date();
  const defStart = s?.packageEnd ? s.packageEnd : `${pad2(today.getDate())}/${pad2(today.getMonth()+1)}/${today.getFullYear()}`;
  const d2=new Date(today); d2.setDate(d2.getDate()+30);
  $("pkgStart").value = defStart;
  $("pkgEnd").value   = `${pad2(d2.getDate())}/${pad2(d2.getMonth()+1)}/${d2.getFullYear()}`;
  $("pkgTotal").value = s?.totalLessons || 4;
  $("pkgNote").value  = "";
  $("pkgModal").classList.add("show");
}
$("btnPkgClose").onclick=()=> $("pkgModal").classList.remove("show");
$("btnPkgSave").onclick = async ()=>{
  if(!pkgTargetId) return;
  try{
    await updateDoc(doc(db,"alunos",pkgTargetId),{
      packageStart: $("pkgStart").value,
      packageEnd:   $("pkgEnd").value,
      totalLessons: +$("pkgTotal").value || 0,

      packageResetAt: null,   // zera o campo existente (deixa de influenciar a contagem)

      notes: (students.find(x=>x.id===pkgTargetId)?.notes||"") + ($("pkgNote").value? ` | ${$("pkgNote").value}` : ""),
      updatedAt: serverTimestamp()
    });
    $("pkgModal").classList.remove("show");
    showAlert("Salvo com sucesso.");
  }catch(e){ 
    console.error(e); 
    alert("Falha ao salvar pacote."); 
  }
};

/* ======================= Evolução ======================= */
function fillStudentSelects(){
  const a=$("lessonStudent"), b=$("evolutionStudent"), c=$("recStudent");
  const opts = `<option value="">Selecione…</option>` + students.map(s=>`<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");
  if(a) a.innerHTML=opts; if(b) b.innerHTML=opts; if(c) c.innerHTML=opts;
}
function renderStudentFilter(){
  const sel = $("filterStudent"); 
  if (!sel) return;
  const cur = sel.value; // guarda a seleção atual

  sel.innerHTML =
    `<option value="">Todos os alunos</option>` +
    students.map(s => `<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");

  // restaura a seleção se ainda existir
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

$("btnSaveEvolution").onclick = async () => {

  const payload = {
    date: $("evolutionDate").value,
    studentId: $("evolutionStudent").value,
    style: $("evolutionStyle").value,
    level: $("evolutionLevel").value,
    duration: +($("evolutionDuration").value || 60),
    content: $("evolutionContent").value,
    progress: $("evolutionProgress").value,
    difficulties: $("evolutionDifficulties").value,
    nextSteps: $("evolutionNextSteps").value,
    rating: null,
    mood: null,
    notes: $("evolutionNotes").value,
    ownerUid: user?.uid || "dev",
    updatedAt: serverTimestamp()
  };

  try {

    if (editingEvolutionId) {

      // 🔁 ATUALIZA
      await updateDoc(
        doc(db, "evolucoes", editingEvolutionId),
        payload
      );

      showAlert("Anotação atualizada com sucesso.");
      editingEvolutionId = null;

    } else {

      // ➕ NOVA
      await addDoc(colEvol, {
        ...payload,
        createdAt: serverTimestamp()
      });

      showAlert("Salvo com sucesso.");
    }

    clearEvol();
    evoModal?.classList.remove("show");

  } catch (e) {
    console.error(e);
    showAlert("Erro ao salvar.", "error");
  }

};


function renderEvolutions(filter={}){  // filter: {studentId, year, monthIndex}
  const box=$("evolutionsList"); box.innerHTML="";
  let list=[...evolutions];
  if(filter.studentId) list=list.filter(e=>e.studentId===filter.studentId);
  if (filter.year)
  list = list.filter(e => {
    const d = parseISODateLocal(e.date);
    return d.getFullYear() === filter.year;
  });

if (typeof filter.monthIndex === "number")
  list = list.filter(e => parseISODateLocal(e.date).getMonth() === filter.monthIndex);


  for(const e of list){

  const st = students.find(s=>s.id===e.studentId);
  const nm = st?.name || "(Aluno)";

  const it = document.createElement("div");
  it.className = "evo-card";


 it.innerHTML = `
  <div class="evo-card-header">
    <div>
      <div><b>${nm}</b> — ${e.style||""} ${e.level||""}</div>
      <div class="muted">${(e.date||"").slice(0,10)} • ${e.duration||60}'</div>
    </div>
    <div class="evo-toggle">▼</div>
  </div>

  <div class="evo-card-body">
    <div class="muted"><b>Conteúdo:</b> ${e.content||"—"}</div>
    <div class="muted"><b>Progresso:</b> ${e.progress||"—"}</div>
<div class="muted"><b>Dificuldades:</b> ${e.difficulties||"—"}</div>
<div class="muted"><b>Próx. passos:</b> ${e.nextSteps||"—"}</div>


    <div class="evo-actions">
      <button class="btn small" data-act="edit">Editar</button>
      <button class="btn small" data-act="share">PDF</button>
      <button class="btn small" data-act="del">Excluir</button>
    </div>
  </div>
`;
// 🔽 Toggle abrir/fechar card
const header = it.querySelector(".evo-card-header");
const body   = it.querySelector(".evo-card-body");
const arrow  = it.querySelector(".evo-toggle");

body.style.display = "none";

header.addEventListener("click", () => {
  const isOpen = body.style.display === "block";

  body.style.display = isOpen ? "none" : "block";
  arrow.textContent  = isOpen ? "▼" : "▲";
});


  // EDITAR
  it.querySelector('[data-act="edit"]').onclick = () => {

    editingEvolutionId = e.id;

    $("evolutionDate").value = (e.date || "").slice(0,10);
    $("evolutionStudent").value = e.studentId || "";
    $("evolutionStyle").value = e.style || "";
    $("evolutionLevel").value = e.level || "Iniciante";
    $("evolutionDuration").value = e.duration || 60;
    $("evolutionContent").value = e.content || "";
    $("evolutionProgress").value = e.progress || "";
    $("evolutionDifficulties").value = e.difficulties || "";
    $("evolutionNextSteps").value = e.nextSteps || "";
    $("evolutionNotes").value = e.notes || "";

    evoModal?.classList.add("show");
  };

  // PDF
  it.querySelector('[data-act="share"]').onclick = () =>
    exportEvolutionPDF(e, nm);

  // EXCLUIR
  it.querySelector('[data-act="del"]').onclick = async () => {
    if(confirm("Excluir esta anotação?")){
      try{
        await deleteDoc(doc(db, "evolucoes", e.id));
        showAlert("Anotação excluída.");
      }catch(err){
        console.error(err);
        showAlert("Erro ao excluir anotação.", "error");
      }
    }
  };

  box.appendChild(it);
}

}


let evoExpanded = {
  students: new Set(),
  years: new Set()
};

/* Monta árvore Aluno > Ano > Mês */
function buildEvoTree(){

  const root = $("evoTree");
  if(!root) return;

  const monthsLbl=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const map = new Map();

  for(const e of evolutions){
    const sid = e.studentId || "_";
    const d = parseISODateLocal(e.date);
    const y = d.getFullYear();
    const m = d.getMonth();

    if(!map.has(sid)) map.set(sid,new Map());
    const ymap = map.get(sid);

    if(!ymap.has(y)) ymap.set(y,new Map());
    const mmap = ymap.get(y);

    mmap.set(m,(mmap.get(m)||0)+1);
  }

  let html = "";

  for(const s of students){

    const sid = s.id;
    const ymap = map.get(sid);
    if(!ymap) continue;

    const isStudentOpen = evoExpanded.students.has(sid);

    html += `
      <div class="tree-item tree-level-1"
           data-type="student"
           data-sid="${sid}">
        ${isStudentOpen ? "📂" : "📁"} ${s.name}
      </div>
    `;

    if(!isStudentOpen) continue;

    const years=[...ymap.keys()].sort((a,b)=>b-a);

    for(const y of years){

      const yearKey = sid+"-"+y;
      const isYearOpen = evoExpanded.years.has(yearKey);

      html += `
        <div class="tree-item tree-level-2"
             data-type="year"
             data-sid="${sid}"
             data-year="${y}">
          ${isYearOpen ? "📂" : "📁"} ${y}
        </div>
      `;

      if(!isYearOpen) continue;

      const mmap = ymap.get(y);
      const monthsIdx=[...mmap.keys()].sort((a,b)=>a-b);

      for(const m of monthsIdx){

        const count=mmap.get(m)||0;

        html += `
          <div class="tree-item tree-level-3"
               data-type="month"
               data-sid="${sid}"
               data-year="${y}"
               data-month="${m}">
            🗂️ ${monthsLbl[m]}
            <span class="muted">(${count})</span>
          </div>
        `;
      }
    }
  }

  root.innerHTML = html;

  root.querySelectorAll(".tree-item").forEach(item=>{

    item.addEventListener("click",()=>{

      const type = item.getAttribute("data-type");
      const sid  = item.getAttribute("data-sid");
      const y    = item.getAttribute("data-year");
      const m    = item.getAttribute("data-month");

      if(type==="student"){

  if(evoExpanded.students.has(sid)){
    evoExpanded.students.delete(sid);

    // limpa anos desse aluno
    [...evoExpanded.years].forEach(key=>{
      if(key.startsWith(sid+"-")){
        evoExpanded.years.delete(key);
      }
    });

  }else{
    evoExpanded.students.add(sid);
  }

  buildEvoTree();
  return;
}
      if(type==="year"){

        const key = sid+"-"+y;

        if(evoExpanded.years.has(key)){
          evoExpanded.years.delete(key);
        }else{
          evoExpanded.years.add(key);
        }

        buildEvoTree();
        return;
      }

      if(type==="month"){

        renderEvolutions({
          studentId:sid,
          year:+y,
          monthIndex:+m
        });

        root.querySelectorAll(".tree-item").forEach(el=>el.classList.remove("active"));
        item.classList.add("active");
      }

    });

  });

}


function exportEvolutionPDF(e, studentName){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const left=56, top=56, lh=18; let y=top;
  doc.setFont("helvetica","bold"); doc.setFontSize(14);
  doc.text("Evolução Pedagógica — Bailado Carioca", left, y); y+=lh+4;
  doc.setFont("helvetica","normal"); doc.setFontSize(12);
  doc.text(`Aluno: ${studentName||"(Aluno)"} • Data: ${(e.date||"").slice(0,10)} • Duração: ${e.duration||60}'`, left, y); y+=lh;
  const multi = (label, text)=>{ doc.setFont("helvetica","bold"); doc.text(label, left, y); y+=lh; doc.setFont("helvetica","normal"); const split=doc.splitTextToSize(text||"—", 480); doc.text(split, left, y); y+=split.length*lh+6; };
  multi("Conteúdo", e.content); multi("Progresso", e.progress); multi("Dificuldades", e.difficulties); multi("Próximos passos", e.nextSteps);
  if(e.notes){ multi("Observações", e.notes); }
  doc.setFontSize(10); doc.setTextColor(120); doc.text("Gerado automaticamente pelo sistema.", left, 800);
  doc.save(`Evolucao-${studentName||"Aluno"}-${(e.date||"").slice(0,10)}.pdf`);
}

/* ======================= KPIs / Relatórios ======================= */
function renderKPIs(){
  const today = new Date(); const y=today.getFullYear(); const m=today.getMonth();
  const dayCount = lessons.filter(l=>{ const d = parseISODateLocal(l.date); return d.getDate()===today.getDate() && d.getMonth()===m && d.getFullYear()===y; }).length;
  const monthList = lessons.filter(l=>{ const d = parseISODateLocal(l.date); return d.getMonth()===m && d.getFullYear()===y; });
  const monthCount = monthList.length;
  const monthRev = monthList.filter(x=>x.status===2).reduce((s,a)=>s+(+a.price||0),0);
  const yearRev = lessons
  .filter(l => {
    const d = parseISODateLocal(l.date);
    return d.getFullYear() === y && l.status === 2;
  })
  .reduce((s, a) => s + (+a.price || 0), 0);

  $("kpiDay").textContent=dayCount;
  $("kpiMonth").textContent=monthCount;
  $("kpiMonthRev").textContent=formatBRL(monthRev);
  $("kpiYearRev").textContent=formatBRL(yearRev);
}
$("repYear").onchange = renderDashboard;
$("repCompare").onchange = renderDashboard;
if ($("repYearInvest")) $("repYearInvest").onchange = renderDashboard; // ✅
function ensureYearSelects(){
  const years=new Set();
  for(const l of lessons){ if(!l.date||l.status!==2) continue; years.add(parseISODateLocal(l.date).getFullYear()); }
  if(years.size===0){ const y=(new Date()).getFullYear(); years.add(y); years.add(y-1); }
  const arr=[...years].sort((a,b)=>a-b);
  // garante anos futuros no seletor (ex.: até +3)
  const cur = (new Date()).getFullYear();
  for (let y = cur; y <= cur + 3; y++) years.add(y);
 
  const fill=(id)=>{ 
    const el=$(id); 
    if(!el) return;
    const cur=el.value; 
    el.innerHTML=arr.map(y=>`<option>${y}</option>`).join(""); 
    if(arr.includes(+cur)) el.value=cur; 
  };

  fill("repYear");
  fill("repCompare");
  fill("repYearInvest");              // ✅ novo

  if(!$("repYear").value) $("repYear").value=String((new Date()).getFullYear());
  if(!$("repCompare").value) $("repCompare").value=String((new Date()).getFullYear()-1);

  // por padrão, o seletor de investimento acompanha o principal
  if ($("repYearInvest") && !$("repYearInvest").value) {
    $("repYearInvest").value = $("repYear").value;
  }

  updateMoneyButton();
}
/* ===== ESTADO RANKING RELATÓRIOS ===== */
let rankingExpanded = false;


let _barsY = Array(12).fill(0);
let _barsC = Array(12).fill(0);
let _chartCtx=null;
function renderDashboard(){
  ensureYearSelects();
  const y  = +$("repYear").value;
const cy = +$("repCompare").value;
const invY = +($("repYearInvest")?.value || y);   // ✅ ano do bloco de investimento
$("listYear").textContent = String(invY);
$("cmpYear").textContent = cy;
$("barsYear").textContent = y;



  _barsY = Array(12).fill(0);
  _barsC = Array(12).fill(0);

  for(const l of lessons){
    if(!l.date || l.status!==2) continue;
    const d = parseISODateLocal(l.date); const m = d.getMonth();
    if(d.getFullYear()===y) _barsY[m]+= (+l.price||0);
    if(d.getFullYear()===cy) _barsC[m]+= (+l.price||0);
  }
  const comparison = calculateYearComparison(_barsY, _barsC);

const yearTotal = comparison.yearTotal;
const cmpTotal = comparison.compareTotal;
const delta = comparison.delta;

  $("kpiYearRev").textContent = formatBRL(yearTotal);
  $("kpiYearDelta").textContent = (delta>=0?"+":"") + delta.toFixed(1) + "%";
  $("yearTotalFooter").textContent = formatBRL(yearTotal);

  drawBars(_barsY, _barsC);

  const fullList = calculateYearlyStudentRanking(
  lessons,
  students,
  invY,
  parseISODateLocal,
  v => (+v || 0)
);

const list = rankingExpanded ? fullList : fullList.slice(0, 10);



  const box=$("byStudentList"); box.innerHTML="";
  if(list.length===0){ box.innerHTML=`<div class="muted">Sem aulas realizadas no ano.</div>`; }
  for(const r of list){
    const row=document.createElement("div"); row.className="listrow";
    row.innerHTML=`<div>${r.name}</div><div><span class="pill-mini">${r.aulas} aulas</span> &nbsp; <b>$formatBRL(r.total)}</b></div>`;
    box.appendChild(row);
  }


  // Botão Toggle Ranking
if (fullList.length > 10) {
  const btnToggle = document.createElement("div");
  btnToggle.className = "ranking-toggle";


  btnToggle.textContent = rankingExpanded
    ? "Ver menos ▴"
    : "Ver ranking completo ▾";

  btnToggle.onclick = function() {
    rankingExpanded = !rankingExpanded;
    renderDashboard();
  };

  const toggleContainer = $("rankingToggleContainer");
toggleContainer.innerHTML = "";
toggleContainer.appendChild(btnToggle);

}


}
function drawBars(arrY, arrC){
  const canvas=$("chartYear"); if(!canvas) return;
  const cssW = canvas.clientWidth || 600;
  const cssH = Number(canvas.getAttribute("height")||140);
  canvas.width = cssW;
  if(!_chartCtx){ _chartCtx=canvas.getContext("2d"); }
  const ctx=_chartCtx;
  const W=canvas.width, H=cssH;
  ctx.clearRect(0,0,W,H);

  const pad=24, innerW=W-pad*2, innerH=H-pad*2;
  const monthsLbl=["J","F","M","A","M","J","J","A","S","O","N","D"];
  const max=Math.max(1,...arrY,...arrC);
  const col=12, gap=innerW/(col*2), barW=gap*0.8;

  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line'); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad,H-pad); ctx.lineTo(W-pad,H-pad); ctx.stroke();

  ctx.fillStyle="#5ea0ff";
  for(let i=0;i<12;i++){ const x=pad + i*gap*2 + gap*0.3; const h=Math.round((arrY[i]/max)*innerH); ctx.fillRect(x, H-pad-h, barW, h); }
  ctx.fillStyle="#7a6cff";
  for(let i=0;i<12;i++){ const x=pad + i*gap*2 + gap*0.3 + barW + 4; const h=Math.round((arrC[i]/max)*innerH); ctx.fillRect(x, H-pad-h, barW, h); }

  ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.font="12px sans-serif"; ctx.textAlign="center";
  for(let i=0;i<12;i++){ const x=pad + i*gap*2 + gap*0.3 + barW; ctx.fillText(monthsLbl[i], x, H-pad+14); }
}
window.addEventListener("resize", ()=> drawBars(_barsY, _barsC));
function updateMoneyButton(){
  const btn=$("btnHideMoney"); if(!btn) return;
  const hidden = btn.dataset.hide==="1";
  btn.textContent = hidden 
  ? "🙈 Mostrar valores"
  : "👁 Ocultar valores";
  const nodes = [ "kpiMonthRev","kpiYearRev","avgPerStudent","yearTotalFooter" ];
  for(const id of nodes){ const el=$(id); if(el) el.style.filter = hidden? "blur(4px)" : "none"; }
}
$("btnHideMoney").onclick=()=>{ const btn=$("btnHideMoney"); btn.dataset.hide = btn.dataset.hide==="1"?"0":"1"; updateMoneyButton(); };


function renderReportStats() {
  // Se não houver elementos na página de relatório, sai sem erro
  const repYearSel = $("#repYear");
  const repCompareSel = $("#repCompare");
  const chartCanvas = $("#chartYear");
  const repListBox = $("#repList");
  const repKpiTotal = $("#repTotal");
  const repKpiMedia = $("#repMedia");

  if (!repYearSel || !chartCanvas || !repListBox) return;

  // Ano principal e ano comparativo
  const year = Number(repYearSel.value || new Date().getFullYear());
  

  // Filtra somente aulas realizadas no ano selecionado
  const lessonsYear = lessons.filter(l => {
    const d = parseISODateLocal(l.date);
    return d.getFullYear() === year && l.status === 2;
  });

  

  // KPIs
  const total = calculateTotalRevenueFromLessons(lessonsYear);
  const alunosSet = extractUniqueStudentIdsFromLessons(lessonsYear);
  const mediaPorAluno = calculateAveragePerStudent(total, alunosSet.size);

  if (repKpiTotal) repKpiTotal.textContent = formatBRL(total);
  if (repKpiMedia) repKpiMedia.textContent = formatBRL(mediaPorAluno);

  // Lista de investimento por aluno
  if (repListBox) {
    repListBox.innerHTML = "";
    alunosSet.forEach(id => {
      const aluno = students.find(s => s.id === id);
      const totalAluno = calculateTotalRevenueForStudent(lessonsYear, id);
      const div = document.createElement("div");
      div.innerHTML = `<b>${aluno?.name || "Sem nome"}</b> — ${formatBRL(totalAluno)}`;
      repListBox.appendChild(div);
    });
  }

  // Gráfico mensal
  if (chartCanvas) {
    const dataYear = calculateMonthlyRevenueFromLessons(
  lessonsYear,
  parseISODateLocal
);

    

    if (window.repChart) window.repChart.destroy();

window.repChart = new Chart(chartCanvas.getContext("2d"), {
  type: "bar",
  data: {
    labels: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    datasets: [
      {
        label: `Ano ${year}`,
        data: dataYear,
        backgroundColor: "#4caf50"
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => formatBR(v) }
      }
    }
  }
});

  }
  
}

/* ======================= Backup ======================= */

// ================= EXPORT =================
$("btnExportJSON").onclick = async () => {

  try {

    const data = {
      meta: {
        app: "Bailado Carioca – Gestão de Aulas",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        studentsCount: students?.length || 0,
        lessonsCount: lessons?.length || 0,
        evolutionsCount: evolutions?.length || 0
      },
      students,
      lessons,
      evolutions
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(a.href);

  } catch (err) {
    console.error("Erro ao exportar:", err);
    alert("Erro ao exportar backup.");
  }
};


// ================= IMPORT =================
$("btnImportJSON").onclick = () => {

  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "application/json";

  inp.onchange = async () => {

    const f = inp.files?.[0];
    if (!f) return;

    const confirmImport = confirm(
      "Isso irá importar dados e atualizar registros existentes.\n\nDeseja continuar?"
    );
    if (!confirmImport) return;

    let data;

    try {
      const tx = await f.text();
      data = JSON.parse(tx || "{}");
    } catch (err) {
      alert("Arquivo JSON inválido.");
      return;
    }

    try {

      if (Array.isArray(data.students)) {
        for (const s of data.students) {
          if (!s?.id) continue;

          const { id, createdAt, updatedAt, ...rest } = s;
          const ref = doc(colStudents, id);

          await setDoc(ref, {
            ...rest,
            createdAt: createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      if (Array.isArray(data.lessons)) {
        for (const l of data.lessons) {
          if (!l?.id) continue;

          const { id, createdAt, updatedAt, ...rest } = l;
          const ref = doc(colLessons, id);

          await setDoc(ref, {
            ...rest,
            createdAt: createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      if (Array.isArray(data.evolutions)) {
        for (const e of data.evolutions) {
          if (!e?.id) continue;

          const { id, createdAt, updatedAt, ...rest } = e;
          const ref = doc(colEvol, id);

          await setDoc(ref, {
            ...rest,
            createdAt: createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      alert("Importação concluída com sucesso.");

    } catch (err) {
      console.error("Erro durante importação:", err);
      alert("Erro ao importar dados. Verifique o console.");
    }
  };

  inp.click();
};

/* ======================= Aula: CRUD ======================= */
$("btnNewLesson").onclick = () => openLessonModal();

$("btnCloseLesson").onclick = () => {
  $("lessonModal").classList.remove("show");
  document.body.classList.remove("modal-open");
};

$("btnSaveLesson").onclick = saveLesson;
$("btnDelLesson").onclick  = deleteLessonConfirmed;

let editingLessonId = null;

function openLessonModal(data) {
  fillStudentSelects();

  editingLessonId = data?.id || null;
  $("lessonTitle").textContent = editingLessonId ? "Editar aula" : "Nova aula";

  const nowLocal = toLocalDateTimeString(new Date());
  $("lessonDate").value     = data?.date?.slice(0, 16) ?? nowLocal;
  $("lessonStudent").value  = data?.studentId || "";
  $("lessonStyle").value    = data?.style || "";
  $("lessonLevel").value    = data?.level || "Iniciante";
  $("lessonType").value     = data?.type || "Particular";
  $("lessonModel").value    = data?.model || "Padrão";
  $("lessonDuration").value = data?.duration || 60;
  $("lessonPrice").value    = Number.isFinite(+data?.price) ? fmtBRL(data.price) : fmtBRL(0);
  $("lessonPlace").value    = data?.place || "";
  $("lessonStatus").value   = String(data?.status ?? 0);
  $("lessonNotes").value    = data?.notes || "";
  $("btnDelLesson").style.display = editingLessonId ? "inline-flex" : "none";

  // Recorrência: defaults ao abrir (apenas aqui dentro!)
  $("recEnabled").checked = false;
  $("recEvery").value = "7";
  $("recCount").value = 0;

  document.body.classList.add("modal-open");
  $("lessonModal").classList.add("show");
}

function editLesson(id) {
  const a = lessons.find(x => x.id === id);
  if (a) openLessonModal(a);
}
 async function saveLesson(){
  const dateLocal = $("lessonDate").value; // "YYYY-MM-DDTHH:MM" (local)
  const payload = {
    date: dateLocal,
    studentId: $("lessonStudent").value,
    style: $("lessonStyle").value,
    level: $("lessonLevel").value,
    type: $("lessonType").value,
    model: $("lessonModel").value,
    duration: +$("lessonDuration").value || 60,
    price: parseNumberFromBRL($("lessonPrice").value),
    place: $("lessonPlace").value,
    status: +$("lessonStatus").value || 0,
    notes: $("lessonNotes").value,
    ownerUid: user?.uid || "dev",
    updatedAt: serverTimestamp()
  };

  try{
    if (editingLessonId){
      await updateDoc(doc(db,"aulas",editingLessonId), payload);
    } else {
      await addDoc(colLessons, { ...payload, createdAt: serverTimestamp() });
    }

    // === Recorrência (cria aulas futuras) ===
    try{
      const recOn   = $("recEnabled")?.checked;
      const recDays = Number($("recEvery")?.value || 7);
      const recQty  = Number($("recCount")?.value || 0);

      if (!editingLessonId && recOn && recQty > 0){
        const base = new Date(dateLocal);

        for (let i = 1; i <= recQty; i++){
          const d = new Date(base);
          d.setDate(d.getDate() + i * recDays);
          const nextLocal = toLocalDateTimeString(d);

          const futurePayload = {
            ...payload,
            date: nextLocal,
            status: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          const exists = lessons.some(l =>
            l.studentId === futurePayload.studentId &&
            typeof l.date === "string" &&
            l.date.slice(0,16) === nextLocal.slice(0,16)
          );
          if (exists) continue;

          await addDoc(colLessons, futurePayload);
        }
      }
    }catch(err){
      console.error(err);
      showAlert("Erro ao criar recorrência.", "error");
    }

    $("lessonModal").classList.remove("show");
    document.body.classList.remove('modal-open');
    showAlert("Salvo com sucesso.");
  }catch(e){
    console.error(e);
    showAlert("Erro ao salvar aula","error");
  }
}

function deleteLesson(id){ const a=lessons.find(x=>x.id===id); if(a) openLessonModal(a); }
async function deleteLessonConfirmed(){
  if (!editingLessonId) return;
  if (!confirm("Excluir esta aula?")) return;

  try{
   await deleteLesson(editingLessonId);
    $("lessonModal").classList.remove("show");
    document.body.classList.remove("modal-open"); // fecha o overlay do modal
    editingLessonId = null;
    showAlert("Aula excluída.");
  }catch(e){
    console.error(e);
    showAlert("Erro ao excluir aula", "error");
  }
}


/* ======================= RECIBO (Completo) ======================= */
const recModal = $("receiptModal");
$("btnReceiptClose").onclick = ()=> recModal.classList.remove("show");
const fmt = (n)=> (Number(n||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

/* Alterna blocos */
function toggleReceiptBoxes(){
  const t = $("recType").value;
  $("recBoxAvulsa").style.display = (t==="avulsa") ? "block" : "none";
  $("recBoxPacote").style.display = (t==="pacote") ? "block" : "none";
  if (t==="avulsa") $("recObsAvulsa").value = "Aula avulsa";
  else $("recObsPacote").value = "Pagamento de pacote";
}
$("recType").onchange = ()=>{ toggleReceiptBoxes(); tryFillPackageAuto(); };

/* Preenche select de alunos */
function fillReceiptStudents(){ const c=$("recStudent"); if(!c) return; const opts = `<option value="">Selecione…</option>` + students.map(s=>`<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join(""); c.innerHTML=opts; }
function setReceiptStudent(id){ const el=$("recStudent"); if(el) el.value = id||""; }

/* Abrir modal Avulsa (a partir da aula) */
function openReceiptFromLesson(a){
  fillReceiptStudents();
  $("recType").value = "avulsa"; toggleReceiptBoxes();
  $("recEmitDate").value = toInputDate(new Date());
  $("recTeacher").value  = "Edson Silva";
  setReceiptStudent(a.studentId||"");
  $("recAvulsaDate").value  = toInputDate(parseISODateLocal(a.date));
  $("recAvulsaValue").value = fmtBRL(a.price||0);
  $("recPayMethod").value = "PIX";
  $("recCNPJ").value = ""; // opcional
  $("recObsAvulsa").value = "Aula avulsa";
  recModal.classList.add("show");
}

/* Abrir modal Pacote (a partir do aluno) */
function openReceiptFromStudent(s){
  fillReceiptStudents();
  $("recType").value = "pacote"; toggleReceiptBoxes();
  $("recEmitDate").value = toInputDate(new Date());
  $("recTeacher").value  = "Edson Silva";
  setReceiptStudent(s.id||"");
  const i = s.packageStart ? parseBR(s.packageStart) : null;
  const f = s.packageEnd   ? parseBR(s.packageEnd)   : null;
  $("recPkgStart").value = i ? toInputDate(i) : "";
  $("recPkgEnd").value   = f ? toInputDate(f) : "";
  $("recPayMethod").value = "PIX";
  $("recCNPJ").value = "";
  $("recObsPacote").value = "Pagamento de pacote";
  tryFillPackageAuto();
  recModal.classList.add("show");
}

/* Aulas no período — exclui canceladas */
function getLessonsInRange(studentId, isoStart, isoEnd){
  if(!studentId || !isoStart || !isoEnd) return [];
  const S = new Date(isoStart + "T00:00:00");
  const E = new Date(isoEnd   + "T23:59:59");
  return lessons
    .filter(l => l.studentId === studentId && l.status !== 3)
    .filter(l => { const d=parseISODateLocal(l.date); return d>=S && d<=E; })
    .sort((a,b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));
}

/* Calcula pacote */
function fillPackageAuto(){
  const sId = $("recStudent").value;
  const i   = $("recPkgStart").value;
  const f   = $("recPkgEnd").value;
  const qtyEl   = $("recPkgQty");
  const totalEl = $("recPkgTotal");
  const datesEl = $("recPkgDates");

  if(!sId || !i || !f){
    qtyEl.value = 0; totalEl.value = 0; datesEl.value = "—";
    return { qty:0, total:0, dates:[] };
  }
  const arr   = getLessonsInRange(sId, i, f);
  const qty   = arr.length;
  const total = arr.reduce((sum,x)=> sum + (+x.price||0), 0);
  const dates = arr.map(x=>{
    const d=parseISODateLocal(x.date);
    const tag = ["Agendada","Confirmada","Realizada","Cancelada"][x.status||0];
    return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} (${tag})`;
  });

  qtyEl.value   = qty;
  totalEl.value = Number(total).toFixed(2);
  datesEl.value = dates.length ? dates.join("\n") : "—";

  return { qty, total, dates };
}
const tryFillPackageAuto = ()=> { if($("recType").value === "pacote") fillPackageAuto(); };
["recStudent","recPkgStart","recPkgEnd"].forEach(id=>{ const el=$(id); if(el) el.addEventListener("change", tryFillPackageAuto); });

/* PDF */
$("btnReceiptPDF").onclick = generateReceiptPDF;
function generateReceiptPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"pt", format:"a4"});
  const L = 56; let y = 64, lh = 18;

  const type = $("recType").value;
  const emit = $("recEmitDate").value;
  const prof = $("recTeacher").value || "Professor";
  const cnpj = $("recCNPJ").value || "";
  const stuId = $("recStudent").value;
  const stu   = students.find(s=>s.id===stuId);
  const aluno = stu?.name || $("recStudent").selectedOptions?.[0]?.text || "Aluno";
  const pay = $("recPayMethod").value || "";
  const obs = ($("recType").value==="avulsa")
  ? ($("recObsAvulsa")?.value || "")
  : ($("recObsPacote")?.value || "");

  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("RECIBO DE AULAS — Bailado Carioca", L, y); y+=lh+8;

  doc.setFont("helvetica","normal"); doc.setFontSize(12);
  doc.text(`Emitido em: ${emit||"-"}`, L, y); y+=lh;

  doc.setFont("helvetica","bold"); doc.text("EMITENTE", L, y); y+=lh;
  doc.setFont("helvetica","normal"); 
  doc.text(`Professor: ${prof}`, L, y); y+=lh;
  if(cnpj){ doc.text(`CNPJ: ${cnpj}`, L, y); y+=lh; }
  y+=6;

  doc.setFont("helvetica","bold"); doc.text("RECEBI DE", L, y); y+=lh;
  doc.setFont("helvetica","normal"); doc.text(`Aluno: ${aluno}`, L, y); y+=lh+6;

  if (type === "avulsa"){
    const d = $("recAvulsaDate").value;
    const v = parseNumberFromBRL($("recAvulsaValue").value);

    doc.setFont("helvetica","bold"); doc.text("AULA AVULSA", L, y); y+=lh;
    doc.setFont("helvetica","normal");
    doc.text(`Data da aula: ${d||"-"}`, L, y); y+=lh;
    doc.text(`Valor pago: ${fmt(v)}`, L, y); y+=lh;

    doc.setFont("helvetica","bold"); doc.text("PAGAMENTO", L, y); y+=lh;
    doc.setFont("helvetica","normal");
    doc.text(`Forma: ${pay||"-"}`, L, y); y+=lh;
    if (obs){
      const lines = doc.splitTextToSize(`Observações: ${obs}`, 480);
      doc.text(lines, L, y); y += lines.length*lh;
    }
  } else {
    const i = $("recPkgStart").value, f = $("recPkgEnd").value;
    const { qty, total, dates } = fillPackageAuto();

    doc.setFont("helvetica","bold"); doc.text("PACOTE", L, y); y+=lh;
    doc.setFont("helvetica","normal");
    doc.text(`Período do pacote: ${i||"-"} a ${f||"-"}`, L, y); y+=lh;
    doc.text(`Aulas no período (agendadas/confirmadas/realizadas): ${qty}`, L, y); y+=lh+6;

    if (dates && dates.length){
      doc.setFont("helvetica","bold"); doc.text("Datas do período", L, y); y+=lh;
      doc.setFont("helvetica","normal");
      const cols = 3, colW = 160;
      for (let idx=0; idx<dates.length; idx++){
        const cx = L + (idx%cols)*colW;
        const cy = y + Math.floor(idx/cols)*lh;
        doc.text("• "+dates[idx], cx, cy);
      }
      y += Math.ceil(dates.length/cols)*lh + 6;
    }

    doc.setFont("helvetica","bold"); doc.text("RESUMO FINANCEIRO", L, y); y+=lh;
    doc.setFont("helvetica","normal");
    doc.text(`TOTAL PAGO: ${fmt(total)}`, L, y); y+=lh;

    y += 6;
    doc.setFont("helvetica","bold"); doc.text("PAGAMENTO", L, y); y+=lh;
    doc.setFont("helvetica","normal");
    doc.text(`Forma: ${pay||"-"}`, L, y); y+=lh;
    if (obs){
      const lines = doc.splitTextToSize(`Observações: ${obs}`, 480);
      doc.text(lines, L, y); y += lines.length*lh;
    }
  }

  doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Documento gerado automaticamente pelo sistema.", L, 800);

  const fname = (type==="avulsa") ? `Recibo-Avulsa-${aluno}.pdf` : `Recibo-Pacote-${aluno}.pdf`;
  doc.save(fname);
}

/* ======================= INIT ======================= */
function renderEvoKPIs(){
  const today=new Date(); const y=today.getFullYear(); const m=today.getMonth(); const d=today.getDate();
  const dayE = evolutions.filter(e=>{
    const t = parseISODateLocal(e.date);
    return t.getDate()===d && t.getMonth()===m && t.getFullYear()===y;
});
const monthE = evolutions.filter(e=>{
    const t = parseISODateLocal(e.date);
    return t.getMonth()===m && t.getFullYear()===y;
});

  const monthMin = monthE.reduce((s,e)=>s+(+e.duration||0),0);
  const stuSet=new Set(monthE.map(x=>x.studentId));
  $("evoDay").textContent = dayE.length;
  $("evoMonth").textContent= monthE.length;
  $("evoMonthMin").textContent= (monthMin||0) + "'";
  $("evoMonthStu").textContent= stuSet.size;
}

(function init(){
  try{
    renderCalendar();
    renderKPIs();
    renderEvoKPIs();
    ensureYearSelects();
    renderDashboard();
    renderDayDetails( ymdKey(new Date()) );
    updateMoneyButton();
    $("recEmitDate").value = toInputDate(new Date());
    toggleReceiptBoxes();
  }catch(e){
    console.error("Init error:", e);
  }
})();
// === Relatório por Aluno ===
function brl(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0)); }

function getRepYear(){
  // Se seu select de ano tiver outro id, ajuste aqui
  const sel = $("repYear");
  return sel && sel.value ? Number(sel.value) : (new Date()).getFullYear();
}

function fillRepStudentSelect() {
  const sel = $("repStuSelect");
  if (!sel || !Array.isArray(students)) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Selecione um aluno...</option>` +
    students.map(s => {
      const id = String(s.id ?? "");
      const name = s.name?.trim() || "(sem nome)";
      return `<option value="${id}">${name}</option>`;
    }).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function renderRepStudent() {
  const sel = $("repStuSelect");
  const box = $("repStuBox");
  const yearEcho = $("repYearEcho");
  if (!sel || !box) return;

  const year = getRepYear();
  if (yearEcho) yearEcho.textContent = year;

  const id = String(sel.value || "");
  if (!id) {
    box.innerHTML = `<div class="muted">Selecione um aluno para ver o detalhamento.</div>`;
    return;
  }

  const stu = (students || []).find(s => String(s.id) === id);

  const report = calculateYearlyStudentReport(
  lessons || [],
  id,
  year,
  parseISODateLocal,
  parseBRLToNumber
);

const lessonsYear = report.lessons;
const total = report.total;

  box.innerHTML = `
    <h3>${stu?.name?.trim() || "(sem nome)"}</h3>
    <p>Total de aulas realizadas: <b>${lessonsYear.length}</b></p>
    <p>Investimento no ano: <b>${brl(total)}</b></p>
  `;
}

// Listeners (com proteção)
if ($("repStuSelect")) $("repStuSelect").onchange = renderRepStudent;
if ($("repYear"))      $("repYear").onchange      = renderRepStudent;

// Chamar após snapshots carregarem
function initRepStudentArea(){
  fillRepStudentSelect();
  renderRepStudent();
  /* ================= Filtro de Mês (Relatórios) — Bloco Isolado ================= */

// 1) Preenche <select id="repMonth"> (uma vez)
function setupReportMonthFilter(){
  var sel = document.getElementById("repMonth");
  var yearSel = document.getElementById("repYear");
  if (!sel) return;
  if (sel.dataset._filled === "1") return;

  var meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  sel.innerHTML = "";
  for (var i=0;i<12;i++){
    var o = document.createElement("option");
    o.value = String(i);  // 0..11
    o.textContent = meses[i];
    sel.appendChild(o);
  }
  sel.value = String((new Date()).getMonth());
  sel.dataset._filled = "1";

  // liga eventos só uma vez
  if (sel.dataset._bound !== "1"){
    sel.addEventListener("change", renderReportMonthKPIs);
    sel.dataset._bound = "1";
  }

  // também recalcula quando mudar o ano
  var ysel = document.getElementById("repYear");
  if (ysel && ysel.dataset._repYearBound !== "1"){
    ysel.addEventListener("change", renderReportMonthKPIs);
    ysel.dataset._repYearBound = "1";
  }
}

// 2) Helpers
function _repYear(){
  var el = document.getElementById("repYear");
  return Number(el && el.value) || (new Date()).getFullYear();
}
function _repMonth(){
  var el = document.getElementById("repMonth");
  return Number(el && el.value !== "" ? el.value : (new Date()).getMonth());
}
function parseBRLToNumber(v){
  if (typeof v === "number") return v;
  var s = String(v||"").replace(/^R\$\s?/, "").replace(/\./g,"").replace(",",".");
  var n = Number(s); return isFinite(n) ? n : 0;
}

// 3) Calcula apenas os KPIs mensais (não altera mais nada do seu Relatório)
function renderReportMonthKPIs(){
  var y = _repYear();
  var m = _repMonth();

  var arr = Array.isArray(lessons) ? lessons.filter(function(l){
    var d = parseISODateLocal(l.date);
    return d.getFullYear() === y && d.getMonth() === m;
  }) : [];

  // KPI: "Mês (aulas)" — quantidade total no mês
  var monthCount = calculateLessonCount(arr);


  // 🔵 Receita Prevista (Realizadas + Confirmadas + Agendadas)
var forecastRevenue = arr
  .filter(function(l){
    return String(l.status) === "0" || // Agendada
           String(l.status) === "1" || // Confirmada
           String(l.status) === "2";   // Realizada
  })
  .reduce(function(acc,l){
    return acc + parseBRLToNumber(l.price);
  }, 0);

  // KPI: "Receita (mês)" — apenas status=2 (Realizada)
  var forecastRevenue = calculateForecastRevenueForLessons(
  arr,
  parseBRLToNumber
);


  var elCount = document.getElementById("kpiMonth");
  var elRev   = document.getElementById("kpiMonthRev");
  if (elCount) elCount.textContent = String(monthCount);
  if (elRev)   elRev.textContent   = fmtBRL(monthRevenue);
}

// 4) expõe uma inicialização simples
function initReportMonthPatch(){
  setupReportMonthFilter();
  renderReportMonthKPIs();
}

// tenta inicializar assim que possível (caso a aba já esteja visível)
setTimeout(initReportMonthPatch, 0);

/* ================= FIM — Filtro de Mês (Relatórios) — Bloco Isolado ========== */

/* ======================= Backup ======================= */

document.addEventListener("DOMContentLoaded", () => {

  const btnExport = document.getElementById("btnExportJSON");
  const btnImport = document.getElementById("btnImportJSON");

  if (btnExport) {
    btnExport.addEventListener("click", () => {

      const data = { students, lessons, evolutions };

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "backup.json";
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  if (btnImport) {
    btnImport.addEventListener("click", () => {

      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "application/json";

      inp.onchange = async () => {

        const f = inp.files?.[0];
        if (!f) return;

        if (!confirm("Importar dados irá atualizar registros existentes. Deseja continuar?")) return;

        const tx = await f.text();
        const data = JSON.parse(tx || "{}");

        if (Array.isArray(data.students)) {
          for (const s of data.students) {
            if (!s.id) continue;
            await setDoc(doc(colStudents, s.id), {
              ...s,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        if (Array.isArray(data.lessons)) {
          for (const l of data.lessons) {
            if (!l.id) continue;
            await setDoc(doc(colLessons, l.id), {
              ...l,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        if (Array.isArray(data.evolutions)) {
          for (const e of data.evolutions) {
            if (!e.id) continue;
            await setDoc(doc(colEvol, e.id), {
              ...e,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        alert("Importação concluída com sucesso.");
      };

      inp.click();
    });
  }

});



}


