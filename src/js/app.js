/* =============================================================================
   Bailado Carioca — App (Prod Base)
   - Auth anon + escopo por usuário (ownerUid)
   - Calendário Mensal e Semanal (navegação Hoje/Prev/Next)
   - CRUD Alunos, Aulas, Evolução
   - Relatórios (Chart.js) + Backup/Restore
   - WhatsApp link correto
   - PWA: SW já registrado no index.html
============================================================================= */

// ===== Firebase (SEU projeto)
const firebaseConfig = {
  apiKey: "AIzaSyBh6CIne05dCuO0mu7JX6icZv8l7c2bw_8",
  authDomain: "meu-app-edson.firebaseapp.com",
  projectId: "meu-app-edson",
  storageBucket: "meu-app-edson.firebasestorage.app",
  messagingSenderId: "555388653411",
  appId: "1:555388653411:web:e9184f7f5e443174934d56"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== Estado
let currentUser = null;
let alunos = [];
let aulas = [];
let evolucoes = [];

let viewMode = 'month'; // 'month' | 'week'
let cursorDate = new Date(); // âncora para navegação (mês ou semana)
let unsubAulas = null;

// ==== helpers DOM
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const toDate = v => (v?.toDate ? v.toDate() : new Date(v));
const sameDay = (a,b)=> a.getFullYear()==b.getFullYear() && a.getMonth()==b.getMonth() && a.getDate()==b.getDate();
const sanitizePhone = p => (p||'').replace(/[^\d+]/g,'');

// ==== Navegação de views
function showView(id) {
  $$('.view').forEach(v => v.classList.add('hidden'));
  const el = document.getElementById(id) || document.getElementById('calendario');
  el.classList.remove('hidden');
  if (id === 'relatorios') atualizarRelatorios();
}
function onHashChange(){ showView((location.hash||'#calendario').slice(1)); }
window.addEventListener('hashchange', onHashChange);
$('#btnMenu')?.addEventListener('click', ()=> $('#menuMobile')?.classList.toggle('hidden'));

// ==== Status -> classe
function evClass(st){
  switch((st||'').toLowerCase()){
    case 'confirmada': return 'ev-confirmada';
    case 'reagendada': return 'ev-reagendada';
    case 'dada':       return 'ev-dada';
    case 'cancelada':  return 'ev-cancelada';
    default:           return 'ev-marcada';
  }
}

// ==== Calendário — render mensal
function renderMonth(){
  $('#weekHead').classList.add('hidden');
  $('#calendarWeek').classList.add('hidden');
  $('#monthHead').classList.remove('hidden');
  $('#calendarMonth').classList.remove('hidden');

  $('#labelRange').textContent = cursorDate.toLocaleDateString('pt-BR', { month:'long', year:'numeric' });

  const grid = $('#calendarMonth');
  grid.innerHTML = '';

  const first = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const last  = new Date(cursorDate.getFullYear(), cursorDate.getMonth()+1, 0);
  const startDay = first.getDay();
  const totalCells = 42;

  // mês anterior
  for (let i=0; i<startDay; i++){
    const cell = document.createElement('div');
    cell.className = 'day-cell bg-gray-50';
    grid.appendChild(cell);
  }

  // mês atual
  for (let d=1; d<=last.getDate(); d++){
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    const dayDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), d);
    if (sameDay(dayDate, new Date())) cell.classList.add('day-today');

    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = d;
    cell.appendChild(num);

    const list = document.createElement('div');
    aulas.filter(a=> sameDay(toDate(a.data), dayDate)).slice(0,5).forEach(a=>{
      const evt = document.createElement('div');
      evt.className = `event-pill ${evClass(a.status)}`;
      const hora = toDate(a.data).toTimeString().slice(0,5);
      evt.textContent = `${hora} • ${a.alunoNome||''}${a.estilo?' • '+a.estilo:''}`;
      evt.title = 'Editar';
      evt.addEventListener('click', (e)=>{ e.stopPropagation(); abrirModalAula(a); });
      list.appendChild(evt);
    });
    cell.appendChild(list);

    cell.addEventListener('click', ()=> abrirModalAula(null, dayDate));
    grid.appendChild(cell);
  }

  // completar
  const filled = startDay + last.getDate();
  for (let i=filled; i<totalCells; i++){
    const cell = document.createElement('div');
    cell.className = 'day-cell bg-gray-50';
    grid.appendChild(cell);
  }
}

