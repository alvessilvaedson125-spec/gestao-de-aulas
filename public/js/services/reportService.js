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
 * NÃO acessa DOMf
 * NÃO usa Firestore diretamente
 * Apenas lógica pura
 */



// ================================
// INTERNAL SAFETY HELPERS
// ================================

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function safeNumber(value) {
  const n = Number(value);
  return isFinite(n) ? n : 0;
}


// ================================
// KPI – Receita Total por Lista de Aulas
// ================================
export function calculateTotalRevenueFromLessons(lessons = []) {
  const arr = safeArray(lessons);

  return arr.reduce((sum, lesson) => {
    return sum + safeNumber(lesson?.price);
  }, 0);
}

// ================================
// KPI – Conjunto de Alunos Únicos por Lista de Aulas
// ================================
export function extractUniqueStudentIdsFromLessons(lessons = []) {
  const arr = safeArray(lessons);

  return new Set(
    arr
      .map(lesson => lesson?.studentId)
      .filter(id => id != null)
  );
}

// ================================
// KPI – Média por Aluno
// ================================
export function calculateAveragePerStudent(totalRevenue = 0, studentCount = 0) {
  const safeTotal = safeNumber(totalRevenue);
  const safeCount = safeNumber(studentCount);

  if (safeCount <= 0) return 0;

  return safeTotal / safeCount;
}

// ================================
// Relatório – Total por Aluno
// ================================
export function calculateTotalRevenueForStudent(
  lessons = [],
  studentId,
  parseNumberFn
) {
  const arr = safeArray(lessons);

  const safeParseNumber =
    typeof parseNumberFn === "function"
      ? parseNumberFn
      : value => safeNumber(value);

  return arr.reduce((sum, lesson) => {
    if (!lesson) return sum;
    if (lesson?.studentId !== studentId) return sum;

    const value = safeParseNumber(lesson.price);
    return sum + (isFinite(value) ? value : 0);
  }, 0);
}

// ================================
// Relatório – Receita Mensal (Ano)
// ================================
export function calculateMonthlyRevenueFromLessons(
  lessons = [],
  parseDateFn,
  parseNumberFn
) {
  const months = Array(12).fill(0);

  if (!Array.isArray(lessons)) return months;

  const safeParseDate =
    typeof parseDateFn === "function" ? parseDateFn : () => null;

  const safeParseNumber =
    typeof parseNumberFn === "function" ? parseNumberFn : v => Number(v) || 0;

  lessons.forEach(lesson => {
    if (!lesson) return;

    const date = safeParseDate(lesson.date);
    if (!(date instanceof Date) || isNaN(date)) return;

    const monthIndex = date.getMonth();
    if (monthIndex < 0 || monthIndex > 11) return;

    const value = safeParseNumber(lesson.price);
    months[monthIndex] += isFinite(value) ? value : 0;
  });

  return months;
}

// ================================
// Relatório – Receita Prevista (mês)
// ================================
export function calculateForecastRevenueForLessons(
  lessons = [],
  priceParserFn
) {
  const arr = safeArray(lessons);

  const safeParse =
    typeof priceParserFn === "function"
      ? priceParserFn
      : value => safeNumber(value);

  return arr.reduce((sum, lesson) => {
    if (!lesson) return sum;

    const status = String(lesson.status);

    if (status !== "0" && status !== "1" && status !== "2") {
      return sum;
    }

    const value = safeParse(lesson.price);

    return sum + (isFinite(value) ? value : 0);
  }, 0);
}



// ================================
// Relatório – Receita Realizada (mês)
// ================================
export function calculateRealizedRevenueForLessons(
  lessons = [],
  priceParserFn
) {
  const arr = safeArray(lessons);

  const safeParse =
    typeof priceParserFn === "function"
      ? priceParserFn
      : value => safeNumber(value);

  return arr.reduce((sum, lesson) => {
    if (!lesson) return sum;

    if (String(lesson.status) !== "2") return sum;

    const value = safeParse(lesson.price);

    return sum + (isFinite(value) ? value : 0);
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
// ================================
// Relatório – Ranking Anual por Aluno
// ================================
export function calculateYearlyStudentRanking(
  lessons = [],
  students = [],
  year,
  parseDateFn,
  priceParserFn
) {
  const map = new Map();

  for (const lesson of lessons) {
    if (!lesson.date || Number(lesson.status) !== 2) continue;

    const d = parseDateFn(lesson.date);
    if (d.getFullYear() !== Number(year)) continue;

    const key = lesson.studentId || "_";

    const current = map.get(key) || { sum: 0, count: 0 };
    current.sum += priceParserFn(lesson.price);
    current.count += 1;

    map.set(key, current);
  }

  const ranking = [...map.entries()]
    .map(([id, agg]) => {
      const student = students.find(s => s.id === id);
      return {
        id,
        name: student?.name || "(Aluno)",
        total: agg.sum,
        aulas: agg.count
      };
    })
    .sort((a, b) => b.total - a.total);

  return ranking;
}
// ================================
// Relatório – Comparativo Anual
// ================================
export function calculateYearComparison(yearMonthly = [], compareMonthly = []) {
  const yearTotal = yearMonthly.reduce((acc, v) => acc + v, 0);
  const compareTotal = compareMonthly.reduce((acc, v) => acc + v, 0);

  let delta = 0;

  if (compareTotal > 0) {
    delta = ((yearTotal - compareTotal) / compareTotal) * 100;
  } else {
    delta = yearTotal > 0 ? 100 : 0;
  }

  return {
    yearTotal,
    compareTotal,
    delta
  };
}
// ========================================
// Receita por aluno (concentração)
// Considera apenas status === "2" (Realizada)
// Pode ser usada para ANO ou MÊS (já filtrado antes)
// ========================================
export function calculateRevenueConcentration(lessons = [], parseDateFn, year, month = null) {
  if (!Array.isArray(lessons)) return {
    totalRevenue: 0,
    byStudent: [],
    top1Percent: 0,
    top3Percent: 0
  };

  const revenueMap = new Map();
  let totalRevenue = 0;

  lessons.forEach(lesson => {
    if (String(lesson.status) !== "2") return;

    const date = parseDateFn(lesson.date);
    if (!date || isNaN(date)) return;

    if (date.getFullYear() !== Number(year)) return;
    if (month !== null && date.getMonth() !== Number(month)) return;

    const price = Number(lesson.price) || 0;
    const studentId = String(lesson.studentId || "");

    if (!studentId) return;

    totalRevenue += price;
    revenueMap.set(studentId, (revenueMap.get(studentId) || 0) + price);
  });

  const byStudent = Array.from(revenueMap.entries())
    .map(([studentId, revenue]) => ({ studentId, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const top1 = byStudent[0]?.revenue || 0;
  const top3 = byStudent.slice(0, 3).reduce((acc, s) => acc + s.revenue, 0);

  const safePercent = (value) =>
    totalRevenue > 0 ? (value / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    byStudent,
    top1Percent: safePercent(top1),
    top3Percent: safePercent(top3)
  };
}
