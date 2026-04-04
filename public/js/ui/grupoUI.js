import { $ } from "../utils/uiHelpers.js";
import { showAlert } from "./helpers.js";
import { parseBRLToNumber, formatBRL } from "../utils/formatService.js";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ======================= Contexto injetado ======================= */
let _ctx = {
  get db()   { return null; },
  get user() { return null; }
};

export function initGrupo(ctx) { _ctx = ctx; }

/* ======================= Estado ======================= */
let turmas       = [];
let alunosGrupo  = [];
let matriculas   = [];
let mensalidades = [];
let presencas    = [];
let unsubPresencas = null;
let editingTurmaId   = null;
let editingAlunoId   = null;
let currentTurmaId   = null;
let currentMes = new Date().getMonth();
let currentAno = new Date().getFullYear();
let unsubTurmas      = null;
let unsubAlunos      = null;
let unsubMatriculas  = null;
let unsubMensalidades= null;

/* ======================= Constantes ======================= */
const DIAS   = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const PAPEIS = ["Condutor","Condutora","Conduzido","Conduzida"];
const MESES  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

/* ======================= Listeners Firestore ======================= */
export function attachGrupoListeners() {
  if (!_ctx.user) return;

  // Turmas
  if (unsubTurmas) unsubTurmas();
  unsubTurmas = onSnapshot(
    query(collection(_ctx.db, "turmas"), where("ownerUid","==",_ctx.user.uid), orderBy("createdAt","desc")),
    snap => { turmas = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderTurmas(); },
    err => console.error("Erro listener turmas:", err)
  );

  // Alunos do grupo
  if (unsubAlunos) unsubAlunos();
  unsubAlunos = onSnapshot(
    query(collection(_ctx.db, "alunosGrupo"), where("ownerUid","==",_ctx.user.uid), orderBy("name","asc")),
    snap => { alunosGrupo = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderTurmas(); },
    err => console.error("Erro listener alunosGrupo:", err)
  );

  // Matrículas
  if (unsubMatriculas) unsubMatriculas();
  unsubMatriculas = onSnapshot(
    query(collection(_ctx.db, "matriculas"), where("ownerUid","==",_ctx.user.uid)),
    snap => { matriculas = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderTurmas(); if (currentTurmaId) renderAlunosTurma(currentTurmaId); },
    err => console.error("Erro listener matriculas:", err)
  );

  // Mensalidades
  if (unsubMensalidades) unsubMensalidades();
  unsubMensalidades = onSnapshot(
    query(collection(_ctx.db, "mensalidadesGrupo"), where("ownerUid","==",_ctx.user.uid)),
    snap => { mensalidades = snap.docs.map(d => ({ id: d.id, ...d.data() })); if (currentTurmaId) renderAlunosTurma(currentTurmaId); },
    err => console.error("Erro listener mensalidades:", err)
  );

  if (unsubPresencas) unsubPresencas();
unsubPresencas = onSnapshot(
  query(collection(_ctx.db, "presencas"), where("ownerUid","==",_ctx.user.uid)),
  snap => { presencas = snap.docs.map(d => ({ id: d.id, ...d.data() })); },
  err => console.error("Erro listener presencas:", err)
);

}

export function detachGrupoListeners() {
  unsubTurmas?.(); unsubAlunos?.(); unsubMatriculas?.(); unsubMensalidades?.();unsubPresencas?.();
}

