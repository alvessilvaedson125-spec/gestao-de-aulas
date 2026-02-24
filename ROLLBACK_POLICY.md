

# 📘 POLÍTICA DE ROLLBACK OFICIAL

Bailado Carioca – Gestão de Aulas
Versão: v2.1
Status: Ativa e Atualizada
Princípio: Restaurar rápido, restaurar limpo, restaurar documentado.

---

## 1️⃣ Quando aplicar rollback?

Aplicar rollback imediatamente em caso de:

* ❌ Erro crítico após deploy em produção
* ❌ Falha total de renderização
* ❌ Quebra de autenticação
* ❌ Snapshot não sincronizando
* ❌ Receita anual inconsistente
* ❌ KPIs divergentes
* ❌ Console com erro estrutural
* ❌ Identidade PWA incorreta
* ❌ Ícone incorreto após promoção
* ❌ Service Worker servindo versão antiga
* ❌ Merge staging → production com comportamento inesperado

**Regra:**
Se há dúvida sobre integridade → rollback.

Produção não é ambiente de teste.

---

## 2️⃣ Identificação da Versão Estável

Verificar tags disponíveis:

```
git tag
```

Selecionar a última versão validada (ex: v2.7.0).

Regra:

* Nunca usar commit hash aleatório
* Sempre usar tag oficial documentada no VERSION_LOG.md
* Nunca restaurar branch manualmente sem referência formal

---

## 3️⃣ Procedimento Oficial de Rollback

### Etapa 1 — Restaurar código

```
git checkout NOME_DA_TAG
firebase use production
firebase deploy --only hosting
```

Exemplo:

```
git checkout v2.7.0
firebase use production
firebase deploy --only hosting
```

---

### Etapa 2 — Limpeza de Cache (Obrigatória)

Após deploy:

* Hard reload (Ctrl + Shift + R)
* Verificar Service Worker
* Se necessário: Unregister SW
* Testar reabertura completa do app
* Se for PWA instalado → desinstalar e reinstalar

---

### Etapa 3 — Validação Pós-Rollback

Confirmar:

* Login funcionando
* attach() inicializando
* Firestore sincronizando
* Caixa renderizando
* Evolução abrindo árvore
* Relatórios corretos
* Console sem erros
* Receita anual consistente
* Popup PWA exibindo identidade correta

Sistema só é considerado restaurado se:

✔ UI estável
✔ Snapshot ativo
✔ Console limpo
✔ Nenhum erro silencioso

---

## 4️⃣ Registro Formal da Ocorrência

Adicionar no VERSION_LOG.md:

* Data
* Versão revertida
* Versão problemática
* Motivo técnico
* Impacto
* Correção planejada
* Tempo de indisponibilidade (se houver)

Exemplo:

Rollback – 2026-02-23
Versão revertida: v2.7.0
Motivo: Identidade PWA incorreta após merge
Impacto: Parcial
Ação corretiva: Correção validada em staging

Rollback sem registro formal é considerado procedimento incompleto.

---

## 5️⃣ Regra de Ouro Pós-Rollback

Nunca corrigir diretamente em produção.

Fluxo obrigatório:

1. Corrigir em staging
2. Testar completamente
3. Validar checklist
4. Novo commit
5. Nova tag
6. Deploy controlado

Produção só recebe versão validada.

---

## 6️⃣ Rollback de Dados (Se Necessário)

Caso erro envolva dados:

* Restaurar backup Firestore
* Confirmar integridade de:

  * alunos
  * aulas
  * evolucoes
  * caixa
* Validar KPIs após restauração
* Registrar operação

Nunca restaurar dados parcialmente sem registro formal.

---

## 7️⃣ Princípios Arquiteturais

Rollback é procedimento técnico, não emocional.

* Sem improviso
* Sem edição manual em produção
* Sem hotfix direto no servidor
* Sem alteração de banco sem versionamento
* Sem deploy sem confirmar alias

Produção é ambiente protegido.

---

## 🔐 Versão Atual de Referência Segura

Sistema estável atual: **v2.7.0**

* Identidade PWA consolidada
* Multi-ambiente validado
* Snapshot estabilizado
* Caixa integrado
* Evolução funcional
* attach() blindado
* Fluxo staging → production formalizado

---

S
