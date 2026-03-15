import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/index.js";
import { prisma } from "../lib/db.js";

export interface UpdateWorkoutSessionInputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
  completedAt: Date;
}

export interface UpdateWorkoutSessionOutputDto {
  id: string;
  startedAt: Date;
  completedAt: Date;
}

export class UpdateWorkoutSession {
  async execute(
    dto: UpdateWorkoutSessionInputDto,
  ): Promise<UpdateWorkoutSessionOutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Plano de treino nÃ£o encontrado");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        "Apenas o dono do plano pode atualizar uma sessÃ£o",
      );
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        workoutDay: true,
      },
    });

    if (
      !session ||
      session.workoutDayId !== dto.workoutDayId ||
      session.workoutDay.workoutPlanId !== dto.workoutPlanId
    ) {
      throw new NotFoundError("SessÃ£o de treino nÃ£o encontrada");
    }

    if (session.completedAt) {
      throw new ConflictError("Esta sessÃ£o de treino jÃ¡ foi finalizada");
    }

    if (dto.completedAt < session.startedAt) {
      throw new BadRequestError("A data de conclusÃ£o nÃ£o pode ser anterior ao inÃ­cio");
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: dto.sessionId },
      data: {
        completedAt: dto.completedAt,
      },
    });

    if (!updatedSession.completedAt) {
      throw new Error("Falha ao atualizar a data de conclusÃ£o");
    }

    return {
      id: updatedSession.id,
      startedAt: updatedSession.startedAt,
      completedAt: updatedSession.completedAt,
    };
  }
}
