import { app, auth, db } from "./core/firebase.js";
import { addLesson, updateLesson, deleteLesson } from "./services/lessonService.js";
import { addStudent, updateStudent, deleteStudent } from "./services/studentService.js";
import { parseISODateLocal } from "./utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "./utils/formatService.js";
import { $, els, pad2, ymdKey } from "./utils/uiHelpers.js";
import {
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, where, orderBy, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import {
  toInputDate, toLocalDateTimeString, showAlert, bindBRLMasks
} from "./ui/helpers.js";
import {
  state, renderCalendar, renderDayDetails, renderUpcoming,
  renderFilterEcho, bindCalendarEvents, initCalendar
} from "./ui/calendarUI.js";
import {
  renderStudents, initStudents, openPkgModal, bindPkgModal
} from "./ui/studentsUI.js";
import { initCash, bindCashButton, renderCashEntries } from "./ui/cashUI.js";
import {
  initLessons, editLesson, requestDeleteLesson, bindLessonButtons
} from "./ui/lessonsUI.js";
import {
  initReceipt, openReceiptFromLesson, toggleReceiptBoxes, bindReceiptButtons
} from "./ui/receiptUI.js";
import {
  initEvolution, renderEvolutions, buildEvoTree
} from "./ui/evolutionUI.js";
import {
  initReports, renderReportMonthKPIs, renderDashboard, drawBars,
  ensureYearSelects, fillRepYearInvest, fillRepStudentSelect,
  renderRepStudent, initRepStudentArea, initReportMonthPatch,
  renderGrupoKPIs
} from "./ui/reportsUI.js";

import { initReportPDF, bindReportPDFButton } from "./ui/reportPDF.js";
import { initPackageHistory } from "./ui/packageHistoryUI.js";

import {
  validateLessonForm, validatePackageForm,
  validateCashForm, validateStudentForm, validateEvolutionForm
} from "./ui/formValidation.js";

import {
  initGrupo, bindTurmaForm, attachGrupoListeners, detachGrupoListeners
} from "./ui/grupoUI.js";

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
let turmas       = [];
let matriculas   = [];
let mensalidades = [];
window._cashEntries = cashEntries;
let unsubCash = null;

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
  agenda:     $("agenda"),
  alunos:     $("alunos"),
  evolucao:   $("evolucao"),
  relatorios: $("relatorios"),
  caixa:      $("caixa"),
  grupo:      $("grupo"),
  backup:     $("backup")
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
  setTimeout(() => {
    try {
      initReportMonthPatch();
      renderGrupoKPIs();
      renderDashboard(updateMoneyButton);
    } catch (e) { console.error(e); }
  }, 50);
}
}
els("#tabs a").forEach(a => a.onclick = (e) => { e.preventDefault(); showTab(a.dataset.tab); });
$("btnEnterSystem").onclick = () => $("btnGoogle").click();

/* ======================= UI: toggles ======================= */
const btnToggleHistory = $("btnToggleHistory");
const historyContent   = $("historyContent");
if (btnToggleHistory && historyContent) {
  btnToggleHistory.addEventListener("click", () => {
    const isHidden = historyContent.style.display === "none";
    historyContent.style.display = isHidden ? "block" : "none";
    btnToggleHistory.textContent  = isHidden ? "Ocultar" : "Mostrar";
  });
}

const studentFormWrap      = document.getElementById("studentFormWrap");
const btnToggleStudentForm = document.getElementById("btnToggleStudentForm");
if (btnToggleStudentForm && studentFormWrap) {
  btnToggleStudentForm.addEventListener("click", () => {
    const isOpen = studentFormWrap.classList.contains("form-open");
    studentFormWrap.classList.toggle("form-open",     !isOpen);
    studentFormWrap.classList.toggle("form-collapsed", isOpen);
    btnToggleStudentForm.textContent = isOpen ? "+ Novo Aluno" : "Fechar";
  });
}

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
  $("hero").style.display = "none";
  $("tabs").style.display = "flex";
  attach();
  attachGlobalCashListener();
  showTab("agenda");
});

