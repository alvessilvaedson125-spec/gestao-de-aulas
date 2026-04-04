/* eslint-env jest */

/* === funções sob teste === */
function parseISODateLocal(iso) {
  if (!iso) return new Date(NaN);
  const [datePart, timePart = "00:00"] = String(iso).split("T");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m] = timePart.split(":").map(Number);
  return new Date(Y, (M || 1) - 1, D || 1, h || 0, m || 0, 0, 0);
}

/* === testes === */
describe("parseISODateLocal", () => {
  test("parseia data simples YYYY-MM-DD", () => {
    const d = parseISODateLocal("2026-04-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(1);
  });

  test("parseia data com horário YYYY-MM-DDTHH:MM", () => {
    const d = parseISODateLocal("2026-04-01T14:30");
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  test("retorna NaN para valor nulo", () => {
    expect(isNaN(parseISODateLocal(null).getTime())).toBe(true);
  });

  test("retorna NaN para valor vazio", () => {
    expect(isNaN(parseISODateLocal("").getTime())).toBe(true);
  });

  test("parseia data sem horário com hora zero", () => {
    const d = parseISODateLocal("2026-01-15");
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});