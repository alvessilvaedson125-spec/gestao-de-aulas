/**
 * Testes de cálculo de totais mensais nos Relatórios
 */

describe('Relatórios - cálculo de totais mensais', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="kpiMonthRev">R$ 0,00</div>
    `;

    function calcularTotalMensal(aulas, mes, ano) {
      const total = aulas
        .filter(a => {
          const d = new Date(a.data);
          return d.getMonth() === mes && d.getFullYear() === ano;
        })
        .reduce((acc, aula) => acc + aula.valor, 0);

      document.getElementById('kpiMonthRev').textContent =
        `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    global.calcularTotalMensal = calcularTotalMensal;
  });

  test('soma apenas aulas do mês e ano corretos', () => {
    const aulas = [
      { data: '2025-01-10', valor: 50 }, // janeiro
      { data: '2025-01-20', valor: 70 }, // janeiro
      { data: '2025-02-05', valor: 80 }  // fevereiro
    ];

    // Janeiro = mês 0
    global.calcularTotalMensal(aulas, 0, 2025);

    expect(document.getElementById('kpiMonthRev').textContent)
      .toBe('R$ 120,00');
  });

  test('mostra R$ 0,00 se não houver aulas no mês', () => {
    const aulas = [
      { data: '2025-02-05', valor: 80 } // fevereiro
    ];

    // Janeiro = mês 0
    global.calcularTotalMensal(aulas, 0, 2025);

    expect(document.getElementById('kpiMonthRev').textContent)
      .toBe('R$ 0,00');
  });
});
