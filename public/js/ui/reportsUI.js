import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $ } from "../utils/uiHelpers.js";
import {
  calculateRealizedRevenueForLessons,
  calculateYearlyStudentReport,
  calculateYearlyStudentRanking,
  calculateYearComparison,
  calculateRevenueConcentration
} from "../services/reportService.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get lessons()     { return []; },
  get students()    { return []; },
  get cashEntries() { return []; },
};

export function initReports(ctx) {
  _ctx = ctx;
}

/* ======================= Helpers ======================= */
function brl(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0)); }
function _repYear() { const el = document.getElementById("repYear"); return Number(el && el.value) || new Date().getFullYear(); }
function _repMonth() { const el = document.getElementById("repMonth"); return Number(el && el.value !== "" ? el.value : new Date().getMonth()); }

function calculateCashRevenueForMonth(year, month) {
  const cashEntries = _ctx.cashEntries;
  if (!cashEntries || !cashEntries.length) return 0;
  return cashEntries
    .filter(e => {
      if (!e || !e.data) return false;
      const d = e.data?.toDate ? e.data.toDate() : new Date(e.data);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((acc, e) => acc + Number(e.valor || 0), 0);
}

/* ======================= Filtro de mês ======================= */
export function setupReportMonthFilter() {
  const sel    = document.getElementById("repMonth");
  const yearSel= document.getElementById("repYear");
  if (!sel) return;
  if (sel.dataset._filled === "1") return;
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  sel.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const o = document.createElement("option"); o.value = String(i); o.textContent = meses[i]; sel.appendChild(o);
  }
  sel.value = String(new Date().getMonth());
  if (yearSel) yearSel.value = String(new Date().getFullYear());
  sel.dataset._filled = "1";
  if (sel.dataset._bound !== "1") { sel.addEventListener("change", renderReportMonthKPIs); sel.dataset._bound = "1"; }
  if (yearSel && yearSel.dataset._repYearBound !== "1") { yearSel.addEventListener("change", renderReportMonthKPIs); yearSel.dataset._repYearBound = "1"; }
}

export function initReportMonthPatch() {
  setupReportMonthFilter();
  renderReportMonthKPIs();
}

/* ======================= KPIs mensais ======================= */
export function renderReportMonthKPIs() {
  const y = _repYear();
  const m = _repMonth();
  const lessons = _ctx.lessons;
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
  const monthRevTotal = lessonRevenue + cashRevenue;

  const paidCount    = arr.filter(l => String(l.status) === "2").length;
  const monthAvg     = paidCount > 0 ? monthRevTotal / paidCount : 0;
  const activeCount  = Number(document.getElementById("kpiActiveStudents")?.textContent || 0);
  const revPerActive = activeCount > 0 ? monthRevTotal / activeCount : 0;
  const forecastRevenue = arr.filter(l => ["0","1","2"].includes(String(l.status))).reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  let prevMonth = m - 1, prevYear = y;
  if (prevMonth < 0) { prevMonth = 11; prevYear = y - 1; }
  const prevLessons   = lessons.filter(l => { if (!l?.date) return false; const d = parseISODateLocal(l.date); return d.getFullYear() === prevYear && d.getMonth() === prevMonth && String(l.status) === "2"; });
  const prevLessonRev = prevLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const prevCashRev   = calculateCashRevenueForMonth(prevYear, prevMonth);
  const prevTotal     = prevLessonRev + prevCashRev;
  const growth        = prevTotal > 0 ? ((monthRevTotal - prevTotal) / prevTotal) * 100 : 0;
  const absDiff       = monthRevTotal - prevTotal;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayArr     = lessons.filter(l => { const d = parseISODateLocal(l.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
  const todayRevenue = todayArr.filter(l => String(l.status) === "2").reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  const yearArr            = lessons.filter(l => { if (!l?.date) return false; const d = parseISODateLocal(l.date); return d.getFullYear() === y && String(l.status) === "2"; });
  const yearRevenue        = yearArr.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const uniqueYearStudents = new Set(yearArr.map(l => l.studentId));
  const avgYear            = uniqueYearStudents.size > 0 ? yearRevenue / uniqueYearStudents.size : 0;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpiMonth",         String(monthCount));
  set("kpiMonthRev",      formatBRL(monthRevTotal));
  set("kpiMonthForecast", formatBRL(forecastRevenue));
  set("kpiMonthPaid",     String(paidCount));
  set("kpiMonthAvg",      formatBRL(monthAvg));
  set("kpiRevPerActive",  formatBRL(revPerActive));
  set("kpiDay",           todayArr.length + " aula(s) • " + formatBRL(todayRevenue));
  set("kpiMonthGrowth",   growth.toFixed(1) + "%");
  set("avgPerStudent",    formatBRL(avgYear));

  const elRef = document.getElementById("kpiMonthGrowthRef");
  if (elRef) {
    const mn = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    elRef.textContent = `vs ${mn[prevMonth]} ${prevYear} (${absDiff > 0 ? "+" : ""}${formatBRL(absDiff)})`;
  }
}

/* ======================= Anos dos selects ======================= */
export function fillRepYearInvest() {
  const sel = document.getElementById("repYearInvest"); if (!sel) return;
  const lessons = _ctx.lessons;
  const y = new Set();
  if (Array.isArray(lessons) && lessons.length) {
    for (const l of lessons) { const d = parseISODateLocal(l.date); if (!isNaN(d)) y.add(d.getFullYear()); }
  }
  const curY = new Date().getFullYear();
  if (y.size === 0) y.add(curY);
  const yearsArray = [...y];
  const minY = Math.min(...yearsArray);
  const maxY = Math.max(curY + 3, ...yearsArray);
  const arr = [];
  for (let yr = minY; yr <= maxY; yr++) arr.push(yr);
  arr.sort((a, b) => b - a);
  const prev = sel.value;
  sel.innerHTML = "";
  for (const yr of arr) { const o = document.createElement("option"); o.value = String(yr); o.textContent = String(yr); sel.appendChild(o); }
  sel.value = arr.includes(Number(prev)) ? prev : String(curY);
}

export function ensureYearSelects(updateMoneyButton) {
  const lessons = _ctx.lessons;
  const years = new Set();
  for (const l of lessons) { if (!l.date || l.status !== 2) continue; years.add(parseISODateLocal(l.date).getFullYear()); }
  const cur = new Date().getFullYear();
  for (let y = cur - 3; y <= cur; y++) years.add(y);
  const arr = [...years].sort((a, b) => b - a);
  const fill = (id) => { const el = $(id); if (!el) return; const curVal = el.value; el.innerHTML = arr.map(y => `<option value="${y}">${y}</option>`).join(""); if (arr.includes(+curVal)) el.value = curVal; };
  fill("repYear"); fill("repCompare"); fill("repYearInvest");
  $("repYear").value = String(cur);
  if (!$("repCompare").value) $("repCompare").value = String(cur - 1);
  if ($("repYearInvest") && !$("repYearInvest").value) $("repYearInvest").value = $("repYear").value;
  if (updateMoneyButton) updateMoneyButton();
}

/* ======================= Relatório por aluno ======================= */
export function fillRepStudentSelect() {
  const sel = $("repStuSelect"); if (!sel || !Array.isArray(_ctx.students)) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Selecione um aluno...</option>` + _ctx.students.map(s => `<option value="${String(s.id??"")}"> ${s.name?.trim()||"(sem nome)"}</option>`).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

export function renderRepStudent() {
  const sel = $("repStuSelect"), box = $("repStuBox"), yearEcho = $("repYearEcho");
  if (!sel || !box) return;
  const year = _repYear();
  if (yearEcho) yearEcho.textContent = year;
  const id = String(sel.value || "");
  if (!id) { box.innerHTML = `<div class="muted">Selecione um aluno para ver o detalhamento.</div>`; return; }
  const stu    = (_ctx.students || []).find(s => String(s.id) === id);
  const report = calculateYearlyStudentReport(_ctx.lessons || [], id, year, parseISODateLocal, parseBRLToNumber);
  box.innerHTML = `<h3>${stu?.name?.trim()||"(sem nome)"}</h3><p>Total de aulas realizadas: <b>${report.lessons.length}</b></p><p>Investimento no ano: <b>${brl(report.total)}</b></p>`;
}

export function initRepStudentArea() {
  fillRepStudentSelect();
  renderRepStudent();
}

/* ======================= Dashboard anual ======================= */
let rankingExpanded = false;
let _barsY = Array(12).fill(0);
let _barsC = Array(12).fill(0);
let _chartCtx = null;

export function renderDashboard(updateMoneyButton) {
  ensureYearSelects(updateMoneyButton);
  const lessons     = _ctx.lessons;
  const students    = _ctx.students;
  const cashEntries = _ctx.cashEntries;
  const y   = +$("repYear").value;
  const cy  = +$("repCompare").value;
  const invY= +($("repYearInvest")?.value || y);

  if ($("listYear"))  $("listYear").textContent  = String(invY);
  if ($("cmpYear"))   $("cmpYear").textContent   = String(cy);
  if ($("barsYear"))  $("barsYear").textContent  = String(y);

  _barsY = Array(12).fill(0); _barsC = Array(12).fill(0);
  for (const l of lessons || []) {
    if (!l || !l.date || String(l.status) !== "2") continue;
    const d = parseISODateLocal(l.date); if (!(d instanceof Date) || isNaN(d)) continue;
    const m = d.getMonth(); const v = parseBRLToNumber(l.price || 0);
    if (d.getFullYear() === y)  _barsY[m] += v;
    if (d.getFullYear() === cy) _barsC[m] += v;
  }
  for (const c of cashEntries || []) {
    if (!c || !c.data) continue;
    const d = c.data?.toDate ? c.data.toDate() : new Date(c.data); if (!(d instanceof Date) || isNaN(d)) continue;
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
      btn.onclick = () => { rankingExpanded = !rankingExpanded; renderDashboard(updateMoneyButton); };
      toggleContainer.appendChild(btn);
    }
  }
}

export function drawBars(arrY, arrC) {
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