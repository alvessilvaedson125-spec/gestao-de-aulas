

## VERSION_LOG.md

Bailado Carioca – Gestão de Aulas
Atualizado até v2.7.0
Status: Oficial

---

# 📘 VERSION LOG

Bailado Carioca – Gestão de Aulas

---

## v2.7.0 — Consolidação PWA e Promoção Controlada para Produção

Data: 2026

### 🔵 Infraestrutura

* Manifest atualizado com campo `id` explícito
* Inclusão de ícone 512x512 maskable
* Substituição completa dos ícones oficiais
* Nova identidade PWA forçada
* Correção definitiva de cache de instalação Edge
* Revalidação do Service Worker
* Validação de hard reload pós deploy

### 🔵 Processo

* Fluxo formal staging → production consolidado
* Merge realizado via `--no-edit`
* Deploy production validado
* Checklist atualizado
* Documentação arquitetural revisada

### 🔵 Resultado

✔ Ícone oficial amarelo ativo em produção
✔ Identidade PWA estável
✔ Sem regressão funcional
✔ Snapshot preservado
✔ Multi-ambiente intacto

---

## v2.6.2 — Estabilização Estrutural Reativa

### 🔵 Correções

* Reestruturação da função `attach()`
* Correção de fechamento incorreto que quebrava `onSnapshot`
* Normalização de datas no snapshot de `cashEntries`
* Remoção de listener duplicado
* Alinhamento estrutural do Caixa

### 🔵 Segurança

* Hardening matemático implementado
* Guards contra NaN
* safeArray aplicado
* safeNumber aplicado

### 🔵 Estabilidade

✔ Reatividade restaurada
✔ Evolução estabilizada
✔ Caixa funcional
✔ Ranking anual consistente
✔ Receita anual validada

---

## v2.5.x — Consolidação Financeira

* Implementação de cálculo híbrido (Aulas + Caixa)
* Integração de KPIs consolidados
* Comparativo anual
* Ranking por aluno
* Crescimento percentual

---

## v2.4.x — Implementação de Recorrência

* Campo `recurrenceGroupId` introduzido
* Geração via `crypto.randomUUID()`
* Sem impacto na renderização
* Estrutura de exclusão segura

---

## v2.3.x — Consolidação Multi-Ambiente

* Separação production / staging
* Configuração dinâmica por hostname
* Isolamento completo de banco
* Deploy por alias Firebase

---

## v2.2.x — Modularização Inicial

* Separação core / services / utils
* Extração de reportService
* Padronização de retorno de funções
* Redução de acoplamento

---

## v2.1.x — Estrutura Base Estável

* CRUD Alunos
* CRUD Aulas
* Módulo Evolução
* Caixa inicial
* Snapshot reativo implementado

---

# 🔒 Política de Versionamento

* Versões Major: mudanças estruturais profundas
* Versões Minor: melhorias arquiteturais
* Patch: correções e estabilizações

Deploy em produção sempre vinculado a versão documentada.

---

# 🎯 Versão Atual Oficial

v2.7.0
Produção estável
Identidade PWA consolidada
Arquitetura preservada

---



