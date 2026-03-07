# Diretrizes do Agente (agente.md)

Este documento centraliza as informações essenciais sobre a arquitetura, convenções e regras do projeto `gestao-treino-api` para orientar o desenvolvimento.

## Visão Geral

API de treinos construída com **Fastify 5**, **TypeScript 5.9**, **Prisma 7.4** e **Better-Auth**.

- Roda em **Node.js 24.x** com **pnpm 10.30.0** (ambos obrigatórios via `engine-strict`).
- Pacote ESM (Type: `module`).

## Comandos Principais

- **Iniciar servidor de desenvolvimento (hot-reload):** `pnpm dev`
- **Iniciar banco PostgreSQL via Docker:** `docker-compose up -d`
- **Migrations do Prisma:**
  - `pnpm exec prisma migrate dev`
  - `pnpm exec prisma generate`
- **Linting:** `pnpm exec eslint .`
- **Formatação:** `pnpm exec prettier --write .`
  _(Não há script de build ou teste configurado ainda. TypeScript compila para `./dist` via `tsc`)._

## Arquitetura

### Padrão em Camadas: Routes -> Use Cases -> Prisma

1. **Routes (`src/router/`)**
   - Handlers de rotas Fastify.
   - Registram schemas Zod para validação de request/response via `fastify-type-provider-zod`.
   - Extraem sessão de autenticação.
   - Definem e retornam o status HTTP adequado (ex: 201, 400, 404, 500).

2. **Use Cases (`src/usercases/`)**
   - Classes de lógica de negócio (uma classe por caso de uso).
   - Recebem DTOs padronizados.
   - Usam transações Prisma (`prisma.$transaction`) para garantir atomicidade.
   - Lançam erros que são capturados ou traduzidos nas rotas.

3. **Schemas (`src/shemas/`)**
   - Schemas Zod compartilhados entre rotas e OpenAPI docs.
   - Definem tanto a validação de entrada (body/query/params) quanto o formato de resposta esperado.

4. **Errors (`src/errors/`)**
   - Classes de erro customizadas (ex: `NotFoundError`, `UnauthorizedError`) estendendo `Error`.
   - Incluem também o `ErrorSchema` centralizado para mapeamento de respostas de erro na API.

## Autenticação

- Implementada via **Better-Auth** com adaptador Prisma (`src/lib/auth.ts`).
- Rotas de autenticação gerenciadas automaticamente em `/api/auth/*`.
- Autenticação baseada em sessão — as rotas privadas extraem a sessão do usuário via `auth.api.getSession({ headers: fromNodeHeaders(request.headers) })`.

## Banco de Dados

- **PostgreSQL 16** via Docker.
- Prisma client inicializado em `src/lib/prisma.ts` / `src/lib/db.ts`.
- Tipos gerados em `src/generated/prisma/` (esta pasta deve ser ignorada no git).
- Schema principal em `prisma/schema.prisma`.
- **Regras Importantes de Prisma:**
  - Mapas de nomeação (`@@map`, `@map`) devem sempre seguir o padrão `snake_case` para tabelas e colunas.
  - Campos de data/hora (`DateTime`) devem usar `@db.Timestamptz()`.
  - Deleções em cascata (`onDelete: Cascade`) devem ser configuradas para garantir integridade.

## Documentação da API

- Swagger JSON gerado dinamicamente via fastify-swagger, servido em `/swagger.json`.
- UI do Scalar disponível nativamente na rota `/docs`.
- Endpoints de autenticação são mesclados na spec OpenAPI via plugin do Better-Auth.

## Convenções de Código

- **TypeScript strict** com target _ES2024_ e module resolution _nodenext_.
- **ESLint** com typescript-eslint, integração com Prettier e `simple-import-sort` (imports devem ser sempre ordenados).
- Retornos das funções, especialmente em handlers de rotas e use cases, devem ser auto-descritivos e tipados via Zod.
- Privilegiar **Performance** sobre elegância pura.
- O idioma nativo para commits é **Inglês**, enquanto o desenvolvimento/ajuda deve ser focado em **Português do Brasil**.

---

_Este documento serve como mapa mental para que a IA não quebre os padrões existentes e conheça os limites técnicos do projeto._
