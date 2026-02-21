# LOG DE VERSÕES
Bailado Carioca – Gestão de Aulas

---

## v2.3-multi-environment-stable
Data: 2026
Status: Estável
Tipo: Marco estrutural

Descrição:
- Arquitetura modular consolidada (SoC)
- Multi-ambiente implementado (production / staging)
- Relatórios estabilizados
- Correções críticas aplicadas
- Deploy por alias Firebase CLI

Backup confirmado antes do deploy.

---

## v1.2-governanca-inicial
Data: 2026
Status: Documentação

Descrição:
- DEPLOY_CHECKLIST.md criado
- ROLLBACK_POLICY.md criado
- Governança operacional formalizada
- Processo disciplinado de versionamento iniciado
## v2.4.1 – Estabilização Agenda (Bugfix Estrutural)

### Correções
- Corrigido binding do botão "Novo Aluno"
- Corrigido import deleteDoc no lessonService
- Removida chamada manual de renderLessons()
- Eliminado conflito com múltiplos DOMContentLoaded
- Estabilizado fluxo reativo via onSnapshot

### Impacto
- CRUD da Agenda totalmente funcional
- Exclusão de aula corrigida
- Sistema validado em produção

### Risco
Baixo – apenas correções estruturais, sem mudança de modelo de dados.