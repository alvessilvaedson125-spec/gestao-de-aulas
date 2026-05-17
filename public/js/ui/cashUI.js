import { formatBRL, parseBRLToNumber } from "../utils/formatService.js";
import { $ } from "../utils/uiHelpers.js";
import { showAlert } from "./helpers.js";
import {
  collection, addDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get db()      { return null; },
  get user()    { return null; },
  get colCash() { return null; },
};

export function initCash(ctx) { _ctx = ctx; }

let _cashMes = new Date().getMonth();
let _cashAno = new Date().getFullYear();

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export function bindCashNav(onFilter) {
  const btnAnterior = document.getElementById("btnCashMesAnterior");
  const btnProximo  = document.getElementById("btnCashMesProximo");
  const label       = document.getElementById("cashMesLabel");

  function updateLabel() {
    if (label) label.textContent = `${MESES[_cashMes]} ${_cashAno}`;
  }

  updateLabel();

  btnAnterior?.addEventListener("click", () => {
    if (_cashMes === 0) { _cashMes = 11; _cashAno--; }
    else { _cashMes--; }
    updateLabel();
    onFilter(_cashMes, _cashAno);
  });

  btnProximo?.addEventListener("click", () => {
    if (_cashMes === 11) { _cashMes = 0; _cashAno++; }
    else { _cashMes++; }
    updateLabel();
    onFilter(_cashMes, _cashAno);
  });
}

export function getCashMesAno() {
  return { mes: _cashMes, ano: _cashAno };
}

/* ======================= Categorias ======================= */
const CATEGORIAS_ENTRADA = ["grupo", "workshop", "aulao", "outros"];
const CATEGORIAS_SAIDA   = ["aluguel", "material", "transporte", "outros"];
const LABEL_CATEGORIA = {
  grupo:      "Aulas em grupo",
  workshop:   "Workshop",
  aulao:      "Aulão",
  aluguel:    "Aluguel de sala",
  material:   "Material didático",
  transporte: "Transporte",
  outros:     "Outros",
};

/* ======================= Bind do formulário ======================= */
export function bindCashButton() {
  const btn     = document.getElementById("btnSaveCash");
  const tipoSel = document.getElementById("cashTipo");

  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  // Atualiza categorias ao mudar tipo
  tipoSel?.addEventListener("change", () => updateCashCategories(tipoSel.value));
  updateCashCategories(tipoSel?.value || "entrada");

  btn.addEventListener("click", async () => {
    const tipo      = document.getElementById("cashTipo")?.value || "entrada";
    const data      = document.getElementById("cashDate")?.value;
    const valorRaw  = document.getElementById("cashAmount")?.value;
    const categoria = document.getElementById("cashCategory")?.value;
    const descricao = document.getElementById("cashDescription")?.value?.trim();

    if (!data)     { showAlert("Informe a data.", "error"); return; }
    if (!valorRaw) { showAlert("Informe o valor.", "error"); return; }
    if (!descricao){ showAlert("Informe a descrição.", "error"); return; }

    try {
      const [dy, dm, dd] = data.split("-");
      await addDoc(_ctx.colCash, {
        tipo,
        data:      new Date(+dy, +dm - 1, +dd),
        valor:     parseBRLToNumber(valorRaw),
        categoria: categoria || null,
        descricao,
        criadoEm:  serverTimestamp(),
        ownerUid:  _ctx.user?.uid || "dev"
      });
      showAlert(tipo === "entrada" ? "Entrada registrada." : "Saída registrada.");
      document.getElementById("cashDate").value        = "";
      document.getElementById("cashAmount").value      = "";
      document.getElementById("cashDescription").value = "";
    } catch (err) {
      console.error("Erro ao salvar Caixa:", err);
      showAlert("Erro ao salvar lançamento.", "error");
    }
  });
}

function updateCashCategories(tipo) {
  const sel  = document.getElementById("cashCategory"); if (!sel) return;
  const cats = tipo === "saida" ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA;
  sel.innerHTML = cats.map(c => `<option value="${c}">${LABEL_CATEGORIA[c]}</option>`).join("");
}

/* ======================= Listar lançamentos ======================= */
export function renderCashEntries(cashEntries) {
  const container = document.getElementById("cashList");
  if (!container) return;
  container.innerHTML = "";

  // Filtra pelo mês/ano atual
  const filtered = cashEntries.filter(e => {
    const d = e.data?.toDate ? e.data.toDate() : new Date(e.data);
    return d.getUTCMonth() === _cashMes && d.getUTCFullYear() === _cashAno;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="muted">Nenhum lançamento em ${MESES[_cashMes]} ${_cashAno}.</div>`;
    return;
  }

  cashEntries = filtered;

  // Totais
  const totalEntradas = cashEntries.filter(e => e.tipo === "entrada").reduce((acc, e) => acc + Number(e.valor || 0), 0);
  const totalSaidas   = cashEntries.filter(e => e.tipo === "saida").reduce((acc, e) => acc + Number(e.valor || 0), 0);
  const saldo         = totalEntradas - totalSaidas;

  container.innerHTML = `
    <div class="cash-resumo">
      <div class="cash-resumo-item">
        <div class="cash-resumo-label">Entradas</div>
        <div class="cash-resumo-valor entrada">${formatBRL(totalEntradas)}</div>
      </div>
      <div class="cash-resumo-item">
        <div class="cash-resumo-label">Saídas</div>
        <div class="cash-resumo-valor saida">${formatBRL(totalSaidas)}</div>
      </div>
      <div class="cash-resumo-item highlight">
        <div class="cash-resumo-label">Saldo</div>
        <div class="cash-resumo-valor ${saldo >= 0 ? "entrada" : "saida"}">${formatBRL(saldo)}</div>
      </div>
    </div>
    <div id="cashListItems"></div>`;

  const listItems = document.getElementById("cashListItems");

  for (const item of cashEntries) {
    const _raw = item.data?.toDate ? item.data.toDate() : new Date(item.data);
    const data = new Date(_raw.getUTCFullYear(), _raw.getUTCMonth(), _raw.getUTCDate());
    const isSaida = item.tipo === "saida";
    const card   = document.createElement("div");
    card.className = "cash-item-card";
    card.innerHTML = `
      <div class="cash-item-left">
        <div class="cash-item-tipo ${isSaida ? "saida" : "entrada"}">
          ${isSaida ? "↓ Saída" : "↑ Entrada"}
        </div>
        <div>
          <div class="cash-item-desc"><b>${item.descricao}</b></div>
          <div class="muted">${data.toLocaleDateString("pt-BR")} • ${LABEL_CATEGORIA[item.categoria] || item.categoria || "—"}</div>
        </div>
      </div>
      <div class="cash-item-right">
        <div class="cash-item-valor ${isSaida ? "saida" : "entrada"}">${isSaida ? "-" : "+"}${formatBRL(item.valor)}</div>
        <button class="btn small" data-id="${item.id}">Excluir</button>
      </div>`;
    listItems.appendChild(card);
  }

  listItems.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir este lançamento?")) return;
      await deleteDoc(doc(_ctx.db, "caixa", btn.dataset.id));
      showAlert("Lançamento excluído.");
    });
  });
}