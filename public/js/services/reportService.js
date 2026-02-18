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
// ================================
// Relatório – Receita Mensal (Ano)
// ================================
export function calculateMonthlyRevenueFromLessons(lessons = [], parseDateFn) {
  const months = Array(12).fill(0);

  lessons.forEach(lesson => {
    const monthIndex = parseDateFn(lesson.date).getMonth();
    months[monthIndex] += Number(lesson.price) || 0;
  });

  return months;
}
// ================================
// Relatório – Receita Prevista (mês)
// ================================
export function calculateForecastRevenueForLessons(lessons = [], priceParserFn) {
  return lessons
    .filter(lesson => {
      const status = String(lesson.status);
      return status === "0" || status === "1" || status === "2";
    })
    .reduce((acc, lesson) => {
      return acc + priceParserFn(lesson.price);
    }, 0);
}


// ================================
// Relatório – Receita Realizada (mês)
// ================================
export function calculateRealizedRevenueForLessons(lessons = [], priceParserFn) {
  return lessons
    .filter(lesson => String(lesson.status) === "2")
    .reduce((acc, lesson) => {
      return acc + priceParserFn(lesson.price);
    }, 0);
}


// ================================
// Relatório – Quantidade de Aulas
// ================================
export function calculateLessonCount(lessons = []) {
  return lessons.length;
}
// ================================
// Relatório – Dados Anuais por Aluno
// ================================
export function calculateYearlyStudentReport(
  lessons = [],
  studentId,
  year,
  parseDateFn,
  priceParserFn
) {
  const filtered = lessons.filter(lesson => {
    return (
      String(lesson.studentId) === String(studentId) &&
      parseDateFn(lesson.date).getFullYear() === Number(year) &&
      Number(lesson.status) === 2
    );
  });

  const total = filtered.reduce((acc, lesson) => {
    return acc + priceParserFn(lesson.price);
  }, 0);

  return {
    lessons: filtered,
    count: filtered.length,
    total
  };
}
