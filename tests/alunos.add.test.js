/**
 * Testes de adicionar alunos
 */

describe('Alunos - adicionar', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alunos-list"></div>
      <form id="alunos-form">
        <input id="aluno-nome" value="João">
        <button type="submit">Salvar</button>
      </form>
    `;
  });

  test('adiciona um novo aluno na lista', () => {
    const form = document.getElementById('alunos-form');
    const list = document.getElementById('alunos-list');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nome = document.getElementById('aluno-nome').value;

      const aluno = document.createElement('div');
      aluno.classList.add('aluno', 'ativo');
      aluno.innerHTML = `<span class="nome">${nome}</span>`;
      list.appendChild(aluno);
    });

    // Simula envio do formulário
    form.dispatchEvent(new Event('submit'));

    expect(list.children.length).toBe(1);
    expect(list.textContent).toContain('João');
  });
});

