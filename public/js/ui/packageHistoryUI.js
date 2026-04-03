import { parseISODateLocal } from "../utils/dateService.js";
import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $, pad2 } from "../utils/uiHelpers.js";
import { showAlert } from "./helpers.js";
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get db()       { return null; },
  get lessons()  { return []; },
  get students() { return []; },
};

export function initPackageHistory(ctx) {
  _ctx = ctx;
}

/* ======================= Salvar pacote no histórico ======================= */
export async function savePackageToHistory(studentId, packageData) {
  if (!studentId || !packageData?.packageStart) return;
  try {
    const db  = _ctx.db;
    const ref = collection(db, "alunos", studentId, "pacotes");
    await addDoc(ref, {
      packageStart:  packageData.packageStart  || null,
      packageEnd:    packageData.packageEnd    || null,
      totalLessons:  packageData.totalLessons  || 0,
      notes:         packageData.notes         || "",
      savedAt:       serverTimestamp()
    });
  } catch (err) {
    console.error("Erro ao salvar histórico de pacote:", err);
  }
}

/* ======================= Helpers ======================= */
function parsePkgDate(str) {
  if (!str) return null;
  if (str.includes("-")) return parseISODateLocal(str);
  if (str.includes("/")) {
    const [d, m, y] = str.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}

function formatPkgDate(str) {
  if (!str) return "—";
  const d = parsePkgDate(str);
  if (!d || isNaN(d)) return str;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getLessonsInPackage(studentId, packageStart, packageEnd) {
  if (!studentId || !packageStart || !packageEnd) return [];
  const start = parsePkgDate(packageStart);
  const end   = parsePkgDate(packageEnd);
  if (!start || !end) return [];
  end.setHours(23, 59, 59, 999);
  return _ctx.lessons.filter(l => {
    if (l.studentId !== studentId || l.status !== 2) return false;
    const d = parseISODateLocal(l.date);
    return d >= start && d <= end;
  });
}

/* ======================= Modal de histórico ======================= */
export async function openPackageHistory(studentId) {
  const student = _ctx.students.find(s => s.id === studentId);
  if (!student) return;

  // Busca histórico no Firestore
  let history = [];
  try {
    const db  = _ctx.db;
    const ref = collection(db, "alunos", studentId, "pacotes");
    const q   = query(ref, orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    showAlert("Erro ao carregar histórico.", "error");
    return;
  }

  // Cria o modal
  const existing = document.getElementById("pkgHistoryModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "pkgHistoryModal";
  modal.className = "modal";
  modal.style.display = "flex";

  const doneLessons = getLessonsInPackage(studentId, student.packageStart, student.packageEnd);
  const doneRevenue = doneLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price || 0), 0);

  let historyHTML = "";
  if (history.length === 0) {
    historyHTML = `<div class="muted" style="margin-top:8px">Nenhum pacote anterior registrado.</div>`;
  } else {
    for (const pkg of history) {
      const pkgLessons = getLessonsInPackage(studentId, pkg.packageStart, pkg.packageEnd);
      const pkgRevenue = pkgLessons.reduce((acc, l) => acc + parseBRLToNumber(l.price || 0), 0);
      const pct = pkg.totalLessons > 0 ? Math.min(100, Math.round((pkgLessons.length / pkg.totalLessons) * 100)) : 0;
      const savedAt = pkg.savedAt?.toDate ? pkg.savedAt.toDate().toLocaleDateString("pt-BR") : "—";

      historyHTML += `
        <div class="cardx" style="margin-bottom:12px">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <div>
              <div style="font-weight:600">${formatPkgDate(pkg.packageStart)} → ${formatPkgDate(pkg.packageEnd)}</div>
              <div class="muted">Registrado em: ${savedAt}</div>
            </div>
            <div style="text-align:right">
              <div class="pill">${pkgLessons.length} / ${pkg.totalLessons} aulas</div>
              <div style="font-weight:600; margin-top:4px">${formatBRL(pkgRevenue)}</div>
            </div>
          </div>
          <div class="pkgbar" style="margin-top:8px">
            <div class="fill ok" style="width:${pct}%"></div>
          </div>
          ${pkg.notes ? `<div class="muted" style="margin-top:6px">Obs: ${pkg.notes}</div>` : ""}
        </div>`;
    }
  }

  modal.innerHTML = `
    <div class="box" style="max-width:600px; max-height:80vh; overflow-y:auto">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px">
        <h3>Histórico de Pacotes — ${student.name}</h3>
        <button class="btn small" id="btnClosePkgHistory">✕</button>
      </div>

      <div class="cardx" style="margin-bottom:16px; background:var(--accent-soft, #1e1e2e)">
        <div style="font-weight:600; margin-bottom:8px">Pacote Atual</div>
        <div style="display:flex; justify-content:space-between">
          <div>${formatPkgDate(student.packageStart)} → ${formatPkgDate(student.packageEnd)}</div>
          <div class="pill">${doneLessons.length} / ${student.totalLessons || 0} aulas</div>
        </div>
        <div style="font-weight:600; margin-top:4px">${formatBRL(doneRevenue)}</div>
      </div>

      <h4 style="margin-bottom:8px">Pacotes Anteriores</h4>
      ${historyHTML}
    </div>`;

  document.body.appendChild(modal);

  document.getElementById("btnClosePkgHistory").onclick = () => modal.remove();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}