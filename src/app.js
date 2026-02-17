// ===== App Build 301 =====
// Sinais de vida no console p/ debug
console.log('[GA] app.js carregado (build 301)');

// ---- Firebase (v9 modular via CDN) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged,
  setPersistence, browserLocalPersistence, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  getDocs, query, orderBy, serverTimestamp, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- Config do seu projeto ---
const firebaseConfig = {
  apiKey: "AIzaSyBh6CIne05dCuO0mu7JX6icZv8l7c2bw_8",
  authDomain: "meu-app-edson.firebaseapp.com",
  projectId: "meu-app-edson",
  storageBucket: "meu-app-edson.firebasestorage.app",
  messagingSenderId: "555388653411",
  appId: "1:555388653411:web:e9184f7f5e443174934d56"
};

// ---- Inicialização ----
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(console.warn);
enableIndexedDbPersistence(db).catch(() => { /* ok se falhar */ });

const provider = new GoogleAuthProvider();

// Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, type='info') {
  console.log(`[toast:${type}]`, msg);
  alert(msg); // simples por enquanto; pode trocar por toast bonitinho
}

// ---- Login UI (opcional) ----
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
if (btnLogin) {
  btnLogin.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
      toast('Login realizado!');
    } catch (e) {
      console.error(e);
      toast('Falha no login', 'error');
    }
  });
}
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    await signOut(auth);
    toast('Saiu da conta');
  });
}

let currentUID = null;
onAuthStateChanged(auth, (user) => {
  currentUID = user ? user.uid : null;
  console.log('[GA] auth user =', user?.email || 'anon');
  // Aqui você pode mostrar/esconder áreas da UI se quiser
});

// ---- Coleções (padrão sem multi-usuário) ----
// Se você quiser por usuário, use: collection(db, `users/${currentUID}/students`) etc.
const colStudents  = collection(db, 'students');
const colLessons   = collection(db, 'lessons');
const colEvolutions= collection(db, 'evolutions');

// ---- Alunos: botões e CRUD ----
const btnNovoAluno = $('#btnNovoAluno');
const modalAluno   = $('#modalAluno');
const formAluno    = $('#studentForm');
const btnAlunoLimpar = $('#btnAlunoLimpar');
const alunosLista  = $('#studentsList');

function openModal(el) {
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('flex');
}
function closeModal(el) {
  if (!el) return;
  el.classList.add('hidden');
  el.classList.remove('flex');
}

if (btnNovoAluno && modalAluno) {
  btnNovoAluno.addEventListener('click', () => openModal(modalAluno));
  // fechar clicando fora
  modalAluno.addEventListener('click', (ev) => {
    if (ev.target === modalAluno) closeModal(modalAluno);
  });
}

if (btnAlunoLimpar && formAluno) {
  btnAlunoLimpar.addEventListener('click', () => {
    formAluno.reset();
    toast('Formulário de aluno limpo', 'info');
  });
}

if (formAluno) {
  formAluno.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: ($('#studentName')?.value || '').trim(),
        phone: ($('#studentPhone')?.value || '').trim(),
        email: ($('#studentEmail')?.value || '').trim(),
        active: ($('#studentActive')?.value || 'true') === 'true',
        packageStart: $('#studentPackageStart')?.value || '',
        packageEnd: $('#studentPackageEnd')?.value || '',
        totalLessons: parseInt($('#studentTotalLessons')?.value || '0', 10) || 0,
        notes: ($('#studentNotes')?.value || '').trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!data.name) {
        toast('Por favor, informe o nome do aluno.', 'warning');
        return;
      }
      await addDoc(colStudents, data);
      toast('Aluno criado com sucesso!', 'success');
      formAluno.reset();
      closeModal(modalAluno);
      await listarAlunos(); // atualiza lista
    } catch (err) {
      console.error(err);
      toast('Erro ao salvar aluno.', 'error');
    }
  });
}

