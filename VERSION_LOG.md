# 📘 VERSION LOG

Bailado Carioca – Gestão de Aulas
Atualizado até v2.16.0 | Status: Oficial

---

# 🔒 Política de Versionamento

- **Major**: mudanças estruturais profundas
- **Minor**: melhorias arquiteturais e extração de módulos
- **Patch**: correções e estabilizações

Deploy em produção sempre vinculado a versão documentada.
Sequência obrigatória: staging → validar → commit → production → tag → VERSION_LOG

---

# 📦 Histórico de Versões

---

## v2.16.0 — Extração do módulo de relatórios

- Criado `public/js/ui/reportsUI.js`
- Extraídos: `renderReportMonthKPIs`, `renderDashboard`, `drawBars`,
  `ensureYearSelects`, `fillRepYearInvest`, `fillRepStudentSelect`,
  `renderRepStudent`, `initRepStudentArea`, `setupReportMonthFilter`,
  `initReportMonthPatch`, `calculateCashRevenueForMonth`
- Padrão `_ctx` com getters para `lessons`, `students` e `cashEntries`
- **Refatoração completa** — todos os módulos extraídos do `app.js`

---

## v2.15.0 — Extração do módulo de evolução

- Criado `public/js/ui/evolutionUI.js`
- Extraídos: `renderEvolutions`, `buildEvoTree`, `exportEvolutionPDF`
- Padrão `_ctx` com getters para `evolutions`, `students` e `db`

---

## v2.14.0 — Extração do módulo de recibo

- Criado `public/js/ui/receiptUI.js`
- Extraídos: `openReceiptFromLesson`, `openReceiptFromStudent`,
  `generateReceiptPDF`, `fillPackageAuto`, `toggleReceiptBoxes`,
  `bindReceiptButtons`, `fillReceiptStudents`, `getLessonsInRange`
- Padrão `_ctx` com getters para `lessons` e `students`

---

## v2.13.0 — Extração do módulo de aulas

- Criado `public/js/ui/lessonsUI.js`
- Extraídos: `openLessonModal`, `editLesson`, `requestDeleteLesson`,
  `saveLesson`, `deleteLessonConfirmed`, `bindLessonButtons`
- Padrão `_ctx` com getters para acesso reativo

---

## v2.12.0 — Extração do módulo de caixa

- Criado `public/js/ui/cashUI.js`
- Extraídos: `bindCashButton`, `renderCashEntries`, `initCash`
- `renderCashEntries` agora recebe `cashEntries` como parâmetro
- Padrão `_ctx` com getters para `db`, `user` e `colCash`

---

## v2.11.0 — Extração do módulo de alunos

- Criado `public/js/ui/studentsUI.js`
- Extraídos: `renderStudents`, `enableStudentDrag`, `getDragAfterElement`,
  `openPkgModal`, `bindPkgModal`, `hasActivePackage`, `parsePkgDate`, `inPkgRange`
- Padrão `_ctx` com getters para acesso reativo

---

## v2.10.0 — Extração do módulo de calendário

- Criado `public/js/ui/calendarUI.js`
- Extraídos: `renderCalendar`, `renderDayDetails`, `renderUpcoming`,
  `renderFilterEcho`, `bindCalendarEvents`, `initCalendar`
- Padrão `_ctx` com getters para acesso reativo a `lessons` e `students`

---

## v2.9.0 — Extração do módulo de helpers

- Criada pasta `public/js/ui/`
- Criado `public/js/ui/helpers.js`
- Extraídos: `BRAND_NAME`, `toInputDate`, `toLocalDateTimeString`,
  `hhmmLocal`, `showAlert`, `maskBRLInput`, `bindBRLMasks`,
  `firstName`, `normalizePhoneBR`, `buildWhatsAppMessage`

---

## v2.8.0 — Limpeza e organização do projeto

- Removidos 10 arquivos desnecessários e duplicatas
- `app.js` limpo: duplicatas removidas
- Redução de ~3000 para 1641 linhas sem perda de funcionalidade
- Árvore do projeto organizada e documentada

---

## v2.7.0 — Consolidação PWA e Promoção Controlada para Produção

- Manifest atualizado com campo `id` explícito
- Inclusão de ícone 512x512 maskable
- Substituição completa dos ícones oficiais
- Nova identidade PWA forçada
- Correção definitiva de cache de instalação Edge
- Revalidação do Service Worker
- Fluxo formal staging → production consolidado
- ✔ Ícone oficial amarelo ativo em produção

---

## v2.6.2 — Estabilização Estrutural Reativa

- Reestruturação da função `attach()`
- Correção de fechamento incorreto que quebrava `onSnapshot`
- Normalização de datas no snapshot de `cashEntries`
- Remoção de listener duplicado
- Hardening matemático: guards contra NaN, `safeArray`, `safeNumber`
- ✔ Reatividade restaurada | ✔ Caixa funcional | ✔ Ranking consistente

