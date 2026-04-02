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
  calculateYearComparison,
  calculateRevenueConcentration
} from './services/reportService.js';
import { parseISODateLocal } from "./utils/dateService.js";
import { formatBRL, formatBRLFromCents, parseBRLToNumber } from "./utils/formatService.js";
import { $, els, pad2, ymdKey } from "./utils/uiHelpers.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import {
  BRAND_NAME, toInputDate, toLocalDateTimeString, hhmmLocal,
  showAlert, onlyDigits, maskBRLInput, bindBRLMasks,
  firstName, normalizePhoneBR, buildWhatsAppMessage
} from "./ui/helpers.js";

/* ======================= Shift key ======================= */
let isShiftPressed = false;
window.addEventListener("keydown", (e) => { if (e.key === "Shift") isShiftPressed = true; });
window.addEventListener("keyup",   (e) => { if (e.key === "Shift") isShiftPressed = false; });



/* ======================= Estado ======================= */
let user = null;
let students = [], lessons = [], evolutions = [];
let unsubS = null, unsubL = null, unsubE = null;
let editingEvolutionId = null;
let cashEntries = [];
window._cashEntries = cashEntries;
let unsubCash = null;
let monthRevenueTotal = 0;

const colStudents = collection(db, "alunos");
const colLessons  = collection(db, "aulas");
const colEvol     = collection(db, "evolucoes");
const colCash     = collection(db, "caixa");
const withId      = (d) => ({ id: d.id, ...d.data() });

bindBRLMasks();

/* ======================= Tema ======================= */
(function () {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  $("btnTheme").textContent = saved === "dark" ? "🌙 Tema" : "☀️ Tema";
})();
$("btnTheme").onclick = () => {
  const cur  = document.documentElement.getAttribute("data-theme") || "dark";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  $("btnTheme").textContent = next === "dark" ? "🌙 Tema" : "☀️ Tema";
};

/* ======================= Abas ======================= */
const sections = {
  agenda:    $("agenda"),
  alunos:    $("alunos"),
  evolucao:  $("evolucao"),
  relatorios:$("relatorios"),
  caixa:     $("caixa"),
  backup:    $("backup")
};
function hideAllSections() {
  Object.values(sections).forEach(s => s.classList.remove("show"));
  els("#tabs a").forEach(a => a.classList.remove("active"));
}
function showCover() {
  hideAllSections();
  $("tabs").style.display = "none";
  $("hero").style.display = "block";
  try { window.scrollTo({ top: 0, behavior: "instant" }); } catch {}
}
function showTab(name) {
  hideAllSections();
  sections[name]?.classList.add("show");
  els("#tabs a").forEach(a => a.classList.toggle("active", a.dataset.tab === name));
  if (user) $("hero").style.display = "none";
  if (name === "relatorios") {
    setTimeout(() => { try { initReportMonthPatch(); } catch (e) { console.error(e); } }, 0);
  }
}
els("#tabs a").forEach(a => a.onclick = (e) => { e.preventDefault(); showTab(a.dataset.tab); });
$("btnEnterSystem").onclick = () => $("btnGoogle").click();

/* ======================= UI: toggles ======================= */
// Histórico de Evolução
const btnToggleHistory = $("btnToggleHistory");
const historyContent   = $("historyContent");
if (btnToggleHistory && historyContent) {
  btnToggleHistory.addEventListener("click", () => {
    const isHidden = historyContent.style.display === "none";
    historyContent.style.display = isHidden ? "block" : "none";
    btnToggleHistory.textContent  = isHidden ? "Ocultar" : "Mostrar";
  });
}

// Formulário Novo Aluno
const studentFormWrap      = document.getElementById("studentFormWrap");
const btnToggleStudentForm = document.getElementById("btnToggleStudentForm");
if (btnToggleStudentForm && studentFormWrap) {
  btnToggleStudentForm.addEventListener("click", () => {
    const isOpen = studentFormWrap.classList.contains("form-open");
    studentFormWrap.classList.toggle("form-open",      !isOpen);
    studentFormWrap.classList.toggle("form-collapsed",  isOpen);
    btnToggleStudentForm.textContent = isOpen ? "+ Novo Aluno" : "Fechar";
  });
}