/* ======================= Render Turmas ======================= */
function renderTurmas() {
  const box = $("turmasList"); if (!box) return;
  box.innerHTML = "";

  if (turmas.length === 0) {
    box.innerHTML = `<div class="muted" style="margin-top:16px">Nenhuma turma cadastrada ainda.</div>`;
    return;
  }

  for (const t of turmas) {
    const mats       = matriculas.filter(m => m.turmaId === t.id);
    const condutores = mats.filter(m => ["Condutor","Condutora"].includes(m.papel)).length;
    const conduzidas = mats.filter(m => ["Conduzido","Conduzida"].includes(m.papel)).length;

    const card = document.createElement("div");
    card.className = "turma-card";
    card.innerHTML = `
      <div class="turma-header">
        <div>
          <div class="turma-nome">${t.name || "(sem nome)"}</div>
          <div class="muted">${DIAS[t.dia] || "—"} • ${t.horario || "—"} • Mensalidade padrão: ${formatBRL(parseBRLToNumber(t.mensalidade || 0))}</div>
        </div>
        <div class="turma-status-badge ${t.active !== false ? "ok" : "warn"}">
          ${t.active !== false ? "Ativa" : "Inativa"}
        </div>
      </div>
      <div class="turma-vagas">
        <div class="vaga-item">🕺 Condutores <span class="pill-mini">${condutores} / ${t.capCond || 12}</span></div>
        <div class="vaga-item">💃 Conduzidas <span class="pill-mini">${conduzidas} / ${t.capCond2 || 12}</span></div>
        <div class="vaga-item">👥 Total <span class="pill-mini">${mats.length} / ${(t.capCond||12)+(t.capCond2||12)}</span></div>
      </div>
      ${t.notes ? `<div class="muted turma-notes">${t.notes}</div>` : ""}
      <div class="turma-actions">
        <button class="btn small primary" data-act="alunos">👥 Gerenciar Alunos</button>
<button class="btn small" data-act="chamada">📋 Chamada</button>
        <button class="btn small" data-act="edit">Editar</button>
        <button class="btn small" data-act="del">Excluir</button>
      </div>
      <div class="turma-alunos-panel" id="panel-${t.id}" style="display:none"></div>`;

   card.querySelector('[data-act="alunos"]').onclick   = () => toggleAlunosPanel(t.id);
card.querySelector('[data-act="chamada"]').onclick  = () => openChamadaModal(t.id);
card.querySelector('[data-act="edit"]').onclick     = () => editTurma(t);
card.querySelector('[data-act="del"]').onclick      = () => deleteTurma(t.id, t.name);
    box.appendChild(card);
  }

  if (currentTurmaId) {
    const panel = document.getElementById(`panel-${currentTurmaId}`);
    if (panel) { panel.style.display = "block"; renderAlunosTurma(currentTurmaId); }
  }
}

/* ======================= Painel de Alunos da Turma ======================= */
function toggleAlunosPanel(turmaId) {
  if (currentTurmaId === turmaId) {
    currentTurmaId = null;
    const panel = document.getElementById(`panel-${turmaId}`);
    if (panel) panel.style.display = "none";
    return;
  }
  if (currentTurmaId) {
    const old = document.getElementById(`panel-${currentTurmaId}`);
    if (old) old.style.display = "none";
  }
  currentTurmaId = turmaId;
  const panel = document.getElementById(`panel-${turmaId}`);
  if (panel) { panel.style.display = "block"; renderAlunosTurma(turmaId); }
}

function getMesAno() {
  const now = new Date();
  return { mes: now.getMonth(), ano: now.getFullYear() };
}

