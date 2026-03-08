import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth.js";
import {
  ErrorSchema,
  UpsertUserTrainDataBodySchema,
  UserTrainDataResponseSchema,
} from "../shemas/index.js";
import { GetUserTrainData } from "../usercases/GetUserTrainData.js";
import { UpsertUserTrainData } from "../usercases/UpsertUserTrainData.js";
import { z } from "zod";

export const userRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/me",
    schema: {
      summary: "Obter dados do perfil e treino do usuário",
      tags: ["Usuário"],
      response: {
        200: UserTrainDataResponseSchema.nullable(),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Não autorizado",
          code: "UNAUTHORIZED",
        });
      }

      try {
        const getUserTrainData = new GetUserTrainData();
        const result = await getUserTrainData.execute({
          userId: session.user.id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/me",
    schema: {
      summary: "Atualizar dados de treino do usuário",
      tags: ["Usuário"],
      body: UpsertUserTrainDataBodySchema,
      response: {
        200: z.object({
          userId: z.string(),
          weightInGrams: z.number(),
          heightInCentimeters: z.number(),
          age: z.number(),
          bodyFatPercentage: z.number(),
        }),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Não autorizado",
          code: "UNAUTHORIZED",
        });
      }

      try {
        const upsertUserTrainData = new UpsertUserTrainData();
        const result = await upsertUserTrainData.execute({
          userId: session.user.id,
          ...request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
