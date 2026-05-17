import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL } from "../utils/formatService.js";
import { $, els, pad2, ymdKey } from "../utils/uiHelpers.js";
import { hhmmLocal, showAlert, buildWhatsAppMessage, normalizePhoneBR } from "./helpers.js";
import { addLesson, updateLesson } from "../services/lessonService.js";

/* ======================= Estado do calendário ======================= */
export const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const state  = { y: new Date().getFullYear(), m: new Date().getMonth(), selKey: ymdKey(new Date()) };

/* ======================= Referências externas (injetadas) ======================= */
// lessons, students e funções de modal são passados via init()
let _ctx = {
  get lessons()  { return []; },
  get students() { return []; },
  editLesson: ()=>{},
  requestDeleteLesson: ()=>{},
  openReceiptFromLesson: ()=>{}
};

export function initCalendar(ctx) {
  _ctx = ctx;
}

/* ======================= Helpers locais ======================= */
function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ").filter(p => p.length > 0);
  return parts[0][0].toUpperCase();
}

/* ======================= Render calendário ======================= */
export function renderCalendar() {
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

    const list = _ctx.lessons
      .filter(l => ymdKey(parseISODateLocal(l.date)) === key)
      .filter(l => !filterStudent || l.studentId === filterStudent)
      .filter(l => !filterStatus  || String(l.status) === filterStatus)
      .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

    if (list.length) {
      const b = document.createElement("div"); b.className = "cal-dot"; b.textContent = list.length;
      cell.appendChild(b);
      for (const a of list) {
        const st   = _ctx.students.find(s => s.id === a.studentId);
        const nm   = st?.name || "(Aluno)";
        const hhmm = hhmmLocal(a.date);
        const chip = document.createElement("div");
        chip.className = "chip" + (a.status === 2 ? " done" : a.status === 3 ? " cancel" : "");
        chip.textContent = nm;
        chip.dataset.initials = getInitials(nm);
        chip.title = `${nm} — ${a.style||""}${a.level?" • "+a.level:""} • ${hhmm}`;
        chip.onclick = (ev) => { ev.stopPropagation(); _ctx.editLesson(a.id); };
        chip.setAttribute("draggable", "true");
        chip.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/lessonId", a.id); });
        cell.appendChild(chip);
      }
    }

    cell.addEventListener("dragover", (e) => e.preventDefault());
    cell.addEventListener("drop", async (e) => {
      e.preventDefault();
      const id     = e.dataTransfer.getData("text/lessonId");
      const origin = _ctx.lessons.find(x => x.id === id);
      if (!origin) return;
      const time        = hhmmLocal(origin.date);
      const dropDateStr = key + "T" + time;
      const isCopy      = e.shiftKey;
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

/* ======================= Render detalhe do dia ======================= */
export function renderDayDetails(key) {
  const box = $("dayDetails");
  if (!key) { box.innerHTML = `<span class="muted">Nenhum dia selecionado.</span>`; return; }
  const s = $("filterStudent")?.value || "";
  const t = $("filterStatus")?.value  || "";
  const list = _ctx.lessons
    .filter(l => ymdKey(parseISODateLocal(l.date)) === key)
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  if (!list.length) { box.innerHTML = `<span class="muted">Sem aulas neste dia.</span>`; return; }
  box.innerHTML = "";
  for (const a of list) {
    const st   = _ctx.students.find(s => s.id === a.studentId);
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
    row.querySelector('[data-act="edit"]').onclick = (ev) => { ev.stopPropagation(); _ctx.editLesson(a.id); };
    row.querySelector('[data-act="del"]').onclick  = (ev) => { ev.stopPropagation(); _ctx.requestDeleteLesson(a.id); };
    row.querySelector('[data-act="rec"]').onclick  = (ev) => { ev.stopPropagation(); _ctx.openReceiptFromLesson(a); };
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

/* ======================= Render próximas aulas ======================= */
export function renderUpcoming() {
  const days  = +$("upcomingRange").value || 30;
  const s     = $("filterStudent")?.value || "";
  const t     = $("filterStatus")?.value  || "";
  const start = new Date(); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(end.getDate() + days);

  const items = _ctx.lessons
    .filter(l => { const d = parseISODateLocal(l.date); return d >= start && d < end; })
    .filter(l => !s || l.studentId === s)
    .filter(l => !t || String(l.status) === String(t))
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  const box = $("upcomingList");
  if (!items.length) { box.innerHTML = `<div class="muted">Sem aulas neste período.</div>`; return; }
  box.innerHTML = "";
  for (const a of items) {
    const st   = _ctx.students.find(s => s.id === a.studentId);
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

/* ======================= Filtro echo ======================= */
export function renderFilterEcho(students) {
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

/* ======================= Bind de eventos ======================= */
export function bindCalendarEvents({ onFilterChange }) {
  $("calPrev").onclick   = () => { state.m--; if (state.m < 0)  { state.m = 11; state.y--; } renderCalendar(); };
  $("calNext").onclick   = () => { state.m++; if (state.m > 11) { state.m = 0;  state.y++; } renderCalendar(); };
  $("selMonth").onchange = () => { state.m = $("selMonth").selectedIndex; renderCalendar(); };
  $("selYear").onchange  = () => { state.y = +$("selYear").value; renderCalendar(); };
  $("btnCalRefresh").onclick = () => { renderCalendar(); renderUpcoming(); };
  $("btnToday").onclick = () => {
    const now = new Date();
    state.y = now.getFullYear(); state.m = now.getMonth(); state.selKey = ymdKey(now);
    renderCalendar(); renderDayDetails(state.selKey); onFilterChange();
  };
  $("btnClearFilters").onclick = () => {
    const fs = $("filterStudent"), ft = $("filterStatus");
    if (fs) fs.value = ""; if (ft) ft.value = "";
    renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); onFilterChange();
    showAlert("Filtros limpos");
  };
  $("filterStudent").onchange = () => { renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); onFilterChange(); };
  $("filterStatus").onchange  = () => { renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); onFilterChange(); };
  $("upcomingRange").onchange = () => renderUpcoming();

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const fs = $("filterStudent"), ft = $("filterStatus");
      if (fs) fs.value = ""; if (ft) ft.value = "";
      renderCalendar(); renderUpcoming(); renderDayDetails(state.selKey); onFilterChange();
      showAlert("Filtros limpos (Esc)");
    }
  });
}