function renderAlunosTurma(turmaId) {
  const panel = document.getElementById(`panel-${turmaId}`); if (!panel) return;
  const turma = turmas.find(t => t.id === turmaId);
  const mats  = matriculas.filter(m => m.turmaId === turmaId);
  const mes = currentMes;
const ano = currentAno;
  let html = `
    <div class="painel-header">
      <h4>Alunos — ${turma?.name || ""}</h4>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
  <button class="btn small" id="btnMesAnterior-${turmaId}">◀</button>
  <span class="muted" style="min-width:120px; text-align:center">${MESES[mes]} ${ano}</span>
  <button class="btn small" id="btnMesProximo-${turmaId}">▶</button>
  <button class="btn small primary" id="btnMatricular-${turmaId}">+ Matricular Aluno</button>
</div>
    </div>`;

  if (mats.length === 0) {
    html += `<div class="muted" style="margin:12px 0">Nenhum aluno matriculado nesta turma.</div>`;
  } else {
    // Agrupa por papel
    const grupos = [
      { label: "🕺 Condutores / Condutoras", papeis: ["Condutor","Condutora"] },
      { label: "💃 Conduzidos / Conduzidas", papeis: ["Conduzido","Conduzida"] },
    ];

    for (const grupo of grupos) {
      const gmats = mats.filter(m => grupo.papeis.includes(m.papel));
      if (gmats.length === 0) continue;
      html += `<div class="grupo-papel-label">${grupo.label}</div>`;
      for (const mat of gmats) {
        const aluno = alunosGrupo.find(a => a.id === mat.alunoId);
        const mens  = mensalidades.find(m => m.matriculaId === mat.id && m.mes === mes && m.ano === ano);
        const pago  = mens?.status === "pago";
        html += `
          <div class="aluno-mat-card">
            <div class="aluno-mat-info">
              <div class="aluno-mat-nome">${aluno?.name || "(Aluno)"}</div>
              <div class="muted">${mat.papel} • ${mat.tipo === "bolsista" ? "Bolsista" : "Pagante"} • ${formatBRL(parseBRLToNumber(mat.mensalidade || 0))}/mês</div>
              ${aluno?.phone ? `<div class="muted">${aluno.phone}</div>` : ""}
            </div>
            <div class="aluno-mat-actions">
  <button class="btn small ${pago ? "ok-btn" : "warn-btn"}" data-mens="${mat.id}" data-pago="${pago}">
    ${pago ? "✓ Pago" : "Pendente"}
  </button>
  <button class="btn small" data-editmat="${mat.id}" data-alunoId="${mat.alunoId}">Editar</button>
  <button class="btn small" data-desmat="${mat.id}">Remover</button>
</div>
          </div>`;
      }
    }
  }

  panel.innerHTML = html;

  document.getElementById(`btnMatricular-${turmaId}`)?.addEventListener("click", () => openMatricularModal(turmaId));


document.getElementById(`btnMesAnterior-${turmaId}`)?.addEventListener("click", () => {
  if (currentMes === 0) { currentMes = 11; currentAno--; }
  else { currentMes--; }
  renderAlunosTurma(turmaId);
});

document.getElementById(`btnMesProximo-${turmaId}`)?.addEventListener("click", () => {
  if (currentMes === 11) { currentMes = 0; currentAno++; }
  else { currentMes++; }
  renderAlunosTurma(turmaId);
});

  panel.querySelectorAll("[data-mens]").forEach(btn => {
    btn.addEventListener("click", () => toggleMensalidade(btn.dataset.mens, btn.dataset.pago === "true", mes, ano));
  });

  panel.querySelectorAll("[data-desmat]").forEach(btn => {
    btn.addEventListener("click", () => desmatricular(btn.dataset.desmat));
  });

  panel.querySelectorAll("[data-editmat]").forEach(btn => {
  btn.addEventListener("click", () => openEditAlunoModal(btn.dataset.editmat, btn.dataset.alunoid));
});
}