async function listarAlunos() {
  if (!alunosLista) return;
  alunosLista.innerHTML = '<div class="text-gray-500 p-3">Carregando...</div>';
  try {
    const q = query(colStudents, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      alunosLista.innerHTML = '<div class="text-gray-500 p-3">Nenhum aluno</div>';
      return;
    }
    const html = [];
    snap.forEach(docSnap => {
      const s = docSnap.data();
      html.push(`
        <div class="flex items-center justify-between p-3 border rounded mb-2">
          <div>
            <div class="font-semibold">${s.name || '(sem nome)'}</div>
            ${s.phone ? `<div class="text-sm text-gray-600">${s.phone}</div>`:''}
            ${s.email ? `<div class="text-sm text-gray-600">${s.email}</div>`:''}
          </div>
          <div class="flex gap-2">
            <button class="text-blue-600" data-edit="${docSnap.id}">✏️</button>
            <button class="text-red-600" data-del="${docSnap.id}">🗑️</button>
          </div>
        </div>
      `);
    });
    alunosLista.innerHTML = html.join('');

    // listeners editar/excluir
    alunosLista.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del');
        if (!confirm('Excluir este aluno?')) return;
        await deleteDoc(doc(colStudents, id));
        toast('Aluno excluído', 'success');
        await listarAlunos();
      });
    });
    alunosLista.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-edit');
        const snap = await getDoc(doc(colStudents, id));
        if (!snap.exists()) return;
        const s = snap.data();
        // Preenche o form e reabre modal p/ edição simples
        $('#studentName').value = s.name || '';
        $('#studentPhone').value = s.phone || '';
        $('#studentEmail').value = s.email || '';
        $('#studentActive').value = s.active ? 'true' : 'false';
        $('#studentPackageStart').value = s.packageStart || '';
        $('#studentPackageEnd').value = s.packageEnd || '';
        $('#studentTotalLessons').value = s.totalLessons || 0;
        $('#studentNotes').value = s.notes || '';
        openModal(modalAluno);

        // troca submit temporariamente para update
        const handler = async (ev) => {
          ev.preventDefault();
          try {
            const upd = {
              name: ($('#studentName')?.value || '').trim(),
              phone: ($('#studentPhone')?.value || '').trim(),
              email: ($('#studentEmail')?.value || '').trim(),
              active: ($('#studentActive')?.value || 'true') === 'true',
              packageStart: $('#studentPackageStart')?.value || '',
              packageEnd: $('#studentPackageEnd')?.value || '',
              totalLessons: parseInt($('#studentTotalLessons')?.value || '0', 10) || 0,
              notes: ($('#studentNotes')?.value || '').trim(),
              updatedAt: serverTimestamp(),
            };
            await updateDoc(doc(colStudents, id), upd);
            toast('Aluno atualizado!', 'success');
            formAluno.removeEventListener('submit', handler);
            formAluno.reset();
            closeModal(modalAluno);
            await listarAlunos();
          } catch (e) {
            console.error(e);
            toast('Erro ao atualizar', 'error');
          }
        };
        // remove qualquer handler prévio e adiciona temporário
        formAluno.addEventListener('submit', handler, { once: true });
      });
    });

  } catch (e) {
    console.error(e);
    alunosLista.innerHTML = '<div class="text-red-600 p-3">Erro ao listar alunos</div>';
  }
}

// ---- Agenda (aulas) – ganchos básicos ----
const btnAgendarAula = $('#btnAgendarAula');
const modalAula = $('#lessonModal');
const formAula = $('#lessonForm');
const aulasLista = $('#lessonsList');

if (btnAgendarAula && modalAula) {
  btnAgendarAula.addEventListener('click', () => openModal(modalAula));
  modalAula.addEventListener('click', (ev) => {
    if (ev.target === modalAula) closeModal(modalAula);
  });
}

if ($('#btnAulaLimpar') && formAula) {
  $('#btnAulaLimpar').addEventListener('click', () => {
    formAula.reset();
    toast('Formulário de aula limpo');
  });
}

if (formAula) {
  formAula.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = {
        date: new Date($('#lessonDate')?.value || Date.now()),
        studentId: $('#lessonStudent')?.value || null,
        style: $('#lessonStyle')?.value || '',
        level: $('#lessonLevel')?.value || '',
        type: $('#lessonType')?.value || '',
        model: $('#lessonModel')?.value || 'Avulsa',
        durationMin: parseInt($('#lessonDuration')?.value || '60', 10) || 60,
        place: ($('#lessonPlace')?.value || '').trim(),
        price: parseFloat($('#lessonPrice')?.value || '0') || 0,
        status: parseInt($('#lessonStatus')?.value || '4', 10) || 4, // default “marcada”
        notes: ($('#lessonNotes')?.value || '').trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(colLessons, data);
      toast('Aula agendada!', 'success');
      formAula.reset();
      closeModal(modalAula);
      await listarAulas();
    } catch (e) {
      console.error(e);
      toast('Erro ao salvar aula', 'error');
    }
  });
}

