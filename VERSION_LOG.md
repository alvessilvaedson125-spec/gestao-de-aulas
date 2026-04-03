

## VERSION_LOG.md

Bailado Carioca – Gestão de Aulas
Atualizado até v2.7.0
Status: Oficial

---

# 📘 VERSION LOG

Bailado Carioca – Gestão de Aulas

---

## v2.7.0 — Consolidação PWA e Promoção Controlada para Produção

Data: 2026

### 🔵 Infraestrutura

* Manifest atualizado com campo `id` explícito
* Inclusão de ícone 512x512 maskable
* Substituição completa dos ícones oficiais
* Nova identidade PWA forçada
* Correção definitiva de cache de instalação Edge
* Revalidação do Service Worker
* Validação de hard reload pós deploy

### 🔵 Processo

* Fluxo formal staging → production consolidado
* Merge realizado via `--no-edit`
* Deploy production validado
* Checklist atualizado
* Documentação arquitetural revisada

### 🔵 Resultado

✔ Ícone oficial amarelo ativo em produção
✔ Identidade PWA estável
✔ Sem regressão funcional
✔ Snapshot preservado
✔ Multi-ambiente intacto

---

## v2.6.2 — Estabilização Estrutural Reativa

### 🔵 Correções

* Reestruturação da função `attach()`
* Correção de fechamento incorreto que quebrava `onSnapshot`
* Normalização de datas no snapshot de `cashEntries`
* Remoção de listener duplicado
* Alinhamento estrutural do Caixa

### 🔵 Segurança

* Hardening matemático implementado
* Guards contra NaN
* safeArray aplicado
* safeNumber aplicado

### 🔵 Estabilidade

✔ Reatividade restaurada
✔ Evolução estabilizada
✔ Caixa funcional
✔ Ranking anual consistente
✔ Receita anual validada

---

## v2.5.x — Consolidação Financeira

* Implementação de cálculo híbrido (Aulas + Caixa)
* Integração de KPIs consolidados
* Comparativo anual
* Ranking por aluno
* Crescimento percentual

---

## v2.4.x — Implementação de Recorrência

* Campo `recurrenceGroupId` introduzido
* Geração via `crypto.randomUUID()`
* Sem impacto na renderização
* Estrutura de exclusão segura

---

## v2.3.x — Consolidação Multi-Ambiente

* Separação production / staging
* Configuração dinâmica por hostname
* Isolamento completo de banco
* Deploy por alias Firebase

---

## v2.2.x — Modularização Inicial

* Separação core / services / utils
* Extração de reportService
* Padronização de retorno de funções
* Redução de acoplamento

---

## v2.1.x — Estrutura Base Estável

* CRUD Alunos
* CRUD Aulas
* Módulo Evolução
* Caixa inicial
* Snapshot reativo implementado

---

# 🔒 Política de Versionamento

* Versões Major: mudanças estruturais profundas
* Versões Minor: melhorias arquiteturais
* Patch: correções e estabilizações

Deploy em produção sempre vinculado a versão documentada.

---

## v2.8.0 — Limpeza e organização do projeto

- Removidos 10 arquivos desnecessários e duplicatas
- app.js limpo: duplicatas de setupReportMonthFilter, renderReportMonthKPIs e Backup removidas
- Redução de ~3000 para 1641 linhas sem perda de funcionalidade
- Árvore do projeto organizada e documentada
---
## v2.9.0 — Extração de helpers para módulo separado

- Criada pasta public/js/ui/
- Extraído ui/helpers.js: BRAND_NAME, toInputDate, toLocalDateTimeString,
  hhmmLocal, showAlert, maskBRLInput, bindBRLMasks,
  firstName, normalizePhoneBR, buildWhatsAppMessage
- app.js reduzido sem perda de funcionalidade

## v2.10.0 — Extração do módulo de calendário

- Criado public/js/ui/calendarUI.js
- Extraídos: renderCalendar, renderDayDetails, renderUpcoming,
  renderFilterEcho, bindCalendarEvents, initCalendar
- Padrão _ctx com getters para acesso reativo a lessons e students
- app.js reduzido sem perda de funcionalidade

## v2.11.0 — Extração do módulo de alunos

- Criado public/js/ui/studentsUI.js
- Extraídos: renderStudents, enableStudentDrag, getDragAfterElement,
  openPkgModal, bindPkgModal, hasActivePackage, parsePkgDate, inPkgRange
- Padrão _ctx com getters para acesso reativo
- app.js reduzido sem perda de funcionalidade

## v2.12.0 — Extração do módulo de caixa

- Criado public/js/ui/cashUI.js
- Extraídos: bindCashButton, renderCashEntries, initCash
- renderCashEntries agora recebe cashEntries como parâmetro
- Padrão _ctx com getters para db, user e colCash
- app.js reduzido sem perda de funcionalidade

## v2.13.0 — Extração do módulo de aulas

- Criado public/js/ui/lessonsUI.js
- Extraídos: openLessonModal, editLesson, requestDeleteLesson,
  saveLesson, deleteLessonConfirmed, bindLessonButtons
- Padrão _ctx com getters para acesso reativo
- app.js reduzido sem perda de funcionalidade

## v2.14.0 — Extração do módulo de recibo

- Criado public/js/ui/receiptUI.js
- Extraídos: openReceiptFromLesson, openReceiptFromStudent,
  generateReceiptPDF, fillPackageAuto, toggleReceiptBoxes,
  bindReceiptButtons, fillReceiptStudents, getLessonsInRange
- Padrão _ctx com getters para lessons e students
- app.js reduzido sem perda de funcionalidade
