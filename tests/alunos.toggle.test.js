/**
 * Testes de ativação e inativação de alunos
 */

describe('Alunos - ativar e inativar', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alunos-list">
        <div class="aluno ativo">
          <span class="nome">Maria</span>
          <button class="toggle">Inativar</button>
        </div>
      </div>
    `;
  });

  test('inativa um aluno ativo', () => {
    const aluno = document.querySelector('.aluno');
    const btn = aluno.querySelector('.toggle');

    btn.addEventListener('click', () => {
      aluno.classList.remove('ativo');
      aluno.classList.add('inativo');
      btn.textContent = 'Ativar';
    });

    // Simula clique
    btn.click();

    expect(aluno.classList.contains('ativo')).toBe(false);
    expect(aluno.classList.contains('inativo')).toBe(true);
    expect(btn.textContent).toBe('Ativar');
  });

  test('ativa um aluno inativo', () => {
    const aluno = document.querySelector('.aluno');
    const btn = aluno.querySelector('.toggle');

    // Estado inicial: inativo
    aluno.classList.remove('ativo');
    aluno.classList.add('inativo');
    btn.textContent = 'Ativar';

    btn.addEventListener('click', () => {
      aluno.classList.remove('inativo');
      aluno.classList.add('ativo');
      btn.textContent = 'Inativar';
    });

    // Simula clique
    btn.click();

    expect(aluno.classList.contains('inativo')).toBe(false);
    expect(aluno.classList.contains('ativo')).toBe(true);
    expect(btn.textContent).toBe('Inativar');
  });
});

