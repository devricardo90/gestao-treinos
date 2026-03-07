import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth.js";
import {
  CreateWorkoutPlanBodySchema,
  CreateWorkoutPlanResponseSchema,
  ErrorSchema,
} from "../shemas/index.js";
import {
  CreateWorkoutPlan,
  CreateWorkoutPlanInputDto,
} from "../usercases/CreateWorkoutPlan.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/workout-plans",
    schema: {
      summary: "Criar um novo plano de treino",
      tags: ["Planos de Treino"],
      body: CreateWorkoutPlanBodySchema,
      response: {
        201: CreateWorkoutPlanResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
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
        const createWorkoutPlan = new CreateWorkoutPlan();

        const payload: CreateWorkoutPlanInputDto = {
          userId: session.user.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays,
        };

        const result = await createWorkoutPlan.execute(payload);

        return reply.status(201).send(result);
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