// Modal Evolução
const evoModal         = document.getElementById("evoModal");
const btnToggleEvoForm = document.getElementById("btnToggleEvoForm");
const btnCloseEvoModal = document.getElementById("btnCloseEvoModal");
if (evoModal && btnToggleEvoForm) {
  btnToggleEvoForm.addEventListener("click", () => evoModal.classList.add("show"));
  btnCloseEvoModal?.addEventListener("click", () => evoModal.classList.remove("show"));
  evoModal.addEventListener("click", (e) => { if (e.target === evoModal) evoModal.classList.remove("show"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") evoModal.classList.remove("show"); });
}

/* ======================= Auth ======================= */
const provider = new GoogleAuthProvider();
$("btnGoogle").onclick  = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
$("btnSignout").onclick = async () => { try { await signOut(auth); } catch {} };

onAuthStateChanged(auth, (u) => {
  detach();
  user = u || null;
  const logged = !!user;

  $("btnGoogle").style.display  = logged ? "none"        : "inline-flex";
  $("btnSignout").style.display = logged ? "inline-flex" : "none";
  $("authEmail").style.display  = logged ? "inline-flex" : "none";
  $("authEmail").textContent    = logged ? user.email    : "";

  if (!logged) { showCover(); return; }

  console.log("Auth confirmado:", user.uid);
  $("hero").style.display = "none";
  $("tabs").style.display = "flex";

  attach();
  attachGlobalCashListener();
  showTab("agenda");
});

/* ======================= Firestore listeners ======================= */
function attach() {
  if (!user) return;

  const qS = query(colStudents, where("ownerUid","==",user.uid), orderBy("createdAt","desc"));
  const qL = query(colLessons,  where("ownerUid","==",user.uid), orderBy("date","asc"));
  const qE = query(colEvol,     where("ownerUid","==",user.uid), orderBy("date","desc"));

  unsubS = onSnapshot(qS, (snap) => {
    students = snap.docs.map(withId);
    $("kpiActiveStudents").textContent = students.filter(s => s.active === true).length;
    fillStudentSelects();
    renderStudentFilter();
    fillRepStudentSelect();
    initRepStudentArea();
    renderStudents();
    renderDashboard();
    buildEvoTree();
  });

  unsubL = onSnapshot(qL, (snap) => {
    lessons = snap.docs.map(withId);
    renderCalendar();
    renderUpcoming();
    renderDayDetails(state.selKey);
    renderEvoKPIs();
    renderStudents();
    fillRepYearInvest();
    renderDashboard();
    renderReportMonthKPIs();
  });

  unsubE = onSnapshot(qE, (snap) => {
    evolutions = snap.docs.map(withId);
    renderEvolutions();
    renderEvoKPIs();
    buildEvoTree();
    initRepStudentArea();
  });
}

function detach() {
  unsubS?.();
  unsubL?.();
  unsubE?.();
  unsubCash?.();
}

function attachGlobalCashListener() {
  if (!user) return;
  if (unsubCash) unsubCash();

  const q = query(colCash, where("ownerUid","==",user.uid), orderBy("data","desc"));
  unsubCash = onSnapshot(q, (snap) => {
    cashEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window._cashEntries = cashEntries;
    if (typeof renderCashEntries === "function") renderCashEntries();
    renderReportMonthKPIs();
    renderDashboard();
  }, (error) => {
    console.error("Erro no listener do Caixa:", error);
  });
}

/* ======================= Relatórios — filtro de mês ======================= */
function setupReportMonthFilter() {
  const sel    = document.getElementById("repMonth");
  const yearSel= document.getElementById("repYear");
  if (!sel) return;
  if (sel.dataset._filled === "1") return;

  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  sel.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = meses[i];
    sel.appendChild(o);
  }
  sel.value = String(new Date().getMonth());
  if (yearSel) yearSel.value = String(new Date().getFullYear());
  sel.dataset._filled = "1";

  if (sel.dataset._bound !== "1") {
    sel.addEventListener("change", renderReportMonthKPIs);
    sel.dataset._bound = "1";
  }
  if (yearSel && yearSel.dataset._repYearBound !== "1") {
    yearSel.addEventListener("change", renderReportMonthKPIs);
    yearSel.dataset._repYearBound = "1";
  }
}

function _repYear() {
  const el = document.getElementById("repYear");
  return Number(el && el.value) || new Date().getFullYear();
}
function _repMonth() {
  const el = document.getElementById("repMonth");
  return Number(el && el.value !== "" ? el.value : new Date().getMonth());
}

function calculateCashRevenueForMonth(year, month) {
  if (!cashEntries || !cashEntries.length) return 0;
  return cashEntries
    .filter(e => {
      if (!e || !e.data) return false;
      const d = e.data?.toDate ? e.data.toDate() : new Date(e.data);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((acc, e) => acc + Number(e.valor || 0), 0);
}

function renderReportMonthKPIs() {
  const y = _repYear();
  const m = _repMonth();

  if (!Array.isArray(lessons)) return;

  const arr = lessons.filter(l => {
    if (!l || !l.date) return false;
    const d = parseISODateLocal(l.date);
    if (!(d instanceof Date) || isNaN(d)) return false;
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const monthCount    = arr.length;
  const lessonRevenue = calculateRealizedRevenueForLessons(arr, parseBRLToNumber);
  const cashRevenue   = calculateCashRevenueForMonth(y, m);
  monthRevenueTotal   = lessonRevenue + cashRevenue;

  const paidCount   = arr.filter(l => String(l.status) === "2").length;
  const monthAvg    = paidCount > 0 ? monthRevenueTotal / paidCount : 0;
  const activeCount = Number(document.getElementById("kpiActiveStudents")?.textContent || 0);
  const revPerActive= activeCount > 0 ? monthRevenueTotal / activeCount : 0;

  const forecastRevenue = arr
    .filter(l => ["0","1","2"].includes(String(l.status)))
    .reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  // Mês anterior
  let prevMonth = m - 1, prevYear = y;
  if (prevMonth < 0) { prevMonth = 11; prevYear = y - 1; }

  const prevLessons = lessons.filter(l => {
    if (!l || !l.date) return false;
    const d = parseISODateLocal(l.date);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth && String(l.status) === "2";
  });
  const prevLessonRev  = prevLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const prevCashRev    = calculateCashRevenueForMonth(prevYear, prevMonth);
  const prevTotal      = prevLessonRev + prevCashRev;
  const growth         = prevTotal > 0 ? ((monthRevenueTotal - prevTotal) / prevTotal) * 100 : 0;
  const absDiff        = monthRevenueTotal - prevTotal;

  // Hoje
  const today = new Date(); today.setHours(0,0,0,0);
  const todayArr = lessons.filter(l => {
    const d = parseISODateLocal(l.date); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  });
  const todayRevenue = todayArr
    .filter(l => String(l.status) === "2")
    .reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  // Média por aluno (ano)
  const yearArr = lessons.filter(l => {
    if (!l || !l.date) return false;
    const d = parseISODateLocal(l.date);
    return d.getFullYear() === y && String(l.status) === "2";
  });
  const yearRevenue        = yearArr.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const uniqueYearStudents = new Set(yearArr.map(l => l.studentId));
  const avgYear            = uniqueYearStudents.size > 0 ? yearRevenue / uniqueYearStudents.size : 0;

  // Atualiza DOM
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpiMonth",        String(monthCount));
  set("kpiMonthRev",     formatBRL(monthRevenueTotal));
  set("kpiMonthForecast",formatBRL(forecastRevenue));
  set("kpiMonthPaid",    String(paidCount));
  set("kpiMonthAvg",     formatBRL(monthAvg));
  set("kpiRevPerActive", formatBRL(revPerActive));
  set("kpiDay",          todayArr.length + " aula(s) • " + formatBRL(todayRevenue));
  set("kpiMonthGrowth",  growth.toFixed(1) + "%");
  set("avgPerStudent",   formatBRL(avgYear));

  const elRef = document.getElementById("kpiMonthGrowthRef");
  if (elRef) {
    const mn = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    elRef.textContent = `vs ${mn[prevMonth]} ${prevYear} (${absDiff > 0 ? "+" : ""}${formatBRL(absDiff)})`;
  }
}

function initReportMonthPatch() {
  setupReportMonthFilter();
  renderReportMonthKPIs();
}

/* ======================= Anos dos selects ======================= */
function fillRepYearInvest() {
  const sel = document.getElementById("repYearInvest");
  if (!sel) return;
  const y = new Set();
  if (Array.isArray(lessons) && lessons.length) {
    for (const l of lessons) {
      const d = parseISODateLocal(l.date);
      if (!isNaN(d)) y.add(d.getFullYear());
    }
  }
  const curY = new Date().getFullYear();
  if (y.size === 0) y.add(curY);
  const yearsArray = [...y];
  const minY = Math.min(...yearsArray);
  const maxY = Math.max(curY + 3, ...yearsArray);
  const arr  = [];
  for (let yr = minY; yr <= maxY; yr++) arr.push(yr);
  arr.sort((a, b) => b - a);
  const prev = sel.value;
  sel.innerHTML = "";
  for (const yr of arr) {
    const o = document.createElement("option");
    o.value = String(yr); o.textContent = String(yr);
    sel.appendChild(o);
  }
  sel.value = arr.includes(Number(prev)) ? prev : String(curY);
}

function ensureYearSelects() {
  const years = new Set();
  for (const l of lessons) {
    if (!l.date || l.status !== 2) continue;
    years.add(parseISODateLocal(l.date).getFullYear());
  }
  const cur = new Date().getFullYear();
  for (let y = cur - 3; y <= cur; y++) years.add(y);
  const arr = [...years].sort((a, b) => b - a);

  const fill = (id) => {
    const el = $(id); if (!el) return;
    const curVal = el.value;
    el.innerHTML = arr.map(y => `<option value="${y}">${y}</option>`).join("");
    if (arr.includes(+curVal)) el.value = curVal;
  };
  fill("repYear"); fill("repCompare"); fill("repYearInvest");

  $("repYear").value = String(cur);
  if (!$("repCompare").value) $("repCompare").value = String(cur - 1);
  if ($("repYearInvest") && !$("repYearInvest").value) $("repYearInvest").value = $("repYear").value;
  updateMoneyButton();
}

/* ======================= Calendário ======================= */
function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ").filter(p => p.length > 0);
  return parts[0][0].toUpperCase();
}

const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const state  = { y: new Date().getFullYear(), m: new Date().getMonth(), selKey: ymdKey(new Date()) };

function renderCalendar() {
  const filterStudent = $("filterStudent")?.value ?? "";
  const filterStatus  = $("filterStatus")?.value  ?? "";

  $("calTitle").textContent = `${months[state.m]} ${state.y}`;

  const ysel = $("selYear");
  if (ysel.childElementCount === 0) {
    const now = new Date().getFullYear();
    for (let y = now - 3; y <= now + 3; y++) {
      const o = document.createElement("option"); o.value = y; o.textContent = y; ysel.appendChild(o);
    }
  }
  $("selMonth").selectedIndex = state.m;
  $("selYear").value = String(state.y);

  const grid  = $("calGrid"); grid.innerHTML = "";
  const first = new Date(state.y, state.m, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  for (let i = 0; i < 42; i++) {
    const d   = new Date(start); d.setDate(start.getDate() + i);
    const key = ymdKey(d);
    const cell= document.createElement("div"); cell.className = "cal-cell";

    if (key === ymdKey(new Date())) cell.classList.add("today");
    if (key === state.selKey)       cell.classList.add("sel");
    cell.innerHTML = `<div class="cal-num">${d.getDate()}</div>`;

    const list = lessons
      .filter(l => ymdKey(parseISODateLocal(l.date)) === key)
      .filter(l => !filterStudent || l.studentId === filterStudent)
      .filter(l => !filterStatus  || String(l.status) === filterStatus)
      .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

    if (list.length) {
      const b = document.createElement("div"); b.className = "cal-dot"; b.textContent = list.length;
      cell.appendChild(b);
      for (const a of list) {
        const st   = students.find(s => s.id === a.studentId);
        const nm   = st?.name || "(Aluno)";
        const hhmm = hhmmLocal(a.date);
        const chip = document.createElement("div");
        chip.className = "chip" + (a.status == 2 ? " done" : a.status == 3 ? " cancel" : "");
        chip.textContent = nm;
        chip.dataset.initials = getInitials(nm);
        chip.title = `${nm} — ${a.style||""}${a.level?" • "+a.level:""} • ${hhmm}`;
        chip.onclick = (ev) => { ev.stopPropagation(); editLesson(a.id); };
        chip.setAttribute("draggable", "true");
        chip.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/lessonId", a.id); });
        cell.appendChild(chip);
      }
    }

    cell.addEventListener("dragover", (e) => e.preventDefault());
    cell.addEventListener("drop", async (e) => {
      e.preventDefault();
      const id     = e.dataTransfer.getData("text/lessonId");
      const origin = lessons.find(x => x.id === id);
      if (!origin) return;
      const time       = hhmmLocal(origin.date);
      const dropDateStr= key + "T" + time;
      const isCopy     = e.shiftKey;
      try {
        if (isCopy) {
          const { id: _, ...rest } = origin;
          await addLesson({ ...rest, date: dropDateStr });
        } else {
          await updateLesson(id, { date: dropDateStr });
        }
        showAlert(isCopy ? "Aula copiada." : "Aula movida.");
      } catch (err) {
        console.error(err); showAlert("Erro ao mover aula", "error");
      }
    });

    cell.onclick = () => { state.selKey = key; renderCalendar(); renderDayDetails(key); };
    grid.appendChild(cell);
  }
}

$("calPrev").onclick   = () => { state.m--; if (state.m < 0)  { state.m = 11; state.y--; } renderCalendar(); };
$("calNext").onclick   = () => { state.m++; if (state.m > 11) { state.m = 0;  state.y++; } renderCalendar(); };
$("selMonth").onchange = () => { state.m = $("selMonth").selectedIndex; renderCalendar(); };
$("selYear").onchange  = () => { state.y = +$("selYear").value; renderCalendar(); };
$("btnCalRefresh").onclick = () => { renderCalendar(); renderUpcoming(); };
$("btnToday").onclick = () => {
  const now = new Date();
  state.y = now.getFullYear(); state.m = now.getMonth(); state.selKey = ymdKey(now);
  renderCalendar(); renderDayDetails(state.selKey); renderFilterEcho();
};
$("btnClearFilters").onclick = () => {
  const fs = $("filterStudent"), ft = $("filterStatus");
  if (fs) fs.value = ""; if (ft) ft.value = "";
  renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); renderFilterEcho();
};
$("filterStudent").onchange = () => { renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); renderFilterEcho(); };
$("filterStatus").onchange  = () => { renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); renderFilterEcho(); };

function renderFilterEcho() {
  const s    = $("filterStudent")?.value || "";
  const t    = $("filterStatus")?.value  || "";
  const span = $("calFiltersEcho"); if (!span) return;
  const sTxt = s ? (students.find(x => x.id === s)?.name || "Aluno") : "";
  const tTxt = t === "" ? "" : ["Agendada","Confirmada","Realizada","Cancelada"][Number(t) || 0];
  const parts= [sTxt, tTxt].filter(Boolean);
  if (!parts.length) { span.style.display = "none"; span.textContent = ""; return; }
  span.textContent = "Filtro: " + parts.join(" • ") + "  (Esc limpa)";
  span.style.display = "inline-flex";
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const fs = $("filterStudent"), ft = $("filterStatus");
    if (fs) fs.value = ""; if (ft) ft.value = "";
    renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); renderFilterEcho();
    showAlert("Filtros limpos (Esc)");
  }
});

