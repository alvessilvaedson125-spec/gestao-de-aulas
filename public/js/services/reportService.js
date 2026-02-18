// public/js/services/reportService.js

/**
 * ================================
 * REPORT SERVICE
 * ================================
 * Camada responsável por:
 * - Cálculos
 * - KPIs
 * - Agregações
 *
 * NÃO acessa DOM
 * NÃO usa Firestore diretamente
 * Apenas lógica pura
 */


// ================================
// KPI – Receita Total por Lista de Aulas
// ================================
export function calculateTotalRevenueFromLessons(lessons = []) {
  return lessons.reduce((sum, lesson) => {
    return sum + (Number(lesson.price) || 0);
  }, 0);
}