/* ======================= Mensalidade ======================= */
async function toggleMensalidade(matriculaId, isPago, mes, ano) {
  const novoStatus = isPago ? "pendente" : "pago";
  const existing   = mensalidades.find(m => m.matriculaId === matriculaId && m.mes === mes && m.ano === ano);
  try {
    if (existing) {
      await updateDoc(doc(_ctx.db, "mensalidadesGrupo", existing.id), { status: novoStatus, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(_ctx.db, "mensalidadesGrupo"), {
        matriculaId, mes, ano, status: novoStatus,
        ownerUid: _ctx.user?.uid || "dev",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
    }
  } catch (err) { console.error(err); showAlert("Erro ao atualizar mensalidade.", "error"); }
}

/* ======================= Desmatricular ======================= */
async function desmatricular(matriculaId) {
  if (!confirm("Remover este aluno da turma?")) return;
  try {
    await deleteDoc(doc(_ctx.db, "matriculas", matriculaId));
    showAlert("Aluno removido da turma.");
  } catch (err) { console.error(err); showAlert("Erro ao remover aluno.", "error"); }
}

/* ======================= Modal Matricular ======================= */
function openMatricularModal(turmaId) {
  const turma = turmas.find(t => t.id === turmaId);
  const existing = document.getElementById("matricularModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "matricularModal";
  modal.className = "modal";
  modal.style.display = "flex";

  const alunosOpts = alunosGrupo.map(a => `<option value="${a.id}">${a.name}</option>`).join("");

  modal.innerHTML = `
    <div class="box" style="max-width:560px">
      <div class="modal-title-row">
        <h3>Matricular em — ${turma?.name || ""}</h3>
        <button class="btn small" id="btnCloseMatricular">✕</button>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-weight:600">Aluno existente ou novo?</label>
        <div style="display:flex; gap:8px; margin-top:8px">
          <button class="btn small" id="btnUseExisting">Aluno existente</button>
          <button class="btn small primary" id="btnUseNew">+ Cadastrar novo</button>
        </div>
      </div>

      <div id="existingWrap">
        <label>Selecione o aluno</label>
        <select id="matAlunoSelect">
          <option value="">Selecione…</option>
          ${alunosOpts}
        </select>
      </div>

      <div id="newAlunoWrap" style="display:none">
        <div class="grid2">
          <div><label>Nome</label><input id="newAlunoName" placeholder="Nome completo"></div>
          <div><label>Telefone</label><input id="newAlunoPhone" placeholder="(21) 9xxxx-xxxx"></div>
        </div>
        <div><label>E-mail</label><input id="newAlunoEmail" placeholder="email@exemplo.com"></div>
      </div>

      <div class="grid2" style="margin-top:12px">
        <div>
          <label>Papel</label>
          <select id="matPapel">
            ${PAPEIS.map(p => `<option value="${p}">${p}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Tipo</label>
          <select id="matTipo">
            <option value="pagante">Pagante</option>
            <option value="bolsista">Bolsista</option>
          </select>
        </div>
      </div>

      <div style="margin-top:12px">
        <label>Mensalidade individual (R$)</label>
        <input id="matMensalidade" type="text" placeholder="${turma?.mensalidade || '0,00'}" value="${turma?.mensalidade || ''}">
        <div class="muted" style="margin-top:4px">Deixe vazio para usar o valor padrão da turma</div>
      </div>

      <div class="actions" style="margin-top:16px">
        <button class="btn primary" id="btnConfirmarMatricula">Confirmar Matrícula</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  let useNew = false;
  document.getElementById("btnUseExisting").onclick = () => {
    useNew = false;
    document.getElementById("existingWrap").style.display = "block";
    document.getElementById("newAlunoWrap").style.display = "none";
  };
  document.getElementById("btnUseNew").onclick = () => {
    useNew = true;
    document.getElementById("existingWrap").style.display = "none";
    document.getElementById("newAlunoWrap").style.display = "block";
  };
  document.getElementById("btnCloseMatricular").onclick = () => modal.remove();
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  document.getElementById("btnConfirmarMatricula").onclick = () => confirmarMatricula(turmaId, turma, useNew, modal);
}

async function confirmarMatricula(turmaId, turma, useNew, modal) {
  const papel       = document.getElementById("matPapel")?.value;
  const tipo        = document.getElementById("matTipo")?.value;
  const mensalidade = document.getElementById("matMensalidade")?.value || turma?.mensalidade || "0";

  let alunoId = null;

  try {
    if (useNew) {
      const name  = document.getElementById("newAlunoName")?.value.trim();
      const phone = document.getElementById("newAlunoPhone")?.value.trim();
      const email = document.getElementById("newAlunoEmail")?.value.trim();
      if (!name) { showAlert("Informe o nome do aluno.", "error"); return; }
      const ref = await addDoc(collection(_ctx.db, "alunosGrupo"), {
        name, phone, email,
        ownerUid:  _ctx.user?.uid || "dev",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      alunoId = ref.id;
    } else {
      alunoId = document.getElementById("matAlunoSelect")?.value;
      if (!alunoId) { showAlert("Selecione um aluno.", "error"); return; }
    }

    // Verifica se já matriculado
    const jaMatriculado = matriculas.find(m => m.turmaId === turmaId && m.alunoId === alunoId);
    if (jaMatriculado) { showAlert("Aluno já matriculado nesta turma.", "error"); return; }

    await addDoc(collection(_ctx.db, "matriculas"), {
      turmaId, alunoId, papel, tipo, mensalidade,
      ownerUid:  _ctx.user?.uid || "dev",
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });

    showAlert("Aluno matriculado com sucesso.");
    modal.remove();
  } catch (err) {
    console.error(err);
    showAlert("Erro ao matricular aluno.", "error");
  }
}

/* ======================= CRUD Turmas ======================= */
export function bindTurmaForm() {
  const btnToggle = $("btnToggleTurmaForm");
  const formWrap  = document.getElementById("turmaFormWrap");

  if (btnToggle && formWrap) {
    btnToggle.addEventListener("click", () => {
      const isOpen = formWrap.classList.contains("form-open");
      formWrap.classList.toggle("form-open",     !isOpen);
      formWrap.classList.toggle("form-collapsed", isOpen);
      btnToggle.textContent = isOpen ? "+ Nova Turma" : "Fechar";
      if (isOpen) clearTurmaForm();
    });
  }

  $("btnSaveTurma")?.addEventListener("click", saveTurma);
  $("btnClearTurma")?.addEventListener("click", clearTurmaForm);
}

async function saveTurma() {
  const name = $("turmaName")?.value.trim();
  if (!name) { showAlert("Informe o nome da turma.", "error"); return; }

  const payload = {
    name,
    dia:         +($("turmaDia")?.value   ?? 5),
    horario:     $("turmaHorario")?.value || "20:00",
    capCond:     +($("turmaCapCond")?.value  || 12),
    capCond2:    +($("turmaCapCond2")?.value || 12),
    mensalidade: $("turmaMensalidade")?.value || "0",
    active:      $("turmaStatus")?.value === "true",
    notes:       $("turmaNotes")?.value || "",
    ownerUid:    _ctx.user?.uid || "dev",
    updatedAt:   serverTimestamp()
  };

  try {
    if (editingTurmaId) {
      await updateDoc(doc(_ctx.db, "turmas", editingTurmaId), payload);
      showAlert("Turma atualizada.");
    } else {
      await addDoc(collection(_ctx.db, "turmas"), { ...payload, createdAt: serverTimestamp() });
      showAlert("Turma criada com sucesso.");
    }
    clearTurmaForm();
    const formWrap = document.getElementById("turmaFormWrap");
    formWrap?.classList.remove("form-open");
    formWrap?.classList.add("form-collapsed");
    $("btnToggleTurmaForm").textContent = "+ Nova Turma";
  } catch (err) { console.error(err); showAlert("Erro ao salvar turma.", "error"); }
}

function editTurma(t) {
  editingTurmaId = t.id;
  if ($("turmaName"))        $("turmaName").value        = t.name || "";
  if ($("turmaDia"))         $("turmaDia").value         = String(t.dia ?? 5);
  if ($("turmaHorario"))     $("turmaHorario").value     = t.horario || "20:00";
  if ($("turmaCapCond"))     $("turmaCapCond").value     = t.capCond || 12;
  if ($("turmaCapCond2"))    $("turmaCapCond2").value    = t.capCond2 || 12;
  if ($("turmaMensalidade")) $("turmaMensalidade").value = t.mensalidade || "0";
  if ($("turmaStatus"))      $("turmaStatus").value      = String(t.active !== false);
  if ($("turmaNotes"))       $("turmaNotes").value       = t.notes || "";
  const formWrap = document.getElementById("turmaFormWrap");
  formWrap?.classList.add("form-open");
  formWrap?.classList.remove("form-collapsed");
  $("btnToggleTurmaForm").textContent = "Fechar";
  showAlert("Modo edição: " + t.name);
}

async function deleteTurma(id, name) {
  if (!confirm(`Excluir a turma "${name}"? Esta ação é permanente.`)) return;
  try {
    await deleteDoc(doc(_ctx.db, "turmas", id));
    showAlert("Turma excluída.");
  } catch (err) { console.error(err); showAlert("Erro ao excluir turma.", "error"); }
}

function clearTurmaForm() {
  if ($("turmaName"))        $("turmaName").value        = "";
  if ($("turmaDia"))         $("turmaDia").value         = "5";
  if ($("turmaHorario"))     $("turmaHorario").value     = "20:00";
  if ($("turmaCapCond"))     $("turmaCapCond").value     = "12";
  if ($("turmaCapCond2"))    $("turmaCapCond2").value    = "12";
  if ($("turmaMensalidade")) $("turmaMensalidade").value = "";
  if ($("turmaStatus"))      $("turmaStatus").value      = "true";
  if ($("turmaNotes"))       $("turmaNotes").value       = "";
  editingTurmaId = null;
}

function openEditAlunoModal(matriculaId, alunoId) {
  const aluno = alunosGrupo.find(a => a.id === alunoId);
  const mat   = matriculas.find(m => m.id === matriculaId);
  if (!aluno || !mat) return;

  const existing = document.getElementById("editAlunoModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "editAlunoModal";
  modal.className = "modal";
  modal.style.display = "flex";

  modal.innerHTML = `
    <div class="box" style="max-width:560px">
      <div class="modal-title-row">
        <h3>Editar Aluno — ${aluno.name}</h3>
        <button class="btn small" id="btnCloseEditAluno">✕</button>
      </div>
      <div class="grid2">
        <div><label>Nome</label><input id="editAlunoName" value="${aluno.name || ""}"></div>
        <div><label>Telefone</label><input id="editAlunoPhone" value="${aluno.phone || ""}"></div>
      </div>
      <div><label>E-mail</label><input id="editAlunoEmail" value="${aluno.email || ""}"></div>
      <div class="grid2" style="margin-top:12px">
        <div>
          <label>Papel</label>
          <select id="editMatPapel">
            ${PAPEIS.map(p => `<option value="${p}" ${mat.papel === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Tipo</label>
          <select id="editMatTipo">
            <option value="pagante" ${mat.tipo === "pagante" ? "selected" : ""}>Pagante</option>
            <option value="bolsista" ${mat.tipo === "bolsista" ? "selected" : ""}>Bolsista</option>
          </select>
        </div>
      </div>
      <div style="margin-top:12px">
        <label>Mensalidade individual (R$)</label>
        <input id="editMatMensalidade" value="${mat.mensalidade || ""}">
      </div>
      <div class="actions" style="margin-top:16px">
        <button class="btn primary" id="btnSaveEditAluno">Salvar</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  document.getElementById("btnCloseEditAluno").onclick = () => modal.remove();
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  document.getElementById("btnSaveEditAluno").onclick = async () => {
    const name  = document.getElementById("editAlunoName")?.value.trim();
    if (!name) { showAlert("Informe o nome.", "error"); return; }
    try {
      await updateDoc(doc(_ctx.db, "alunosGrupo", alunoId), {
        name,
        phone: document.getElementById("editAlunoPhone")?.value.trim() || "",
        email: document.getElementById("editAlunoEmail")?.value.trim() || "",
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(_ctx.db, "matriculas", matriculaId), {
        papel:       document.getElementById("editMatPapel")?.value,
        tipo:        document.getElementById("editMatTipo")?.value,
        mensalidade: document.getElementById("editMatMensalidade")?.value || "0",
        updatedAt:   serverTimestamp()
      });
      showAlert("Aluno atualizado.");
      modal.remove();
    } catch (err) {
      console.error(err);
      showAlert("Erro ao atualizar aluno.", "error");
    }
  };
}

/* ======================= Chamada ======================= */
function getProximaSexta() {
  const hoje = new Date();
  const dia  = hoje.getDay();
  const diff = dia <= 5 ? 5 - dia : 6;
  const sexta = new Date(hoje);
  sexta.setDate(hoje.getDate() + (dia === 5 ? 0 : diff));
  return sexta.toISOString().slice(0, 10);
}

function openChamadaModal(turmaId) {
  const turma = turmas.find(t => t.id === turmaId);
  const mats  = matriculas.filter(m => m.turmaId === turmaId && m.status !== "trancado");

  const existing = document.getElementById("chamadaModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "chamadaModal";
  modal.className = "modal";
  modal.style.display = "flex";

  const dataDefault = getProximaSexta();

  modal.innerHTML = `
    <div class="box" style="max-width:640px">
      <div class="modal-title-row">
        <h3>Chamada — ${turma?.name || ""}</h3>
        <button class="btn small" id="btnCloseChamada">✕</button>
      </div>

      <div style="display:flex; gap:12px; align-items:flex-end; margin-bottom:16px; flex-wrap:wrap">
        <div style="flex:1">
          <label>Data da Aula</label>
          <input type="date" id="chamadaData" value="${dataDefault}">
        </div>
        <button class="btn small" id="btnCarregarChamada">Carregar / Nova</button>
      </div>

      <div id="chamadaLista"></div>

      <div class="actions" style="margin-top:16px">
        <button class="btn primary" id="btnSalvarChamada">Salvar Chamada</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  document.getElementById("btnCloseChamada").onclick = () => modal.remove();
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });

  // Estado temporário da chamada
  let chamadaState = {};
  mats.forEach(m => { chamadaState[m.id] = "presente"; });

  function renderChamadaLista(data) {
    const lista = document.getElementById("chamadaLista");
    if (!lista) return;

    // Verifica se já existe chamada salva para esta data
    const existentes = presencas.filter(p => p.turmaId === turmaId && p.data === data);
    if (existentes.length > 0) {
      existentes.forEach(p => { chamadaState[p.matriculaId] = p.status; });
    }

    const grupos = [
      { label: "🕺 Condutores / Condutoras", papeis: ["Condutor","Condutora"] },
      { label: "💃 Conduzidos / Conduzidas", papeis: ["Conduzido","Conduzida"] },
    ];

    let html = "";
    for (const grupo of grupos) {
      const gmats = mats.filter(m => grupo.papeis.includes(m.papel));
      if (gmats.length === 0) continue;
      html += `<div class="grupo-papel-label">${grupo.label}</div>`;
      for (const mat of gmats) {
        const aluno  = alunosGrupo.find(a => a.id === mat.alunoId);
        const status = chamadaState[mat.id] || "presente";
        html += `
          <div class="chamada-row">
            <div class="chamada-nome">${aluno?.name || "(Aluno)"}</div>
            <div class="chamada-btns">
              <button class="btn small chamada-opt ${status === "presente"   ? "chamada-presente"   : ""}" data-mat="${mat.id}" data-val="presente">✓ Presente</button>
              <button class="btn small chamada-opt ${status === "ausente"    ? "chamada-ausente"    : ""}" data-mat="${mat.id}" data-val="ausente">✗ Ausente</button>
              <button class="btn small chamada-opt ${status === "justificado"? "chamada-justificado": ""}" data-mat="${mat.id}" data-val="justificado">~ Justificado</button>
            </div>
          </div>`;
      }
    }

    if (mats.length === 0) html = `<div class="muted">Nenhum aluno ativo nesta turma.</div>`;
    lista.innerHTML = html;

    lista.querySelectorAll(".chamada-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        const matId = btn.dataset.mat;
        const val   = btn.dataset.val;
        chamadaState[matId] = val;
        lista.querySelectorAll(`[data-mat="${matId}"]`).forEach(b => {
          b.classList.remove("chamada-presente","chamada-ausente","chamada-justificado");
        });
        btn.classList.add(`chamada-${val}`);
      });
    });
  }

  renderChamadaLista(dataDefault);

  document.getElementById("btnCarregarChamada").onclick = () => {
    const data = document.getElementById("chamadaData")?.value;
    if (data) renderChamadaLista(data);
  };

  document.getElementById("btnSalvarChamada").onclick = async () => {
    const data = document.getElementById("chamadaData")?.value;
    if (!data) { showAlert("Informe a data da aula.", "error"); return; }
    try {
      for (const [matriculaId, status] of Object.entries(chamadaState)) {
        const existing = presencas.find(p => p.turmaId === turmaId && p.matriculaId === matriculaId && p.data === data);
        if (existing) {
          await updateDoc(doc(_ctx.db, "presencas", existing.id), { status, updatedAt: serverTimestamp() });
        } else {
          await addDoc(collection(_ctx.db, "presencas"), {
            turmaId, matriculaId, data, status,
            ownerUid:  _ctx.user?.uid || "dev",
            createdAt: serverTimestamp(), updatedAt: serverTimestamp()
          });
        }
      }
      showAlert("Chamada salva com sucesso.");
      modal.remove();
    } catch (err) {
      console.error(err);
      showAlert("Erro ao salvar chamada.", "error");
    }
  };
}