function renderDayDetails(key) {
  const box = $("dayDetails");
  if (!key) { box.innerHTML = `<span class="muted">Nenhum dia selecionado.</span>`; return; }
  const s = $("filterStudent")?.value || "";
  const t = $("filterStatus")?.value  || "";
  const list = lessons
    .filter(l => ymdKey(parseISODateLocal(l.date)) === key)
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  if (!list.length) { box.innerHTML = `<span class="muted">Sem aulas neste dia.</span>`; return; }
  box.innerHTML = "";
  for (const a of list) {
    const st   = students.find(s => s.id === a.studentId);
    const nm   = st?.name || "(Aluno)";
    const stat = ["Agendada","Confirmada","Realizada","Cancelada"][a.status || 0];
    const hhmm = hhmmLocal(a.date);
    const row  = document.createElement("div"); row.className = "day-card";
    row.innerHTML = `
      <div>
        <div><span class="who">${nm}</span> — ${a.style||""}${a.level?" • "+a.level:""}</div>
        <div class="muted">${hhmm} • ${a.place||"—"} • ${stat} • ${formatBRL(a.price||0)}</div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end">
        <button class="btn small" data-act="wa">WhatsApp</button>
        <button class="btn small" data-act="rec">Recibo</button>
        <button class="btn small" data-act="edit">Editar</button>
        <button class="btn small" data-act="del">Excluir</button>
      </div>`;
    row.querySelector('[data-act="edit"]').onclick = (ev) => { ev.stopPropagation(); editLesson(a.id); };
    row.querySelector('[data-act="del"]').onclick  = (ev) => { ev.stopPropagation(); requestDeleteLesson(a.id); };
    row.querySelector('[data-act="rec"]').onclick  = (ev) => { ev.stopPropagation(); openReceiptFromLesson(a); };
    row.querySelector('[data-act="wa"]').onclick   = (ev) => {
      ev.stopPropagation();
      const when = parseISODateLocal(a.date);
      const msg  = buildWhatsAppMessage({ studentName: nm, when, style: a.style, level: a.level, place: a.place });
      const phone= normalizePhoneBR(st?.phone || "");
      const url  = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    };
    box.appendChild(row);
  }
}

function renderUpcoming() {
  const days  = +$("upcomingRange").value || 30;
  const s     = $("filterStudent")?.value || "";
  const t     = $("filterStatus")?.value  || "";
  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(end.getDate() + days);

  const items = lessons
    .filter(l => { const d = parseISODateLocal(l.date); return d >= start && d < end; })
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  const box = $("upcomingList");
  if (!items.length) { box.innerHTML = `<div class="muted">Sem aulas neste período.</div>`; return; }
  box.innerHTML = "";
  for (const a of items) {
    const st   = students.find(s => s.id === a.studentId);
    const nm   = st?.name || "(Aluno)";
    const stat = ["Agendada","Confirmada","Realizada","Cancelada"][a.status || 0];
    const d    = parseISODateLocal(a.date);
    const row  = document.createElement("div"); row.className = "day-card";
    row.innerHTML = `
      <div>
        <div><span class="who">${nm}</span> — ${a.style||""}${a.level?" • "+a.level:""}</div>
        <div class="muted">
          ${d.toLocaleString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
          • ${a.place||"—"} • ${stat} • ${formatBRL(a.price||0)}
        </div>
      </div>
      <div>${a.duration||60}'</div>`;
    box.appendChild(row);
  }
}
$("upcomingRange").onchange = () => renderUpcoming();

/* ======================= Alunos ======================= */
function hasActivePackage(s) {
  if (!s) return false;
  const total = Number(s.totalLessons || 0);
  if (total <= 0 || !s.packageStart) return false;
  const start = parseISODateLocal(s.packageStart);
  const end   = s.packageEnd ? parseISODateLocal(s.packageEnd) : null;
  const today = new Date(); today.setHours(0,0,0,0);
  if (today < start) return false;
  if (end && today > end) return false;
  return true;
}
function parsePkgDate(str) {
  if (!str) return null;
  if (str.includes("-")) return parseISODateLocal(str);
  if (str.includes("/")) { const [d,m,y] = str.split("/"); return new Date(Number(y), Number(m)-1, Number(d)); }
  return null;
}
function inPkgRange(a, s) {
  if (!a?.date || !s?.packageStart || !s?.packageEnd) return false;
  const d     = parseISODateLocal(a.date);
  const start = parsePkgDate(s.packageStart);
  const end   = parsePkgDate(s.packageEnd);
  if (!d || !start || !end) return false;
  end.setHours(23,59,59,999);
  return d >= start && d <= end;
}

let editingStudentId = null;
$("btnSaveStudent").onclick = async () => {
  const base = {
    name:          $("studentName").value.trim(),
    phone:         $("studentPhone").value.trim(),
    email:         $("studentEmail").value.trim(),
    active:        $("studentActive").value === "true",
    packageStart:  $("studentPackageStart").value,
    packageEnd:    $("studentPackageEnd").value,
    totalLessons:  +$("studentTotalLessons").value || 0,
    notes:         $("studentNotes").value,
    ownerUid:      user?.uid || "dev",
    updatedAt:     serverTimestamp()
  };
  try {
    if (editingStudentId) {
      await updateDoc(doc(db, "alunos", editingStudentId), base);
    } else {
      await addDoc(colStudents, { ...base, orderIndex: (students?.length || 0) + 1, createdAt: serverTimestamp() });
    }
    showAlert("Salvo com sucesso.");
    clearStudentForm();
  } catch (e) { console.error(e); showAlert("Falha ao salvar aluno.", "error"); }
};
$("btnClearStudent").onclick = clearStudentForm;
function clearStudentForm() {
  ["studentName","studentPhone","studentEmail","studentPackageStart","studentPackageEnd","studentTotalLessons","studentNotes"].forEach(id => $(id).value = "");
  $("studentActive").value = "true";
  editingStudentId = null;
}

