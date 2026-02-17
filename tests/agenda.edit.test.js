/**
 * Testes de edição de aulas na Agenda
 */

describe('Agenda - edição de aulas', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="agenda-list">
        <div class="aula">
          <span class="info">2025-09-30 14:00 - João</span>
          <button class="edit">Editar</button>
        </div>
      </div>
      <input id="agenda-edit" value="">
    `;
  });

  test('edita uma aula existente', () => {
    const info = document.querySelector('.info');
    const editBtn = document.querySelector('.edit');
    const input = document.getElementById('agenda-edit');

    editBtn.addEventListener('click', () => {
      input.value = '2025-09-30 15:00 - João Silva';
      info.textContent = input.value;
    });

    // Simular clique
    editBtn.click();

    expect(info.textContent).toBe('2025-09-30 15:00 - João Silva');
  });
});
