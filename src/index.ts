import "dotenv/config";

import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
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

import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { authenticate } from "./plugins/authenticate.js";
import { errorHandler } from "./plugins/error-handler.js";
import { aiRoutes } from "./routes/ai.js";
import { homeRoutes } from "./routes/home.js";
import { statsRoutes } from "./routes/stats.js";
import { userRoutes } from "./routes/user.js";
import { workoutPlanRoutes } from "./routes/workout-plan.js";

export const app = Fastify({ logger: true });

// Register CORS
await app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Error handler global — mapeia erros de domínio para HTTP status
await app.register(errorHandler);

// Rate limit global — configuração base (a rota /ai sobrescreve com limite menor)
await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (request: import("fastify").FastifyRequest & { session?: { user: { id: string } } }) =>
    request.session?.user?.id ?? request.ip,
});

// Register authentication endpoint
app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  schema: {
    hide: true,
  },
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


// Rotas PRIVADAS — protegidas pelo plugin authenticate com escopo isolado
await app.register(async (privateApp) => {
  privateApp.register(authenticate);
  privateApp.register(homeRoutes);
  privateApp.register(aiRoutes);
  privateApp.register(statsRoutes, { prefix: "/stats" });
  privateApp.register(userRoutes);
  privateApp.register(workoutPlanRoutes);

  // Rota de perfil básico — protegida, retorna apenas o próprio usuário
  privateApp.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users/me",
    schema: {
      summary: "Obter perfil do usuário autenticado",
      tags: ["Usuários"],
      response: {
        200: z.object({
          id: z.string(),
          name: z.string().nullable(),
          email: z.string(),
        }),
        401: z.object({ error: z.string(), code: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.session.user.id },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return reply.status(401).send({ error: "Usuário não encontrado", code: "NOT_FOUND" });
      }

      return reply.status(200).send(user);
    },
  });
});

try {
  await app.listen({
    port: Number(process.env.PORT) || 3333,
    host: "0.0.0.0",
  });
} catch (err) {
  app.log.error(err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
}