function renderStudents() {
  try {
    const _tgl = $("toggleInactive");
    if (_tgl && !_tgl.dataset.bound) {
      _tgl.dataset.bound = "1";
      _tgl.onclick = () => {
        const list  = $("inactiveList");
        const isOpen= list?.style.display !== "none";
        list.style.display = isOpen ? "none" : "block";
        _tgl.textContent   = isOpen ? "Mostrar" : "Ocultar";
      };
    }

    const box  = $("studentsList");
    const ibox = $("inactiveList");
    const iwrap= $("inactiveWrap");
    if (!box) return;
    box.innerHTML = ""; if (ibox) ibox.innerHTML = "";

    const safeStudents = Array.isArray(students) ? students : [];
    const ordered = [...safeStudents].sort(
      (a, b) => (a.orderIndex ?? 1e9) - (b.orderIndex ?? 1e9) || (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0)
    );
    const actives   = ordered.filter(s => s.active !== false);
    const inactives = ordered.filter(s => s.active === false);
    $("inactiveCount").textContent = `(${inactives.length})`;
    $("inactiveWrap").style.display= inactives.length ? "block" : "none";

    function confirmDeleteStudent(id, name) {
      if (!id) return;
      if (!confirm(`Excluir o aluno "${name || "(sem nome)"}"? Esta ação é permanente e NÃO remove aulas já registradas.`)) return;
      handleDeleteStudent(id);
    }
    async function handleDeleteStudent(id) {
      try {
        await deleteStudent(id);
        students = students.filter(s => s.id !== id);
        renderStudents();
        showAlert("Aluno excluído com sucesso.");
      } catch (e) { console.error(e); showAlert("Erro ao excluir aluno.", "error"); }
    }

    const buildItem = (s, inactive = false) => {
      if (!s || !s.id) { console.warn("Aluno inválido:", s); return null; }
      const it = document.createElement("div");
      it.className = "student-item"; it.dataset.id = s.id;
      if (!inactive) it.setAttribute("draggable", "true");

      const pkgOn      = hasActivePackage(s);
      const safeLessons= Array.isArray(lessons) ? lessons : [];
      const total      = pkgOn ? (+s.totalLessons || 0) : 0;
      const done       = pkgOn ? safeLessons.filter(a => a.studentId === s.id && a.status === 2 && inPkgRange(a, s)).length : 0;
      const rest       = pkgOn ? Math.max(0, total - done) : 0;
      const pct        = pkgOn && total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      let cls = "ok";
      if (pkgOn) { if (rest <= 2) cls = "warn"; if (rest <= 0) cls = "danger"; }

      it.innerHTML = `
        <div class="student-head">
          <div>
            <div class="who">${s.name || "Sem nome"}</div>
            <div class="muted">${s.phone||""} ${s.email ? "• "+s.email : ""}</div>
          </div>
          <div class="badge ${pkgOn ? "" : "warn"}">${pkgOn ? "Pacote ativo" : "Sem pacote"}</div>
        </div>
        <div class="pkgbar"><div class="fill ${cls}" style="width:${pct}%"></div></div>
        <div class="muted" style="margin-top:8px">${pkgOn ? `Aulas: ${done}/${total} • Restam: ${rest}` : "Sem pacote ativo"}</div>
        <div style="display:flex; gap:6px; margin-top:12px">
          <button class="btn small" data-act="edit">Editar</button>
          <button class="btn small" data-act="newpkg">Novo Pacote</button>
          ${inactive
            ? `<button class="btn small" data-act="activate">Ativar</button>`
            : `<button class="btn small" data-act="deactivate">Inativar</button>`}
          <button class="btn small" data-act="del">Excluir</button>
        </div>`;

      it.querySelector('[data-act="edit"]')?.addEventListener("click", () => {
        editingStudentId = s.id;
        $("studentName").value          = s.name || "";
        $("studentPhone").value         = s.phone || "";
        $("studentEmail").value         = s.email || "";
        $("studentActive").value        = String(!!s.active);
        $("studentPackageStart").value  = s.packageStart || "";
        $("studentPackageEnd").value    = s.packageEnd || "";
        $("studentTotalLessons").value  = s.totalLessons ?? 0;
        $("studentNotes").value         = s.notes || "";
        showAlert("Modo edição: " + (s.name || ""));
        window.scrollTo({ top: $("alunos").offsetTop - 60, behavior: "smooth" });
      });
      it.querySelector('[data-act="newpkg"]')?.addEventListener("click", () => openPkgModal(s.id));
      it.querySelector('[data-act="deactivate"]')?.addEventListener("click", async () => {
        try { await updateDoc(doc(db, "alunos", s.id), { active: false, updatedAt: serverTimestamp() }); showAlert("Aluno inativado."); }
        catch (e) { console.error(e); showAlert("Erro ao inativar.", "error"); }
      });
      it.querySelector('[data-act="activate"]')?.addEventListener("click", async () => {
        try { await updateDoc(doc(db, "alunos", s.id), { active: true, updatedAt: serverTimestamp() }); showAlert("Aluno ativado."); }
        catch (e) { console.error(e); showAlert("Erro ao ativar.", "error"); }
      });
      it.querySelector('[data-act="del"]')?.addEventListener("click", (ev) => {
        ev.stopPropagation(); confirmDeleteStudent(s.id, s.name);
      });
      return it;
    };

    for (const s of actives)   { try { const el = buildItem(s, false); if (el) box.appendChild(el);  } catch (err) { console.error(err); } }
    if (iwrap) {
      if (inactives.length) {
        iwrap.style.display = "block";
        $("inactiveCount").textContent = `(${inactives.length})`;
        for (const s of inactives) { try { const el = buildItem(s, true); if (el) ibox.appendChild(el); } catch (err) { console.error(err); } }
      } else { iwrap.style.display = "none"; }
    }
    enableStudentDrag(box);
  } catch (err) { console.error("ERRO GERAL EM renderStudents:", err); showAlert("Erro ao renderizar alunos.", "error"); }
}

function enableStudentDrag(container) {
  let draggingEl = null;
  container.querySelectorAll(".student-item[draggable='true']").forEach(el => {
    el.addEventListener("dragstart", () => { draggingEl = el; el.classList.add("dragging"); });
    el.addEventListener("dragend",   () => { draggingEl = null; el.classList.remove("dragging"); });
  });
  container.addEventListener("dragover", (e) => {
    e.preventDefault(); if (!draggingEl) return;
    const after = getDragAfterElement(container, e.clientY);
    after == null ? container.appendChild(draggingEl) : container.insertBefore(draggingEl, after);
  });
  container.ondrop = async () => {
    const ids = [...container.querySelectorAll(".student-item[draggable='true']")].map(n => n.dataset.id);
    for (let i = 0; i < ids.length; i++) {
      try { await updateDoc(doc(db, "alunos", ids[i]), { orderIndex: i+1, updatedAt: serverTimestamp() }); }
      catch (e) { console.error(e); }
    }
    showAlert("Salvo com sucesso.");
  };
}
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".student-item[draggable='true']:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box    = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

let pkgTargetId = null;
function openPkgModal(studentId) {
  pkgTargetId = studentId;
  const s = students.find(x => x.id === studentId);
  const today = new Date();
  const defStart = s?.packageEnd ? s.packageEnd : `${pad2(today.getDate())}/${pad2(today.getMonth()+1)}/${today.getFullYear()}`;
  const d2 = new Date(today); d2.setDate(d2.getDate() + 30);
  $("pkgStart").value  = defStart;
  $("pkgEnd").value    = `${pad2(d2.getDate())}/${pad2(d2.getMonth()+1)}/${d2.getFullYear()}`;
  $("pkgTotal").value  = s?.totalLessons || 4;
  $("pkgNote").value   = "";
  $("pkgModal").classList.add("show");
}
$("btnPkgClose").onclick = () => $("pkgModal").classList.remove("show");
$("btnPkgSave").onclick  = async () => {
  if (!pkgTargetId) return;
  try {
    await updateDoc(doc(db, "alunos", pkgTargetId), {
      packageStart:    $("pkgStart").value,
      packageEnd:      $("pkgEnd").value,
      totalLessons:    +$("pkgTotal").value || 0,
      packageResetAt:  null,
      notes: (students.find(x => x.id === pkgTargetId)?.notes || "") + ($("pkgNote").value ? ` | ${$("pkgNote").value}` : ""),
      updatedAt: serverTimestamp()
    });
    $("pkgModal").classList.remove("show");
    showAlert("Salvo com sucesso.");
  } catch (e) { console.error(e); alert("Falha ao salvar pacote."); }
};

