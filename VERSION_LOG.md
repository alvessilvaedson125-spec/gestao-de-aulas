📘 LOG DE VERSÕES
Bailado Carioca – Gestão de Aulas
v2.4.1-agenda-stable

Data: 2026
Status: Estável – Produção Validada
Tipo: Estabilização Estrutural (Bugfix Controlado)

Contexto

Correções estruturais realizadas após validação em produção do módulo Agenda.
Ajustes focados em binding de eventos, sincronização reativa e importações ausentes.

Correções Aplicadas

Corrigido binding do botão "Novo Aluno"

Corrigido binding do botão "Nova Anotação"

Corrigido import ausente de deleteDoc no lessonService

Removida chamada manual de renderLessons()

Eliminado conflito causado por múltiplos DOMContentLoaded

Normalização da execução em type="module"

Ajustado fluxo reativo com onSnapshot

Resultado Técnico

✔ CRUD da Agenda totalmente funcional

✔ CRUD de Alunos funcional

✔ Exclusão de aula corrigida

✔ Exclusão de aluno validada

✔ Snapshot sincronizado

✔ Sem erros no console

✔ Sistema validado em produção

Impacto Arquitetural

Nenhuma alteração no modelo de dados.

A arquitetura reativa baseada em onSnapshot() foi consolidada como padrão oficial para:

add

update

delete

Regra estabelecida:

Nunca chamar renderLessons() manualmente quando houver listener ativo.

Risco

Baixo.
Apenas correções estruturais internas, sem mudança de schema ou regras de negócio.

v2.3-multi-environment-stable

Data: 2026
Status: Estável
Tipo: Marco Estrutural

Descrição

Arquitetura modular consolidada (SoC)

Multi-ambiente implementado (production / staging)

Relatórios estabilizados

Correções críticas aplicadas

Deploy controlado por alias Firebase CLI

Seleção dinâmica via hostname

Importação via CDN oficial Firebase

Backup confirmado antes do deploy.

v1.2-governanca-inicial

Data: 2026
Status: Documentação
Tipo: Governança Operacional

Descrição

DEPLOY_CHECKLIST.md criado

ROLLBACK_POLICY.md criado

VERSION_LOG.md criado

Processo disciplinado de versionamento iniciado

Política formal de deploy seguro estabelecida

🔒 Política de Versionamento

Regras oficiais do projeto:

Toda correção estrutural deve gerar entrada no log.

Todo deploy relevante deve possuir commit identificável.

Marcos estruturais devem receber tag Git.

Nenhuma versão é considerada estável sem validação em produção.

📌 Versão Atual Consolidada

v2.4.1-agenda-stable

Sistema pronto para:

Evolução controlada

Deploy seguro

Escalabilidade futura

Hardening contínuo