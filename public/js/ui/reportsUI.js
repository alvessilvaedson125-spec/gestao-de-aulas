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

import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import { showAlert } from "./helpers.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get lessons()      { return []; },
  get students()     { return []; },
  get cashEntries()  { return []; },
  get turmas()       { return []; },
  get matriculas()   { return []; },
  get mensalidades() { return []; },
  get db()           { return null; },
  get user()         { return null; },
};

export function initReports(ctx) { _ctx = ctx; }

/* ======================= Helpers ======================= */
const MESES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_LONGO = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function brl(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0)); }
function _repYear()  { const el = document.getElementById("repYear");  return Number(el && el.value) || new Date().getFullYear(); }
function _repMonth() { const el = document.getElementById("repMonth"); return Number(el && el.value !== "" ? el.value : new Date().getMonth()); }

function getCashForMonth(year, month, tipo = null) {
  const cashEntries = _ctx.cashEntries;
  if (!cashEntries?.length) return 0;
  return cashEntries
    .filter(e => {
      if (!e?.data) return false;
      const d = e.data?.toDate ? e.data.toDate() : new Date(e.data);
      if (d.getFullYear() !== year || d.getMonth() !== month) return false;
      if (tipo === "entrada") return e.tipo !== "saida";
      if (tipo === "saida")   return e.tipo === "saida";
      return true;
    })
    .reduce((acc, e) => acc + Number(e.valor || 0), 0);
}

