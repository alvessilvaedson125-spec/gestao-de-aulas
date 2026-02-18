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
// ================================
// KPI – Conjunto de Alunos Únicos por Lista de Aulas
// ================================
export function extractUniqueStudentIdsFromLessons(lessons = []) {
  return new Set(
    lessons.map(lesson => lesson.studentId)
  );
}
// ================================
// KPI – Média por Aluno
// ================================
export function calculateAveragePerStudent(totalRevenue = 0, studentCount = 0) {
  if (!studentCount) return 0;
  return totalRevenue / studentCount;
}
// ================================
// Relatório – Total por Aluno
// ================================
export function calculateTotalRevenueForStudent(lessons = [], studentId) {
  return lessons
    .filter(lesson => lesson.studentId === studentId)
    .reduce((sum, lesson) => {
      return sum + (Number(lesson.price) || 0);
    }, 0);
}
