/* eslint-env jest */

/* === funções sob teste === */
function formatBRL(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function parseBRLToNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value || "")
    .replace(/^R\$\s?/, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return isFinite(parsed) ? parsed : 0;
}

function formatBRLFromCents(cents = 0) {
  return formatBRL(Number(cents || 0) / 100);
}

/* === testes === */
describe("parseBRLToNumber", () => {
  test("converte string BRL para número", () => {
    expect(parseBRLToNumber("R$ 1.234,56")).toBe(1234.56);
  });

  test("converte string sem prefixo R$", () => {
    expect(parseBRLToNumber("1.234,56")).toBe(1234.56);
  });

  test("retorna o próprio número se já for number", () => {
    expect(parseBRLToNumber(150)).toBe(150);
  });

  test("retorna 0 para valor vazio", () => {
    expect(parseBRLToNumber("")).toBe(0);
  });

  test("retorna 0 para valor nulo", () => {
    expect(parseBRLToNumber(null)).toBe(0);
  });

  test("retorna 0 para valor inválido", () => {
    expect(parseBRLToNumber("abc")).toBe(0);
  });

  test("converte valor simples sem separadores", () => {
    expect(parseBRLToNumber("100")).toBe(100);
  });
});

describe("formatBRL", () => {
  test("formata número para BRL", () => {
    expect(formatBRL(1234.56)).toContain("1.234,56");
  });

  test("formata zero corretamente", () => {
    expect(formatBRL(0)).toContain("0,00");
  });

  test("formata valor negativo", () => {
    expect(formatBRL(-100)).toContain("100,00");
  });
});

describe("formatBRLFromCents", () => {
  test("converte centavos para BRL formatado", () => {
    expect(formatBRLFromCents(123456)).toContain("1.234,56");
  });

  test("retorna zero para 0 centavos", () => {
    expect(formatBRLFromCents(0)).toContain("0,00");
  });
});