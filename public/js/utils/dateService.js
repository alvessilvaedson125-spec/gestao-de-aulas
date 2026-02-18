// public/js/utils/dateService.js

/**
 * ================================
 * DATE SERVICE
 * ================================
 * Responsável por:
 * - Parsing de datas ISO
 * - Manipulação segura de datas
 * 
 * NÃO acessa DOM
 * NÃO depende de estado global
 * Funções puras
 */


// ================================
// Parse ISO date (YYYY-MM-DD)
// Mantém comportamento local
// ================================
export function parseISODateLocal(dateString) {
  if (!dateString) return new Date(NaN);

  const parts = String(dateString).split("-");

  if (parts.length !== 3) return new Date(NaN);

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1; // mês começa em 0
  const day = Number(parts[2]);

  return new Date(year, month, day);
}
