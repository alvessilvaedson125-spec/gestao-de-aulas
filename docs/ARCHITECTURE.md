
📘 DOCUMENTO 1
ARQUITETURA OFICIAL CONSOLIDADA
Atualizado para refletir:
•	Deploy do novo ícone em production
•	Manifest com maskable ativo
•	Identidade PWA consolidada
•	Processo formal de promoção staging → production
•	Hardening já aplicado
•	Estado atual pós promoção
________________________________________
📘 Bailado Carioca – Gestão de Aulas
Arquitetura Oficial Consolidada
Versão: v2.7.0 – Consolidação PWA e Promoção Controlada para Produção
Status: Produção Validada
Ano: 2026
________________________________________
1. Visão Geral
A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento rigoroso entre:
• Core (Infraestrutura)
• Services (Domínio)
• Utils (Utilitários)
• Orquestração e Interface (app.js)
A arquitetura atual está consolidada com:
✔ Multi-ambiente funcional
✔ Arquitetura reativa via Firestore
✔ CRUD completo validado (Alunos, Agenda, Evolução, Caixa)
✔ Deploy controlado por alias
✔ Hardening matemático aplicado
✔ Estrutura de recorrência implementada
✔ Formulários estabilizados
✔ Função attach() blindada
✔ PWA com identidade explícita e ícone oficial aplicado em produção
________________________________________
2. Estrutura de Pastas
public/js
core/
├── firebase.js
├── firebase.production.js
└── firebase.staging.js
services/
├── authService.js
├── lessonService.js
├── studentService.js
├── reportService.js
└── (cashService.js – previsto)
utils/
├── formatService.js
├── dateService.js
└── uiHelpers.js
app.js
Estrutura validada e estabilizada.
________________________________________
3. Camadas e Responsabilidades
3.1 Core (Infraestrutura)
Responsável por:
• Inicialização do Firebase
• Seleção dinâmica de ambiente
• Exportação de app, auth, db
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
• CRUD de alunos
• CRUD de aulas
• Consolidação financeira
• KPIs
• Comparativos anuais
• Ranking
• Crescimento percentual
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
• formatBRL
• parseBRLToNumber
• parseISODateLocal
• Guardas defensivos
• Helpers de UI
Regras:
❌ Não contém regra financeira complexa
❌ Não acessa Firebase
❌ Não contém lógica de domínio
________________________________________
3.4 app.js (Orquestração)
Responsável por:
• Eventos
• Listeners
• Renderização
• Integração com Chart.js
• Integração com Firestore
• Controle de filtros
• Sincronização reativa
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
• Alunos
• Aulas
• Evoluções
• Caixa
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
6. Consolidação PWA (v2.7.0)
Implementado:
✔ Manifest estruturado corretamente
✔ Campo id explícito
✔ Ícone 192x192 oficial
✔ Ícone 512x512 oficial
✔ Ícone 512x512 maskable
✔ Background padronizado
✔ Identidade nova forçada após troca de ícone
✔ Deploy staging validado antes de produção
Fluxo de promoção aplicado:
staging → merge → production → deploy controlado
Regra estabelecida:
Qualquer alteração de identidade PWA deve:
1.	Validar em staging
2.	Confirmar troca de alias Firebase
3.	Deploy controlado
4.	Hard reload
5.	Reinstalação manual do app
________________________________________
7. Política Oficial de Deploy Seguro
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
8. Hardening Aplicado
Implementado em reportService:
• safeArray
• safeNumber
• Guards contra NaN
• Fallback seguro
Sem alterar comportamento funcional.
Apenas robustez matemática.
________________________________________
9. Modelo de Dados – Aulas (Recorrência)
Campo:
recurrenceGroupId (string | opcional)
Regras:
✔ Aulas avulsas NÃO possuem recurrenceGroupId
✔ Aulas recorrentes compartilham o mesmo ID
✔ Gerado via crypto.randomUUID()
✔ Sem impacto na renderização atual
________________________________________
10. Módulo Caixa
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
________________________________________
11. Correções Estruturais Consolidadas
attach() estabilizado
Evolução estruturada corretamente
Formulários íntegros
Listeners isolados
Sem erros críticos de console
________________________________________
12. Estado Atual do Sistema
✔ Produção atualizada com novo ícone
✔ Identidade PWA consolidada
✔ Multi-ambiente funcional
✔ Snapshot sincronizado
✔ Receita anual validada
✔ Ranking anual consistente
✔ Caixa operacional
✔ Evolução estabilizada
✔ Arquitetura modular consolidada
Sistema pronto para evolução controlada.
________________________________________
13. Diretrizes Futuras
• Extração formal de cashService.js
• Backup automatizado (quando viável)
• Versionamento por tag formal
• CI/CD opcional
• Consolidação final de KPIs híbridos
________________________________________
14. Change Log
v2.6.2 – Consolidação Estrutural e Estabilidade Reativa
v2.7.0 – Consolidação PWA e Promoção Controlada para Produção
________________________________________
🔷 Versão Oficial Atual
v2.7.0 – Produção com identidade PWA oficial aplicada
________________________________________