async function listarAulas() {
  if (!aulasLista) return;
  aulasLista.innerHTML = '<div class="text-gray-500 p-3">Carregando...</div>';
  try {
    const q = query(colLessons, orderBy('date', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      aulasLista.innerHTML = '<div class="text-gray-500 p-3">Nenhuma aula futura</div>';
      return;
    }
    const html = [];
    snap.forEach(docSnap => {
      const l = docSnap.data();
      const d = l.date?.toDate ? l.date.toDate() : (l.date instanceof Date ? l.date : new Date(l.date));
      html.push(`
        <div class="flex items-center justify-between p-3 border rounded mb-2">
          <div>
            <div class="font-semibold">${(l.style || 'Aula')} - ${(l.level || '')}</div>
            <div class="text-sm text-gray-600">${d.toLocaleString('pt-BR')}</div>
            <div class="text-sm">R$ ${(Number(l.price) || 0).toFixed(2)}</div>
          </div>
          <div class="flex gap-2">
            <button class="text-blue-600" data-lesson-done="${docSnap.id}">✅</button>
            <button class="text-red-600" data-lesson-del="${docSnap.id}">🗑️</button>
          </div>
        </div>
      `);
    });
    aulasLista.innerHTML = html.join('');

    // marcar como dada
    aulasLista.querySelectorAll('[data-lesson-done]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-lesson-done');
        await updateDoc(doc(colLessons, id), { status: 2, updatedAt: serverTimestamp() });
        toast('Aula marcada como dada', 'success');
        await listarAulas();
      });
    });
    // excluir
    aulasLista.querySelectorAll('[data-lesson-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-lesson-del');
        if (!confirm('Excluir esta aula?')) return;
        await deleteDoc(doc(colLessons, id));
        toast('Aula excluída', 'success');
        await listarAulas();
      });
    });

  } catch (e) {
    console.error(e);
    aulasLista.innerHTML = '<div class="text-red-600 p-3">Erro ao listar aulas</div>';
  }
}

// ---- Evolução – ganchos básicos ----
const btnNovaEvolucao = $('#btnNovaEvolucao');
const modalEvo = $('#evolutionModal');
const formEvo = $('#evolutionForm');
const evoTimeline = $('#evolutionTimeline');

if (btnNovaEvolucao && modalEvo) {
  btnNovaEvolucao.addEventListener('click', () => openModal(modalEvo));
  modalEvo.addEventListener('click', (ev) => {
    if (ev.target === modalEvo) closeModal(modalEvo);
  });
}

if ($('#btnEvoLimpar') && formEvo) {
  $('#btnEvoLimpar').addEventListener('click', () => {
    formEvo.reset();
    toast('Formulário de evolução limpo');
  });
}

if (formEvo) {
  formEvo.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = {
        date: $('#evolutionDate')?.value || new Date().toISOString().slice(0,10),
        studentId: $('#evolutionStudent')?.value || '',
        style: ($('#evolutionStyle')?.value || '').trim(),
        level: ($('#evolutionLevel')?.value || '').trim(),
        duration: parseInt($('#evolutionDuration')?.value || '60', 10) || 60,
        content: ($('#evolutionContent')?.value || '').trim(),
        progress: ($('#evolutionProgress')?.value || '').trim(),
        difficulties: ($('#evolutionDifficulties')?.value || '').trim(),
        nextSteps: ($('#evolutionNextSteps')?.value || '').trim(),
        rating: $('#evolutionRating')?.value || '',
        mood: $('#evolutionMood')?.value || '',
        notes: ($('#evolutionNotes')?.value || '').trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (!data.studentId) {
        toast('Selecione um aluno', 'warning');
        return;
      }
      await addDoc(colEvolutions, data);
      toast('Anotação criada!', 'success');
      formEvo.reset();
      closeModal(modalEvo);
      await listarEvolucao();
    } catch (e) {
      console.error(e);
      toast('Erro ao salvar evolução', 'error');
    }
  });
}

