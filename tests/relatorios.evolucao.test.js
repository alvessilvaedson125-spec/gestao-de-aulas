/**
 * Relatórios - evolução mensal de aulas realizadas
 * Ambiente: jest + jsdom
 */
describe('Relatórios - evolução mensal', () => {
  // helpers
  const pad2 = (n) => String(n).padStart(2, '0');
  const monthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

  // agrega por mês contando SOMENTE status=2 (realizada)
  function computeEvolutionMonthly(lessons) {
    const acc = new Map();
    for (const l of lessons) {
      if (Number(l.status) !== 2) continue;
      const d = new Date(l.date);
      const key = monthKey(d);
      acc.set(key, (acc.get(key) || 0) + 1);
    }
    // ordenar por ano-mês (lexicográfico funciona em YYYY-MM)
    return [...acc.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }

  // “render” simples para testarmos a saída visual (ul/li)
  function renderEvolution(listEl, lessons) {
    listEl.innerHTML = '';
    const data = computeEvolutionMonthly(lessons);
    for (const [key, count] of data) {
      const li = document.createElement('li');
      li.textContent = `${key}: ${count}`;
      listEl.appendChild(li);
    }
  }

  // util de datas: base fixa para estabilidade do teste
  const base = new Date(2025, 0, 10, 12, 0, 0); // 10/01/2025 12:00
  const inDays = (d) => {
    const x = new Date(base);
    x.setDate(x.getDate() + d);
    // ISO sem timezone: YYYY-MM-DD
    return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}T18:00`;
  };

  test('agrega por mês contando apenas aulas realizadas', () => {
    document.body.innerHTML = `<ul id="evolution"></ul>`;
    const list = document.getElementById('evolution');

    const lessons = [
      // Janeiro/2025
      { id: 'a1', date: inDays(0),   status: 2 },
      { id: 'a2', date: inDays(3),   status: 0 },
      { id: 'a3', date: inDays(5),   status: 2 },
      // Fevereiro/2025
      { id: 'a4', date: inDays(30),  status: 1 },
      { id: 'a5', date: inDays(31),  status: 2 },
      { id: 'a6', date: inDays(45),  status: 2 },
      // Março/2025 (somente não realizadas)
      { id: 'a7', date: inDays(70),  status: 1 },
      { id: 'a8', date: inDays(71),  status: 0 },
    ];

    renderEvolution(list, lessons);

    // Deve ter 2 linhas (Jan e Fev). Março não entra (sem realizadas).
    expect(list.children.length).toBe(2);
    // Ordenado cronologicamente
    expect(list.children[0].textContent).toBe('2025-01: 2');
    expect(list.children[1].textContent).toBe('2025-02: 2');
  });

  test('lista vazia quando não há aulas realizadas', () => {
    document.body.innerHTML = `<ul id="evolution"></ul>`;
    const list = document.getElementById('evolution');

    const lessons = [
      { id: 'b1', date: inDays(0),  status: 0 },
      { id: 'b2', date: inDays(1),  status: 1 },
    ];

    renderEvolution(list, lessons);
    expect(list.children.length).toBe(0);
  });
});
