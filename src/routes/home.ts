import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  ErrorSchema,
  GetHomeParamsSchema,
  GetHomeResponseSchema,
} from "../schemas/index.js";
import { GetHomeData } from "../usecases/GetHomeData.js";

export const homeRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/home/:date",
    schema: {
      summary: "Obter dados da página inicial",
      tags: ["Dashboard"],
      params: GetHomeParamsSchema,
      response: {
        200: GetHomeResponseSchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const getHomeData = new GetHomeData();

      const result = await getHomeData.execute({
        userId: request.session.user.id,
        date: request.params.date,
      });

      return reply.status(200).send(result);
    },
  });
};
