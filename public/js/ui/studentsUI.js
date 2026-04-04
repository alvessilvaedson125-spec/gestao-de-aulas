import { parseISODateLocal } from "../utils/dateService.js";
import { $, pad2, ymdKey } from "../utils/uiHelpers.js";
import { showAlert } from "./helpers.js";
import { updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { savePackageToHistory, openPackageHistory } from "./packageHistoryUI.js";
import { validatePackageForm } from "./formValidation.js";



/* ======================= Contexto injetado ======================= */
let _ctx = {
  get students() { return []; },
  get lessons()  { return []; },
  get db()       { return null; },
  deleteStudent: async ()=>{},
  openPkgModal: ()=>{},
  onEdit: ()=>{}
};

export function initStudents(ctx) {
  _ctx = ctx;
}

/* ======================= Helpers ======================= */
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

/* ======================= Render alunos ======================= */
export function renderStudents() {
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

    const safeStudents = Array.isArray(_ctx.students) ? _ctx.students : [];
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
        await _ctx.deleteStudent(id);
        showAlert("Aluno excluído com sucesso.");
      } catch (e) { console.error(e); showAlert("Erro ao excluir aluno.", "error"); }
    }

    const buildItem = (s, inactive = false) => {
      if (!s || !s.id) { console.warn("Aluno inválido:", s); return null; }
      const it = document.createElement("div");
      it.className = "student-item"; it.dataset.id = s.id;
      if (!inactive) it.setAttribute("draggable", "true");

      const pkgOn      = hasActivePackage(s);
      const safeLessons= Array.isArray(_ctx.lessons) ? _ctx.lessons : [];
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
          <button class="btn small" data-act="history">Histórico</button>
          ${inactive
            ? `<button class="btn small" data-act="activate">Ativar</button>`
            : `<button class="btn small" data-act="deactivate">Inativar</button>`}
          <button class="btn small" data-act="del">Excluir</button>
        </div>`;

      it.querySelector('[data-act="edit"]')?.addEventListener("click", () => _ctx.onEdit(s));
      it.querySelector('[data-act="newpkg"]')?.addEventListener("click", () => _ctx.openPkgModal(s.id));
      it.querySelector('[data-act="history"]')?.addEventListener("click", () => openPackageHistory(s.id));
      it.querySelector('[data-act="deactivate"]')?.addEventListener("click", async () => {
        try {
          await updateDoc(doc(_ctx.db, "alunos", s.id), { active: false, updatedAt: serverTimestamp() });
          showAlert("Aluno inativado.");
        } catch (e) { console.error(e); showAlert("Erro ao inativar.", "error"); }
      });
      it.querySelector('[data-act="activate"]')?.addEventListener("click", async () => {
        try {
          await updateDoc(doc(_ctx.db, "alunos", s.id), { active: true, updatedAt: serverTimestamp() });
          showAlert("Aluno ativado.");
        } catch (e) { console.error(e); showAlert("Erro ao ativar.", "error"); }
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

/* ======================= Drag & drop ======================= */
export function enableStudentDrag(container) {
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
      try { await updateDoc(doc(_ctx.db, "alunos", ids[i]), { orderIndex: i+1, updatedAt: serverTimestamp() }); }
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

/* ======================= Modal Novo Pacote ======================= */
export function bindPkgModal(db) {
  $("btnPkgClose").onclick = () => $("pkgModal").classList.remove("show");
  $("btnPkgSave").onclick  = async () => {
    if (!validatePackageForm()) return;
    const pkgTargetId = $("pkgModal").dataset.targetId;
    if (!pkgTargetId) return;
    try {
      const student = _ctx.students.find(x => x.id === pkgTargetId);
      // Salva pacote atual no histórico antes de sobrescrever
      if (student?.packageStart) {
        await savePackageToHistory(pkgTargetId, student);
      }
      await updateDoc(doc(db, "alunos", pkgTargetId), {
        packageStart:   $("pkgStart").value,
        packageEnd:     $("pkgEnd").value,
        totalLessons:   +$("pkgTotal").value || 0,
        packageResetAt: null,
        notes: (student?.notes || "") + ($("pkgNote").value ? ` | ${$("pkgNote").value}` : ""),
        updatedAt: serverTimestamp()
      });
      $("pkgModal").classList.remove("show");
      showAlert("Salvo com sucesso.");
    } catch (e) { console.error(e); alert("Falha ao salvar pacote."); }
  };
}

export function openPkgModal(studentId) {
  const s = _ctx.students.find(x => x.id === studentId);
  const today = new Date();
  const defStart = s?.packageEnd ? s.packageEnd : `${pad2(today.getDate())}/${pad2(today.getMonth()+1)}/${today.getFullYear()}`;
  const d2 = new Date(today); d2.setDate(d2.getDate() + 30);
  $("pkgStart").value  = defStart;
  $("pkgEnd").value    = `${pad2(d2.getDate())}/${pad2(d2.getMonth()+1)}/${d2.getFullYear()}`;
  $("pkgTotal").value  = s?.totalLessons || 4;
  $("pkgNote").value   = "";
  $("pkgModal").dataset.targetId = studentId;
  $("pkgModal").classList.add("show");
}