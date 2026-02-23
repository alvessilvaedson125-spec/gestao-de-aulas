
📘 POLÍTICA DE ROLLBACK OFICIAL
Bailado Carioca – Gestão de Aulas
Versão: v2.0
Status: Ativa e Formalizada
Princípio: Restaurar rápido, restaurar limpo, restaurar documentado.
________________________________________
1️⃣ Quando aplicar rollback?
Aplicar rollback imediatamente em caso de:
•	❌ Erro crítico após deploy em produção
•	❌ Falha total de renderização
•	❌ Quebra de autenticação
•	❌ Snapshot não sincronizando
•	❌ Receita anual inconsistente
•	❌ KPIs divergentes
•	❌ Console com erro estrutural
•	❌ Cache incorreto do Service Worker
Regra: Se há dúvida sobre integridade → rollback.
________________________________________
2️⃣ Identificação da Versão Estável
Verificar tags disponíveis:
git tag
Selecionar a última versão validada (ex: v2.6.2).
Regra:
Nunca usar commit hash aleatório.
Sempre usar tag oficial.
________________________________________
3️⃣ Procedimento Oficial de Rollback
Etapa 1 — Restaurar código
git checkout NOME_DA_TAG
firebase use production
firebase deploy --only hosting
Exemplo:
git checkout v2.6.2
firebase use production
firebase deploy --only hosting
________________________________________
Etapa 2 — Limpeza de Cache (Obrigatória)
Após deploy:
•	Hard reload (Ctrl + Shift + R)
•	Verificar Service Worker
•	Se necessário: Unregister SW
•	Testar reabertura completa do app
________________________________________
Etapa 3 — Validação Pós-Rollback
Confirmar:
•	Login funcionando
•	attach() inicializando
•	Firestore sincronizando
•	Caixa renderizando
•	Evolução abrindo árvore
•	Relatórios corretos
•	Console sem erros
•	Receita anual consistente
Sistema só é considerado restaurado se:
✔ UI estável
✔ Snapshot ativo
✔ Console limpo
________________________________________
4️⃣ Registro Formal da Ocorrência
Adicionar no VERSION_LOG.md:
•	Data
•	Versão revertida
•	Versão problemática
•	Motivo técnico
•	Impacto
•	Correção planejada
•	Tempo de indisponibilidade (se houver)
Exemplo:
Rollback – 2026-02-23
Versão revertida: v2.6.2
Motivo: Inconsistência em módulo Evolução
Impacto: Parcial
Ação corretiva: Correção aplicada em staging
________________________________________
5️⃣ Regra de Ouro Pós-Rollback
Nunca corrigir diretamente em produção.
Fluxo obrigatório:
1.	Corrigir em staging
2.	Testar completamente
3.	Validar checklist
4.	Novo commit
5.	Nova tag
6.	Deploy controlado
________________________________________
6️⃣ Rollback de Dados (Se Necessário)
Caso erro envolva dados:
•	Restaurar backup Firestore
•	Confirmar integridade de:
o	alunos
o	aulas
o	evolucoes
o	caixa
•	Validar KPIs após restauração
Nunca restaurar dados parcialmente sem registro formal.
________________________________________
7️⃣ Princípios Arquiteturais
Rollback é procedimento técnico, não emocional.
•	Sem improviso
•	Sem edição manual em produção
•	Sem hotfix direto no servidor
•	Sem alteração de banco sem versionamento
Produção é ambiente protegido.
________________________________________
🔐 Versão Atual de Referência Segura
Sistema estável: v2.6.2
Arquitetura consolidada
Módulo Caixa integrado
Evolução estabilizada
attach() blindado
________________________________________

