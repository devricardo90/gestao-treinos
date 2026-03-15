import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import {
  ErrorSchema,
  UpsertUserTrainDataBodySchema,
  UserTrainDataResponseSchema,
} from "../schemas/index.js";
import { GetUserTrainData } from "../usecases/GetUserTrainData.js";
import { UpsertUserTrainData } from "../usecases/UpsertUserTrainData.js";

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
      const getUserTrainData = new GetUserTrainData();
      const result = await getUserTrainData.execute({
        userId: request.session.user.id,
      });

      return reply.status(200).send(result);
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
      const upsertUserTrainData = new UpsertUserTrainData();
      const result = await upsertUserTrainData.execute({
        userId: request.session.user.id,
        ...request.body,
      });

      return reply.status(200).send(result);
    },
  });
};
