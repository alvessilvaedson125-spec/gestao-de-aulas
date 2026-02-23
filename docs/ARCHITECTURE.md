
📘 Bailado Carioca – Gestão de Aulas
Arquitetura Oficial Consolidada
Versão: v2.6.2 – Consolidação Estrutural e Estabilidade Reativa
Status: Estável, Validado e Blindado
Ano: 2026
________________________________________
1. Visão Geral
A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento rigoroso entre:
•	Core (Infraestrutura)
•	Services (Domínio)
•	Utils (Utilitários)
•	Orquestração e Interface (app.js)
A arquitetura atual está consolidada com:
✔ Multi-ambiente funcional
✔ Arquitetura reativa via Firestore
✔ CRUD completo validado (Alunos, Agenda, Evolução, Caixa)
✔ Deploy controlado por alias
✔ Hardening matemático aplicado
✔ Estrutura de recorrência implementada
✔ Formulários estruturados corretamente
✔ Função attach() estabilizada
________________________________________
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
│   ├── reportService.js
│   └── (cashService.js – recomendado futuro)
│
├── utils/
│   ├── formatService.js
│   ├── dateService.js
│   └── uiHelpers.js
│
└── app.js
Estrutura validada e estabilizada.
________________________________________
3. Camadas e Responsabilidades
________________________________________
3.1 Core (Infraestrutura)
Responsável por:
•	Inicialização do Firebase
•	Seleção dinâmica de ambiente
•	Exportação de app, auth, db
Regras absolutas:
❌ Não contém regra de negócio
❌ Não manipula DOM
❌ Não contém cálculos
✔ Apenas configuração e bootstrap
Seleção de ambiente via:
window.location.hostname
Ambientes isolados e blindados.
________________________________________
3.2 Services (Domínio)
Contém lógica de negócio pura:
•	CRUD de alunos
•	CRUD de aulas
•	Consolidação financeira
•	KPIs
•	Comparativos anuais
•	Ranking
•	Crescimento percentual
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
________________________________________
3.3 Utils
Responsável por:
•	formatBRL
•	parseBRLToNumber
•	parseISODateLocal
•	Guardas defensivos
•	Helpers de UI
Regras:
❌ Não contém regra financeira complexa
❌ Não acessa Firebase
❌ Não contém lógica de domínio
________________________________________
3.4 app.js (Orquestração)
Responsável por:
•	Eventos
•	Listeners
•	Renderização
•	Integração com Chart.js
•	Integração com Firestore
•	Controle de filtros
•	Sincronização reativa
Regra absoluta:
Nenhum cálculo financeiro estrutural permanece aqui.
app.js apenas orquestra.
________________________________________
4. Arquitetura Reativa
Implementada via:
onSnapshot()
Fluxo oficial:
1.	Firestore sofre alteração
2.	onSnapshot é disparado
3.	Estado local é atualizado
4.	Funções de render executam
5.	UI sincronizada automaticamente
Regra crítica:
❌ Nunca chamar render manualmente após delete
❌ Nunca forçar re-render pós snapshot
✔ Firestore controla a atualização da UI
Aplicado em:
•	Alunos
•	Aulas
•	Evoluções
•	Caixa
________________________________________
5. Multi-Ambiente
Ambientes:
🔵 Production → meu-app-edson
🟣 Staging → meu-app-edson-staging
Seleção automática por hostname.
Regras:
✔ Bancos nunca são compartilhados
✔ API keys isoladas
✔ Deploy controlado por alias
✔ Nunca misturar configs
________________________________________
6. Política Oficial de Deploy Seguro
Antes de qualquer deploy:
firebase use
Deploy Production:
firebase use production
firebase deploy --only hosting
Deploy Staging:
firebase use staging
firebase deploy --only hosting
Regra de Ouro:
Nunca deployar sem confirmar ambiente ativo.
________________________________________
7. Hardening Aplicado
Implementado em reportService:
•	safeArray
•	safeNumber
•	Guards contra NaN
•	Fallback seguro
Sem alterar comportamento funcional.
Apenas robustez matemática.
________________________________________
8. Modelo de Dados – Aulas (Recorrência)
Campo:
recurrenceGroupId (string | opcional)
Regras:
✔ Aulas avulsas NÃO possuem recurrenceGroupId
✔ Aulas recorrentes compartilham o mesmo ID
✔ Gerado via crypto.randomUUID()
✔ Sem impacto na renderização atual
Objetivo:
Preparar base para:
•	Edição por grupo
•	Exclusão por grupo
•	Auditoria futura
________________________________________
9. Módulo Caixa (Entradas Externas)
Implementado na v2.6.0.
Coleção:
caixa
Documento padrão:
{
  date: "2026-02-22",
  amount: 1200.00,
  category: "grupo",
  description: "Grupo Fevereiro",
  createdAt: serverTimestamp()
}
Regras:
✔ amount sempre Number
✔ date sempre ISO
✔ Nunca armazenar valor formatado
✔ Sem regra de cálculo no documento
Integração:
Receita Total =
Receita Aulas + Receita Caixa
KPIs híbridos preparados.
________________________________________
10. Correção Estrutural – attach() (v2.6.1)
Erro corrigido:
Uncaught ReferenceError: qE is not defined
Causa:
Declaração fora do escopo correto.
Solução:
Reestruturação completa da função attach() com:
•	Declaração interna de qS
•	Declaração interna de qL
•	Declaração interna de qE
•	3 onSnapshot independentes
Resultado:
✔ Login restaurado
✔ Fluxo reativo preservado
✔ Nenhum erro de console
________________________________________
11. Correção Estrutural – Módulo Evolução (v2.6.2)
Problema:
•	Formulário estruturado incorretamente
•	Botão Limpar inoperante
•	elements.length retornando 0
Causa:
<form> fechado prematuramente.
Correção:
✔ Estrutura HTML corrigida
✔ Form envolvendo todos os campos
✔ Implementação formal de clearEvol()
✔ Binding correto via addEventListener
✔ Reset funcionando
✔ Salvamento continua íntegro
Nenhuma regra de negócio alterada.
________________________________________
12. Estado Atual do Sistema
✔ Receita anual validada
✔ Comparação anual estável
✔ Ranking anual consistente
✔ Snapshot sincronizado
✔ Multi-ambiente funcional
✔ Login restaurado
✔ Recorrência estruturada
✔ Caixa operacional
✔ Evolução estabilizada
✔ Arquitetura modular consolidada
✔ Nenhum erro crítico de console
Sistema pronto para evolução controlada.
________________________________________
13. Diretrizes Futuras
Recomendado:
•	Backup automático pré-deploy
•	Script seed para staging
•	Versionamento por tag
•	CI/CD via GitHub Actions
•	cashService.js dedicado
•	Migração futura para Vite (opcional)
•	Métrica de ciclos recorrentes
•	Consolidação completa dos KPIs híbridos
________________________________________
14. Change Log
v2.5.0 – Consolidação de Recorrência
v2.6.0 – Introdução do Módulo Caixa
v2.6.1 – Correção Estrutural Attach() e Login
v2.6.2 – Correção Estrutural do Módulo Evolução
________________________________________
🔷 Versão Oficial Atual
v2.6.2 – Consolidação Estrutural e Estabilidade Reativa
Sistema arquiteturalmente estável, modular e preparado para escalabilidade controlada.