// ==== Calendário — render semanal (Dom-Sáb)
function startOfWeek(d){
  const x = new Date(d); const diff = x.getDay(); // 0=Dom
  x.setDate(x.getDate() - diff);
  x.setHours(0,0,0,0);
  return x;
}
function renderWeek(){
  $('#monthHead').classList.add('hidden');
  $('#calendarMonth').classList.add('hidden');
  $('#weekHead').classList.remove('hidden');
  $('#calendarWeek').classList.remove('hidden');

  const base = startOfWeek(cursorDate);
  const end  = new Date(base); end.setDate(end.getDate()+6);
  $('#labelRange').textContent =
    `${base.toLocaleDateString('pt-BR')} — ${end.toLocaleDateString('pt-BR')}`;

  // Cabeçalho já visível (weekHead)

  // Monta grade: 8 colunas (horários + 7 dias)
  const grid = $('#calendarWeek');
  grid.innerHTML = '';

  // Coluna 0: horários
  const colHours = document.createElement('div');
  colHours.className = 'week-col';
  for (let h=7; h<=22; h++){
    const row = document.createElement('div');
    row.className = 'week-hour';
    row.textContent = `${String(h).padStart(2,'0')}:00`;
    colHours.appendChild(row);
  }
  grid.appendChild(colHours);

  // 7 colunas de dias
  for (let i=0; i<7; i++){
    const day = new Date(base); day.setDate(base.getDate()+i);

    const col = document.createElement('div');
    col.className = 'week-col';

    // marcador de hoje
    if (sameDay(day, new Date())) {
      const tag = document.createElement('div');
      tag.className = 'text-[10px] text-pink-700 font-semibold text-right pr-1';
      tag.textContent = 'HOJE';
      col.appendChild(tag);
    }

    // eventos do dia (apenas empilhados por hora)
    const events = aulas.filter(a=> sameDay(toDate(a.data), day))
                        .sort((a,b)=> toDate(a.data) - toDate(b.data));

    let hourCursor = 7;
    events.forEach(a=>{
      const ad = toDate(a.data);
      // adiciona trilhas de horas vazias até a hora do evento
      while (hourCursor < ad.getHours() && hourCursor <= 22){
        const filler = document.createElement('div');
        filler.className = 'week-hour';
        col.appendChild(filler);
        hourCursor++;
      }
      // bloco do evento
      const block = document.createElement('div');
      block.className = `week-event ${evClass(a.status)}`;
      block.textContent = `${String(ad.getHours()).padStart(2,'0')}:${String(ad.getMinutes()).padStart(2,'0')} • ${a.alunoNome||''}${a.estilo?' • '+a.estilo:''}`;
      block.title = 'Editar';
      block.addEventListener('click', ()=> abrirModalAula(a));
      col.appendChild(block);
    });
    // completa horas restantes
    while (hourCursor <= 22){
      const filler = document.createElement('div');
      filler.className = 'week-hour';
      col.appendChild(filler);
      hourCursor++;
    }

    // click no dia para criar 10:00
    col.addEventListener('click', (e)=>{
      if (e.target === col) {
        const seed = new Date(day); seed.setHours(10,0,0,0);
        abrirModalAula(null, seed);
      }
    });

    grid.appendChild(col);
  }
}

// ==== Navegação calendário (prev/next/hoje + mudar visão)
function refreshCalendar(){
  if (viewMode === 'month') renderMonth(); else renderWeek();
  watchAulas(); // atualiza assinatura do período
}

$('#btnViewMonth')?.addEventListener('click', ()=>{ viewMode='month'; refreshCalendar(); });
$('#btnViewWeek')?.addEventListener('click', ()=>{ viewMode='week'; refreshCalendar(); });
$('#btnPrev')?.addEventListener('click', ()=>{
  if (viewMode==='month'){ cursorDate.setMonth(cursorDate.getMonth()-1); }
  else { cursorDate.setDate(cursorDate.getDate()-7); }
  refreshCalendar();
});
$('#btnNext')?.addEventListener('click', ()=>{
  if (viewMode==='month'){ cursorDate.setMonth(cursorDate.getMonth()+1); }
  else { cursorDate.setDate(cursorDate.getDate()+7); }
  refreshCalendar();
});
$('#btnHoje')?.addEventListener('click', ()=>{
  cursorDate = new Date();
  refreshCalendar();
});
$('#btnNovaAula')?.addEventListener('click', ()=> abrirModalAula());

