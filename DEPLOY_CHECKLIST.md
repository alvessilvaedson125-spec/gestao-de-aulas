DEPLOY CHECKLIST OFICIAL
Atualizado para refletir:
•	Promoção staging → production formalizada
•	Consolidação PWA
•	Validação de Manifest
•	Validação de Service Worker
•	Fluxo de merge sem editor interativo
•	Controle de identidade PWA
________________________________________
📘 DEPLOY CHECKLIST OFICIAL
Bailado Carioca – Gestão de Aulas
Versão: v2.1
Status: Ativo e Atualizado
Regra de Ouro: Nada pode quebrar produção. Nunca.
________________________________________
1️⃣ Pré-Deploy Técnico (Obrigatório)
Git
✔ git branch confirma branch correta (production ou staging)
✔ git status está limpo
✔ Merge realizado corretamente (sem conflitos pendentes)
✔ Preferir:
git merge staging --no-edit
✔ Mensagem de commit semântica
✔ Push realizado para branch correta
✔ Nenhum arquivo fora do escopo foi alterado
________________________________________
Firebase
✔ firebase use confirma ambiente correto
✔ Nunca deployar sem confirmar alias ativo
✔ Staging validado antes de produção
✔ Confirmar projeto ativo antes de rodar deploy
________________________________________
2️⃣ Validação em Staging (Obrigatória)
Antes de qualquer deploy em produção:
✔ Login funcionando
✔ attach() inicializa corretamente
✔ Nenhum erro no console
✔ Firestore sincronizando
✔ Caixa renderiza imediatamente
✔ Evolução abre árvore corretamente
✔ Histórico filtra por mês/ano
✔ Botão limpar funcional
✔ KPIs corretos
✔ Gráficos carregando
✔ Receita anual consistente
✔ Ranking anual consistente
✔ Multi-ambiente isolado
✔ Hard reload testado (Ctrl + Shift + R)
________________________________________
Validação Específica de PWA
✔ Manifest carregando corretamente
✔ Ícones 192 e 512 acessíveis via URL direta
✔ Ícone maskable validado
✔ Campo id definido no manifest
✔ Popup de instalação com ícone correto
✔ Reinstalação testada após troca de identidade
✔ Service Worker ativo
✔ Cache não contém versão antiga
________________________________________
3️⃣ Backup Pré-Deploy (Obrigatório)
Antes de deploy crítico:
✔ Backup Firestore manual exportado
✔ Nomeado: backup-YYYY-MM-DD-HHMM
✔ Arquivo salvo localmente
✔ Registro feito no commit
✔ Tag criada antes de deploy estrutural
Regra:
Sem backup → sem deploy.
________________________________________
4️⃣ Promoção Staging → Production (Fluxo Oficial)
Passos obrigatórios:
1.	Validar staging completamente
2.	git checkout production
3.	git pull origin production
4.	git merge staging --no-edit
5.	git push origin production
6.	firebase use production
7.	firebase deploy --only hosting
Regra:
Nunca editar diretamente em production.
________________________________________
5️⃣ Deploy Produção
✔ firebase use production confirmado
✔ Deploy executado
✔ Hard reload manual realizado
✔ Service Worker validado
✔ Login testado
✔ Caixa testado
✔ Evolução testada
✔ Relatórios validados
✔ Console sem erros
✔ Snapshot sincronizado
✔ Popup PWA validado
________________________________________
6️⃣ Pós-Deploy
✔ Tag criada (ex: v2.7.0)
✔ Registro no CHANGELOG
✔ ARCHITECTURE.md atualizado
✔ Commit fechado e sincronizado
✔ Rollback point confirmado
✔ Versão estável identificada
________________________________________
7️⃣ Regras Arquiteturais de Segurança
Nunca:
❌ Deployar sem staging validado
❌ Deployar com erro de console
❌ Deployar sem confirmar firebase use
❌ Alterar attach() sem validação completa
❌ Alterar listeners sem testar reatividade
❌ Trocar identidade PWA direto em produção
Sempre:
✔ Confirmar render via snapshot
✔ Testar fechar e reabrir app
✔ Testar cache do Service Worker
✔ Testar filtro de mês/ano
✔ Testar CRUD completo
✔ Testar reinstalação PWA após mudança estrutural
________________________________________
8️⃣ Política de Rollback Integrada
Caso erro em produção:
1.	Identificar última tag estável
2.	git checkout NOME_DA_TAG
3.	firebase use production
4.	firebase deploy --only hosting
5.	Validar checklist completo
________________________________________
🎯 Versão Atual de Referência
Sistema Estável: v2.7.0
Produção validada
Identidade PWA consolidada
Multi-ambiente ativo
Arquitetura modular preservada
________________________________________