/* ======================= Selects compartilhados ======================= */
function fillStudentSelects() {
  const a = $("lessonStudent"), b = $("evolutionStudent"), c = $("recStudent");
  const opts = `<option value="">Selecione…</option>` + students.map(s => `<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");
  if (a) a.innerHTML = opts; if (b) b.innerHTML = opts; if (c) c.innerHTML = opts;
}
function renderStudentFilter() {
  const sel = $("filterStudent"); if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Todos os alunos</option>` + students.map(s => `<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

/* ======================= Evolução ======================= */
$("btnSaveEvolution").onclick = async () => {
  const payload = {
    date:          $("evolutionDate").value,
    studentId:     $("evolutionStudent").value,
    style:         $("evolutionStyle").value,
    level:         $("evolutionLevel").value,
    duration:      +($("evolutionDuration").value || 60),
    content:       $("evolutionContent").value,
    progress:      $("evolutionProgress").value,
    difficulties:  $("evolutionDifficulties").value,
    nextSteps:     $("evolutionNextSteps").value,
    rating:        null,
    mood:          null,
    notes:         $("evolutionNotes").value,
    ownerUid:      user?.uid || "dev",
    updatedAt:     serverTimestamp()
  };
  try {
    if (editingEvolutionId) {
      await updateDoc(doc(db, "evolucoes", editingEvolutionId), payload);
      showAlert("Anotação atualizada com sucesso.");
      editingEvolutionId = null;
    } else {
      await addDoc(colEvol, { ...payload, createdAt: serverTimestamp() });
      showAlert("Salvo com sucesso.");
    }
    clearEvol();
    evoModal?.classList.remove("show");
  } catch (e) { console.error(e); showAlert("Erro ao salvar.", "error"); }
};

function clearEvol() {
  const form = document.getElementById("evoForm");
  if (form) form.reset();
  editingEvolutionId = null;
}
document.getElementById("btnClearEvolution")?.addEventListener("click", clearEvol);

function renderEvolutions(filter = {}) {
  const box = $("evolutionsList"); box.innerHTML = "";
  let list = [...evolutions];
  if (filter.studentId)              list = list.filter(e => e.studentId === filter.studentId);
  if (typeof filter.y === "number")  list = list.filter(e => parseISODateLocal(e.date).getFullYear() === filter.y);
  if (typeof filter.monthIndex === "number") list = list.filter(e => parseISODateLocal(e.date).getMonth() === filter.monthIndex);

  for (const e of list) {
    const st = students.find(s => s.id === e.studentId);
    const nm = st?.name || "(Aluno)";
    const it = document.createElement("div"); it.className = "evo-card";
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
      </div>`;

    const header = it.querySelector(".evo-card-header");
    const body   = it.querySelector(".evo-card-body");
    const arrow  = it.querySelector(".evo-toggle");
    body.style.display = "none";
    header.addEventListener("click", () => {
      const isOpen = body.style.display === "block";
      body.style.display = isOpen ? "none" : "block";
      arrow.textContent  = isOpen ? "▼" : "▲";
    });

    it.querySelector('[data-act="edit"]').onclick = () => {
      editingEvolutionId = e.id;
      $("evolutionDate").value        = (e.date || "").slice(0, 10);
      $("evolutionStudent").value     = e.studentId || "";
      $("evolutionStyle").value       = e.style || "";
      $("evolutionLevel").value       = e.level || "Iniciante";
      $("evolutionDuration").value    = e.duration || 60;
      $("evolutionContent").value     = e.content || "";
      $("evolutionProgress").value    = e.progress || "";
      $("evolutionDifficulties").value= e.difficulties || "";
      $("evolutionNextSteps").value   = e.nextSteps || "";
      $("evolutionNotes").value       = e.notes || "";
      evoModal?.classList.add("show");
    };
    it.querySelector('[data-act="share"]').onclick = () => exportEvolutionPDF(e, nm);
    it.querySelector('[data-act="del"]').onclick   = async () => {
      if (confirm("Excluir esta anotação?")) {
        try { await deleteDoc(doc(db, "evolucoes", e.id)); showAlert("Anotação excluída."); }
        catch (err) { console.error(err); showAlert("Erro ao excluir anotação.", "error"); }
      }
    };
    box.appendChild(it);
  }
}

let evoExpanded = { students: new Set(), years: new Set() };

function buildEvoTree() {
  const root = $("evoTree"); if (!root) return;
  const monthsLbl = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const map = new Map();
  for (const e of evolutions) {
    const sid = e.studentId || "_";
    const d = parseISODateLocal(e.date); const y = d.getFullYear(); const m = d.getMonth();
    if (!map.has(sid)) map.set(sid, new Map());
    const ymap = map.get(sid);
    if (!ymap.has(y)) ymap.set(y, new Map());
    const mmap = ymap.get(y);
    mmap.set(m, (mmap.get(m) || 0) + 1);
  }

  let html = "";
  for (const s of students) {
    const ymap = map.get(s.id); if (!ymap) continue;
    const isStudentOpen = evoExpanded.students.has(s.id);
    html += `<div class="tree-item tree-level-1" data-type="student" data-sid="${s.id}">${isStudentOpen?"📂":"📁"} ${s.name}</div>`;
    if (!isStudentOpen) continue;
    const years = [...ymap.keys()].sort((a, b) => b - a);
    for (const yr of years) {
      const yearKey    = s.id + "-" + yr;
      const isYearOpen = evoExpanded.years.has(yearKey);
      html += `<div class="tree-item tree-level-2" data-type="year" data-sid="${s.id}" data-year="${yr}">${isYearOpen?"📂":"📁"} ${yr}</div>`;
      if (!isYearOpen) continue;
      const mmap = ymap.get(yr);
      [...mmap.keys()].sort((a, b) => a - b).forEach(m => {
        html += `<div class="tree-item tree-level-3" data-type="month" data-sid="${s.id}" data-y="${yr}" data-month="${m}">🗂️ ${monthsLbl[m]} <span class="muted">(${mmap.get(m)||0})</span></div>`;
      });
    }
  }
  root.innerHTML = html;

  root.querySelectorAll(".tree-item").forEach(item => {
    item.addEventListener("click", () => {
      const type = item.getAttribute("data-type");
      const sid  = item.getAttribute("data-sid");
      const y    = type === "month" ? item.getAttribute("data-y") : item.getAttribute("data-year");
      const m    = item.getAttribute("data-month");

      if (type === "student") {
        if (evoExpanded.students.has(sid)) {
          evoExpanded.students.delete(sid);
          [...evoExpanded.years].forEach(key => { if (key.startsWith(sid + "-")) evoExpanded.years.delete(key); });
        } else { evoExpanded.students.add(sid); }
        buildEvoTree(); return;
      }
      if (type === "year") {
        const key = sid + "-" + y;
        evoExpanded.years.has(key) ? evoExpanded.years.delete(key) : evoExpanded.years.add(key);
        buildEvoTree(); return;
      }
      if (type === "month") {
        renderEvolutions({ studentId: sid, y: +y, monthIndex: +m });
        root.querySelectorAll(".tree-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
      }
    });
  });
}

function exportEvolutionPDF(e, studentName) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 56, lh = 18; let y = 56;
  doc.setFont("helvetica","bold"); doc.setFontSize(14);
  doc.text("Evolução Pedagógica — Bailado Carioca", left, y); y += lh + 4;
  doc.setFont("helvetica","normal"); doc.setFontSize(12);
  doc.text(`Aluno: ${studentName||"(Aluno)"} • Data: ${(e.date||"").slice(0,10)} • Duração: ${e.duration||60}'`, left, y); y += lh;
  const multi = (label, text) => {
    doc.setFont("helvetica","bold"); doc.text(label, left, y); y += lh;
    doc.setFont("helvetica","normal");
    const split = doc.splitTextToSize(text || "—", 480);
    doc.text(split, left, y); y += split.length * lh + 6;
  };
  multi("Conteúdo", e.content); multi("Progresso", e.progress);
  multi("Dificuldades", e.difficulties); multi("Próximos passos", e.nextSteps);
  if (e.notes) multi("Observações", e.notes);
  doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Gerado automaticamente pelo sistema.", left, 800);
  doc.save(`Evolucao-${studentName||"Aluno"}-${(e.date||"").slice(0,10)}.pdf`);
}

/* ======================= Relatório por aluno ======================= */
function brl(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0)); }
function getRepYear() { const sel = $("repYear"); return sel && sel.value ? Number(sel.value) : new Date().getFullYear(); }

