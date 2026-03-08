---
description: Regras Gerais de Engenharia e Convenções do Repo
globs: "**/*"
---

# Regras Gerais

## Princípios Core

- Priorize **Performance** sobre elegância. Código eficiente vem primeiro.
- Respostas para o desenvolvedor: **SEMPRE em Português do Brasil**.
- Os Commits do projeto **DEVEM** ser em Inglês e seguir o padrão **Conventional Commits** (ex: feat:, fix:, docs:, chore:).

## Stack e Ferramentas Fixas

- **Runtime:** Node.js 24.x
- **Package Manager:** pnpm (v10) - Não utilize npm ou yarn.
- **Backend:** Fastify 5
- **ORM:** Prisma 7
- **Auth:** Better-Auth com adaptador Prisma
- **Tipagem:** TypeScript 5.9

## Comandos Recomendados

- Iniciar App: `pnpm dev`
- Gerar Prisma: `npx prisma generate` ou `pnpm exec prisma generate`
- Migrar Prisma: `npx prisma migrate dev`
- Levantar DB: `docker-compose up -d`
- Lint/Formatação: `pnpm exec eslint .` / `pnpm exec prettier --write .`
