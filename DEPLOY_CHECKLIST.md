
📘 DEPLOY CHECKLIST OFICIAL
Bailado Carioca – Gestão de Aulas
Versão: v2.0
Status: Ativo
Regra de Ouro: Nada pode quebrar produção. Nunca.
________________________________________
1️⃣ Pré-Deploy Técnico (Obrigatório)
Git
•	git branch confirma branch correta (production ou staging)
•	git status está limpo
•	Arquivos corretos foram adicionados
•	Mensagem de commit clara e semântica
•	Push realizado
________________________________________
Firebase
•	firebase use confirma ambiente correto
•	Nunca deployar sem confirmar alias
•	Staging validado antes de produção
________________________________________
2️⃣ Validação em Staging (Obrigatória)
Antes de qualquer produção:
•	Login funcionando
•	attach() inicializa corretamente
•	Nenhum erro no console
•	Firestore sincronizando
•	Caixa renderiza imediatamente
•	Evolução abre árvore corretamente
•	Histórico filtra por mês/ano
•	Botão limpar funcional
•	KPIs corretos
•	Gráficos carregando
•	Receita anual consistente
•	Ranking anual consistente
•	Multi-ambiente isolado
•	Hard reload testado (Ctrl+Shift+R)
________________________________________
3️⃣ Backup Pré-Deploy (Obrigatório)
•	Backup Firestore manual exportado
•	Nomeado: backup-YYYY-MM-DD-HHMM
•	Arquivo salvo localmente
•	Registro feito no commit
•	Tag criada antes do deploy crítico
________________________________________
4️⃣ Deploy Produção
•	firebase use production confirmado
•	Deploy executado
•	Hard reload manual realizado
•	Service Worker validado
•	Login testado
•	Caixa testado
•	Evolução testada
•	Relatórios validados
•	Console sem erros
•	Snapshot sincronizado
________________________________________
5️⃣ Pós-Deploy
•	Tag criada (ex: v2.6.2)
•	Registro no CHANGELOG
•	ARCHITECTURE.md atualizado
•	Commit fechado e sincronizado
•	Rollback point confirmado
________________________________________
6️⃣ Regras Arquiteturais de Segurança
Nunca:
❌ Deployar sem staging
❌ Deployar com erro de console
❌ Deployar sem confirmar firebase use
❌ Alterar attach() sem validação completa
❌ Alterar listeners sem testar reatividade
Sempre:
✔ Confirmar render via snapshot
✔ Testar fechar/abrir app
✔ Testar cache do Service Worker
✔ Testar filtro de mês/ano
✔ Testar CRUD completo
________________________________________
🔐 Política de Rollback
Caso erro em produção:
1.	Identificar última tag estável
2.	Checkout da versão
3.	Deploy imediato
4.	Análise posterior em staging
________________________________________
🎯 Versão Atual de Referência
Sistema Estável: v2.6.2
Arquitetura Consolidada
Módulo Caixa integrado
Evolução estabilizada
Attach() blindado

