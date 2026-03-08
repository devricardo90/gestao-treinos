import { NotFoundError, UnauthorizedError } from "../errors/index.js";
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
      throw new NotFoundError("Plano de treino não encontrado");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        "Apenas o dono do plano pode atualizar uma sessão",
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
      throw new NotFoundError("Sessão de treino não encontrada");
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: dto.sessionId },
      data: {
        completedAt: dto.completedAt,
      },
    });

    if (!updatedSession.completedAt) {
        throw new Error("Falha ao atualizar a data de conclusão");
    }

    return {
      id: updatedSession.id,
      startedAt: updatedSession.startedAt,
      completedAt: updatedSession.completedAt,
    };
  }
}
