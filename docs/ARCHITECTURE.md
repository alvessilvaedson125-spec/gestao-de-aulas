📘 Bailado Carioca – Gestão de Aulas
Arquitetura Oficial Consolidada

Versão: v2.4.1 – Estabilização Reativa
Status: Estável, Validado e Blindado
Data: 2026

1. Visão Geral

A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento rigoroso entre:

Core (Infraestrutura)

Services (Domínio)

Utils (Utilitários)

Orquestração e Interface (app.js)

A arquitetura atual está consolidada com:

✔ Multi-ambiente funcional

✔ Arquitetura reativa via Firestore

✔ CRUD completo validado

✔ Deploy controlado por alias

✔ Blindagem contra sobrescritas indevidas

✔ Hardening matemático aplicado

2. Estrutura de Pastas
public/js
├── core/
│   ├── firebase.js
│   ├── firebase.production.js
│   └── firebase.staging.js
│
├── services/
│   ├── authService.js
│   ├── lessonService.js
│   ├── studentService.js
│   └── reportService.js
│
├── utils/
│   ├── formatService.js
│   ├── dateService.js
│   └── uiHelpers.js
│
└── app.js

Estrutura validada e estabilizada.

3. Camadas e Responsabilidades
3.1 Core (Infraestrutura)

Responsável por:

Inicialização do Firebase

Seleção dinâmica de ambiente

Exportação de app, auth, db

Regras absolutas:

❌ Não contém regra de negócio

❌ Não manipula DOM

❌ Não contém cálculos

✔ Apenas configuração e bootstrap

Ambiente selecionado exclusivamente via:

window.location.hostname
3.2 Services (Domínio)

Contém toda lógica de negócio:

CRUD de alunos

CRUD de aulas

Relatórios

Cálculos anuais

Consolidação financeira

KPIs

Comparativos

Ranking

Crescimento percentual

Regras rígidas:

❌ Não acessa DOM

❌ Não conhece HTML

❌ Não depende de variáveis globais

✔ Recebe dependências por parâmetro

✔ Funções puras sempre que possível

Exemplo padronizado:

export function calculateYearComparison(yearMonthly = [], compareMonthly = [])

Retorno padrão:

{
  yearTotal,
  compareTotal,
  delta
}
3.3 Utils

Responsável por:

formatBRL

parseBRLToNumber

parseISODateLocal

Helpers de UI

Guardas defensivos

Regras:

❌ Não contém regra financeira complexa

❌ Não acessa Firebase

❌ Não contém lógica de domínio

3.4 app.js (Orquestração)

Responsável por:

Eventos

Listeners

Renderização

Integração com Chart.js

Sincronização com Firestore

Controle de estados de filtros

Regra absoluta:

Nenhum cálculo financeiro permanece aqui.

4. Arquitetura Reativa (Agenda & Alunos)

Implementação consolidada na v2.4.1.

Os módulos de Agenda e Alunos utilizam:

onSnapshot()

Para atualização automática da interface.

Fluxo oficial:

Firestore sofre alteração (add / update / delete)

onSnapshot é disparado

Estado local é atualizado

Funções de render são chamadas automaticamente

Regra crítica:

❌ Nunca chamar renderLessons() manualmente

❌ Nunca forçar re-render após delete

✔ Firestore controla a atualização da UI

Essa mudança eliminou:

Erros de estado

Inconsistências visuais

Duplicações de render

Conflitos pós-delete

5. Multi-Ambiente Implementado

Ambientes isolados:

🔵 Production → meu-app-edson
🟣 Staging → meu-app-edson-staging

Seleção automática via hostname:

if (hostname === "meu-app-edson.web.app") {
  import firebase.production.js
}

Regras oficiais:

Bancos nunca são compartilhados

Cada ambiente possui API key própria

Sempre usar CDN oficial do Firebase

Nunca usar modelo NPM (firebase/app)

Nunca misturar config de ambiente

6. Correções Críticas v2.4.1
Corrigido

Binding do botão "Novo Aluno"

Import ausente de deleteDoc

Chamada indevida de renderLessons()

Conflito pós-exclusão

Erros de escopo em DOMContentLoaded

Resultado

✔ CRUD de Agenda 100% funcional
✔ CRUD de Alunos funcional
✔ Exclusão limpa
✔ Snapshot sincronizado
✔ Nenhum erro de console

Sistema validado em produção.

7. Política Oficial de Deploy Seguro

Antes de qualquer deploy:

firebase use

Confirmar alias ativo.

Deploy Production:

firebase use production
firebase deploy --only hosting

Deploy Staging:

firebase use staging
firebase deploy --only hosting

Regra de Ouro:

Nunca deployar sem confirmar ambiente ativo.

8. Fluxo Oficial de Renderização

Sequência validada:

onSnapshot carrega dados

Estado local é atualizado

Funções de render executam

UI atualizada

Filtros preservados

Nenhum reset automático de select.

9. Hardening Aplicado

Implementado em reportService:

safeArray

safeNumber

Guards defensivos

Prevenção de NaN

Fallback seguro

Sem alteração funcional.
Apenas robustez matemática.

10. Estado Atual do Sistema

✔ Receita anual validada
✔ Comparação anual estável
✔ Ranking anual consistente
✔ Snapshot sincronizado
✔ Multi-ambiente funcional
✔ Login restaurado
✔ Deploy controlado por alias
✔ Imports padronizados
✔ Arquitetura reativa consolidada

11. Diretrizes Futuras

Recomendado:

Backup automático pré-deploy

Script de seed para staging

Versionamento formal por tag

CI/CD via GitHub Actions

Log estruturado por ambiente

Migração futura para Vite (opcional)

12. Versão Oficial Atual

v2.4.1 – Estabilização Reativa

Sistema pronto para:

Evolução controlada

Deploy seguro

Escalabilidade futura

Hardening contínuo