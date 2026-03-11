import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { ErrorSchema, GetStatsQuerySchema, GetStatsResponseSchema } from "../schemas/index.js";
import { GetStats } from "../usecases/GetStats.js";

export const statsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      summary: "Obter estatísticas do usuário",
      tags: ["Estatísticas"],
      querystring: GetStatsQuerySchema,
      response: {
        200: GetStatsResponseSchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const getStats = new GetStats();

        const result = await getStats.execute({
          userId: request.session.user.id,
          from: request.query.from,
          to: request.query.to,
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