---

## v2.5.x — Consolidação Financeira

- Cálculo híbrido: Aulas + Caixa
- KPIs consolidados, comparativo anual, ranking por aluno
- Crescimento percentual implementado

---

## v2.4.x — Implementação de Recorrência

- Campo `recurrenceGroupId` introduzido via `crypto.randomUUID()`
- Sem impacto na renderização
- Estrutura de exclusão segura

---

## v2.3.x — Consolidação Multi-Ambiente

- Separação production / staging
- Configuração dinâmica por hostname
- Isolamento completo de banco por ambiente
- Deploy por alias Firebase

---

## v2.2.x — Modularização Inicial

- Separação `core` / `services` / `utils`
- Extração de `reportService`
- Padronização de retorno de funções
- Redução de acoplamento

---

## v2.1.x — Estrutura Base Estável

- CRUD Alunos e Aulas
- Módulo Evolução
- Caixa inicial
- Snapshot reativo implementado

---

## Estrutura atual do projeto

public/js/
├── app.js              ← orquestrador (~200 linhas)
├── core/
│   ├── firebase.js
│   ├── firebase.production.js
│   └── firebase.staging.js
├── services/
│   ├── authService.js
│   ├── lessonService.js
│   ├── studentService.js
│   └── reportService.js
├── utils/
│   ├── dateService.js
│   ├── formatService.js
│   └── uiHelpers.js
└── ui/
├── helpers.js
├── calendarUI.js
├── studentsUI.js
├── cashUI.js
├── lessonsUI.js
├── receiptUI.js
├── evolutionUI.js
└── reportsUI.js

## v2.17.0 — Relatório Mensal em PDF

- Criado public/js/ui/reportPDF.js
- Botão "📄 Exportar PDF do Mês" adicionado na aba Relatórios
- Relatório inclui: cabeçalho, KPIs do mês, lista de aulas realizadas,
  entradas do caixa e total geral
- Respeita o mês/ano selecionado nos filtros de relatório
- Gerado via jsPDF, sem dependências extras

## v2.18.0 — Histórico de pacotes por aluno

- Criado public/js/ui/packageHistoryUI.js
- Botão "Histórico" adicionado em cada card de aluno
- Pacote anterior salvo automaticamente antes de cada renovação
- Modal de histórico mostra pacote atual e todos os anteriores
- Inclui: período, aulas realizadas, valor investido e barra de progresso
- firestore.rules atualizado com subcoleção /alunos/{id}/pacotes
- firebase.json atualizado com configuração do Firestore
- Índices compostos criados em staging e produção
- Correção do drawBars no reportsUI.js

## v2.19.0 — Validação visual de formulários

- Criado public/js/ui/formValidation.js
- Validação com borda vermelha e mensagem de erro por campo
- Erro limpo automaticamente ao digitar/mudar o campo
- Formulários validados:
  - Nova Aula: aluno, data e estilo obrigatórios
  - Novo Pacote: início, fim e total obrigatórios
  - Caixa: data, valor e descrição obrigatórios
  - Aluno: nome obrigatório
  - Evolução: aluno e data obrigatórios
- CSS adicionado: .field-error e .field-error-msg
- sw.js atualizado para gestao-v305

## v2.20.0 — Modo offline robusto

- Ativado enableIndexedDbPersistence em firebase.production.js e firebase.staging.js
- Dados persistem localmente via IndexedDB
- App funciona offline após primeiro carregamento
- Fallback com warnings para múltiplas abas e browsers sem suporte

## v2.21.0 — Limpeza e organização do index.html

- Inline styles removidos e substituídos por classes CSS
- Bug corrigido na seção Relatórios (div mal fechada)
- Scripts inline consolidados em um único bloco
- Ordem das seções corrigida (Caixa antes do Backup)
- Indentação e estrutura HTML reorganizada
- Novas classes utilitárias adicionadas ao app.css:
  .header-row, .section-header, .form-grid, .form-field,
  .field-lg/md/sm/full, .modal-title-row, entre outras

  ## v2.22.0 — Refatoração completa do CSS

- app.css reorganizado: Variáveis → Base → Layout → Componentes → Seções → Modais → Responsivo
- Duplicatas removidas: cal-head-top, cal-head-filters, upcoming-row, evo-card-body, btn
- Inline styles do index.html substituídos por classes CSS
- Filtros da agenda corrigidos (layout em linha, sem empilhamento)
- Sticky removido do cal-head (não travava mais durante scroll)
- Responsivo consolidado em 3 breakpoints: 900px, 768px e 600px

## v2.23.0 — Expansão da cobertura de testes

