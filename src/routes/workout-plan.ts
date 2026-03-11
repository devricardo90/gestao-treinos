import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  CreateWorkoutPlanBodySchema,
  CreateWorkoutPlanResponseSchema,
  ErrorSchema,
} from "../schemas/index.js";
import {
  GetWorkoutDayParamsSchema,
  GetWorkoutDayResponseSchema,
  GetWorkoutPlanParamsSchema,
  GetWorkoutPlanResponseSchema,
  ListWorkoutPlansQuerySchema,
  ListWorkoutPlansResponseSchema,
  StartWorkoutSessionParamsSchema,
  StartWorkoutSessionResponseSchema,
  UpdateWorkoutSessionBodySchema,
  UpdateWorkoutSessionParamsSchema,
  UpdateWorkoutSessionResponseSchema,
} from "../schemas/index.js";
import {
  CreateWorkoutPlan,
  CreateWorkoutPlanInputDto,
} from "../usecases/CreateWorkoutPlan.js";
import { GetWorkoutDayDetails } from "../usecases/GetWorkoutDayDetails.js";
import { GetWorkoutPlanDetails } from "../usecases/GetWorkoutPlanDetails.js";
import { ListWorkoutPlans } from "../usecases/ListWorkoutPlans.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usecases/UpdateWorkoutSession.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/workout-plans",
    schema: {
      operationId: "createWorkoutPlan",
      summary: "Criar plano de treino",
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
      const createWorkoutPlan = new CreateWorkoutPlan();

      const payload: CreateWorkoutPlanInputDto = {
        userId: request.session.user.id,
        name: request.body.name,
        workoutDays: request.body.workoutDays,
      };

      const result = await createWorkoutPlan.execute(payload);

      return reply.status(201).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions",
    schema: {
      operationId: "startWorkoutSession",
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
      const startWorkoutSession = new StartWorkoutSession();

      const result = await startWorkoutSession.execute({
        userId: request.session.user.id,
        workoutPlanId: request.params.workoutPlanId,
        workoutDayId: request.params.workoutDayId,
      });

      return reply.status(201).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/workout-plans/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
    schema: {
      operationId: "updateWorkoutSession",
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
      const updateWorkoutSession = new UpdateWorkoutSession();

      const result = await updateWorkoutSession.execute({
        userId: request.session.user.id,
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
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/workout-plans/:id",
    schema: {
      summary: "Obter detalhes de um plano de treino",
      tags: ["Planos de Treino"],
      params: GetWorkoutPlanParamsSchema,
      response: {
        200: GetWorkoutPlanResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const getWorkoutPlanDetails = new GetWorkoutPlanDetails();

      const result = await getWorkoutPlanDetails.execute({
        userId: request.session.user.id,
        workoutPlanId: request.params.id,
      });

      return reply.status(200).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/workout-plans/:id/days/:dayId",
    schema: {
      operationId: "getWorkoutDayDetails",
      summary: "Obter detalhes de um dia de treino",
      tags: ["Planos de Treino"],
      params: GetWorkoutDayParamsSchema,
      response: {
        200: GetWorkoutDayResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const getWorkoutDayDetails = new GetWorkoutDayDetails();

      const result = await getWorkoutDayDetails.execute({
        userId: request.session.user.id,
        workoutPlanId: request.params.id,
        workoutDayId: request.params.dayId,
      });

      return reply.status(200).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/workout-plans",
    schema: {
      operationId: "listWorkoutPlans",
      summary: "Listar planos de treino",
      tags: ["Planos de Treino"],
      querystring: ListWorkoutPlansQuerySchema,
      response: {
        200: ListWorkoutPlansResponseSchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const listWorkoutPlans = new ListWorkoutPlans();

      const result = await listWorkoutPlans.execute({
        userId: request.session.user.id,
        isActive: request.query.active,
      });

      return reply.status(200).send(result);
    },
  });
};
