// public/js/utils/formatService.js

/**
 * ================================
 * FORMAT SERVICE
 * ================================
 * Responsável por:
 * - Formatação monetária
 * - Conversão de valores monetários
 * 
 * NÃO acessa DOM
 * NÃO depende de estado global
 * Funções puras
 */


// ================================
// Formatar para BRL
// ================================
export function formatBRL(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}


// ================================
// Converter BRL (string) para número
// ================================
export function parseBRLToNumber(value) {
  if (typeof value === "number") return value;

  const normalized = String(value || "")
    .replace(/^R\$\s?/, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return isFinite(parsed) ? parsed : 0;
}
// ================================
// Formatar centavos (inteiro) para BRL
// Ex: 123456 -> "R$ 1.234,56"
// ================================
export function formatBRLFromCents(cents = 0) {
  const value = Number(cents || 0) / 100;
  return formatBRL(value);
}
