// public/js/utils/dateService.js

/**
 * ================================
 * DATE SERVICE
 * ================================
 * Responsável por:
 * - Parsing de datas ISO
 * - Suporte a YYYY-MM-DD
 * - Suporte a YYYY-MM-DDTHH:MM
 * 
 * NÃO acessa DOM
 * NÃO depende de estado global
 * Função pura
 */

export function parseISODateLocal(iso) {
  if (!iso) return new Date(NaN);

  const [datePart, timePart = "00:00"] = String(iso).split("T");

  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m] = timePart.split(":").map(Number);

  return new Date(
    Y,
    (M || 1) - 1,
    (D || 1),
    h || 0,
    m || 0,
    0,
    0
  );
}
