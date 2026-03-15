import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";

export interface StartWorkoutSessionInputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

export interface StartWorkoutSessionOutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(
    dto: StartWorkoutSessionInputDto,
  ): Promise<StartWorkoutSessionOutputDto> {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const workoutPlan = await tx.workoutPlan.findUnique({
            where: { id: dto.workoutPlanId },
            include: {
              workoutDays: {
                where: { id: dto.workoutDayId },
              },
            },
          });

          if (!workoutPlan) {
            throw new NotFoundError("Plano de treino nÃ£o encontrado");
          }

          if (workoutPlan.userId !== dto.userId) {
            throw new UnauthorizedError("Apenas o dono do plano pode iniciar uma sessÃ£o");
          }

          if (!workoutPlan.isActive) {
            throw new WorkoutPlanNotActiveError();
          }

          const workoutDay = workoutPlan.workoutDays[0];

          if (!workoutDay) {
            throw new NotFoundError("Dia de treino nÃ£o encontrado neste plano");
          }

          const existingSession = await tx.workoutSession.findFirst({
            where: {
              workoutDayId: dto.workoutDayId,
              completedAt: null,
            },
          });

          if (existingSession) {
            throw new ConflictError("JÃ¡ existe uma sessÃ£o iniciada para este dia");
          }

          const session = await tx.workoutSession.create({
            data: {
              workoutDayId: dto.workoutDayId,
              userId: dto.userId,
              startedAt: new Date(),
            },
          });

          return {
            userWorkoutSessionId: session.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (isSerializationConflict(error)) {
        throw new ConflictError("JÃ¡ existe uma sessÃ£o iniciada para este dia");
      }

      throw error;
    }
  }
}

function isSerializationConflict(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}
