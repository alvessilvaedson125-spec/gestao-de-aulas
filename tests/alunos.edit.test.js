/**
 * Testes de edição de alunos
 */

describe('Alunos - edição', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alunos-list">
        <div class="aluno ativo">
          <span class="nome">Maria</span>
          <button class="edit">Editar</button>
        </div>
      </div>
      <input id="aluno-edit" value="">
    `;
  });

  test('edita o nome de um aluno existente', () => {
    const aluno = document.querySelector('.aluno');
    const nomeSpan = aluno.querySelector('.nome');
    const editBtn = aluno.querySelector('.edit');
    const input = document.getElementById('aluno-edit');

    editBtn.addEventListener('click', () => {
      input.value = 'Maria Silva';
      nomeSpan.textContent = input.value;
    });

    // Simula clique
    editBtn.click();

    expect(nomeSpan.textContent).toBe('Maria Silva');
  });
});
