📘 Bailado Carioca – Gestão de Aulas
Arquitetura Oficial Atualizada

Versão: v2.3-multi-environment-stable
Status: Estável, Validado e Blindado
Data: 2026

1. Visão Geral

A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento rigoroso entre:

Infraestrutura (Core)

Domínio (Services)

Utilitários (Utils)

Interface / Orquestração (app.js)

A evolução recente consolidou:

Estabilização do módulo de Relatórios

Correção de renderizações inconsistentes

Blindagem de filtros

Implementação de arquitetura multi-ambiente

Padronização de deploy seguro

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

Estrutura consolidada e validada.

3. Camadas e Responsabilidades
3.1 Core (Infraestrutura)

Responsável por:

Inicialização do Firebase

Seleção dinâmica de ambiente

Exportação de app, auth, db

Regras:

Nenhuma lógica de negócio

Nenhuma manipulação de DOM

Apenas configuração

Ambiente selecionado exclusivamente via hostname

3.2 Services (Domínio)

Contém toda lógica de negócio:

Comparativo anual

Concentração de receita

Ranking anual

Cálculos mensais

Crescimento percentual

KPIs

Consolidação financeira

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

Não contém regra de negócio

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
4.1 Correção – Sobrescrita do Filtro “Comparar com”

Correção aplicada:

if (!$("repCompare").value) {
  $("repCompare").value = String($("repYear").value - 1);
}

Resultado:

Sistema inicializa corretamente

Filtro permanece sob controle do usuário

Nenhuma sobrescrita silenciosa

4.2 Correção – Ordem Decrescente de Anos
const arr = [...years].sort((a,b)=>b-a);

Ano mais recente aparece primeiro.

4.3 Sincronização Firestore

Ciclo natural validado:

1ª execução → lessons = []
2ª execução → lessons carregadas

Sistema considerado estável.

4.4 Blindagem do Filtro Anual

Padronização:

String(l.status) !== "2"

Consistência com padrão global.

5. Arquitetura Multi-Ambiente (Implementada)
5.1 Estratégia

Ambientes isolados:

🔵 Production → meu-app-edson

🟣 Staging → meu-app-edson-staging

Seleção automática via:

window.location.hostname

Fluxo:

Hostname detectado
→ Import dinâmico
→ firebase.production.js OU firebase.staging.js
→ Export consistente de app, auth, db
5.2 Regras Arquiteturais Multi-Ambiente

Bancos nunca são compartilhados

Cada ambiente possui API key própria

Nunca usar modelo NPM (firebase/app)

Sempre usar CDN oficial

Padrão obrigatório:

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
6. Correções Críticas Registradas

Erros resolvidos:

auth/api-key-not-valid

Failed to resolve module specifier "firebase/app"

Production sem export de auth/db

Deploy no alias incorreto

Correção aplicada:

Padronização CDN

Export consistente

Controle rigoroso de alias Firebase CLI

Sistema estabilizado.

7. Política Oficial de Deploy Seguro

Antes de qualquer deploy:

firebase use

Confirmar asterisco ativo.

Deploy Production:

firebase use production
firebase deploy --only hosting

Deploy Staging:

firebase use staging
firebase deploy --only hosting

Regra de Ouro:

Nunca deployar sem confirmar ambiente.

8. Fluxo Oficial de Renderização

Sequência:

onSnapshot carrega dados

renderDashboard()

renderReportMonthKPIs()

UI atualizada

Filtros preservados

Nenhum reset automático de select.

9. Hardening Consolidado

Aplicado em reportService:

safeArray

safeNumber

Guards defensivos

Prevenção de NaN

Fallback seguro

Sem alteração funcional.
Apenas robustez matemática.

10. Estado Atual da Arquitetura

✔ Receita anual validada
✔ Comparação anual estável
✔ Ranking anual consistente
✔ Snapshot sincronizado
✔ Multi-ambiente funcional
✔ Login restaurado
✔ Deploy controlado por alias
✔ Imports padronizados

11. Diretrizes Futuras

Recomendado:

Backup automático pré-deploy

Script de seed para staging

Versionamento formal por tag

CI/CD via GitHub Actions

Log estruturado por ambiente

Migração futura para Vite (opcional)

12. Versão Oficial

Versão atual consolidada:

v2.3-multi-environment-stable

Sistema pronto para:

Evolução controlada

Deploy seguro

Escalabilidade futura

Hardening contínuo