// ==== Consultas escopadas por ownerUid
function watchAlunos(){
  if (!currentUser) return;
  return db.collection('alunos')
    .where('ownerUid','==',currentUser.uid)
    .orderBy('nome')
    .onSnapshot(snap=>{
      alunos = [];
      snap.forEach(doc => alunos.push({ id:doc.id, ...doc.data() }));
      renderAlunos(); preencherSelects(); atualizarRelatorios();
    });
}
function watchEvolucoes(){
  if (!currentUser) return;
  return db.collection('evolucoes')
    .where('ownerUid','==',currentUser.uid)
    .orderBy('criadoEm','desc')
    .onSnapshot(snap=>{
      evolucoes = []; snap.forEach(doc=> evolucoes.push({ id:doc.id, ...doc.data() }));
      renderEvolucao();
    });
}
function watchAulas(){
  if (!currentUser) return;
  if (unsubAulas) { unsubAulas(); unsubAulas=null; }

  let ini, fim;
  if (viewMode==='month'){
    ini = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    fim = new Date(cursorDate.getFullYear(), cursorDate.getMonth()+1, 0, 23,59,59,999);
  } else {
    const base = startOfWeek(cursorDate);
    ini = new Date(base);
    fim = new Date(base); fim.setDate(base.getDate()+6); fim.setHours(23,59,59,999);
  }

  unsubAulas = db.collection('aulas')
    .where('ownerUid','==',currentUser.uid)
    .where('data','>=',ini)
    .where('data','<=',fim)
    .orderBy('data')
    .onSnapshot(snap=>{
      aulas = []; snap.forEach(doc => aulas.push({ id:doc.id, ...doc.data() }));
      (viewMode==='month'? renderMonth : renderWeek)();
    });
}