/* ======================= Filtro de mês ======================= */
export function setupReportMonthFilter() {
  const sel    = document.getElementById("repMonth");
  const yearSel= document.getElementById("repYear");
  if (!sel || sel.dataset._filled === "1") return;
  sel.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const o = document.createElement("option"); o.value = String(i); o.textContent = MESES_CURTO[i]; sel.appendChild(o);
  }
  sel.value = String(new Date().getMonth());
  if (yearSel) yearSel.value = String(new Date().getFullYear());
  sel.dataset._filled = "1";
  if (sel.dataset._bound !== "1")          { sel.addEventListener("change", renderReportMonthKPIs); sel.dataset._bound = "1"; }
  if (yearSel?.dataset._repYearBound !== "1") { yearSel.addEventListener("change", renderReportMonthKPIs); yearSel.dataset._repYearBound = "1"; }
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
    if (!l?.date) return false;
    const d = parseISODateLocal(l.date);
    return d instanceof Date && !isNaN(d) && d.getFullYear() === y && d.getMonth() === m;
  });

  const monthCount      = arr.length;
  const lessonRevenue   = calculateRealizedRevenueForLessons(arr, parseBRLToNumber);
  const cashEntradas    = getCashForMonth(y, m, "entrada");
  const cashSaidas      = getCashForMonth(y, m, "saida");
  const receitaBruta    = lessonRevenue + cashEntradas;
  const receitaLiquida  = receitaBruta - cashSaidas;
  const paidCount       = arr.filter(l => String(l.status) === "2").length;
  const monthAvg        = paidCount > 0 ? receitaBruta / paidCount : 0;
  const activeCount     = Number(document.getElementById("kpiActiveStudents")?.textContent || 0);
  const revPerActive    = activeCount > 0 ? receitaBruta / activeCount : 0;
  const forecastRevenue = arr.filter(l => ["0","1","2"].includes(String(l.status))).reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  let prevMonth = m - 1, prevYear = y;
  if (prevMonth < 0) { prevMonth = 11; prevYear = y - 1; }
  const prevLessons   = lessons.filter(l => { if (!l?.date) return false; const d = parseISODateLocal(l.date); return d.getFullYear() === prevYear && d.getMonth() === prevMonth && String(l.status) === "2"; });
  const prevLessonRev = prevLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const prevCashRev   = getCashForMonth(prevYear, prevMonth, "entrada");
  const prevTotal     = prevLessonRev + prevCashRev;
  const growth        = prevTotal > 0 ? ((receitaBruta - prevTotal) / prevTotal) * 100 : 0;
  const absDiff       = receitaBruta - prevTotal;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayArr     = lessons.filter(l => { const d = parseISODateLocal(l.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });
  const todayRevenue = todayArr.filter(l => String(l.status) === "2").reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);

  const yearArr            = lessons.filter(l => { if (!l?.date) return false; const d = parseISODateLocal(l.date); return d.getFullYear() === y && String(l.status) === "2"; });
  const yearRevenue        = yearArr.reduce((acc, l) => acc + parseBRLToNumber(l.price), 0);
  const uniqueYearStudents = new Set(yearArr.map(l => l.studentId));
  const avgYear            = uniqueYearStudents.size > 0 ? yearRevenue / uniqueYearStudents.size : 0;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpiMonth",         String(monthCount));
  set("kpiMonthRev",      formatBRL(receitaBruta));
  set("kpiMonthLiquido",  formatBRL(receitaLiquida));
  set("kpiMonthSaidas",   formatBRL(cashSaidas));
  set("kpiMonthForecast", formatBRL(forecastRevenue));
  set("kpiMonthPaid",     String(paidCount));
  set("kpiMonthAvg",      formatBRL(monthAvg));
  set("kpiRevPerActive",  formatBRL(revPerActive));
  set("kpiDay",           todayArr.length + " aula(s) • " + formatBRL(todayRevenue));
  set("kpiMonthGrowth",   growth.toFixed(1) + "%");
  set("avgPerStudent",    formatBRL(avgYear));

  const elRef = document.getElementById("kpiMonthGrowthRef");
  if (elRef) elRef.textContent = `vs ${MESES_CURTO[prevMonth]} ${prevYear} (${absDiff > 0 ? "+" : ""}${formatBRL(absDiff)})`;

  // Atualiza classe do crescimento
  const elGrowth = document.getElementById("kpiMonthGrowth");
  if (elGrowth) {
    elGrowth.className = "n " + (growth > 0 ? "kpi-up" : growth < 0 ? "kpi-down" : "kpi-neutral");
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
let _barsParticulares = Array(12).fill(0);
let _barsCaixaEntradas = Array(12).fill(0);
let _barsCaixaSaidas   = Array(12).fill(0);
let _barsCompare      = Array(12).fill(0);
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

  _barsParticulares  = Array(12).fill(0);
  _barsCaixaEntradas = Array(12).fill(0);
  _barsCaixaSaidas   = Array(12).fill(0);
  _barsCompare       = Array(12).fill(0);

  for (const l of lessons || []) {
    if (!l?.date || String(l.status) !== "2") continue;
    const d = parseISODateLocal(l.date); if (!(d instanceof Date) || isNaN(d)) continue;
    const m = d.getMonth(); const v = parseBRLToNumber(l.price || 0);
    if (d.getFullYear() === y)  _barsParticulares[m] += v;
    if (d.getFullYear() === cy) _barsCompare[m] += v;
  }
  for (const c of cashEntries || []) {
    if (!c?.data) continue;
    const d = c.data?.toDate ? c.data.toDate() : new Date(c.data);
    if (!(d instanceof Date) || isNaN(d)) continue;
    const m = d.getMonth(); const v = Number(c.valor || 0);
    if (d.getFullYear() === y) {
      if (c.tipo === "saida") _barsCaixaSaidas[m] += v;
      else                    _barsCaixaEntradas[m] += v;
    }
    if (d.getFullYear() === cy && c.tipo !== "saida") _barsCompare[m] += v;
  }

  const barsTotal  = _barsParticulares.map((v, i) => v + _barsCaixaEntradas[i]);
  const comparison = calculateYearComparison(barsTotal, _barsCompare);
  const yearTotal  = comparison.yearTotal || 0;
  const yearSaidas = _barsCaixaSaidas.reduce((a, b) => a + b, 0);
  const yearLiquido= yearTotal - yearSaidas;
  const delta      = comparison.delta || 0;

  if ($("kpiYearRev"))     $("kpiYearRev").textContent     = formatBRL(yearTotal);
  if ($("kpiYearLiquido")) $("kpiYearLiquido").textContent = formatBRL(yearLiquido);
  if ($("kpiYearSaidas"))  $("kpiYearSaidas").textContent  = formatBRL(yearSaidas);
  if ($("kpiYearDelta"))   $("kpiYearDelta").textContent   = (delta >= 0 ? "+" : "") + delta.toFixed(1) + "%";
  if ($("yearTotalFooter"))$("yearTotalFooter").textContent = formatBRL(yearTotal);

  const concentration = calculateRevenueConcentration(lessons || [], parseISODateLocal, y);
  if ($("kpiTop1Share")) $("kpiTop1Share").textContent = (concentration.top1Percent || 0).toFixed(1) + "%";
  if ($("kpiTop3Share")) $("kpiTop3Share").textContent = (concentration.top3Percent || 0).toFixed(1) + "%";

  drawBars(_barsParticulares, _barsCaixaEntradas, _barsCaixaSaidas, _barsCompare);

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

/* ======================= Gráfico com escala ======================= */
export function drawBars(arrParticulares, arrCaixaEntradas, arrCaixaSaidas, arrCompare) {
  arrParticulares  = arrParticulares  || Array(12).fill(0);
  arrCaixaEntradas = arrCaixaEntradas || Array(12).fill(0);
  arrCaixaSaidas   = arrCaixaSaidas   || Array(12).fill(0);
  arrCompare       = arrCompare       || Array(12).fill(0);

  const canvas = $("chartYear"); if (!canvas) return;
  const cssW   = canvas.clientWidth || 600;
  const cssH   = 180;
  canvas.height = cssH;
  canvas.width  = cssW;
  if (!_chartCtx) _chartCtx = canvas.getContext("2d");
  const ctx = _chartCtx;
  const W = canvas.width; const H = cssH;
  ctx.clearRect(0, 0, W, H);

  const padL = 52, padR = 16, padT = 12, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allVals = [...arrParticulares, ...arrCaixaEntradas, ...arrCaixaSaidas, ...arrCompare];
  const max = Math.max(1, ...allVals);

  // Escala Y
  const steps = 4;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--line");
  ctx.lineWidth = 0.5;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((max / steps) * i);
    const y   = H - padB - Math.round((val / max) * innerH);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    const label = val >= 1000 ? `R$${(val/1000).toFixed(0)}k` : `R$${val}`;
    ctx.fillText(label, padL - 4, y + 3);
  }

  // Barras
  const groupW = innerW / 12;
  const barCount = 4;
  const barW = (groupW * 0.8) / barCount;
  const gap  = groupW * 0.1;

  const cores = ["#5ea0ff", "#7a6cff", "#ff6b6b", "#404a60"];
  const arrs  = [arrParticulares, arrCaixaEntradas, arrCaixaSaidas, arrCompare];

  for (let i = 0; i < 12; i++) {
    const x0 = padL + i * groupW + gap;
    for (let b = 0; b < barCount; b++) {
      const v = arrs[b][i];
      if (v <= 0) continue;
      const h = Math.round((v / max) * innerH);
      const x = x0 + b * (barW + 1);
      const y = H - padB - h;
      ctx.fillStyle = cores[b];
      ctx.fillRect(x, y, barW, h);
    }
  }

  // Labels meses
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  const lbl = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  for (let i = 0; i < 12; i++) {
    const x = padL + i * groupW + groupW / 2;
    ctx.fillText(lbl[i], x, H - padB + 14);
  }

  // Legenda
  const legenda = [
    { cor: "#5ea0ff", label: "Particulares" },
    { cor: "#7a6cff", label: "Caixa entradas" },
    { cor: "#ff6b6b", label: "Caixa saídas" },
    { cor: "#404a60", label: "Comparativo" },
  ];
  let lx = padL;
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  for (const leg of legenda) {
    ctx.fillStyle = leg.cor;
    ctx.fillRect(lx, padT - 2, 10, 10);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted");
    ctx.fillText(leg.label, lx + 13, padT + 7);
    lx += 90;
    if (lx > W - 80) break;
  }
}

