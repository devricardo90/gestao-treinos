# API Prompt

Este documento contém diretrizes e prompts para a manutenção e evolução da API de Gestão de Treinos.

## Padronização de Rotas
- Sempre utilize Fastify com o Type Provider do Zod.
- Validação de entrada via `body`, `params` e `querystring`.
- Respostas padronizadas usando esquemas definidos em `src/shemas/index.ts`.
- Autenticação obrigatória para rotas privadas via `better-auth`.

## Estrutura do Projeto
- `src/router`: Definição das rotas e handlers.
- `src/usercases`: Lógica de negócio e DTOs.
- `src/shemas`: Esquemas de validação Zod.
- `src/lib`: Configurações de bibliotecas (Prisma, Auth).

---

# Template de Prompt para Criar uma Rota de API

Crie a rota `POST /workout-plans/{id}/days/{id}/sessions`

## Descrição

Ela inicia uma sessão de treino de um dia de um plano de treino específico.

## Requisitos Técnicos

- Um dia iniciado representa uma WorkoutSession criada no banco de dados.
- Use case deve se chamar "StartWorkoutSession".

## Autenticação

- Rota protegida.
- Apenas o dono do plano de treino pode iniciar uma sessão de treino.

## Request

```ts
interface Body {}
interface Params {
  workoutPlanId: string;
  workoutDayId: string;
}
```

## Response
```ts
interface StatusCode201 {
  userWorkoutSessionId: string;
}
```

## Regras de Negócio

- Apenas o dono do workout plan pode iniciar a sessão de treino.
- Caso o workout plan não esteja ativo (`isActive = true`), o use case deve lançar o erro `WorkoutPlanNotActiveError`.
- Caso o dia recebido já tenha uma sessão iniciada (`startedAt` presente), retorne 409.
- Deve ser possível criar uma sessão para um dia de descanso.
