import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $ } from "../utils/uiHelpers.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get lessons()     { return []; },
  get students()    { return []; },
  get cashEntries() { return []; },
};

export function initReportPDF(ctx) {
  _ctx = ctx;
}

/* ======================= Helpers ======================= */
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getSelectedMonthYear() {
  const mEl = document.getElementById("repMonth");
  const yEl = document.getElementById("repYear");
  const m = mEl ? Number(mEl.value) : new Date().getMonth();
  const y = yEl ? Number(yEl.value) : new Date().getFullYear();
  return { m, y };
}

/* ======================= Gerar PDF ======================= */
export function generateMonthlyReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ unit: "pt", format: "a4" });
  const L    = 48, R = 547;
  const PW   = 595, lh = 16;
  let y      = 48;

  const { m, y: year } = getSelectedMonthYear();
  const monthLabel     = `${MONTHS[m]} ${year}`;
  const emitDate       = new Date().toLocaleDateString("pt-BR");

  // --- Aulas do mês ---
  const monthLessons = _ctx.lessons.filter(l => {
    if (!l?.date) return false;
    const d = parseISODateLocal(l.date);
    return d.getFullYear() === year && d.getMonth() === m;
  });
  const doneLessons = monthLessons.filter(l => String(l.status) === "2");
  const lessonRevenue = doneLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price || 0), 0);

  // --- Caixa do mês ---
  const monthCash = _ctx.cashEntries.filter(e => {
    if (!e?.data) return false;
    const d = e.data?.toDate ? e.data.toDate() : new Date(e.data);
    return d.getFullYear() === year && d.getMonth() === m;
  });
  const cashRevenue = monthCash.reduce((acc, e) => acc + Number(e.valor || 0), 0);
  const totalRevenue = lessonRevenue + cashRevenue;

  // ===================== CABEÇALHO =====================
  doc.setFillColor(30, 30, 40);
  doc.rect(0, 0, PW, 80, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(255,255,255);
  doc.text("Bailado Carioca – Gestão de Aulas", L, 32);
  doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(180,180,180);
  doc.text(`Relatório Mensal — ${monthLabel}`, L, 52);
  doc.text(`Emitido em: ${emitDate}`, L, 68);
  y = 100;

  // ===================== KPIs =====================
  doc.setTextColor(30,30,40);
  doc.setFont("helvetica","bold"); doc.setFontSize(12);
  doc.text("Resumo do Mês", L, y); y += lh + 4;

  doc.setDrawColor(200,200,200); doc.setLineWidth(0.5);
  doc.line(L, y, R, y); y += 12;

  const kpis = [
    ["Total de aulas no mês",     String(monthLessons.length)],
    ["Aulas realizadas",          String(doneLessons.length)],
    ["Receita de aulas",          formatBRL(lessonRevenue)],
    ["Entradas do caixa",         formatBRL(cashRevenue)],
    ["Total geral do mês",        formatBRL(totalRevenue)],
  ];

  doc.setFontSize(10);
  for (const [label, value] of kpis) {
    doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
    doc.text(label, L, y);
    doc.setFont("helvetica","bold"); doc.setTextColor(30,30,40);
    doc.text(value, R, y, { align: "right" });
    y += lh + 2;
  }
  y += 16;

  // ===================== AULAS REALIZADAS =====================
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(30,30,40);
  doc.text("Aulas Realizadas", L, y); y += lh + 4;
  doc.line(L, y, R, y); y += 10;

  if (doneLessons.length === 0) {
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(120,120,120);
    doc.text("Nenhuma aula realizada neste mês.", L, y); y += lh + 8;
  } else {
    // Cabeçalho da tabela
    doc.setFillColor(245,245,248);
    doc.rect(L, y - 10, R - L, lh + 4, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(60,60,60);
    doc.text("Aluno",        L + 2,   y);
    doc.text("Data",         L + 160, y);
    doc.text("Horário",      L + 230, y);
    doc.text("Estilo",       L + 290, y);
    doc.text("Valor",        R,       y, { align: "right" });
    y += lh;

    const sorted = [...doneLessons].sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));
    let rowCount = 0;
    for (const l of sorted) {
      if (y > 760) { doc.addPage(); y = 48; }
      const st   = _ctx.students.find(s => s.id === l.studentId);
      const nm   = st?.name || "(Aluno)";
      const d    = parseISODateLocal(l.date);
      const date = d.toLocaleDateString("pt-BR");
      const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const val  = formatBRL(parseBRLToNumber(l.price || 0));

      if (rowCount % 2 === 0) {
        doc.setFillColor(252,252,252);
        doc.rect(L, y - 10, R - L, lh + 2, "F");
      }
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(40,40,40);
      doc.text(nm.slice(0, 28),  L + 2,   y);
      doc.text(date,             L + 160, y);
      doc.text(time,             L + 230, y);
      doc.text((l.style||"—").slice(0,20), L + 290, y);
      doc.text(val,              R,       y, { align: "right" });
      y += lh + 2; rowCount++;
    }

    // Total aulas
    y += 4;
    doc.setDrawColor(200,200,200); doc.line(L, y, R, y); y += 10;
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(30,30,40);
    doc.text("Total — Aulas", L, y);
    doc.text(formatBRL(lessonRevenue), R, y, { align: "right" });
    y += lh + 16;
  }

  // ===================== ENTRADAS DO CAIXA =====================
  if (y > 700) { doc.addPage(); y = 48; }
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(30,30,40);
  doc.text("Entradas do Caixa", L, y); y += lh + 4;
  doc.setDrawColor(200,200,200); doc.line(L, y, R, y); y += 10;

  if (monthCash.length === 0) {
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(120,120,120);
    doc.text("Nenhuma entrada no caixa neste mês.", L, y); y += lh + 8;
  } else {
    doc.setFillColor(245,245,248);
    doc.rect(L, y - 10, R - L, lh + 4, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(60,60,60);
    doc.text("Descrição",   L + 2,   y);
    doc.text("Categoria",   L + 220, y);
    doc.text("Data",        L + 360, y);
    doc.text("Valor",       R,       y, { align: "right" });
    y += lh;

    let rowCount = 0;
    for (const e of monthCash) {
      if (y > 760) { doc.addPage(); y = 48; }
      const d    = e.data?.toDate ? e.data.toDate() : new Date(e.data);
      const date = d.toLocaleDateString("pt-BR");
      if (rowCount % 2 === 0) {
        doc.setFillColor(252,252,252);
        doc.rect(L, y - 10, R - L, lh + 2, "F");
      }
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(40,40,40);
      doc.text((e.descricao||"—").slice(0,35), L + 2,   y);
      doc.text((e.categoria||"—").slice(0,20), L + 220, y);
      doc.text(date,                           L + 360, y);
      doc.text(formatBRL(Number(e.valor||0)),  R,       y, { align: "right" });
      y += lh + 2; rowCount++;
    }

    y += 4;
    doc.setDrawColor(200,200,200); doc.line(L, y, R, y); y += 10;
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(30,30,40);
    doc.text("Total — Caixa", L, y);
    doc.text(formatBRL(cashRevenue), R, y, { align: "right" });
    y += lh + 16;
  }

  // ===================== TOTAL GERAL =====================
  if (y > 740) { doc.addPage(); y = 48; }
  doc.setFillColor(30,30,40);
  doc.rect(L, y - 12, R - L, 28, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(255,255,255);
  doc.text("TOTAL GERAL DO MÊS", L + 8, y + 4);
  doc.text(formatBRL(totalRevenue), R - 8, y + 4, { align: "right" });
  y += 36;

  // ===================== RODAPÉ =====================
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(150,150,150);
  doc.text("Gerado automaticamente pelo sistema Bailado Carioca – Gestão de Aulas.", L, 820);

  // Salvar
  const fileName = `Relatorio-${MONTHS[m]}-${year}.pdf`;
  doc.save(fileName);
}

/* ======================= Bind do botão ======================= */
export function bindReportPDFButton() {
  const btn = document.getElementById("btnMonthlyReportPDF");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", generateMonthlyReportPDF);
}