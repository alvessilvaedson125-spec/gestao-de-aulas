# Bailado Carioca – Gestão de Aulas
# Arquitetura Oficial

Versão: v2.0-architecture-stable  
Status: Estável  
Data: 2026  

---

# 1. Visão Geral

A aplicação segue arquitetura modular baseada em Separation of Concerns (SoC), com isolamento claro entre:

- Infraestrutura
- Regras de negócio
- Utilitários
- Interface

A refatoração foi realizada de forma:

- Incremental
- Reversível
- Testada a cada etapa
- Sem alterar layout
- Sem alterar regras de negócio
- Sem quebrar produção

---

# 2. Estrutura de Pastas

public/js
├── core/
│ └── firebase.js
│
├── services/
│ ├── authService.js
│ ├── lessonService.js
│ ├── studentService.js
│ └── reportService.js
│
├── utils/
│ ├── formatService.js
│ ├── dateService.js
│ └── uiHelpers.js
│
└── app.js


---

# 3. Camadas e Responsabilidades

## 3.1 Core (Infraestrutura)

Responsável por:
- Inicialização do Firebase
- Exportação de `app`, `auth`, `db`

Não contém regras de negócio.

---

## 3.2 Services (Domínio)

Responsável por:
- CRUD
- Cálculos
- KPIs
- Relatórios
- Ranking
- Comparativos
- Agregações

Regras obrigatórias:
- Não acessa DOM
- Não manipula HTML
- Não conhece Chart.js
- Não depende de variáveis globais
- Recebe dependências por parâmetro

Todas as funções são puras sempre que possível.

---

## 3.3 Utils (Funções Puras)

Responsável por:
- Formatação monetária
- Parsing de datas
- Helpers de interface
- Manipulação leve de DOM

Regras:
- Sem acesso ao Firebase
- Sem regras de negócio
- Sem cálculos financeiros complexos

---

## 3.4 app.js (Orquestração)

Responsável por:
- Eventos
- Listeners
- Renderização
- Integração com Chart.js
- Manipulação de DOM

Não deve conter:
- Regras de negócio
- Cálculos financeiros
- Parsing duplicado
- Lógica de domínio

---

# 4. Princípios Arquiteturais

1. Regra de Ouro: nenhuma alteração pode quebrar produção.
2. Separação clara de responsabilidades.
3. Cada módulo tem responsabilidade única.
4. Nenhuma duplicação funcional.
5. Mudanças sempre versionadas e testadas.

---

# 5. Anti-Patterns Proibidos

- Cálculo financeiro no app.js
- DOM dentro de services
- Parsing monetário duplicado
- Dependência circular entre módulos
- Acesso direto ao Firebase fora da camada apropriada

---

# 6. Estado Atual da Arquitetura

Arquitetura modular consolidada.

Hardening iniciado no reportService:

- Safe guards aplicados
- Validação defensiva
- Prevenção de NaN
- Prevenção de arrays inválidos

---

# 7. Fase Atual – Hardening e Robustez

Objetivos:

- Blindagem contra dados inválidos
- Segurança matemática
- Validação defensiva
- Prevenção de regressão silenciosa

Essa fase não altera comportamento.
Apenas fortalece a estabilidade interna.

---

# 8. Diretrizes para Evolução Futura

Ao criar novos cálculos:
→ Criar sempre em `reportService`.

Ao criar novo módulo:
→ Criar novo service.

Ao alterar relatórios:
→ Separar cálculo de renderização.

Nunca misturar domínio com interface.

---

# 9. Benefícios Obtidos

- Código modular
- Redução de acoplamento
- Maior previsibilidade
- Base pronta para backend real
- Preparação para testes unitários
- Evolução segura

---

# 10. Conclusão

O sistema evoluiu de:

"Cálculos espalhados na interface"

para:

"Arquitetura modular com domínio isolado e controle de evolução"

Isso estabelece base profissional para crescimento sustentável.