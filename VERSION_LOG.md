# 📘 VERSION LOG
## Bailado Carioca – Gestão de Aulas
**Versão atual:** v2.33.0 | **Status:** Produção

---

## 🔒 Política de Versionamento

- **Major**: mudanças estruturais profundas
- **Minor**: novas funcionalidades e melhorias arquiteturais
- **Patch**: correções e estabilizações

Sequência obrigatória: `staging → validar → commit → production → tag → VERSION_LOG`

---

## 📦 Histórico de Versões

---

## v2.33.0 — Responsividade Mobile
- Header: subtítulo oculto em mobile, email truncado
- Abas: scroll horizontal numa linha, sem quebra
- Filtros da Agenda: grid 2 colunas em mobile
- Calendário: células menores, chips compactos, padding reduzido
- Evolução e Relatórios: KPIs em 2 colunas
- Modais: largura 98vw, padding reduzido
- Caixa: resumo em 2 colunas, card empilhado
- Grupo: KPIs em 2 colunas, header em coluna
- Breakpoint dedicado: max-width 480px

## v2.32.0 — Banner de Edição nos Alunos
- Banner visual "✏️ Editando: Nome do Aluno" ao editar aluno
- Formulário abre automaticamente ao clicar Editar
- Banner escondido ao salvar ou limpar
- CSS: student-edit-banner com destaque roxo

## v2.31.0 — Redesign Relatórios + Gráfico com Escala + Lançar Grupo no Caixa
- Relatórios reorganizados em 4 blocos: Visão Geral, Particulares, Anual, Grupo
- Gráfico com escala Y, 4 barras por mês, legenda de cores
- Saídas do Caixa integradas nos cálculos de receita líquida
- Botão "💰 Lançar no Caixa": cria entrada automática das mensalidades do grupo

## v2.30.0 — Histórico de Chamadas
- Botão "📅 Histórico" em cada card de turma
- Modal com chamadas ordenadas por data, resumo e detalhe expansível por aluno

## v2.29.0 — Caixa com Entradas, Saídas e Navegação por Mês
- Entradas e Saídas com categorias separadas
- Resumo do mês: entradas, saídas e saldo
- Navegação por mês (◀ ▶)
- Fix: import duplicado do cashUI.js removido

## v2.28.0 — Refatoração CSS do Módulo de Grupo
- Inline styles removidos do grupoUI.js
- 14 novas classes CSS adicionadas ao app.css
- Código mais limpo e manutenível

## v2.27.0 — Skeleton Loader
- Criado skeletonUI.js
- Skeleton animado em todas as abas durante carregamento
- Removido automaticamente quando dados chegam do Firestore

## v2.26.0 — Integração do Grupo nos Relatórios
- Bloco Grupo adicionado nos Relatórios com KPIs de mensalidades
- Por turma: barra de progresso de adimplência
- Fix: gráfico não renderizava ao abrir aba Relatórios

## v2.25.0 — Presença, Navegação de Meses e Trancar Matrícula
- Chamada por aula: Presente / Ausente / Justificado
- Navegação de meses nas mensalidades
- Trancar e reativar matrícula com badge visual
- Fix: contador de vagas exclui matrículas trancadas

## v2.24.0 — Módulo Aulas em Grupo
- Nova aba Grupo: turmas, matrículas, mensalidades individuais
- Papéis: Condutor / Condutora / Conduzido / Conduzida
- Tipos: Pagante / Bolsista
- Base de alunos separada dos particulares
- firestore.rules atualizado com 4 novas coleções

## v2.23.0 — Expansão da Cobertura de Testes
- 21 suites, 66 testes passando
- Cobertura: reportService, formatService, dateService

## v2.22.0 — Refatoração Completa do CSS
- app.css reorganizado sem duplicatas
- 3 breakpoints: 900px, 768px, 600px

## v2.21.0 — Limpeza do index.html
- Inline styles removidos, bug de div corrigido
- Ordem das seções corrigida

## v2.20.0 — Modo Offline Robusto
- enableIndexedDbPersistence ativado
- App funciona offline após primeiro carregamento

## v2.19.0 — Validação Visual de Formulários
- Criado formValidation.js
- Validação com borda vermelha e mensagem por campo
- 5 formulários validados

## v2.18.0 — Histórico de Pacotes por Aluno
- Criado packageHistoryUI.js
- Pacotes salvos em subcoleção /alunos/{id}/pacotes
- Modal com histórico completo e barra de progresso

## v2.17.0 — Relatório Mensal em PDF
- Criado reportPDF.js
- Exporta KPIs, aulas realizadas e entradas do caixa em PDF via jsPDF

## v2.16.0 — Extração do Módulo de Relatórios
- Criado reportsUI.js
- Refatoração completa — todos os módulos extraídos do app.js

## v2.15.0 — Extração do Módulo de Evolução
- Criado evolutionUI.js

## v2.14.0 — Extração do Módulo de Recibo
- Criado receiptUI.js

## v2.13.0 — Extração do Módulo de Aulas
- Criado lessonsUI.js

## v2.12.0 — Extração do Módulo de Caixa
- Criado cashUI.js

## v2.11.0 — Extração do Módulo de Alunos
- Criado studentsUI.js

## v2.10.0 — Extração do Módulo de Calendário
- Criado calendarUI.js

## v2.9.0 — Extração do Módulo de Helpers
- Criada pasta public/js/ui/
- Criado helpers.js

## v2.8.0 — Limpeza e Organização do Projeto
- 10 arquivos removidos, app.js reduzido de 3000 para 1641 linhas

## v2.7.0 — Consolidação PWA
- Manifest, ícones, Service Worker e identidade PWA estabilizados

## v2.6.2 — Estabilização Estrutural Reativa
- Correção do attach(), reatividade restaurada, Caixa funcional

## v2.5.x — Consolidação Financeira
- Cálculo híbrido Aulas + Caixa, KPIs consolidados

## v2.4.x — Recorrência de Aulas
- Campo recurrenceGroupId, exclusão segura

## v2.3.x — Multi-Ambiente
- Separação production / staging, isolamento completo de banco

## v2.2.x — Modularização Inicial
- Separação core / services / utils

## v2.1.x — Estrutura Base
- CRUD Alunos e Aulas, Módulo Evolução, Caixa inicial

---

## 🗂 Estrutura atual do projeto

```
public/js/
├── app.js
├── core/
│   ├── firebase.js
│   ├── firebase.production.js
│   └── firebase.staging.js
├── services/
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
    ├── reportsUI.js
    ├── reportPDF.js
    ├── packageHistoryUI.js
    ├── formValidation.js
    ├── grupoUI.js
    ├── skeletonUI.js
    └── cashUI.js
```