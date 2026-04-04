/* eslint-env jest */

/* === funções auxiliares === */
function parseISODateLocal(iso) {
  if (!iso) return new Date(NaN);
  const [datePart, timePart = "00:00"] = String(iso).split("T");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m] = timePart.split(":").map(Number);
  return new Date(Y, (M || 1) - 1, D || 1, h || 0, m || 0, 0, 0);
}

function safeArray(arr) { return Array.isArray(arr) ? arr : []; }
function safeNumber(value) { const n = Number(value); return isFinite(n) ? n : 0; }

/* === funções sob teste === */
function calculateTotalRevenueFromLessons(lessons = []) {
  return safeArray(lessons).reduce((sum, l) => sum + safeNumber(l?.price), 0);
}

function extractUniqueStudentIdsFromLessons(lessons = []) {
  return new Set(safeArray(lessons).map(l => l?.studentId).filter(id => id != null));
}

function calculateAveragePerStudent(totalRevenue = 0, studentCount = 0) {
  const safeCount = safeNumber(studentCount);
  return safeCount <= 0 ? 0 : safeNumber(totalRevenue) / safeCount;
}

function calculateTotalRevenueForStudent(lessons = [], studentId, parseNumberFn) {
  const safeParse = typeof parseNumberFn === "function" ? parseNumberFn : v => safeNumber(v);
  return safeArray(lessons).reduce((sum, l) => {
    if (!l || l.studentId !== studentId) return sum;
    const v = safeParse(l.price);
    return sum + (isFinite(v) ? v : 0);
  }, 0);
}

function calculateRealizedRevenueForLessons(lessons = [], priceParserFn) {
  const safeParse = typeof priceParserFn === "function" ? priceParserFn : v => safeNumber(v);
  return safeArray(lessons).reduce((sum, l) => {
    if (!l || String(l.status) !== "2") return sum;
    const v = safeParse(l.price);
    return sum + (isFinite(v) ? v : 0);
  }, 0);
}

function calculateForecastRevenueForLessons(lessons = [], priceParserFn) {
  const safeParse = typeof priceParserFn === "function" ? priceParserFn : v => safeNumber(v);
  return safeArray(lessons).reduce((sum, l) => {
    if (!l) return sum;
    const status = String(l.status);
    if (!["0","1","2"].includes(status)) return sum;
    const v = safeParse(l.price);
    return sum + (isFinite(v) ? v : 0);
  }, 0);
}

function calculateYearlyStudentReport(lessons = [], studentId, year, parseDateFn, priceParserFn) {
  const filtered = lessons.filter(l =>
    String(l.studentId) === String(studentId) &&
    parseDateFn(l.date).getFullYear() === Number(year) &&
    Number(l.status) === 2
  );
  const total = filtered.reduce((acc, l) => acc + priceParserFn(l.price), 0);
  return { lessons: filtered, count: filtered.length, total };
}

function calculateYearlyStudentRanking(lessons = [], students = [], year, parseDateFn, priceParserFn) {
  const map = new Map();
  for (const l of lessons) {
    if (!l.date || Number(l.status) !== 2) continue;
    const d = parseDateFn(l.date);
    if (d.getFullYear() !== Number(year)) continue;
    const key = l.studentId || "_";
    const cur = map.get(key) || { sum: 0, count: 0 };
    cur.sum += priceParserFn(l.price);
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([id, agg]) => {
      const student = students.find(s => s.id === id);
      return { id, name: student?.name || "(Aluno)", total: agg.sum, aulas: agg.count };
    })
    .sort((a, b) => b.total - a.total);
}

function calculateYearComparison(yearMonthly = [], compareMonthly = []) {
  const yearTotal    = yearMonthly.reduce((acc, v) => acc + v, 0);
  const compareTotal = compareMonthly.reduce((acc, v) => acc + v, 0);
  let delta = compareTotal > 0
    ? ((yearTotal - compareTotal) / compareTotal) * 100
    : yearTotal > 0 ? 100 : 0;
  return { yearTotal, compareTotal, delta };
}

