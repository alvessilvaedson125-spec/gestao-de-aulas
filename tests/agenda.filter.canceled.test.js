/**
 * Agenda - filtro: mostra apenas aulas Canceladas (status = 3)
 * Reaproveita um DOM mínimo e uma versão reduzida de renderUpcoming
 * para validar a lógica de filtragem por status.
 */

test("Agenda - filtro: mostra apenas aulas Canceladas", () => {
  // --- DOM mínimo ---
  document.body.innerHTML = `
    <select id="upcomingRange"><option value="30" selected>30</option></select>
    <select id="filterStudent"><option value=""></option></select>
    <select id="filterStatus"><option value="3" selected>Cancelada</option></select>
    <div id="upcomingList"></div>
  `;

  // --- helpers idênticos aos do app ---
  const pad2 = (n)=> String(n).padStart(2,'0');
  const parseISODateLocal = (iso)=>{
    if (!iso) return new Date(NaN);
    const [datePart, timePart = "00:00"] = String(iso).split("T");
    const [Y, M, D] = datePart.split("-").map(Number);
    const [h, m] = timePart.split(":").map(Number);
    return new Date(Y, (M || 1) - 1, (D || 1), h || 0, m || 0, 0);
  };
  const fmtBRL = (n)=> (Number(n||0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  // --- dados fake ---
  const students = [{ id:"s1", name:"Joana" }];
  const base = new Date();
  const inDays = (d)=> {
    const x = new Date(base);
    x.setDate(x.getDate()+d);
    return `${x.getFullYear()}-${pad2(x.getMonth()+1)}-${pad2(x.getDate())}T19:00`;
  };

  const lessons = [
    { id:"l1", studentId:"s1", date: inDays(1),  status: 3, style:"Samba", place:"Sala A", price:120 }, // ✅ Cancelada
    { id:"l2", studentId:"s1", date: inDays(2),  status: 2, style:"Samba", place:"Sala A", price:120 }, // Realizada
    { id:"l3", studentId:"s1", date: inDays(45), status: 3, style:"Samba", place:"Sala A", price:120 }, // fora do range
  ];

  // --- mini renderUpcoming focado no filtro ---
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

  // executa e valida
  renderUpcoming();
  const rows = [...document.querySelectorAll("#upcomingList .upcoming-row")];
  expect(rows.length).toBe(1);
  expect(rows[0].textContent).toContain("Joana");
  expect(rows[0].textContent).toContain("Cancelada");
});
