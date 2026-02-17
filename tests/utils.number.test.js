
/* eslint-env jest */

/**
 * Testes unitários simples de utilidades numéricas e de data/hora.
 * Ambiente: jest + jsdom
 */

/* === funções sob teste (copiadas aqui só para o teste) === */
function parseNumberFromBRL(str){
  const clean = String(str||'')
    .replace(/\s/g,'')
    .replace(/^R\$\s?/, '')
    .replace(/\./g,'')
    .replace(',', '.');
  const n = Number(clean);
  return isNaN(n) ? 0 : n;
}

function pad2(n){ return String(n).padStart(2,'0'); }

function toLocalDateTimeString(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* === testes === */
describe('Utils: moeda e data/hora', () => {
  test('parseNumberFromBRL converte corretamente valores BRL', () => {
    expect(parseNumberFromBRL('R$ 0,00')).toBe(0);
    expect(parseNumberFromBRL('R$ 10,00')).toBe(10);
    expect(parseNumberFromBRL('R$ 1.234,56')).toBe(1234.56);
    expect(parseNumberFromBRL('1.234,56')).toBe(1234.56);
    expect(parseNumberFromBRL('')).toBe(0);
  });

  test('pad2 adiciona zero à esquerda quando necessário', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });

  test('toLocalDateTimeString gera string no formato esperado', () => {
    const d = new Date(2025, 0, 15, 9, 7); // 15/01/2025 09:07
    expect(toLocalDateTimeString(d)).toBe('2025-01-15T09:07');
  });
});