function fillRepStudentSelect() {
  const sel = $("repStuSelect"); if (!sel || !Array.isArray(students)) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Selecione um aluno...</option>` +
    students.map(s => `<option value="${String(s.id??"")}"> ${s.name?.trim()||"(sem nome)"}</option>`).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function renderRepStudent() {
  const sel     = $("repStuSelect");
  const box     = $("repStuBox");
  const yearEcho= $("repYearEcho");
  if (!sel || !box) return;
  const year = getRepYear();
  if (yearEcho) yearEcho.textContent = year;
  const id = String(sel.value || "");
  if (!id) { box.innerHTML = `<div class="muted">Selecione um aluno para ver o detalhamento.</div>`; return; }
  const stu    = (students || []).find(s => String(s.id) === id);
  const report = calculateYearlyStudentReport(lessons || [], id, year, parseISODateLocal, parseBRLToNumber);
  box.innerHTML = `
    <h3>${stu?.name?.trim()||"(sem nome)"}</h3>
    <p>Total de aulas realizadas: <b>${report.lessons.length}</b></p>
    <p>Investimento no ano: <b>${brl(report.total)}</b></p>`;
}
if ($("repStuSelect")) $("repStuSelect").onchange = renderRepStudent;
if ($("repYear"))      $("repYear").onchange      = renderRepStudent;

function initRepStudentArea() {
  fillRepStudentSelect();
  renderRepStudent();
}

/* ======================= Dashboard anual ======================= */
$("repYear").onchange    = renderDashboard;
$("repCompare").onchange = renderDashboard;
if ($("repYearInvest")) $("repYearInvest").onchange = renderDashboard;

let rankingExpanded = false;
let _barsY = Array(12).fill(0);
let _barsC = Array(12).fill(0);
let _chartCtx = null;

function renderDashboard() {
  ensureYearSelects();
  const y   = +$("repYear").value;
  const cy  = +$("repCompare").value;
  const invY= +($("repYearInvest")?.value || y);

  if ($("listYear"))  $("listYear").textContent  = String(invY);
  if ($("cmpYear"))   $("cmpYear").textContent   = String(cy);
  if ($("barsYear"))  $("barsYear").textContent  = String(y);

  _barsY = Array(12).fill(0); _barsC = Array(12).fill(0);

  for (const l of lessons || []) {
    if (!l || !l.date || String(l.status) !== "2") continue;
    const d = parseISODateLocal(l.date);
    if (!(d instanceof Date) || isNaN(d)) continue;
    const m = d.getMonth();
    const v = parseBRLToNumber(l.price || 0);
    if (d.getFullYear() === y)  _barsY[m] += v;
    if (d.getFullYear() === cy) _barsC[m] += v;
  }
  for (const c of cashEntries || []) {
    if (!c || !c.data) continue;
    const d = c.data?.toDate ? c.data.toDate() : new Date(c.data);
    if (!(d instanceof Date) || isNaN(d)) continue;
    const m = d.getMonth(); const v = Number(c.valor || 0);
    if (d.getFullYear() === y)  _barsY[m] += v;
    if (d.getFullYear() === cy) _barsC[m] += v;
  }

  const comparison = calculateYearComparison(_barsY, _barsC);
  const yearTotal  = comparison.yearTotal || 0;
  const delta      = comparison.delta || 0;
  if ($("kpiYearRev"))     $("kpiYearRev").textContent     = formatBRL(yearTotal);
  if ($("kpiYearDelta"))   $("kpiYearDelta").textContent   = (delta >= 0 ? "+" : "") + delta.toFixed(1) + "%";
  if ($("yearTotalFooter"))$("yearTotalFooter").textContent = formatBRL(yearTotal);

  const concentration = calculateRevenueConcentration(lessons || [], parseISODateLocal, y);
  if ($("kpiTop1Share")) $("kpiTop1Share").textContent = (concentration.top1Percent || 0).toFixed(1) + "%";
  if ($("kpiTop3Share")) $("kpiTop3Share").textContent = (concentration.top3Percent || 0).toFixed(1) + "%";

  drawBars(_barsY, _barsC);

  const fullList = calculateYearlyStudentRanking(lessons || [], students || [], invY, parseISODateLocal, v => (+v || 0));
  const list     = rankingExpanded ? fullList : fullList.slice(0, 10);
  const box      = $("byStudentList"); if (!box) return;
  box.innerHTML  = list.length === 0 ? `<div class="muted">Sem aulas realizadas no ano.</div>` : "";
  for (const r of list) {
    const row = document.createElement("div"); row.className = "listrow";
    row.innerHTML = `<div>${r.name}</div><div><span class="pill-mini">${r.aulas} aulas</span> &nbsp; <b>${formatBRL(r.total)}</b></div>`;
    box.appendChild(row);
  }

  const toggleContainer = $("rankingToggleContainer");
  if (toggleContainer) {
    toggleContainer.innerHTML = "";
    if (fullList.length > 10) {
      const btn = document.createElement("div"); btn.className = "ranking-toggle";
      btn.textContent = rankingExpanded ? "Ver menos ▴" : "Ver ranking completo ▾";
      btn.onclick = () => { rankingExpanded = !rankingExpanded; renderDashboard(); };
      toggleContainer.appendChild(btn);
    }
  }
}

function drawBars(arrY, arrC) {
  const canvas = $("chartYear"); if (!canvas) return;
  const cssW   = canvas.clientWidth || 600;
  const cssH   = Number(canvas.getAttribute("height") || 140);
  canvas.width = cssW;
  if (!_chartCtx) _chartCtx = canvas.getContext("2d");
  const ctx = _chartCtx; const W = canvas.width; const H = cssH;
  ctx.clearRect(0, 0, W, H);
  const pad = 24, innerW = W - pad*2, innerH = H - pad*2;
  const lbl = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const max = Math.max(1, ...arrY, ...arrC);
  const gap = innerW / 24, barW = gap * 0.8;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--line"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();
  ctx.fillStyle = "#5ea0ff";
  for (let i = 0; i < 12; i++) { const x = pad + i*gap*2 + gap*0.3; const h = Math.round((arrY[i]/max)*innerH); ctx.fillRect(x, H-pad-h, barW, h); }
  ctx.fillStyle = "#7a6cff";
  for (let i = 0; i < 12; i++) { const x = pad + i*gap*2 + gap*0.3 + barW + 4; const h = Math.round((arrC[i]/max)*innerH); ctx.fillRect(x, H-pad-h, barW, h); }
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted"); ctx.font = "12px sans-serif"; ctx.textAlign = "center";
  for (let i = 0; i < 12; i++) { const x = pad + i*gap*2 + gap*0.3 + barW; ctx.fillText(lbl[i], x, H-pad+14); }
}
window.addEventListener("resize", () => drawBars(_barsY, _barsC));

function updateMoneyButton() {
  const btn = $("btnHideMoney"); if (!btn) return;
  const hidden = btn.dataset.hide === "1";
  btn.textContent = hidden ? "🙈 Mostrar valores" : "👁 Ocultar valores";
  ["kpiMonthRev","kpiYearRev","avgPerStudent","yearTotalFooter"].forEach(id => {
    const el = $(id); if (el) el.style.filter = hidden ? "blur(4px)" : "none";
  });
}
$("btnHideMoney").onclick = () => {
  const btn = $("btnHideMoney");
  btn.dataset.hide = btn.dataset.hide === "1" ? "0" : "1";
  updateMoneyButton();
};

/* ======================= Caixa ======================= */
function bindCashButton() {
  const btn = document.getElementById("btnSaveCash");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", async () => {
    const data      = document.getElementById("cashDate")?.value;
    const valorRaw  = document.getElementById("cashAmount")?.value;
    const categoria = document.getElementById("cashCategory")?.value;
    const descricao = document.getElementById("cashDescription")?.value?.trim();
    if (!data || !valorRaw || !descricao) { showAlert("Preencha Data, Valor e Descrição.", "error"); return; }
    try {
      await addDoc(colCash, {
        data:      new Date(data),
        valor:     parseBRLToNumber(valorRaw),
        categoria: categoria || null,
        descricao,
        criadoEm:  serverTimestamp(),
        ownerUid:  user?.uid || "dev"
      });
      showAlert("Entrada registrada no Caixa.");
      document.getElementById("cashDate").value        = "";
      document.getElementById("cashAmount").value      = "";
      document.getElementById("cashDescription").value = "";
    } catch (err) { console.error("Erro ao salvar Caixa:", err); showAlert("Erro ao salvar entrada.", "error"); }
  });
}
bindCashButton();

function renderCashEntries() {
  const container = document.getElementById("cashList"); if (!container) return;
  container.innerHTML = "";
  if (!cashEntries.length) { container.innerHTML = `<div class="muted">Nenhuma entrada registrada.</div>`; return; }
  for (const item of cashEntries) {
    const data = item.data?.toDate ? item.data.toDate() : new Date(item.data);
    const card = document.createElement("div"); card.className = "cardx"; card.style.marginBottom = "12px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center">
        <div>
          <div><b>${item.descricao}</b></div>
          <div class="muted">${data.toLocaleDateString("pt-BR")} • ${item.categoria||"—"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600">${formatBRL(item.valor)}</div>
          <button class="btn small danger" data-id="${item.id}">Excluir</button>
        </div>
      </div>`;
    container.appendChild(card);
  }
  container.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Excluir esta entrada?")) return;
      await deleteDoc(doc(db, "caixa", id));
    });
  });
}

