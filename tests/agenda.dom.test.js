const fs = require("fs");
const path = require("path");

describe("UI - Aba Agenda (DOM básico)", () => {
  beforeAll(() => {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "public", "index.html"),
      "utf8"
    );
    // carrega o HTML na JSDOM (não executa os scripts, apenas estrutura)
    document.documentElement.innerHTML = html;
  });

  test("A seção Agenda existe", () => {
    const el = document.getElementById("agenda");
    expect(el).toBeTruthy();
  });

  test("Elementos-chave existem na Agenda", () => {
    expect(document.getElementById("calGrid")).toBeTruthy();
    expect(document.getElementById("btnNewLesson")).toBeTruthy();
    expect(document.getElementById("btnCalRefresh")).toBeTruthy();
    expect(document.getElementById("btnToday")).toBeTruthy();
  });
});