// ==== Render Alunos
function renderAlunos(){
  const ul = $('#listaAlunos'); if (!ul) return;
  ul.innerHTML = '';

  const busca = ($('#buscarAluno')?.value || '').toLowerCase();
  const filtro = $('#filtroAlunoStatus')?.value || '';

  const list = alunos.filter(a=>{
    const hit = (a.nome||'').toLowerCase().includes(busca) ||
                (a.email||'').toLowerCase().includes(busca) ||
                (a.telefone||'').toLowerCase().includes(busca);
    const ok = !filtro || (a.status||'ativo')===filtro;
    return hit && ok;
  });

  if (!list.length){
    ul.innerHTML = `<li class="text-center text-gray-500 py-8 col-span-3">Nenhum aluno encontrado.</li>`;
    return;
  }

  list.forEach(a=>{
    const li = document.createElement('li');
    li.className = 'card p-4';
    const tot = Number(a.aulasContratadas||0);
    const rest = Number(a.aulasRestantes ?? tot);
    const pct = tot>0 ? Math.max(0, Math.min(100, Math.round(rest*100/tot))) : 0;
    let bar = 'bg-green-500'; if (pct<25) bar='bg-red-500'; else if (pct<50) bar='bg-yellow-500';

    const tipoTxt = ({avulsa:'Aula Avulsa',casal:'Aula em Casal',pacote5:'Pacote 5 aulas',pacote10:'Pacote 10 aulas'})[a.tipoAula]||'—';

    li.innerHTML = `
      <h4 class="text-lg font-semibold text-pink-700">${a.nome||''}</h4>
      <p class="text-sm text-gray-600"><i class="fa-solid fa-envelope mr-1"></i> ${a.email||''}</p>
      <p class="text-sm text-gray-600"><i class="fa-solid fa-phone mr-1"></i> ${a.telefone||''}</p>
      <div class="mt-3">
        <div class="flex justify-between text-sm mb-1"><span>Aulas restantes</span><span class="font-semibold">${rest}/${tot}</span></div>
        <div class="w-full bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full ${bar}" style="width:${pct}%"></div></div>
      </div>
      <div class="mt-3 flex justify-between items-center">
        <span class="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">${tipoTxt}</span>
        <div class="flex items-center gap-2">
          <button class="btn-green px-2 py-1 text-xs" data-wapp="${a.telefone||''}" data-name="${a.nome||''}"><i class="fa-brands fa-whatsapp"></i></button>
          <button class="btn-outline px-2 py-1 text-xs" data-edit="${a.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-outline px-2 py-1 text-xs" data-del="${a.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll('[data-wapp]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const tel = sanitizePhone(b.getAttribute('data-wapp'));
      const nome = b.getAttribute('data-name')||'';
      const msg = `Olá ${nome}! Tudo bem? Gostaria de confirmar sua aula.`;
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  });
  ul.querySelectorAll('[data-edit]').forEach(b=>{
    b.addEventListener('click', ()=> abrirModalAluno(alunos.find(x=>x.id===b.getAttribute('data-edit'))));
  });
  ul.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-del');
      const pend = aulas.filter(x=> x.alunoId===id && ['marcada','confirmada','reagendada'].includes((x.status||'').toLowerCase()));
      if (pend.length){ alert('Aluno com aulas pendentes. Cancele antes de excluir.'); return; }
      if (confirm('Excluir aluno?')) await db.collection('alunos').doc(id).delete();
    });
  });
}
$('#btnNovoAluno')?.addEventListener('click', ()=> abrirModalAluno());
$('#buscarAluno')?.addEventListener('input', renderAlunos);
$('#filtroAlunoStatus')?.addEventListener('change', renderAlunos);

// ==== Modais Aluno
function abrirModalAluno(a=null){
  $('#modalAluno').classList.remove('hidden');
  $('#tituloModalAluno').textContent = a ? 'Editar Aluno' : 'Novo Aluno';
  $('#formAluno').reset();
  $('#alunoId').value = a?.id || '';
  $('#alunoNome').value = a?.nome || '';
  $('#alunoEmail').value = a?.email || '';
  $('#alunoTelefone').value = a?.telefone || '';
  $('#alunoTipoAula').value = a?.tipoAula || '';
  $('#alunoAulasContratadas').value = a?.aulasContratadas || '';
  $('#alunoStatus').value = a?.status || 'ativo';
  $('#alunoObs').value = a?.obs || '';
}
function fecharModalAluno(){ $('#modalAluno').classList.add('hidden'); }
$('#btnFecharAluno')?.addEventListener('click', fecharModalAluno);
$('#btnCancelarAluno')?.addEventListener('click', fecharModalAluno);
$('#btnLimparAluno')?.addEventListener('click', ()=> $('#formAluno').reset());

$('#formAluno')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = $('#alunoId').value || null;
  const data = {
    ownerUid: currentUser.uid,
    nome: $('#alunoNome').value.trim(),
    email: $('#alunoEmail').value.trim(),
    telefone: $('#alunoTelefone').value.trim(),
    tipoAula: $('#alunoTipoAula').value,
    aulasContratadas: parseInt($('#alunoAulasContratadas').value,10),
    status: $('#alunoStatus').value || 'ativo',
    obs: $('#alunoObs').value.trim()
  };
  if (!/^\S+@\S+\.\S+$/.test(data.email)) { alert('E-mail inválido.'); return; }
  if (!/^\+\d{10,15}$/.test(sanitizePhone(data.telefone))) { alert('Telefone inválido (+5521999999999).'); return; }
  if (!(data.aulasContratadas>0)) { alert('Informe aulas contratadas.'); return; }

  if (id){
    // preserva aulasRestantes, se já existir
    const antigo = alunos.find(a=>a.id===id);
    data.aulasRestantes = typeof antigo?.aulasRestantes==='number' ? antigo.aulasRestantes : data.aulasContratadas;
    await db.collection('alunos').doc(id).update(data);
  } else {
    data.aulasRestantes = data.aulasContratadas;
    data.criadoEm = new Date();
    await db.collection('alunos').add(data);
  }
  fecharModalAluno();
});

// ==== Modais Aula
function preencherSelects(){
  const selAula = $('#aulaAluno'); const selEvo = $('#evoAluno');
  if (selAula) selAula.innerHTML = `<option value="">Selecione...</option>` + alunos.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('');
  if (selEvo) selEvo.innerHTML = `<option value="">(Sem vínculo)</option>` + alunos.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('');
}
function abrirModalAula(a=null, dia=null){
  $('#modalAula').classList.remove('hidden');
  $('#tituloModalAula').textContent = a ? 'Editar Aula' : 'Nova Aula';
  $('#formAula').reset();
  $('#aulaId').value = a?.id || '';
  preencherSelects();

  $('#aulaAluno').value = a?.alunoId || '';
  $('#aulaEstilo').value = a?.estilo || '';
  $('#aulaDuracao').value = a?.duracao || 60;
  $('#aulaStatus').value = a?.status || 'marcada';
  $('#aulaObs').value = a?.obs || '';

  let dt;
  if (a?.data) dt = toDate(a.data);
  else if (dia) { dt = new Date(dia); }
  else { dt = new Date(); dt.setMinutes(0); dt.setHours(dt.getHours()+1); }
  $('#aulaDataHora').value = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function fecharModalAula(){ $('#modalAula').classList.add('hidden'); }
$('#btnFecharAula')?.addEventListener('click', fecharModalAula);
$('#btnCancelarAula')?.addEventListener('click', fecharModalAula);
$('#btnLimparAula')?.addEventListener('click', ()=> $('#formAula').reset());

$('#formAula')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = $('#aulaId').value || null;
  const alunoId = $('#aulaAluno').value;
  const aluno = alunos.find(a=>a.id===alunoId);
  if (!aluno){ alert('Selecione um aluno.'); return; }

  const dtIso = $('#aulaDataHora').value;
  const nova = {
    ownerUid: currentUser.uid,
    alunoId,
    alunoNome: aluno.nome,
    data: new Date(dtIso),
    duracao: parseInt($('#aulaDuracao').value,10) || 60,
    status: $('#aulaStatus').value,
    estilo: $('#aulaEstilo').value.trim(),
    obs: $('#aulaObs').value.trim()
  };

  // reduzir saldo quando vira "Dada"
  if (id){
    const antiga = aulas.find(x=>x.id===id);
    const eraDada  = (antiga?.status||'').toLowerCase()==='dada';
    const viraDada = (nova.status||'').toLowerCase()==='dada';
    if (!eraDada && viraDada && aluno.tipoAula!=='avulsa'){
      if ((aluno.aulasRestantes||0) <= 0){ alert('Aluno sem saldo.'); return; }
      await db.collection('alunos').doc(alunoId).update({ aulasRestantes: Math.max(0, (aluno.aulasRestantes||0)-1) });
    }
    await db.collection('aulas').doc(id).update(nova);
  } else {
    if ((nova.status||'').toLowerCase()==='dada' && aluno.tipoAula!=='avulsa'){
      if ((aluno.aulasRestantes||0) <= 0){ alert('Aluno sem saldo.'); return; }
      await db.collection('alunos').doc(alunoId).update({ aulasRestantes: Math.max(0, (aluno.aulasRestantes||0)-1) });
    }
    await db.collection('aulas').add(nova);
  }
  fecharModalAula();
});

// ==== Evolução
$('#btnNovaAnotacao')?.addEventListener('click', ()=> { $('#modalEvolucao').classList.remove('hidden'); $('#formEvolucao').reset(); });
function fecharModalEvolucao(){ $('#modalEvolucao').classList.add('hidden'); }
$('#btnFecharEvolucao')?.addEventListener('click', fecharModalEvolucao);
$('#btnCancelarEvolucao')?.addEventListener('click', fecharModalEvolucao);
$('#btnLimparEvolucao')?.addEventListener('click', ()=> $('#formEvolucao').reset());

$('#formEvolucao')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = {
    ownerUid: currentUser.uid,
    alunoId: $('#evoAluno').value || null,
    estilo: $('#evoEstilo').value.trim() || null,
    nivel: $('#evoNivel').value.trim() || null,
    conteudo: $('#evoConteudo').value.trim() || null,
    dificuldades: $('#evoDificuldades').value.trim() || null,
    proximos: $('#evoProximos').value.trim() || null,
    progresso: Math.max(0, Math.min(100, parseInt($('#evoProgresso').value,10)||0)),
    criadoEm: new Date()
  };
  await db.collection('evolucoes').add(data);
  fecharModalEvolucao();
});

function renderEvolucao(){
  const ul = $('#listaEvolucao'); ul.innerHTML = '';
  if (!evolucoes.length){ ul.innerHTML = `<li class="text-center text-gray-500 py-8">Sem anotações.</li>`; return; }
  evolucoes.forEach(ev=>{
    const li = document.createElement('li'); li.className='card p-4';
    const alunoNome = alunos.find(a=>a.id===ev.alunoId)?.nome || '(sem vínculo)';
    const dt = ev.criadoEm?.toDate?.() || ev.criadoEm || Date.now();
    li.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="font-medium">${alunoNome}</div>
          <div class="text-xs text-gray-500">${new Date(dt).toLocaleString('pt-BR')}</div>
        </div>
        <div class="text-xs text-gray-500">${ev.progresso ?? 0}%</div>
      </div>
      <div class="mt-2">
        ${ev.estilo?`<div><b>Estilo:</b> ${ev.estilo}</div>`:''}
        ${ev.nivel?`<div><b>Nível:</b> ${ev.nivel}</div>`:''}
        ${ev.conteudo?`<div><b>Conteúdo:</b> ${ev.conteudo}</div>`:''}
        ${ev.dificuldades?`<div><b>Dificuldades:</b> ${ev.dificuldades}</div>`:''}
        ${ev.proximos?`<div><b>Próximos passos:</b> ${ev.proximos}</div>`:''}
      </div>`;
    ul.appendChild(li);
  });
}

