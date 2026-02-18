ARCHITECTURE.md

Bailado Carioca – Gestão de Aulas

1. Visão Geral

O sistema foi refatorado com o objetivo de:

Modularizar a arquitetura

Separar regras de negócio da interface

Reduzir risco de regressão

Permitir evolução segura

Facilitar manutenção futura

Preparar o terreno para escalabilidade

A refatoração foi feita de forma:

Incremental

Reversível

Testada a cada etapa

Sem alteração de layout

Sem alteração de regras de negócio

Sem quebra de produção

2. Estrutura Atual de Pastas
public/js/
 ├── core/
 │    └── firebase.js
 │
 ├── services/
 │    ├── authService.js
 │    ├── lessonService.js
 │    ├── studentService.js
 │    └── reportService.js
 │
 └── app.js

3. Princípio Arquitetural Aplicado
Separation of Concerns (SoC)

O sistema está dividido em duas camadas principais:

🔹 Camada de Domínio (Services)

Responsável por:

Cálculo

Agregações

Regras de negócio

Filtros

Comparações

Rankings

Processamento de dados

Não pode:

Acessar DOM

Manipular HTML

Usar Chart.js

Acessar variáveis globais

Depender de elementos da interface

🔹 Camada de Apresentação (app.js)

Responsável por:

Manipulação de DOM

Eventos

Listeners

Renderização

Integração com Chart.js

Seletores

Toggle de interface

Não deve conter:

Cálculo financeiro relevante

Regras de negócio

Agregações complexas

4. Responsabilidade de Cada Service
core/firebase.js

Inicialização do Firebase

Exportação de app, auth, db

authService.js

Login com Google

Logout

Observação de estado de autenticação

lessonService.js

CRUD de aulas

Operações relacionadas a aulas

Isolamento completo do Firestore

studentService.js

CRUD de alunos

Operações relacionadas a alunos

Isolamento completo do Firestore

reportService.js

Responsável por toda lógica de domínio do módulo de relatórios.

Inclui:

Relatório Anual

Receita total

Alunos únicos

Média por aluno

Receita por aluno

Ranking anual

Agregação mensal

Comparativo anual (delta)

Relatório Mensal

Receita prevista

Receita realizada

Quantidade de aulas

Relatório por Aluno

Filtro anual

Total

Contagem

Todas as funções:

São puras

Não acessam DOM

Recebem dependências como parâmetro

Não conhecem variáveis globais

5. Padrão de Refatoração Aplicado

Cada extração seguiu este padrão:

Criar função pura no service

Commit isolado

Substituir trecho no app.js

Testar manualmente

Commit final

Validar produção

Esse padrão deve ser mantido em futuras refatorações.

6. Regra de Ouro do Projeto

Nenhuma alteração pode:

Quebrar produção

Alterar layout

Alterar regra de negócio

Introduzir regressão

Toda mudança deve ser:

Incremental

Testada

Versionada

Reversível

7. Diretrizes para Evolução Futura
Ao criar novos cálculos:

Criar sempre no reportService

Nunca implementar lógica financeira no app.js

Ao criar novos módulos:

Criar novo service

Manter responsabilidade única

Evitar dependência circular

Ao alterar relatórios:

Não misturar cálculo com renderização

Não acessar DOM dentro de services

8. Benefícios Obtidos

Após a refatoração:

Código mais legível

Código mais testável

Redução de acoplamento

Facilidade de manutenção

Base pronta para escalabilidade

Arquitetura preparada para backend real no futuro

9. Próximos Passos Possíveis

Isolar formatadores monetários

Criar camada utilitária (utils)

Introduzir testes unitários

Consolidar dashboard builder

Preparar migração para arquitetura multiusuário real

Implementar camada de persistência desacoplada

10. Conclusão

O módulo de relatórios passou de:

"cálculos espalhados dentro da interface"

para:

"arquitetura modular com domínio isolado"

Isso eleva o sistema para um padrão profissional de desenvolvimento.