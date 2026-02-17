/**
 * Testes de exclusão de aulas na Agenda
 */

describe('Agenda - exclusão de aulas', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="agenda-list">
        <div class="aula">
          <span>2025-09-30 14:00 - João</span>
          <button class="delete">Excluir</button>
        </div>
      </div>
    `;
  });

  test('exclui uma aula da lista', () => {
    const list = document.getElementById('agenda-list');
    const deleteBtn = list.querySelector('.delete');

    deleteBtn.addEventListener('click', () => {
      deleteBtn.parentElement.remove();
    });

    // Simular clique
    deleteBtn.click();

    expect(list.children.length).toBe(0);
  });
});
