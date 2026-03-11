import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
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
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          where: { id: dto.workoutDayId },
        },
      },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Plano de treino não encontrado");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError("Apenas o dono do plano pode iniciar uma sessão");
    }

    if (!workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError();
    }

    const workoutDay = workoutPlan.workoutDays[0];

    if (!workoutDay) {
      throw new NotFoundError("Dia de treino não encontrado neste plano");
    }

    // Verificar se já existe uma sessão iniciada para este dia que não foi finalizada (opcional, mas bom pra consistência)
    // No prompt diz: "Caso o dia recebido já tenha uma sessão iniciada (startedAt presente), retorne 409."
    // Presumo que isso se refira a se já existe QUALQUER sessão para esse dia específico.
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        workoutDayId: dto.workoutDayId,
        startedAt: { not: undefined }, // Verificando se existe algo iniciado
        completedAt: null, // Verificamos se está em aberto
      },
    });

    if (existingSession) {
      throw new ConflictError("Já existe uma sessão iniciada para este dia");
    }

    const session = await prisma.workoutSession.create({
      data: {
        workoutDayId: dto.workoutDayId,
        userId: dto.userId,
        startedAt: new Date(),
      },
    });

    return {
      userWorkoutSessionId: session.id,
    };
  }
}