function calculateRevenueConcentration(lessons = [], parseDateFn, year, month = null) {
  if (!Array.isArray(lessons)) return { totalRevenue: 0, byStudent: [], top1Percent: 0, top3Percent: 0 };
  const revenueMap = new Map();
  let totalRevenue = 0;
  lessons.forEach(l => {
    if (String(l.status) !== "2") return;
    const date = parseDateFn(l.date);
    if (!date || isNaN(date)) return;
    if (date.getFullYear() !== Number(year)) return;
    if (month !== null && date.getMonth() !== Number(month)) return;
    const price = Number(l.price) || 0;
    const sid = String(l.studentId || "");
    if (!sid) return;
    totalRevenue += price;
    revenueMap.set(sid, (revenueMap.get(sid) || 0) + price);
  });
  const byStudent = [...revenueMap.entries()]
    .map(([studentId, revenue]) => ({ studentId, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const top1 = byStudent[0]?.revenue || 0;
  const top3 = byStudent.slice(0, 3).reduce((acc, s) => acc + s.revenue, 0);
  const safePercent = v => totalRevenue > 0 ? (v / totalRevenue) * 100 : 0;
  return { totalRevenue, byStudent, top1Percent: safePercent(top1), top3Percent: safePercent(top3) };
}

/* === fixtures === */
const lessons = [
  { id: "1", studentId: "a1", date: "2026-01-10", price: 100, status: 2 },
  { id: "2", studentId: "a1", date: "2026-01-20", price: 150, status: 2 },
  { id: "3", studentId: "a2", date: "2026-01-15", price: 200, status: 2 },
  { id: "4", studentId: "a2", date: "2026-02-10", price: 100, status: 0 },
  { id: "5", studentId: "a3", date: "2026-03-05", price: 300, status: 1 },
  { id: "6", studentId: "a1", date: "2025-12-01", price: 120, status: 2 },
];

const students = [
  { id: "a1", name: "Ana" },
  { id: "a2", name: "Bruno" },
  { id: "a3", name: "Carla" },
];

/* === testes === */
describe("calculateTotalRevenueFromLessons", () => {
  test("soma todos os preços", () => {
    expect(calculateTotalRevenueFromLessons(lessons)).toBe(970);
  });
  test("retorna 0 para lista vazia", () => {
    expect(calculateTotalRevenueFromLessons([])).toBe(0);
  });
  test("retorna 0 para entrada inválida", () => {
    expect(calculateTotalRevenueFromLessons(null)).toBe(0);
  });
});

describe("extractUniqueStudentIdsFromLessons", () => {
  test("retorna Set com IDs únicos", () => {
    const ids = extractUniqueStudentIdsFromLessons(lessons);
    expect(ids.size).toBe(3);
    expect(ids.has("a1")).toBe(true);
  });
  test("retorna Set vazio para lista vazia", () => {
    expect(extractUniqueStudentIdsFromLessons([]).size).toBe(0);
  });
});

describe("calculateAveragePerStudent", () => {
  test("calcula média corretamente", () => {
    expect(calculateAveragePerStudent(900, 3)).toBe(300);
  });
  test("retorna 0 quando count é 0", () => {
    expect(calculateAveragePerStudent(900, 0)).toBe(0);
  });
});

describe("calculateTotalRevenueForStudent", () => {
  test("soma receita de um aluno específico", () => {
    expect(calculateTotalRevenueForStudent(lessons, "a1", v => Number(v))).toBe(370);
  });
  test("retorna 0 para aluno sem aulas", () => {
    expect(calculateTotalRevenueForStudent(lessons, "a99", v => Number(v))).toBe(0);
  });
});

describe("calculateRealizedRevenueForLessons", () => {
  test("soma apenas aulas com status 2", () => {
    expect(calculateRealizedRevenueForLessons(lessons, v => Number(v))).toBe(570);
  });
  test("retorna 0 para lista vazia", () => {
    expect(calculateRealizedRevenueForLessons([], v => Number(v))).toBe(0);
  });
});

describe("calculateForecastRevenueForLessons", () => {
  test("soma aulas com status 0, 1 e 2", () => {
    expect(calculateForecastRevenueForLessons(lessons, v => Number(v))).toBe(970);
  });
});

describe("calculateYearlyStudentReport", () => {
  test("retorna aulas e total do aluno no ano", () => {
    const report = calculateYearlyStudentReport(lessons, "a1", 2026, parseISODateLocal, v => Number(v));
    expect(report.count).toBe(2);
    expect(report.total).toBe(250);
  });
  test("retorna vazio para ano sem aulas", () => {
    const report = calculateYearlyStudentReport(lessons, "a1", 2024, parseISODateLocal, v => Number(v));
    expect(report.count).toBe(0);
    expect(report.total).toBe(0);
  });
});

describe("calculateYearlyStudentRanking", () => {
  test("retorna ranking ordenado por receita", () => {
    const ranking = calculateYearlyStudentRanking(lessons, students, 2026, parseISODateLocal, v => Number(v));
    expect(ranking[0].name).toBe("Ana"); // 250
    expect(ranking[1].name).toBe("Bruno"); // 200
  });
  test("ranking inclui quantidade de aulas", () => {
    const ranking = calculateYearlyStudentRanking(lessons, students, 2026, parseISODateLocal, v => Number(v));
    const ana = ranking.find(r => r.name === "Ana");
    expect(ana.aulas).toBe(2);
  });
  test("retorna vazio para ano sem aulas", () => {
    const ranking = calculateYearlyStudentRanking(lessons, students, 2020, parseISODateLocal, v => Number(v));
    expect(ranking.length).toBe(0);
  });
});

describe("calculateYearComparison", () => {
  test("calcula delta positivo corretamente", () => {
    const result = calculateYearComparison(
      [100, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    );
    expect(result.yearTotal).toBe(300);
    expect(result.compareTotal).toBe(200);
    expect(result.delta).toBeCloseTo(50);
  });
  test("retorna delta 100% quando comparação é zero", () => {
    const result = calculateYearComparison([100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], Array(12).fill(0));
    expect(result.delta).toBe(100);
  });
  test("retorna delta 0% quando ambos são zero", () => {
    const result = calculateYearComparison(Array(12).fill(0), Array(12).fill(0));
    expect(result.delta).toBe(0);
  });
});

describe("calculateRevenueConcentration", () => {
  test("calcula concentração top 1 corretamente", () => {
    const result = calculateRevenueConcentration(lessons, parseISODateLocal, 2026);
    expect(result.top1Percent).toBeGreaterThan(0);
    expect(result.top1Percent).toBeLessThanOrEqual(100);
  });
  test("retorna zeros para lista vazia", () => {
    const result = calculateRevenueConcentration([], parseISODateLocal, 2026);
    expect(result.top1Percent).toBe(0);
    expect(result.totalRevenue).toBe(0);
  });
  test("top3 é maior ou igual ao top1", () => {
    const result = calculateRevenueConcentration(lessons, parseISODateLocal, 2026);
    expect(result.top3Percent).toBeGreaterThanOrEqual(result.top1Percent);
  });
});