# POLÍTICA DE ROLLBACK
Bailado Carioca – Gestão de Aulas
Status: Ativo
Regra: Restaurar rápido, sem improviso.

---

## Quando aplicar rollback?

- Erro crítico após deploy em produção
- Falha de renderização geral
- Quebra de autenticação
- Relatórios inconsistentes
- Console com erros graves

---

## Procedimento Oficial

### 1. Identificar última versão estável

Verificar tags:

git tag

Selecionar a última versão validada.

---

### 2. Restaurar código

Executar:

git checkout NOME_DA_TAG_ESTAVEL
firebase use production
firebase deploy --only hosting

---

### 3. Validar sistema restaurado

- Login funciona
- Firestore carregando
- Relatórios corretos
- Console limpo

---

### 4. Registrar ocorrência

Adicionar no VERSION_LOG.md:

- Data
- Versão revertida
- Motivo do rollback
- Correção planejada

---

## Observação

Nunca corrigir direto em produção.
Sempre:

1. Corrigir em staging
2. Testar
3. Novo deploy controlado