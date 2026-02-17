/**
 * Testes de interação da Aba Agenda
 */
const fs = require("fs");
const path = require("path");

describe("UI - Interações básicas da Agenda", () => {
  beforeEach(() => {
    const html = fs.readFileSync(
      path.join(__dirname, "..", "public", "index.html"),
      "utf8"
    );
    document.documentElement.innerHTML = html;
  });

  test("Botão Hoje dispara evento de clique", () => {
    const btnToday = document.getElementById("btnToday");
    let clicked = false;

    btnToday.addEventListener("click", () => {
      clicked = true;
    });

    btnToday.click();

    expect(clicked).toBe(true);
  });
});
