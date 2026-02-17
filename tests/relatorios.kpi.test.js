/**
 * Teste do botão "Mostrar/Ocultar" nos KPIs de Relatórios.
 * Simulamos o mesmo comportamento do app (updateMoneyButton + onclick).
 */

describe('Relatórios - botão de mostrar/ocultar valores', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btnHideMoney" data-hide="0">🙈 Ocultar</button>
      <div id="kpiMonthRev">R$ 0,00</div>
      <div id="kpiYearRev">R$ 0,00</div>
      <div id="avgPerStudent">R$ 0,00</div>
      <div id="yearTotalFooter">R$ 0,00</div>
    `;

    const $ = (id) => document.getElementById(id);

    // mesma lógica do app
    function updateMoneyButton(){
      const btn = $("btnHideMoney");
      const hidden = btn.dataset.hide === "1";
      btn.textContent = hidden ? "👁️ Mostrar" : "🙈 Ocultar";
      const nodes = [ "kpiMonthRev","kpiYearRev","avgPerStudent","yearTotalFooter" ];
      for (const id of nodes) {
        const el = $(id);
        if (el) el.style.filter = hidden ? "blur(4px)" : "none";
      }
    }

    $("btnHideMoney").onclick = () => {
      const btn = $("btnHideMoney");
      btn.dataset.hide = btn.dataset.hide === "1" ? "0" : "1";
      updateMoneyButton();
    };

    // estado inicial coerente
    updateMoneyButton();
  });

  test('aplica blur ao clicar (ocultar)', () => {
    const btn = document.getElementById('btnHideMoney');
    const ids = ['kpiMonthRev','kpiYearRev','avgPerStudent','yearTotalFooter'];

    // antes do clique, sem blur
    ids.forEach(id => {
      expect(document.getElementById(id).style.filter).toBe('none');
    });

    // clica -> ativa blur
    btn.click();

    ids.forEach(id => {
      expect(document.getElementById(id).style.filter).toBe('blur(4px)');
    });
    expect(btn.textContent).toMatch(/Mostrar/);
  });

  test('remove blur ao clicar novamente (mostrar)', () => {
    const btn = document.getElementById('btnHideMoney');
    const ids = ['kpiMonthRev','kpiYearRev','avgPerStudent','yearTotalFooter'];

    // 1º clique: oculta (blur)
    btn.click();

    // 2º clique: mostra (sem blur)
    btn.click();

    ids.forEach(id => {
      expect(document.getElementById(id).style.filter).toBe('none');
    });
    expect(btn.textContent).toMatch(/Ocultar/);
  });
});