/* ======================= Inicialização dos módulos ======================= */
bindCalendarEvents({ onFilterChange: () => renderFilterEcho(students) });

initCalendar({
  get lessons()  { return lessons; },
  get students() { return students; },
  editLesson,
  requestDeleteLesson,
  openReceiptFromLesson
});

initStudents({
  get students() { return students; },
  get lessons()  { return lessons; },
  get db()       { return db; },
  deleteStudent,
  openPkgModal,
  onEdit: (s) => {
    editingStudentId = s.id;
    $("studentName").value         = s.name || "";
    $("studentPhone").value        = s.phone || "";
    $("studentEmail").value        = s.email || "";
    $("studentActive").value       = String(!!s.active);
    $("studentPackageStart").value = s.packageStart || "";
    $("studentPackageEnd").value   = s.packageEnd || "";
    $("studentTotalLessons").value = s.totalLessons ?? 0;
    $("studentNotes").value        = s.notes || "";
    showAlert("Modo edição: " + (s.name || ""));
    window.scrollTo({ top: $("alunos").offsetTop - 60, behavior: "smooth" });
  }
});
bindPkgModal(db);

initCash({
  get db()      { return db; },
  get user()    { return user; },
  get colCash() { return colCash; }
});
bindCashButton();

initLessons({
  get lessons()    { return lessons; },
  get students()   { return students; },
  get db()         { return db; },
  get user()       { return user; },
  get colLessons() { return colLessons; },
  fillStudentSelects,
  openReceiptFromLesson
});
bindLessonButtons();

initReceipt({
  get lessons()  { return lessons; },
  get students() { return students; }
});
bindReceiptButtons();

initEvolution({
  get evolutions() { return evolutions; },
  get students()   { return students; },
  get db()         { return db; },
  onEdit: (e) => {
    editingEvolutionId = e.id;
    $("evolutionDate").value         = (e.date || "").slice(0, 10);
    $("evolutionStudent").value      = e.studentId || "";
    $("evolutionStyle").value        = e.style || "";
    $("evolutionLevel").value        = e.level || "Iniciante";
    $("evolutionDuration").value     = e.duration || 60;
    $("evolutionContent").value      = e.content || "";
    $("evolutionProgress").value     = e.progress || "";
    $("evolutionDifficulties").value = e.difficulties || "";
    $("evolutionNextSteps").value    = e.nextSteps || "";
    $("evolutionNotes").value        = e.notes || "";
    evoModal?.classList.add("show");
  }
});

initReports({
  get lessons()      { return lessons; },
  get students()     { return students; },
  get cashEntries()  { return cashEntries; },
  get turmas()       { return turmas; },
  get matriculas()   { return matriculas; },
  get mensalidades() { return mensalidades; }
});

$("repYear").onchange    = () => { renderDashboard(updateMoneyButton); renderGrupoKPIs(); };
$("repCompare").onchange = () => renderDashboard(updateMoneyButton);
if ($("repYearInvest")) $("repYearInvest").onchange = () => renderDashboard(updateMoneyButton);
if ($("repStuSelect"))  $("repStuSelect").onchange  = renderRepStudent;
if ($("repMonth"))      $("repMonth").onchange      = () => { renderReportMonthKPIs(); renderGrupoKPIs(); };
window.addEventListener("resize", () => drawBars());

initReportPDF({
  get lessons()     { return lessons; },
  get students()    { return students; },
  get cashEntries() { return cashEntries; }
});
bindReportPDFButton();

initPackageHistory({
  get db()       { return db; },
  get lessons()  { return lessons; },
  get students() { return students; }
});

initGrupo({
  get db()   { return db; },
  get user() { return user; }
});
bindTurmaForm();

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
    renderDashboard(updateMoneyButton);
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
    renderDashboard(updateMoneyButton);
    renderReportMonthKPIs();
  });

  unsubE = onSnapshot(qE, (snap) => {
    evolutions = snap.docs.map(withId);
    renderEvolutions();
    renderEvoKPIs();
    buildEvoTree();
    initRepStudentArea();
  });

  attachGrupoListeners();

