---
description: Regras de Arquitetura e Padrão de Camadas
globs: ["src/**/*.ts", "prisma/**/*.prisma"]
---

# Regras de Arquitetura

## Padrão em Camadas

A API segue um fluxo estrito: `Routes -> Use Cases -> Prisma`.

### 1. Routes (`src/router/`)

- Devem apenas receber a requisição, validar via schemas, autorizar, chamar o Use Case, e enviar a resposta.
- **SEMPRE** use `fastify-type-provider-zod` nas rotas para validar `body`, `query`, e `params` e definir o `response` HTTP (status 200, 201, 400, 404, etc.).
- Extraia a sessão do usuário com `auth.api.getSession()`.

### 2. Use Cases (`src/usercases/`)

- Centralizam a lógica de negócio.
- Uma classe por caso de uso.
- Devem receber DTOs tipados.
- Ao realizar múltiplas operações no banco, **SEMPRE** utilize `prisma.$transaction` para garantir atomicidade.

### 3. Schemas (`src/shemas/`)

- Centralizam validações do Zod.
- Reutilizáveis entre rotas e OpenAPI docs.
- Devem conter toda a tipagem de Input e Output.

### 4. Errors (`src/errors/`)

- Mapeie erros customizados estendendo a classe genérica `Error` (ex: `NotFoundError`).
- O tratamento deve ser interceptado na rota ou no Use Case, e convertido para a resposta correspondente.

## Banco de Dados

- **SEMPRE** use `snake_case` no Prisma para nomes de tabelas (`@@map("nome_tabela")`) e colunas (`@map("nome_coluna")`).
- Campos `DateTime` devem **SEMPRE** usar `@db.Timestamptz()`.
- Relações fortes devem **SEMPRE** declarar `onDelete: Cascade` (ex: apagar um usuário apaga suas sessões de treino).