/* ======================= Bloco Grupo ======================= */
export function renderGrupoKPIs() {
  const box = document.getElementById("grupoKPIBox"); if (!box) return;

  const m = _repMonth();
  const y = _repYear();
  const turmas       = _ctx.turmas       || [];
  const matriculas   = _ctx.matriculas   || [];
  const mensalidades = _ctx.mensalidades || [];

  const turmasAtivas  = turmas.filter(t => t.active !== false);
  const matsAtivas    = matriculas.filter(m => m.status !== "trancado");
  const matsTrancadas = matriculas.filter(m => m.status === "trancado");

  const receitaEsperada = matsAtivas.reduce((acc, mat) => {
    return acc + (Number(String(mat.mensalidade || "0").replace(",",".")) || 0);
  }, 0);

  const pagoIds = mensalidades.filter(mn => mn.mes === m && mn.ano === y && mn.status === "pago").map(mn => mn.matriculaId);

  const receitaRealizada = mensalidades
    .filter(mn => mn.mes === m && mn.ano === y && mn.status === "pago")
    .reduce((acc, mn) => {
      const mat = matriculas.find(x => x.id === mn.matriculaId);
      return acc + (Number(String(mat?.mensalidade || "0").replace(",",".")) || 0);
    }, 0);

  const inadimplentes = matsAtivas.filter(mat => !pagoIds.includes(mat.id));
  const adimplencia   = matsAtivas.length > 0 ? Math.round((pagoIds.length / matsAtivas.length) * 100) : 0;

  let turmasHTML = "";
  for (const t of turmasAtivas) {
    const tmats  = matsAtivas.filter(mat => mat.turmaId === t.id);
    const tPagos = tmats.filter(mat => pagoIds.includes(mat.id)).length;
    const tTotal = tmats.length;
    const pct    = tTotal > 0 ? Math.round((tPagos / tTotal) * 100) : 0;
    const cls    = pct >= 80 ? "ok" : pct >= 50 ? "warn" : "danger";
    turmasHTML += `
      <div class="grupo-turma-row">
        <div class="grupo-turma-nome">${t.name}</div>
        <div class="grupo-turma-info">
          <span class="pill-mini ok-pill">${tPagos} pagos</span>
          <span class="pill-mini warn-pill">${tTotal - tPagos} pendentes</span>
        </div>
        <div class="pkgbar">
          <div class="fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div class="muted grupo-adim-pct">${pct}% adimplente</div>
      </div>`;
  }

  box.innerHTML = `
    <div class="grupo-kpi-header">
      <h3>🎭 Grupo — ${MESES_LONGO[m]} ${y}</h3>
      <button class="btn small primary" id="btnLancarGrupoCaixa">💰 Lançar no Caixa</button>
    </div>
    <div class="grupo-kpi-grid">
      <div class="cardx kpi-card">
        <div class="kpi-title">Turmas ativas</div>
        <div class="kpi-value">${turmasAtivas.length}</div>
      </div>
      <div class="cardx kpi-card">
        <div class="kpi-title">Alunos ativos</div>
        <div class="kpi-value">${matsAtivas.length}</div>
        <div class="kpi-sub">${matsTrancadas.length} trancados</div>
      </div>
      <div class="cardx kpi-card">
        <div class="kpi-title">Receita esperada</div>
        <div class="kpi-value">${formatBRL(receitaEsperada)}</div>
        <div class="kpi-sub">Mensalidades ativas</div>
      </div>
      <div class="cardx kpi-card highlight">
        <div class="kpi-title">Receita realizada</div>
        <div class="kpi-value">${formatBRL(receitaRealizada)}</div>
        <div class="kpi-sub">${pagoIds.length} pagamentos confirmados</div>
      </div>
      <div class="cardx kpi-card">
        <div class="kpi-title">Inadimplentes</div>
        <div class="kpi-value kpi-down">${inadimplentes.length}</div>
        <div class="kpi-sub">mensalidades pendentes</div>
      </div>
      <div class="cardx kpi-card">
        <div class="kpi-title">Taxa de adimplência</div>
        <div class="kpi-value ${adimplencia >= 80 ? "kpi-up" : adimplencia >= 50 ? "kpi-neutral" : "kpi-down"}">${adimplencia}%</div>
      </div>
    </div>
    ${turmasAtivas.length > 0 ? `
      <div class="grupo-por-turma">
        <div class="grupo-papel-label">Por turma</div>
        ${turmasHTML}
      </div>` : ""}`;

      document.getElementById("btnLancarGrupoCaixa")?.addEventListener("click", () => {
  lancarGrupoNoCaixa(m, y, receitaRealizada, matriculas, mensalidades);
});
}

/* ======================= Lançar grupo no Caixa ======================= */
async function lancarGrupoNoCaixa(m, y, receitaRealizada, matriculas, mensalidades) {
  if (receitaRealizada <= 0) {
    showAlert("Nenhuma mensalidade paga neste mês para lançar.", "error");
    return;
  }

  const mesLabel = MESES_LONGO[m];
  const descricao = `Mensalidades grupo — ${mesLabel} ${y}`;

  if (!confirm(`Lançar ${formatBRL(receitaRealizada)} no Caixa como entrada?\n\n"${descricao}"\n\nIsso criará uma entrada no Caixa. Confirma?`)) return;

  try {
    const colCash = collection(_ctx.db, "caixa");
    await addDoc(colCash, {
      tipo:      "entrada",
      data:      new Date(y, m, 1),
      valor:     receitaRealizada,
      categoria: "grupo",
      descricao,
      criadoEm:  serverTimestamp(),
      ownerUid:  _ctx.user?.uid || "dev"
    });
    showAlert(`${formatBRL(receitaRealizada)} lançado no Caixa com sucesso.`);
  } catch (err) {
    console.error(err);
    showAlert("Erro ao lançar no Caixa.", "error");
  }
}