- Criado tests/reportService.test.js — 40 testes cobrindo:
  calculateTotalRevenueFromLessons, extractUniqueStudentIdsFromLessons,
  calculateAveragePerStudent, calculateTotalRevenueForStudent,
  calculateRealizedRevenueForLessons, calculateForecastRevenueForLessons,
  calculateYearlyStudentReport, calculateYearlyStudentRanking,
  calculateYearComparison, calculateRevenueConcentration
- Criado tests/formatService.test.js — 12 testes cobrindo:
  parseBRLToNumber, formatBRL, formatBRLFromCents
- Criado tests/dateService.test.js — 5 testes cobrindo:
  parseISODateLocal
- Total: 21 suites, 66 testes passando

## v2.24.0 — Módulo Aulas em Grupo

- Nova aba "Grupo" no app
- Cadastro de turmas: nome, dia, horário, capacidade por papel, mensalidade padrão
- Cadastro de alunos do grupo: nome, telefone, e-mail (base separada dos particulares)
- Matrículas por turma: papel (Condutor/Condutora/Conduzido/Conduzida), tipo (Pagante/Bolsista), mensalidade individual
- Controle de mensalidades por mês: Pendente / Pago
- Edição de aluno e matrícula
- Painel de alunos por turma com agrupamento por papel
- Contador de vagas: condutores, conduzidas e total
- firestore.rules atualizado: turmas, alunosGrupo, matriculas, mensalidadesGrupo
- Índices Firestore criados em staging e produção
- CSS: turma-card, painel de alunos, ok-btn, warn-btn

## v2.25.0 — Módulo de Grupo — Presença, Navegação e Trancar Matrícula

- Controle de presença por aula:
  - Modal de chamada com data selecionável
  - Status por aluno: Presente / Ausente / Justificado
  - Chamada salva e recarregada por data
  - Alunos trancados não aparecem na chamada
- Navegação de meses nas mensalidades (◀ ▶)
- Trancar e reativar matrícula:
  - Badge "Trancado" no card do aluno
  - Aluno trancado não aparece no contador de vagas
  - Mensalidade suspensa enquanto trancado
- Fix: contador de condutores, conduzidas e total exclui trancados
- firestore.rules atualizado com coleção presencas

## v2.26.0 — Integração do Grupo nos Relatórios

- Bloco 3 adicionado na aba Relatórios: Grupo — mês selecionado
- KPIs do grupo: turmas ativas, alunos ativos, trancados,
  receita esperada, receita realizada, inadimplentes, taxa de adimplência
- Por turma: barra de progresso de adimplência com cor dinâmica
- Bloco atualiza ao mudar mês/ano nos filtros de relatório
- Fix: gráfico anual não renderizava ao abrir a aba Relatórios
- app.js: listeners Firestore para turmas, matriculas e mensalidadesGrupo

## v2.27.0 — Skeleton Loader

- Criado public/js/ui/skeletonUI.js
- Skeleton loaders implementados em todas as abas:
  - Agenda: grid do calendário com 35 células animadas
  - Alunos: cards com barra de progresso e botões
  - Evolução: árvore + lista de anotações
  - Relatórios: grid de KPIs + gráfico de barras
  - Grupo: cards de turma
- Animação de pulso suave via CSS keyframes
- Skeletons removidos automaticamente quando dados chegam do Firestore
- CSS: skeleton, skeleton-card, skeleton-line, skeleton-kpi, skeleton-bar

## v2.28.0 — Refatoração CSS do módulo de grupo

- Inline styles removidos do grupoUI.js
- Novas classes CSS adicionadas ao app.css:
  modal-box-md, modal-box-lg, modal-aluno-toggle, modal-aluno-btns,
  modal-hint, modal-field-mt, modal-actions-mt, painel-mes-nav,
  painel-mes-label, chamada-data-row, chamada-data-wrap,
  aluno-mat-badge-trancado, turma-sem-dados, painel-sem-alunos
- grupoUI.js mais limpo e manutenível

## v2.29.0 — Caixa com entradas, saídas e navegação por mês

- Caixa evoluído de "entradas externas" para controle financeiro completo
- Tipos de lançamento: Entrada e Saída
- Categorias separadas por tipo:
  - Entradas: Aulas em grupo, Workshop, Aulão, Outros
  - Saídas: Aluguel de sala, Material didático, Transporte, Outros
- Resumo do mês: total de entradas, saídas e saldo
- Navegação por mês (◀ ▶) — mostra apenas lançamentos do mês selecionado
- Visual: badge colorido por tipo, valor verde/vermelho
- Fix: import duplicado do cashUI.js removido do app.js

## v2.30.0 — Histórico de Chamadas

- Botão "📅 Histórico" adicionado em cada card de turma
- Modal com lista de todas as chamadas registradas ordenadas por data
- Resumo por chamada: presentes, ausentes, justificados
- Detalhe expansível por chamada com status individual de cada aluno
- CSS: historico-chamada-card, historico-detalhe-row, badges por status