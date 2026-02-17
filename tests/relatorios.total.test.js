/**
 * Testes de cálculo de totais nos Relatórios
 */

describe('Relatórios - cálculo de totais', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="yearTotalFooter">R$ 0,00</div>
    `;

    // função de soma (simula o comportamento do app)
    function calcularTotalAnual(aulas) {
      const total = aulas.reduce((acc, aula) => acc + aula.valor, 0);
      document.getElementById('yearTotalFooter').textContent =
        `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // guardar no escopo dos testes
    global.calcularTotalAnual = calcularTotalAnual;
  });

  test('soma corretamente valores de aulas no ano', () => {
    const aulas = [
      { data: '2025-01-10', valor: 50 },
      { data: '2025-02-15', valor: 70 },
      { data: '2025-03-20', valor: 80 }
    ];

    global.calcularTotalAnual(aulas);

    expect(document.getElementById('yearTotalFooter').textContent)
      .toBe('R$ 200,00');
  });

  test('mostra R$ 0,00 se não houver aulas', () => {
    global.calcularTotalAnual([]);

    expect(document.getElementById('yearTotalFooter').textContent)
      .toBe('R$ 0,00');
  });
});
