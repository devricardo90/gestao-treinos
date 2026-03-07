import "dotenv/config";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

import { prisma } from "./lib/prisma.js";
import { workoutPlanRoutes } from "./router/workout-plan.js";

export const app = Fastify({ logger: true });

// Register CORS
await app.register(fastifyCors, {
  origin: "*",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register authentication endpoint
app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();

      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      app.log.error({ err: error }, "Authentication Error");
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Gestão de Treino API",
      description: "API para gestão de treinos",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

// Adicione isso para a rota aparecer na documentação
app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/api/auth/sign-up/email",
  schema: {
    tags: ["Autenticação"],
    description: "Criar uma nova conta",
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }),
    response: {
      200: z.any(),
    },
  },
  handler: async (_request, _reply) => {
    // Esse handler será "ignorado" porque a rota /api/auth/*
    // vai capturar a requisição antes, mas o Scalar vai ler esse schema.
  },
});

await app.register(ScalarApiReference, {
  routePrefix: "/docs",
  openApiDocumentEndpoints: {
    json: "/openapi.json",
    yaml: "/openapi.yaml",
  },
  configuration: {
    title: "Gestão de Treino API",
    theme: "deepSpace",
  },
  logLevel: "silent",
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: { hide: true },
  handler: async () => {
    return app.swagger();
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Hello World",
    tags: ["Hello World"],
    response: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
  handler: () => {
    return {
      message: "Hello World",
    };
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/users",
  schema: {
    description: "Listar todos os usuários",
    tags: ["Usuários"],
    response: {
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
      ),
    },
  },
  handler: async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return users;
  },
});

await app.register(workoutPlanRoutes);

try {
  await app.listen({
    port: Number(process.env.PORT) || 3333,
    host: "0.0.0.0",
  });
} catch (err) {
  app.log.error(err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
}
