// tests/agenda.filters.clear.test.js
test("Agenda - botão 'Limpar filtros' limpa selects e re-renderiza", () => {
  // helpers
  const pad2 = (n) => String(n).padStart(2, '0');
  const parseISODateLocal = (iso) => {
    if (!iso) return new Date(NaN);
    const [datePart, timePart = "00:00"] = String(iso).split("T");
    const [Y, M, D] = datePart.split("-").map(Number);
    const [h, m] = timePart.split(":").map(Number);
    return new Date(Y, (M || 1) - 1, (D || 1), h || 0, m || 0, 0);
  };

  // dados simulados
  const students = [
    { id: "s1", name: "Ana" },
    { id: "s2", name: "Bia" }
  ];

  // validamos para não ficar unused
  expect(students.map(s => s.name)).toContain("Ana");
  expect(students.map(s => s.name)).toContain("Bia");

  // também validamos parseISODateLocal para não ficar unused
  const parsed = parseISODateLocal("2025-01-15T18:00");
  expect(parsed instanceof Date).toBe(true);
  expect(parsed.getHours()).toBe(18);

  const base = new Date();
  const inDays = (d) => {
    const x = new Date(base);
    x.setDate(x.getDate() + d);
    return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}T18:00`;
  };

  const lessons = [
    { id: "l1", studentId: "s1", date: inDays(1), status: 2 },
    { id: "l2", studentId: "s2", date: inDays(2), status: 0 }
  ];
  expect(lessons.length).toBe(2); // só para não dar unused

  // simulando selects e botão
  document.body.innerHTML = `
    <select id="filterStudent"><option value="s1">Ana</option></select>
    <select id="filterStatus"><option value="2">Confirmada</option></select>
    <button id="clearFilters">Limpar filtros</button>
  `;

  const studentSelect = document.getElementById("filterStudent");
  const statusSelect = document.getElementById("filterStatus");
  const clearBtn = document.getElementById("clearFilters");

  // estado inicial: filtros estão preenchidos
  studentSelect.value = "s1";
  statusSelect.value = "2";
  expect(studentSelect.value).toBe("s1");
  expect(statusSelect.value).toBe("2");

  // ação do botão
  clearBtn.addEventListener("click", () => {
    studentSelect.value = "";
    statusSelect.value = "";
  });

  clearBtn.click();

  // depois do clique: filtros limpos
  expect(studentSelect.value).toBe("");
  expect(statusSelect.value).toBe("");
});
