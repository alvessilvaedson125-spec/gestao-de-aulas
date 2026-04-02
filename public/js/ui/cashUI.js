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
  onUpdate: ()=>{}
};

export function initCash(ctx) {
  _ctx = ctx;
}

/* ======================= Salvar entrada ======================= */
export function bindCashButton() {
  const btn = document.getElementById("btnSaveCash");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", async () => {
    const data      = document.getElementById("cashDate")?.value;
    const valorRaw  = document.getElementById("cashAmount")?.value;
    const categoria = document.getElementById("cashCategory")?.value;
    const descricao = document.getElementById("cashDescription")?.value?.trim();
    if (!data || !valorRaw || !descricao) {
      showAlert("Preencha Data, Valor e Descrição.", "error");
      return;
    }
    try {
      await addDoc(_ctx.colCash, {
        data:      new Date(data),
        valor:     parseBRLToNumber(valorRaw),
        categoria: categoria || null,
        descricao,
        criadoEm:  serverTimestamp(),
        ownerUid:  _ctx.user?.uid || "dev"
      });
      showAlert("Entrada registrada no Caixa.");
      document.getElementById("cashDate").value        = "";
      document.getElementById("cashAmount").value      = "";
      document.getElementById("cashDescription").value = "";
    } catch (err) {
      console.error("Erro ao salvar Caixa:", err);
      showAlert("Erro ao salvar entrada.", "error");
    }
  });
}

/* ======================= Listar entradas ======================= */
export function renderCashEntries(cashEntries) {
  const container = document.getElementById("cashList");
  if (!container) return;
  container.innerHTML = "";
  if (!cashEntries.length) {
    container.innerHTML = `<div class="muted">Nenhuma entrada registrada.</div>`;
    return;
  }
  for (const item of cashEntries) {
    const data = item.data?.toDate ? item.data.toDate() : new Date(item.data);
    const card = document.createElement("div");
    card.className = "cardx"; card.style.marginBottom = "12px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center">
        <div>
          <div><b>${item.descricao}</b></div>
          <div class="muted">${data.toLocaleDateString("pt-BR")} • ${item.categoria||"—"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600">${formatBRL(item.valor)}</div>
          <button class="btn small danger" data-id="${item.id}">Excluir</button>
        </div>
      </div>`;
    container.appendChild(card);
  }
  container.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Excluir esta entrada?")) return;
      await deleteDoc(doc(_ctx.db, "caixa", id));
    });
  });
}