/* ======================= Backup ======================= */
$("btnExportJSON").onclick = async () => {
  try {
    const data = {
      meta: { app: "Bailado Carioca – Gestão de Aulas", version: "1.0.0", exportedAt: new Date().toISOString(), studentsCount: students?.length||0, lessonsCount: lessons?.length||0, evolutionsCount: evolutions?.length||0 },
      students, lessons, evolutions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(a.href);
    localStorage.setItem("lastBackupAt", new Date().toISOString());
    updateBackupIndicator();
  } catch (err) { console.error("Erro ao exportar:", err); alert("Erro ao exportar backup."); }
};

$("btnImportJSON").onclick = () => {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    if (!confirm("Isso irá importar dados e atualizar registros existentes.\n\nDeseja continuar?")) return;
    let data;
    try { const tx = await f.text(); data = JSON.parse(tx || "{}"); }
    catch (err) { alert("Arquivo JSON inválido."); return; }
    try {
      if (Array.isArray(data.students)) {
        for (const s of data.students) {
          if (!s?.id) continue;
          const { id, createdAt, updatedAt, ...rest } = s;
          await setDoc(doc(colStudents, id), { ...rest, createdAt: createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }
      }
      if (Array.isArray(data.lessons)) {
        for (const l of data.lessons) {
          if (!l?.id) continue;
          const { id, createdAt, updatedAt, ...rest } = l;
          await setDoc(doc(colLessons, id), { ...rest, createdAt: createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }
      }
      if (Array.isArray(data.evolutions)) {
        for (const e of data.evolutions) {
          if (!e?.id) continue;
          const { id, createdAt, updatedAt, ...rest } = e;
          await setDoc(doc(colEvol, id), { ...rest, createdAt: createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }
      }
      alert("Importação concluída com sucesso.");
    } catch (err) { console.error("Erro durante importação:", err); alert("Erro ao importar dados. Verifique o console."); }
  };
  inp.click();
};

function updateBackupIndicator() {
  const el  = document.getElementById("lastBackupInfo"); if (!el) return;
  const raw = localStorage.getItem("lastBackupAt");
  if (!raw) { el.textContent = "Nenhum backup realizado ainda."; return; }
  const d = new Date(raw);
  el.textContent = `Último backup: ${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR")}`;
}
document.addEventListener("DOMContentLoaded", () => updateBackupIndicator());

/* ======================= Aula CRUD ======================= */
$("btnNewLesson").onclick  = () => openLessonModal();
$("btnCloseLesson").onclick= () => { $("lessonModal").classList.remove("show"); document.body.classList.remove("modal-open"); };
$("btnSaveLesson").onclick = saveLesson;
$("btnDelLesson").onclick  = deleteLessonConfirmed;

let editingLessonId = null;

function openLessonModal(data) {
  fillStudentSelects();
  editingLessonId = data?.id || null;
  const recBox = document.getElementById("recurrenceBox");
  if (recBox) recBox.style.display = editingLessonId ? "none" : "grid";
  $("lessonTitle").textContent  = editingLessonId ? "Editar aula" : "Nova aula";
  const nowLocal = toLocalDateTimeString(new Date());
  $("lessonDate").value     = data?.date?.slice(0, 16) ?? nowLocal;
  $("lessonStudent").value  = data?.studentId || "";
  $("lessonStyle").value    = data?.style || "";
  $("lessonLevel").value    = data?.level || "Iniciante";
  $("lessonType").value     = data?.type  || "Particular";
  $("lessonModel").value    = data?.model || "Padrão";
  $("lessonDuration").value = data?.duration || 60;
  $("lessonPrice").value    = Number.isFinite(+data?.price) ? formatBRL(data.price) : formatBRL(0);
  $("lessonPlace").value    = data?.place || "";
  $("lessonStatus").value   = String(data?.status ?? 0);
  $("lessonNotes").value    = data?.notes || "";
  $("btnDelLesson").style.display = editingLessonId ? "inline-flex" : "none";
  $("recEnabled").checked = false; $("recEvery").value = "7"; $("recCount").value = 0;
  document.body.classList.add("modal-open");
  $("lessonModal").classList.add("show");
}
function editLesson(id) { const a = lessons.find(x => x.id === id); if (a) openLessonModal(a); }

async function saveLesson() {
  const dateLocal = $("lessonDate").value;
  const recOn     = $("recEnabled")?.checked;
  const recDays   = Number($("recEvery")?.value || 7);
  const recQty    = Number($("recCount")?.value || 0);
  const recurrenceGroupId = recOn && recQty > 0 ? crypto.randomUUID() : undefined;

  const payload = {
    date:      dateLocal,
    studentId: $("lessonStudent").value,
    style:     $("lessonStyle").value,
    level:     $("lessonLevel").value,
    type:      $("lessonType").value,
    model:     $("lessonModel").value,
    duration:  +$("lessonDuration").value || 60,
    price:     parseBRLToNumber($("lessonPrice").value),
    place:     $("lessonPlace").value,
    status:    +$("lessonStatus").value || 0,
    notes:     $("lessonNotes").value,
    ownerUid:  user?.uid || "dev",
    updatedAt: serverTimestamp()
  };

  try {
    if (editingLessonId) {
      await updateDoc(doc(db, "aulas", editingLessonId), payload);
    } else {
      await addDoc(colLessons, { ...payload, ...(recurrenceGroupId && { recurrenceGroupId }), createdAt: serverTimestamp() });
      if (recurrenceGroupId) {
        const base = new Date(dateLocal);
        for (let i = 1; i <= recQty; i++) {
          const d = new Date(base); d.setDate(d.getDate() + i * recDays);
          await addDoc(colLessons, { ...payload, date: toLocalDateTimeString(d), status: 0, recurrenceGroupId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }
    }
    $("lessonModal").classList.remove("show"); document.body.classList.remove("modal-open");
    showAlert("Salvo com sucesso.");
  } catch (e) { console.error(e); showAlert("Erro ao salvar aula", "error"); }
}

function requestDeleteLesson(id) { const a = lessons.find(x => x.id === id); if (a) openLessonModal(a); }

async function deleteLessonConfirmed() {
  if (!editingLessonId) return;
  if (!confirm("Excluir esta aula?")) return;
  try {
    await deleteLesson(editingLessonId);
    $("lessonModal").classList.remove("show"); document.body.classList.remove("modal-open");
    editingLessonId = null; showAlert("Aula excluída.");
  } catch (e) { console.error("ERRO REAL:", e); showAlert("Erro ao excluir aula", "error"); }
}

/* ======================= Recibo ======================= */
const recModal = $("receiptModal");
$("btnReceiptClose").onclick = () => recModal.classList.remove("show");
const fmt = (n) => (Number(n || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function toggleReceiptBoxes() {
  const t = $("recType").value;
  $("recBoxAvulsa").style.display = t === "avulsa" ? "block" : "none";
  $("recBoxPacote").style.display = t === "pacote" ? "block" : "none";
  if (t === "avulsa") $("recObsAvulsa").value = "Aula avulsa";
  else $("recObsPacote").value = "Pagamento de pacote";
}
$("recType").onchange = () => { toggleReceiptBoxes(); tryFillPackageAuto(); };

function fillReceiptStudents() {
  const c = $("recStudent"); if (!c) return;
  c.innerHTML = `<option value="">Selecione…</option>` + students.map(s => `<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");
}
function setReceiptStudent(id) { const el = $("recStudent"); if (el) el.value = id || ""; }

function openReceiptFromLesson(a) {
  fillReceiptStudents();
  $("recType").value = "avulsa"; toggleReceiptBoxes();
  $("recEmitDate").value   = toInputDate(new Date());
  $("recTeacher").value    = "Edson Silva";
  setReceiptStudent(a.studentId || "");
  $("recAvulsaDate").value = toInputDate(parseISODateLocal(a.date));
  $("recAvulsaValue").value= formatBRL(a.price || 0);
  $("recPayMethod").value  = "PIX"; $("recCNPJ").value = "";
  $("recObsAvulsa").value  = "Aula avulsa";
  recModal.classList.add("show");
}
function openReceiptFromStudent(s) {
  fillReceiptStudents();
  $("recType").value = "pacote"; toggleReceiptBoxes();
  $("recEmitDate").value = toInputDate(new Date());
  $("recTeacher").value  = "Edson Silva";
  setReceiptStudent(s.id || "");
  $("recPkgStart").value = s.packageStart || "";
  $("recPkgEnd").value   = s.packageEnd   || "";
  $("recPayMethod").value= "PIX"; $("recCNPJ").value = "";
  $("recObsPacote").value= "Pagamento de pacote";
  tryFillPackageAuto();
  recModal.classList.add("show");
}

function getLessonsInRange(studentId, isoStart, isoEnd) {
  if (!studentId || !isoStart || !isoEnd) return [];
  const S = new Date(isoStart + "T00:00:00");
  const E = new Date(isoEnd   + "T23:59:59");
  return lessons
    .filter(l => l.studentId === studentId && l.status !== 3)
    .filter(l => { const d = parseISODateLocal(l.date); return d >= S && d <= E; })
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));
}

function fillPackageAuto() {
  const sId = $("recStudent").value;
  const i   = $("recPkgStart").value;
  const f   = $("recPkgEnd").value;
  const qtyEl = $("recPkgQty"), totalEl = $("recPkgTotal"), datesEl = $("recPkgDates");
  if (!sId || !i || !f) { qtyEl.value = 0; totalEl.value = 0; datesEl.value = "—"; return { qty:0, total:0, dates:[] }; }
  const arr   = getLessonsInRange(sId, i, f);
  const qty   = arr.length;
  const total = arr.reduce((sum, x) => sum + (+x.price || 0), 0);
  const dates = arr.map(x => {
    const d = parseISODateLocal(x.date);
    return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} (${["Agendada","Confirmada","Realizada","Cancelada"][x.status||0]})`;
  });
  qtyEl.value = qty; totalEl.value = Number(total).toFixed(2); datesEl.value = dates.length ? dates.join("\n") : "—";
  return { qty, total, dates };
}
const tryFillPackageAuto = () => { if ($("recType").value === "pacote") fillPackageAuto(); };
["recStudent","recPkgStart","recPkgEnd"].forEach(id => { const el = $(id); if (el) el.addEventListener("change", tryFillPackageAuto); });

$("btnReceiptPDF").onclick = generateReceiptPDF;
function generateReceiptPDF() {
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ unit: "pt", format: "a4" });
  const L = 56; let y = 64, lh = 18;
  const type  = $("recType").value;
  const emit  = $("recEmitDate").value;
  const prof  = $("recTeacher").value || "Professor";
  const cnpj  = $("recCNPJ").value || "";
  const stuId = $("recStudent").value;
  const stu   = students.find(s => s.id === stuId);
  const aluno = stu?.name || "Aluno";
  const pay   = $("recPayMethod").value || "";
  const obs   = type === "avulsa" ? ($("recObsAvulsa")?.value||"") : ($("recObsPacote")?.value||"");

  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("RECIBO DE AULAS — Bailado Carioca", L, y); y += lh + 8;
  doc.setFont("helvetica","normal"); doc.setFontSize(12);
  doc.text(`Emitido em: ${emit||"-"}`, L, y); y += lh;
  doc.setFont("helvetica","bold"); doc.text("EMITENTE", L, y); y += lh;
  doc.setFont("helvetica","normal"); doc.text(`Professor: ${prof}`, L, y); y += lh;
  if (cnpj) { doc.text(`CNPJ: ${cnpj}`, L, y); y += lh; }
  y += 6;
  doc.setFont("helvetica","bold"); doc.text("RECEBI DE", L, y); y += lh;
  doc.setFont("helvetica","normal"); doc.text(`Aluno: ${aluno}`, L, y); y += lh + 6;

  if (type === "avulsa") {
    const d = $("recAvulsaDate").value;
    const v = parseBRLToNumber($("recAvulsaValue").value);
    doc.setFont("helvetica","bold"); doc.text("AULA AVULSA", L, y); y += lh;
    doc.setFont("helvetica","normal");
    doc.text(`Data da aula: ${d||"-"}`, L, y); y += lh;
    doc.text(`Valor pago: ${fmt(v)}`, L, y); y += lh;
    doc.setFont("helvetica","bold"); doc.text("PAGAMENTO", L, y); y += lh;
    doc.setFont("helvetica","normal"); doc.text(`Forma: ${pay||"-"}`, L, y); y += lh;
    if (obs) { const lines = doc.splitTextToSize(`Observações: ${obs}`, 480); doc.text(lines, L, y); y += lines.length * lh; }
  } else {
    const i = $("recPkgStart").value, f = $("recPkgEnd").value;
    const { qty, total, dates } = fillPackageAuto();
    doc.setFont("helvetica","bold"); doc.text("PACOTE", L, y); y += lh;
    doc.setFont("helvetica","normal");
    doc.text(`Período: ${i||"-"} a ${f||"-"}`, L, y); y += lh;
    doc.text(`Aulas no período: ${qty}`, L, y); y += lh + 6;
    if (dates && dates.length) {
      doc.setFont("helvetica","bold"); doc.text("Datas do período", L, y); y += lh;
      doc.setFont("helvetica","normal");
      const cols = 3, colW = 160;
      for (let idx = 0; idx < dates.length; idx++) {
        doc.text("• " + dates[idx], L + (idx % cols) * colW, y + Math.floor(idx / cols) * lh);
      }
      y += Math.ceil(dates.length / cols) * lh + 6;
    }
    doc.setFont("helvetica","bold"); doc.text("RESUMO FINANCEIRO", L, y); y += lh;
    doc.setFont("helvetica","normal"); doc.text(`TOTAL PAGO: ${fmt(total)}`, L, y); y += lh + 6;
    doc.setFont("helvetica","bold"); doc.text("PAGAMENTO", L, y); y += lh;
    doc.setFont("helvetica","normal"); doc.text(`Forma: ${pay||"-"}`, L, y); y += lh;
    if (obs) { const lines = doc.splitTextToSize(`Observações: ${obs}`, 480); doc.text(lines, L, y); y += lines.length * lh; }
  }
  doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Documento gerado automaticamente pelo sistema.", L, 800);
  doc.save(type === "avulsa" ? `Recibo-Avulsa-${aluno}.pdf` : `Recibo-Pacote-${aluno}.pdf`);
}

/* ======================= KPIs Evolução ======================= */
function renderEvoKPIs() {
  const today = new Date(); const y = today.getFullYear(); const m = today.getMonth(); const d = today.getDate();
  const dayE   = evolutions.filter(e => { const t = parseISODateLocal(e.date); return t.getDate()===d && t.getMonth()===m && t.getFullYear()===y; });
  const monthE = evolutions.filter(e => { const t = parseISODateLocal(e.date); return t.getMonth()===m && t.getFullYear()===y; });
  const monthMin = monthE.reduce((s, e) => s + (+e.duration || 0), 0);
  const stuSet   = new Set(monthE.map(x => x.studentId));
  $("evoDay").textContent       = dayE.length;
  $("evoMonth").textContent     = monthE.length;
  $("evoMonthMin").textContent  = (monthMin || 0) + "'";
  $("evoMonthStu").textContent  = stuSet.size;
}

/* ======================= Init ======================= */
(function init() {
  try {
    renderCalendar();
    renderEvoKPIs();
    ensureYearSelects();
    renderDayDetails(ymdKey(new Date()));
    updateMoneyButton();
    $("recEmitDate").value = toInputDate(new Date());
    toggleReceiptBoxes();
  } catch (e) { console.error("Init error:", e); }
})();