// ==== Relatórios
let chartTipo, chartEvo;
function atualizarRelatorios(){
  if (!currentUser) return;
  $('#kpiAlunos').textContent = alunos.length;

  const now = new Date();
  const ini = new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);

  const aulasMes = aulas.filter(a=> {
    const d = toDate(a.data);
    return d>=ini && d<=fim;
  });
  $('#kpiAulasMes').textContent = aulasMes.length;

  const dadas = aulasMes.filter(a=> (a.status||'').toLowerCase()==='dada').length;
  const agend = aulasMes.filter(a=> ['marcada','confirmada','reagendada'].includes((a.status||'').toLowerCase())).length;
  const cmp = agend>0 ? Math.round(dadas*100/agend) : 0;
  $('#kpiComparecimento').textContent = `${cmp}%`;

  const precos = { avulsa:100, casal:180, pacote5:450, pacote10:800 };
  let receita = 0;
  aulasMes.filter(a=> (a.status||'').toLowerCase()==='dada').forEach(a=>{
    const al = alunos.find(x=>x.id===a.alunoId); if (al) receita += (precos[al.tipoAula]||0);
  });
  $('#kpiReceita').textContent = `R$ ${receita.toFixed(2)}`;

  // gráfico tipo
  const cont = { avulsa:0, casal:0, pacote5:0, pacote10:0 };
  aulas.forEach(a=>{ const al = alunos.find(x=>x.id===a.alunoId); if (al && cont[al.tipoAula]!=null) cont[al.tipoAula]++; });
  const dataTipo = { labels:['Avulsa','Casal','Pacote 5','Pacote 10'], datasets:[{ data:[cont.avulsa,cont.casal,cont.pacote5,cont.pacote10], backgroundColor:['#FF6384','#36A2EB','#FFCE56','#4BC0C0'] }] };
  if (chartTipo) chartTipo.destroy();
  chartTipo = new Chart($('#chartTipo'), { type:'doughnut', data:dataTipo, options:{responsive:true, plugins:{legend:{position:'bottom'}}}});

  // gráfico evolução (mock + proporção dos alunos)
  const meses = []; const valores = []; for (let i=5;i>=0;i--){ const m=new Date(now.getFullYear(), now.getMonth()-i, 1); meses.push(m.toLocaleDateString('pt-BR',{month:'short', year:'2-digit'})); valores.push(Math.max(5, Math.round(alunos.length*(0.6+Math.random()*0.8)))); }
  const dataEvo = { labels: meses, datasets:[{ label:'Alunos', data: valores, borderColor:'rgb(75, 192, 192)' }] };
  if (chartEvo) chartEvo.destroy();
  chartEvo = new Chart($('#chartEvo'), { type:'line', data:dataEvo, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
}

// ==== Backup/Restore (escopado por ownerUid)
$('#btnExportar')?.addEventListener('click', async ()=>{
  const [al,au,ev] = await Promise.all([
    db.collection('alunos').where('ownerUid','==',currentUser.uid).get(),
    db.collection('aulas').where('ownerUid','==',currentUser.uid).get(),
    db.collection('evolucoes').where('ownerUid','==',currentUser.uid).get()
  ]);
  const dados = { alunos:[], aulas:[], evolucoes:[] };
  al.forEach(d=> dados.alunos.push({ id:d.id, ...d.data() }));
  au.forEach(d=> { const x=d.data(); if (x.data?.toDate) x.data=x.data.toDate(); dados.aulas.push({ id:d.id, ...x }); });
  ev.forEach(d=> { const x=d.data(); if (x.criadoEm?.toDate) x.criadoEm=x.criadoEm.toDate(); dados.evolucoes.push({ id:d.id, ...x }); });
  const blob = new Blob([JSON.stringify(dados)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href=url; a.download=`backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  alert('Backup exportado.');
});

$('#btnImportar')?.addEventListener('click', ()=> $('#arquivoBackup').click());
$('#arquivoBackup')?.addEventListener('change', async (ev)=>{
  const f = ev.target.files[0]; if (!f) return;
  try{
    const dados = JSON.parse(await f.text());
    if (!Array.isArray(dados.alunos) || !Array.isArray(dados.aulas) || !Array.isArray(dados.evolucoes)) { alert('Arquivo inválido.'); return; }
    if (!confirm('Importar backup e substituir tudo?')) return;

    // limpa dados do usuário
    const [al,au,evs] = await Promise.all([
      db.collection('alunos').where('ownerUid','==',currentUser.uid).get(),
      db.collection('aulas').where('ownerUid','==',currentUser.uid).get(),
      db.collection('evolucoes').where('ownerUid','==',currentUser.uid).get()
    ]);
    let batch = db.batch(); al.forEach(d=> batch.delete(d.ref)); await batch.commit();
    batch = db.batch(); au.forEach(d=> batch.delete(d.ref)); await batch.commit();
    batch = db.batch(); evs.forEach(d=> batch.delete(d.ref)); await batch.commit();

    // reimporta setando ownerUid
    batch = db.batch();
    dados.alunos.forEach(x=>{ const id=x.id; delete x.id; x.ownerUid=currentUser.uid; const ref=db.collection('alunos').doc(id); batch.set(ref,x); });
    await batch.commit();

    batch = db.batch();
    dados.aulas.forEach(x=>{ const id=x.id; delete x.id; x.ownerUid=currentUser.uid; if (typeof x.data==='string') x.data=new Date(x.data); const ref=db.collection('aulas').doc(id); batch.set(ref,x); });
    await batch.commit();

    batch = db.batch();
    dados.evolucoes.forEach(x=>{ const id=x.id; delete x.id; x.ownerUid=currentUser.uid; if (typeof x.criadoEm==='string') x.criadoEm=new Date(x.criadoEm); const ref=db.collection('evolucoes').doc(id); batch.set(ref,x); });
    await batch.commit();

    alert('Backup importado.');
  } catch(e){ console.error(e); alert('Erro ao importar.'); }
});

// ==== Auth + boot
async function boot(){
  try{ await auth.signInAnonymously(); } catch(e){ console.warn('auth anon', e); }
  currentUser = auth.currentUser;

  // MIGRAÇÃO: atribui ownerUid aos docs antigos sem ownerUid (apenas leitura/escrita do próprio usuário atual)
  const migrate = async (col) => {
    const snap = await db.collection(col).where('ownerUid','==',null).get().catch(()=>null);
    if (!snap || snap.empty) return;
    const batch = db.batch();
    snap.forEach(doc => { batch.update(doc.ref, { ownerUid: currentUser.uid }); });
    await batch.commit().catch(()=>{});
  };
  await Promise.all(['alunos','aulas','evolucoes'].map(migrate));

  // watchers
  watchAlunos();
  watchEvolucoes();
  refreshCalendar();

  // roteamento inicial
  onHashChange();
}
document.addEventListener('DOMContentLoaded', boot);