const colTurmas      = collection(db, "turmas");
const colMatriculas  = collection(db, "matriculas");
const colMensalidades= collection(db, "mensalidadesGrupo");

onSnapshot(
  query(colTurmas, where("ownerUid","==",user.uid)),
  snap => { turmas = snap.docs.map(withId); renderGrupoKPIs(); }
);
onSnapshot(
  query(colMatriculas, where("ownerUid","==",user.uid)),
  snap => { matriculas = snap.docs.map(withId); renderGrupoKPIs(); }
);
onSnapshot(
  query(colMensalidades, where("ownerUid","==",user.uid)),
  snap => { mensalidades = snap.docs.map(withId); renderGrupoKPIs(); }
);

}

function detach() {
  unsubS?.(); unsubL?.(); unsubE?.(); unsubCash?.();
  detachGrupoListeners();
}

function attachGlobalCashListener() {
  if (!user) return;
  if (unsubCash) unsubCash();
  const q = query(colCash, where("ownerUid","==",user.uid), orderBy("data","desc"));
  unsubCash = onSnapshot(q, (snap) => {
    cashEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window._cashEntries = cashEntries;
    renderCashEntries(cashEntries);
    renderReportMonthKPIs();
    renderDashboard(updateMoneyButton);
  }, (error) => { console.error("Erro no listener do Caixa:", error); });
}

/* ======================= Alunos ======================= */
let editingStudentId = null;

$("btnSaveStudent").onclick = async () => {
   if (!validateStudentForm()) return;
  const base = {
    name:         $("studentName").value.trim(),
    phone:        $("studentPhone").value.trim(),
    email:        $("studentEmail").value.trim(),
    active:       $("studentActive").value === "true",
    packageStart: $("studentPackageStart").value,
    packageEnd:   $("studentPackageEnd").value,
    totalLessons: +$("studentTotalLessons").value || 0,
    notes:        $("studentNotes").value,
    ownerUid:     user?.uid || "dev",
    updatedAt:    serverTimestamp()
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
    date:         $("evolutionDate").value,
    studentId:    $("evolutionStudent").value,
    style:        $("evolutionStyle").value,
    level:        $("evolutionLevel").value,
    duration:     +($("evolutionDuration").value || 60),
    content:      $("evolutionContent").value,
    progress:     $("evolutionProgress").value,
    difficulties: $("evolutionDifficulties").value,
    nextSteps:    $("evolutionNextSteps").value,
    rating:       null,
    mood:         null,
    notes:        $("evolutionNotes").value,
    ownerUid:     user?.uid || "dev",
    updatedAt:    serverTimestamp()
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

/* ======================= KPIs Evolução ======================= */
function renderEvoKPIs() {
  const today = new Date(); const y = today.getFullYear(); const m = today.getMonth(); const d = today.getDate();
  const dayE   = evolutions.filter(e => { const t = parseISODateLocal(e.date); return t.getDate()===d && t.getMonth()===m && t.getFullYear()===y; });
  const monthE = evolutions.filter(e => { const t = parseISODateLocal(e.date); return t.getMonth()===m && t.getFullYear()===y; });
  const monthMin = monthE.reduce((s, e) => s + (+e.duration || 0), 0);
  const stuSet   = new Set(monthE.map(x => x.studentId));
  $("evoDay").textContent      = dayE.length;
  $("evoMonth").textContent    = monthE.length;
  $("evoMonthMin").textContent = (monthMin || 0) + "'";
  $("evoMonthStu").textContent = stuSet.size;
}

/* ======================= Money button ======================= */
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

/* ======================= Init ======================= */
(function init() {
  try {
    renderCalendar();
    renderEvoKPIs();
    ensureYearSelects(updateMoneyButton);
    renderDayDetails(ymdKey(new Date()));
    updateMoneyButton();
    $("recEmitDate").value = toInputDate(new Date());
    toggleReceiptBoxes();
  } catch (e) { console.error("Init error:", e); }
})();