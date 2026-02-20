📘 Bailado Carioca – Gestão de Aulas
Arquitetura Oficial Atualizada

Versão: v2.2-report-stable-controlled-render
Status: Estável e Validado
Data: 2026

1. Visão Geral

A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento rigoroso entre:

Infraestrutura

Domínio (Services)

Utilitários

Interface (Orquestração)

A evolução recente focou principalmente na estabilização do módulo de Relatórios, eliminando:

Renderizações inconsistentes

Sobrescrita automática de filtros

Dependência implícita da ordem de execução do Firestore

Inconsistências entre filtro anual e mensal

2. Estrutura de Pastas
public/js
├── core/
│   └── firebase.js
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


Estrutura consolidada e estável.

3. Camadas e Responsabilidades
3.1 Core (Infraestrutura)

Responsável por:

Inicialização do Firebase

Exportação de app, auth, db

Regras:

Nenhuma lógica de negócio

Nenhuma manipulação de DOM

Apenas configuração

3.2 Services (Domínio)

Contém toda lógica de negócio:

Comparativo anual

Concentração de receita

Ranking anual

Cálculos mensais

Crescimento percentual

KPIs

Regras rígidas:

Não acessa DOM

Não conhece HTML

Não depende de variáveis globais

Recebe dependências por parâmetro

Funções puras sempre que possível

Exemplo consolidado:

export function calculateYearComparison(yearMonthly = [], compareMonthly = [])


Retorno padrão:

{
  yearTotal,
  compareTotal,
  delta
}

3.3 Utils

Responsável por:

parseBRLToNumber

formatBRL

parseISODateLocal

Helpers de interface

Regras:

Não contém regra financeira complexa

Não contém acesso ao Firebase

3.4 app.js (Orquestração)

Responsável por:

Eventos

Listeners

Renderização

Integração com Chart.js

Controle de estados de filtros

Sincronização com onSnapshot

Regra absoluta:

Nenhum cálculo financeiro permanece aqui.

4. Estabilização do Módulo de Relatórios
4.1 Correção Crítica – Sobrescrita do Filtro “Comparar com”

Problema anterior:

ensureYearSelects() redefinia automaticamente o valor de repCompare a cada render.

Sintoma:
O select sempre voltava para o ano anterior (ex: 2025).

Correção aplicada:

if (!$("repCompare").value) {
  $("repCompare").value = String($("repYear").value - 1);
}


Resultado:

O sistema inicializa corretamente

O usuário mantém controle manual do filtro

Nenhuma sobrescrita silenciosa ocorre

4.2 Correção – Ordem de Anos

Problema:

O select assumia o menor ano disponível.

Correção:

Ordenação alterada para decrescente:

const arr = [...years].sort((a,b)=>b-a);


Resultado:

Ano mais recente aparece primeiro

Comportamento consistente com UX moderna

4.3 Sincronização com Firestore

Identificado comportamento normal:

1ª execução do renderDashboard → lessons = []
2ª execução → lessons carregadas

Console confirmou:

Lessons carregadas: 0
Lessons carregadas: 335


Isso não era erro, apenas ciclo natural do onSnapshot.

Sistema considerado estável.

4.4 Blindagem do Filtro Anual

Padronização do filtro de aulas realizadas:

Substituído:

Number(l.status) !== 2


Por:

String(l.status) !== "2"


Motivo:

Consistência com padrão geral do sistema.

5. Princípios Arquiteturais Consolidados

Regra de Ouro: nada pode quebrar produção.

Filtros controlados pelo usuário nunca são sobrescritos.

Inicialização ocorre apenas quando necessário.

Render não altera estado.

Estado não altera cálculo.

Cálculo nunca depende de DOM.

6. Estado Atual da Arquitetura

✔ Receita anual validada
✔ Comparação anual estável
✔ Ranking anual consistente
✔ Concentração correta
✔ Snapshot sincronizado
✔ Filtros persistentes
✔ Hardening aplicado

7. Hardening Consolidado

Aplicado no reportService:

safeArray

safeNumber

Guards defensivos

Prevenção de NaN

Fallback seguro de parsing

Nenhuma alteração funcional foi introduzida.
Apenas robustez matemática.

8. Fluxo Atual de Renderização (Controlado)

Sequência oficial:

onSnapshot carrega dados

renderDashboard()

renderReportMonthKPIs()

UI atualizada

Filtros preservados

Nenhum reset automático de select.

9. Diretrizes para Próxima Evolução

Próxima camada recomendada:

Separar função de inicialização dos selects da função de atualização

Implementar staging environment

Implantar deploy automático via GitHub Actions

Implementar backup automático pré-deploy

Versionamento formal por tag

10. Versão Atual Oficial

Arquitetura validada após estabilização do módulo Relatórios.

Versão oficial:

v2.2-report-stable-controlled-render

Sistema pronto para:

Deploy automático

Ambiente staging

Controle de versões estruturado