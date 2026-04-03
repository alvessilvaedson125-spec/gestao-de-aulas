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