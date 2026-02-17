/**
 * Testa a filtragem de aulas "Confirmadas" (status = 1) na Agenda.
 * Aqui usamos um DOM mínimo e uma versão reduzida de renderUpcoming
 * só para validar a lógica de filtragem por status.
 */

test("Agenda - filtro: mostra apenas aulas Confirmadas", () => {
  // --- DOM mínimo necessário ---
  document.body.innerHTML = `
    <select id="upcomingRange"><option value="30" selected>30</option></select>
    <select id="filterStudent"><option value=""></option></select>
    <select id="filterStatus"><option value="1" selected>Confirmada</option></select>
    <div id="upcomingList"></div>
  `;

  // --- helpers (mesmos contratos do app) ---
  const pad2 = (n)=> String(n).padStart(2,'0');
  const parseISODateLocal = (iso)=>{
    if (!iso) return new Date(NaN);
    const [datePart, timePart = "00:00"] = String(iso).split("T");
    const [Y, M, D] = datePart.split("-").map(Number);
    const [h, m] = timePart.split(":").map(Number);
    return new Date(Y, (M || 1) - 1, (D || 1), h || 0, m || 0, 0);
  };
  const fmtBRL = (n)=> (Number(n||0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  // --- dados de exemplo ---
  const students = [{ id:"s1", name:"Ana" }];
  const base = new Date(); // hoje
  const inDays = (d)=> {
    const x = new Date(base);
    x.setDate(x.getDate()+d);
    return `${x.getFullYear()}-${pad2(x.getMonth()+1)}-${pad2(x.getDate())}T10:00`;
  };

  const lessons = [
    { id:"a1", studentId:"s1", date: inDays(1),  status: 1, style:"Samba", level:"Iniciante", place:"Estúdio", price:100 }, // Confirmada
    { id:"a2", studentId:"s1", date: inDays(2),  status: 0, style:"Samba", level:"Iniciante", place:"Estúdio", price:100 }, // Agendada
    { id:"a3", studentId:"s1", date: inDays(40), status: 1, style:"Samba", level:"Iniciante", place:"Estúdio", price:100 }, // fora do range (30 dias)
  ];

  // --- versão reduzida do renderUpcoming focada no filtro por status ---
  function renderUpcoming(){
    const days = +document.getElementById("upcomingRange").value || 30;
    const s = document.getElementById("filterStudent").value || "";
    const t = document.getElementById("filterStatus").value || "";

    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(start); end.setDate(end.getDate() + days);

    const items = lessons
      .filter(l => {
        const d = parseISODateLocal(l.date);
        return d >= start && d < end;
      })
      .filter(l => !s || l.studentId === s)
      .filter(l => !t || String(l.status) === String(t))
      .sort((a,b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

    const box = document.getElementById("upcomingList");
    if (!items.length){
      box.innerHTML = `<div class="muted">Sem aulas neste período.</div>`;
      return;
    }

    box.innerHTML = "";
    for (const a of items){
      const st  = students.find(s=>s.id===a.studentId);
      const nm  = st?.name || "(Aluno)";
      const stat= ["Agendada","Confirmada","Realizada","Cancelada"][a.status||0];
      const d   = parseISODateLocal(a.date);

      const row = document.createElement("div");
      row.className="upcoming-row";
      row.textContent = `${nm} • ${d.toISOString()} • ${stat} • ${fmtBRL(a.price||0)}`;
      box.appendChild(row);
    }
  }

  // executa
  renderUpcoming();

  // valida: só 1 item (aula confirmada dentro de 30 dias)
  const rows = [...document.querySelectorAll("#upcomingList .upcoming-row")];
  expect(rows.length).toBe(1);
  expect(rows[0].textContent).toContain("Ana");
  expect(rows[0].textContent).toContain("Confirmada");
});
