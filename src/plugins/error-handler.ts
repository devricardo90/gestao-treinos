import { FastifyError, FastifyInstance } from "fastify";

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";

/**
 * Plugin de error handler global.
 * Mapeia erros de domínio para status HTTP automaticamente.
 * Elimina os blocos if/instanceof repetidos em cada route handler.
 *
 * Registrar no app principal (fora dos contextos de rotas):
 *   app.register(errorHandler);
 */
export const errorHandler = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    // Erros de validação Zod/Fastify
    if (error.validation) {
      return reply.status(400).send({
        error: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message, code: "NOT_FOUND" });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ error: error.message, code: "UNAUTHORIZED" });
    }

    if (error instanceof BadRequestError) {
      return reply.status(400).send({ error: error.message, code: "BAD_REQUEST" });
    }

    if (error instanceof WorkoutPlanNotActiveError) {
      return reply.status(400).send({ error: error.message, code: "WORKOUT_PLAN_NOT_ACTIVE" });
    }

    if (error instanceof ConflictError) {
      return reply.status(409).send({ error: error.message, code: "CONFLICT" });
    }

    // Fallback — erro inesperado
    fastify.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({
      error: "Erro interno do servidor",
      code: "INTERNAL_SERVER_ERROR",
    });
  });
};
