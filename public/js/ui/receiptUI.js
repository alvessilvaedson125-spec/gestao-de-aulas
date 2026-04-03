import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $, pad2 } from "../utils/uiHelpers.js";
import { toInputDate } from "./helpers.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get lessons()  { return []; },
  get students() { return []; },
};

export function initReceipt(ctx) {
  _ctx = ctx;
}

/* ======================= Helpers locais ======================= */
const fmt = (n) => (Number(n || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fillReceiptStudents() {
  const c = $("recStudent"); if (!c) return;
  c.innerHTML = `<option value="">Selecione…</option>` +
    _ctx.students.map(s => `<option value="${s.id}">${s.name||"(sem nome)"}</option>`).join("");
}

function setReceiptStudent(id) {
  const el = $("recStudent"); if (el) el.value = id || "";
}

function getLessonsInRange(studentId, isoStart, isoEnd) {
  if (!studentId || !isoStart || !isoEnd) return [];
  const S = new Date(isoStart + "T00:00:00");
  const E = new Date(isoEnd   + "T23:59:59");
  return _ctx.lessons
    .filter(l => l.studentId === studentId && l.status !== 3)
    .filter(l => { const d = parseISODateLocal(l.date); return d >= S && d <= E; })
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));
}

/* ======================= Toggle boxes ======================= */
export function toggleReceiptBoxes() {
  const t = $("recType").value;
  $("recBoxAvulsa").style.display = t === "avulsa" ? "block" : "none";
  $("recBoxPacote").style.display = t === "pacote" ? "block" : "none";
  if (t === "avulsa") $("recObsAvulsa").value = "Aula avulsa";
  else $("recObsPacote").value = "Pagamento de pacote";
}

/* ======================= Fill package auto ======================= */
export function fillPackageAuto() {
  const sId   = $("recStudent").value;
  const i     = $("recPkgStart").value;
  const f     = $("recPkgEnd").value;
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

/* ======================= Abrir recibo ======================= */
export function openReceiptFromLesson(a) {
  fillReceiptStudents();
  $("recType").value = "avulsa"; toggleReceiptBoxes();
  $("recEmitDate").value    = toInputDate(new Date());
  $("recTeacher").value     = "Edson Silva";
  setReceiptStudent(a.studentId || "");
  $("recAvulsaDate").value  = toInputDate(parseISODateLocal(a.date));
  $("recAvulsaValue").value = formatBRL(a.price || 0);
  $("recPayMethod").value   = "PIX"; $("recCNPJ").value = "";
  $("recObsAvulsa").value   = "Aula avulsa";
  $("receiptModal").classList.add("show");
}

export function openReceiptFromStudent(s) {
  fillReceiptStudents();
  $("recType").value = "pacote"; toggleReceiptBoxes();
  $("recEmitDate").value  = toInputDate(new Date());
  $("recTeacher").value   = "Edson Silva";
  setReceiptStudent(s.id || "");
  $("recPkgStart").value  = s.packageStart || "";
  $("recPkgEnd").value    = s.packageEnd   || "";
  $("recPayMethod").value = "PIX"; $("recCNPJ").value = "";
  $("recObsPacote").value = "Pagamento de pacote";
  tryFillPackageAuto();
  $("receiptModal").classList.add("show");
}

/* ======================= Gerar PDF ======================= */
export function generateReceiptPDF() {
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ unit: "pt", format: "a4" });
  const L = 56; let y = 64, lh = 18;
  const type  = $("recType").value;
  const emit  = $("recEmitDate").value;
  const prof  = $("recTeacher").value || "Professor";
  const cnpj  = $("recCNPJ").value || "";
  const stuId = $("recStudent").value;
  const stu   = _ctx.students.find(s => s.id === stuId);
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

/* ======================= Bind de botões ======================= */
export function bindReceiptButtons() {
  $("btnReceiptClose").onclick = () => $("receiptModal").classList.remove("show");
  $("btnReceiptPDF").onclick   = generateReceiptPDF;
  $("recType").onchange = () => { toggleReceiptBoxes(); tryFillPackageAuto(); };
  ["recStudent","recPkgStart","recPkgEnd"].forEach(id => {
    const el = $(id); if (el) el.addEventListener("change", tryFillPackageAuto);
  });
}