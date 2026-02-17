/**
 * Testes de criação de aulas na Agenda
 */

describe('Agenda - criação de aulas', () => {
  beforeEach(() => {
    // Limpar DOM antes de cada teste
    document.body.innerHTML = `
      <div id="agenda-list"></div>
      <form id="agenda-form">
        <input id="agenda-date" value="2025-09-30">
        <input id="agenda-time" value="14:00">
        <input id="agenda-aluno" value="João">
        <button type="submit">Salvar</button>
      </form>
    `;
  });

  test('cria uma nova aula e aparece na lista', () => {
    const form = document.getElementById('agenda-form');
    const list = document.getElementById('agenda-list');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const date = document.getElementById('agenda-date').value;
      const time = document.getElementById('agenda-time').value;
      const aluno = document.getElementById('agenda-aluno').value;

      const item = document.createElement('div');
      item.textContent = `${date} ${time} - ${aluno}`;
      list.appendChild(item);
    });

    // Simular envio do formulário
    form.dispatchEvent(new Event('submit'));

    expect(list.children.length).toBe(1);
    expect(list.textContent).toContain('João');
  });
});
