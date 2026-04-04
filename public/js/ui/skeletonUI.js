/* ======================= Skeleton Loaders ======================= */

/* Agenda — skeleton do calendário */
function skeletonCalendar() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-line title"></div>
      <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-top:12px">
        ${Array(35).fill(0).map((_, i) => `
          <div class="skeleton" style="height:clamp(60px,12vw,100px); border-radius:12px; animation-delay:${(i * 0.03).toFixed(2)}s"></div>
        `).join("")}
      </div>
    </div>`;
}

/* Alunos — skeleton de cards */
function skeletonStudents(count = 4) {
  return Array(count).fill(0).map((_, i) => `
    <div class="skeleton-card" style="animation-delay:${(i * 0.1).toFixed(1)}s">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <div style="flex:1">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton" style="width:80px; height:24px; border-radius:999px"></div>
      </div>
      <div class="skeleton" style="height:8px; border-radius:999px; width:100%"></div>
      <div style="display:flex; gap:8px; margin-top:12px">
        ${Array(3).fill(0).map(() => `<div class="skeleton" style="width:70px; height:28px; border-radius:8px"></div>`).join("")}
      </div>
    </div>`).join("");
}

/* Relatórios — skeleton dos KPIs */
function skeletonKPIs(count = 8) {
  return `
    <div class="skeleton-kpi">
      ${Array(count).fill(0).map((_, i) => `
        <div class="skeleton-kpi-card" style="animation-delay:${(i * 0.06).toFixed(2)}s">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium" style="height:24px"></div>
        </div>
      `).join("")}
    </div>
    <div class="skeleton-bar">
      ${Array(12).fill(0).map((_, i) => `
        <div class="skeleton-bar-item" style="height:${20 + Math.random() * 60}%; animation-delay:${(i * 0.05).toFixed(2)}s"></div>
      `).join("")}
    </div>`;
}

/* Evolução — skeleton da árvore e lista */
function skeletonEvolution() {
  return `
    <div style="display:grid; grid-template-columns:280px 1fr; gap:18px; margin-top:16px">
      <div class="skeleton-card">
        <div class="skeleton-line title"></div>
        ${Array(6).fill(0).map((_, i) => `
          <div class="skeleton-line ${i % 2 === 0 ? "medium" : "short"}" style="animation-delay:${(i*0.08).toFixed(2)}s"></div>
        `).join("")}
      </div>
      <div>
        ${Array(3).fill(0).map((_, i) => `
          <div class="skeleton-card" style="animation-delay:${(i*0.12).toFixed(2)}s">
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line full"></div>
          </div>
        `).join("")}
      </div>
    </div>`;
}

/* Grupo — skeleton de turmas */
function skeletonGrupo(count = 2) {
  return Array(count).fill(0).map((_, i) => `
    <div class="skeleton-card" style="animation-delay:${(i*0.15).toFixed(2)}s">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px">
        <div style="flex:1">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton" style="width:60px; height:24px; border-radius:999px"></div>
      </div>
      <div style="display:flex; gap:16px; margin-bottom:10px">
        ${Array(3).fill(0).map(() => `<div class="skeleton" style="width:100px; height:24px; border-radius:999px"></div>`).join("")}
      </div>
      <div style="display:flex; gap:8px">
        ${Array(3).fill(0).map(() => `<div class="skeleton" style="width:80px; height:28px; border-radius:8px"></div>`).join("")}
      </div>
    </div>`).join("");
}

/* ======================= API pública ======================= */
export function showSkeleton(sectionId) {
  const map = {
    agenda:     skeletonCalendar(),
    alunos:     `<div style="margin-top:14px">${skeletonStudents(4)}</div>`,
    evolucao:   skeletonEvolution(),
    relatorios: skeletonKPIs(8),
    grupo:      `<div style="margin-top:16px">${skeletonGrupo(2)}</div>`,
  };

  const section = document.getElementById(sectionId);
  if (!section) return;

  const skeletonId = `skeleton-${sectionId}`;
  if (document.getElementById(skeletonId)) return; // já existe

  const wrapper = document.createElement("div");
  wrapper.id = skeletonId;
  wrapper.innerHTML = map[sectionId] || "";
  section.appendChild(wrapper);
}

export function hideSkeleton(sectionId) {
  const el = document.getElementById(`skeleton-${sectionId}`);
  if (el) el.remove();
}

export function showAllSkeletons() {
  ["agenda","alunos","evolucao","relatorios","grupo"].forEach(showSkeleton);
}

export function hideAllSkeletons() {
  ["agenda","alunos","evolucao","relatorios","grupo"].forEach(hideSkeleton);
}