async function listarEvolucao() {
  if (!evoTimeline) return;
  evoTimeline.innerHTML = '<div class="text-gray-500 p-3">Carregando...</div>';
  try {
    const q = query(colEvolutions, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      evoTimeline.innerHTML = '<div class="text-gray-500 p-3">Sem anotações</div>';
      return;
    }
    const html = [];
    snap.forEach(docSnap => {
      const e = docSnap.data();
      html.push(`
        <div class="p-3 border rounded mb-2">
          <div class="font-semibold">${e.style || 'Aula'} ${e.level || ''}</div>
          <div class="text-sm text-gray-600">${e.date}</div>
          ${e.content ? `<div class="mt-1">${e.content}</div>` : ''}
        </div>
      `);
    });
    evoTimeline.innerHTML = html.join('');
  } catch (e) {
    console.error(e);
    evoTimeline.innerHTML = '<div class="text-red-600 p-3">Erro ao listar evolução</div>';
  }
}

// ---- Inicializações de listas na carga ----
window.addEventListener('DOMContentLoaded', async () => {
  console.log('[GA] DOM pronto – carregando listas');
  await listarAlunos();
  await listarAulas();
  await listarEvolucao();
});
// =====================
// CALENDÁRIO (render e navegação)
// =====================
(() => {
  const grid = document.getElementById('calendarGrid');
  const lbl  = document.getElementById('labelMes');
  const btnPrev = document.getElementById('btnPrevMonth');
  const btnNext = document.getElementById('btnNextMonth');
  const btnToday = document.getElementById('btnToday');

  if (!grid || !lbl) {
    console.warn('[CAL] elementos de calendário não encontrados; pulando setup.');
    return;
  }

  // Cursor = primeiro dia do mês atual
  let cursor = new Date();
  cursor.setDate(1);

  function fmtMesAno(d) {
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function ymd(d) {
    // YYYY-MM-DD (para salvar/consultar Firestore depois)
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  // retorna array de 42 datas (6 semanas) iniciando no domingo anterior/igual ao dia 1
  function buildMatrix(dateFirstOfMonth) {
    const year = dateFirstOfMonth.getFullYear();
    const month = dateFirstOfMonth.getMonth();
    const first = new Date(year, month, 1);
    const startDow = first.getDay(); // 0=Dom
    const start = new Date(year, month, 1 - startDow);

    const days = [];
    for (let i=0; i<42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate()+i);
      days.push(d);
    }
    return days;
  }

  // (placeholder) carrega eventos do mês — por enquanto vazio; já deixo o shape pronto
  async function loadEventsMap(monthDate) {
    // Em seguida conectaremos ao Firestore. Por agora, devolve {}
    // Estrutura: { 'YYYY-MM-DD': [ {title, status, style, aluno} ] }
    return {};
  }

  async function renderCalendar() {
    lbl.textContent = fmtMesAno(cursor);

    const cells = buildMatrix(cursor);
    const thisMonth = cursor.getMonth();

    // Carrega eventos do mês (a seguir conectaremos ao Firestore)
    const eventsMap = await loadEventsMap(cursor);

    const html = cells.map(d => {
      const isOut = d.getMonth() !== thisMonth;
      const key = ymd(d);
      const items = eventsMap[key] || [];
      const evs = items.map(ev => {
        const cls = `badge ${ev.status || 'marcada'}`;
        const txt = (ev.aluno ? ev.aluno + ' — ' : '') + (ev.style || ev.titulo || 'Aula');
        return `<span class="${cls}" title="${txt}">${txt}</span>`;
      }).join('');

      return `
        <div class="cal-cell ${isOut ? 'out':''}" data-date="${key}">
          <span class="cal-day">${d.getDate()}</span>
          <div class="cal-events">${evs}</div>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;

    // Clique em dia = (por enquanto) cria aula padrão às 10:00 (na próxima etapa salvaremos no Firestore)
    grid.querySelectorAll('.cal-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dia = cell.getAttribute('data-date');
        console.log('[CAL] clique no dia:', dia);
        // Aqui depois abriremos o modal "Agendar Aula" já com a data preenchida.
        alert(`Dia ${dia} selecionado.\nNa próxima etapa abriremos o modal de agendamento.`);
      });
    });
  }

  // Navegação
  btnPrev?.addEventListener('click', () => {
    cursor.setMonth(cursor.getMonth() - 1);
    renderCalendar();
  });
  btnNext?.addEventListener('click', () => {
    cursor.setMonth(cursor.getMonth() + 1);
    renderCalendar();
  });
  btnToday?.addEventListener('click', () => {
    const now = new Date();
    cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();
  });

  // Render inicial
  renderCalendar();
  console.log('[CAL] calendário pronto');
})();
