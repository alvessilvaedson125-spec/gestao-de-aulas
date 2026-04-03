import { parseISODateLocal } from "../utils/dateService.js";
import { $ } from "../utils/uiHelpers.js";
import { showAlert } from "./helpers.js";
import {
  deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get evolutions() { return []; },
  get students()   { return []; },
  get db()         { return null; },
  get evoModal()   { return null; },
  onEdit: ()=>{}
};

export function initEvolution(ctx) {
  _ctx = ctx;
}

/* ======================= Render evoluções ======================= */
export function renderEvolutions(filter = {}) {
  const box = $("evolutionsList"); box.innerHTML = "";
  let list = [..._ctx.evolutions];
  if (filter.studentId)                    list = list.filter(e => e.studentId === filter.studentId);
  if (typeof filter.y === "number")        list = list.filter(e => parseISODateLocal(e.date).getFullYear() === filter.y);
  if (typeof filter.monthIndex === "number") list = list.filter(e => parseISODateLocal(e.date).getMonth() === filter.monthIndex);

  for (const e of list) {
    const st = _ctx.students.find(s => s.id === e.studentId);
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

    it.querySelector('[data-act="edit"]').onclick = () => _ctx.onEdit(e);
    it.querySelector('[data-act="share"]').onclick = () => exportEvolutionPDF(e, nm);
    it.querySelector('[data-act="del"]').onclick   = async () => {
      if (confirm("Excluir esta anotação?")) {
        try {
          await deleteDoc(doc(_ctx.db, "evolucoes", e.id));
          showAlert("Anotação excluída.");
        } catch (err) { console.error(err); showAlert("Erro ao excluir anotação.", "error"); }
      }
    };
    box.appendChild(it);
  }
}

/* ======================= Árvore de evoluções ======================= */
let evoExpanded = { students: new Set(), years: new Set() };

export function buildEvoTree() {
  const root = $("evoTree"); if (!root) return;
  const monthsLbl = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const map = new Map();
  for (const e of _ctx.evolutions) {
    const sid = e.studentId || "_";
    const d = parseISODateLocal(e.date); const y = d.getFullYear(); const m = d.getMonth();
    if (!map.has(sid)) map.set(sid, new Map());
    const ymap = map.get(sid);
    if (!ymap.has(y)) ymap.set(y, new Map());
    const mmap = ymap.get(y);
    mmap.set(m, (mmap.get(m) || 0) + 1);
  }

  let html = "";
  for (const s of _ctx.students) {
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

/* ======================= Export PDF ======================= */
export function exportEvolutionPDF(e, studentName) {
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