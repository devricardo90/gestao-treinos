import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
  CreateWorkoutPlanBodySchema,
  CreateWorkoutPlanResponseSchema,
  ErrorSchema,
} from "../shemas/index.js";
import {
  StartWorkoutSessionParamsSchema,
  StartWorkoutSessionResponseSchema,
  UpdateWorkoutSessionBodySchema,
  UpdateWorkoutSessionParamsSchema,
  UpdateWorkoutSessionResponseSchema,
} from "../shemas/index.js";
import {
  CreateWorkoutPlan,
  CreateWorkoutPlanInputDto,
} from "../usercases/CreateWorkoutPlan.js";
import { StartWorkoutSession } from "../usercases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usercases/UpdateWorkoutSession.js";

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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions",
    schema: {
      summary: "Iniciar uma sessão de treino",
      tags: ["Sessões de Treino"],
      params: StartWorkoutSessionParamsSchema,
      response: {
        201: StartWorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
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
        const startWorkoutSession = new StartWorkoutSession();

        const result = await startWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "NOT_FOUND" });
        }
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            error: error.message,
            code: "UNAUTHORIZED",
          });
        }
        if (error instanceof WorkoutPlanNotActiveError) {
          return reply.status(400).send({
            error: error.message,
            code: "WORKOUT_PLAN_NOT_ACTIVE",
          });
        }
        if (error instanceof ConflictError) {
          return reply
            .status(409)
            .send({ error: error.message, code: "CONFLICT" });
        }

        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
    schema: {
      summary: "Finalizar uma sessão de treino",
      tags: ["Sessões de Treino"],
      params: UpdateWorkoutSessionParamsSchema,
      body: UpdateWorkoutSessionBodySchema,
      response: {
        200: UpdateWorkoutSessionResponseSchema,
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
        const updateWorkoutSession = new UpdateWorkoutSession();

        const result = await updateWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
          sessionId: request.params.sessionId,
          completedAt: new Date(request.body.completedAt),
        });

        return reply.status(200).send({
          ...result,
          startedAt: result.startedAt.toISOString(),
          completedAt: result.completedAt.toISOString(),
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "NOT_FOUND" });
        }
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            error: error.message,
            code: "UNAUTHORIZED",
          });
        }

        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
