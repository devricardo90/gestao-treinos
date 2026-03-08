import { Weekday } from "../generated/prisma/enums.js";
import { NotFoundError, UnauthorizedError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

export interface GetWorkoutPlanDetailsInputDto {
  userId: string;
  workoutPlanId: string;
}

export interface GetWorkoutPlanDetailsOutputDto {
  id: string;
  name: string;
  workoutDays: Array<{
    id: string;
    weekDay: Weekday;
    name: string;
    isRest: boolean;
    coverImageUrl?: string | null;
    estimatedDurationInSeconds: number;
    exercisesCount: number;
  }>;
}

export class GetWorkoutPlanDetails {
  async execute(
    dto: GetWorkoutPlanDetailsInputDto,
  ): Promise<GetWorkoutPlanDetailsOutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          include: {
            _count: {
              select: { workoutExercises: true },
            },
          },
        },
      },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Plano de treino não encontrado");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        "Apenas o dono do plano pode visualizar seus detalhes",
      );
    }

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays: workoutPlan.workoutDays.map((day) => ({
        id: day.id,
        weekDay: day.weekday,
        name: day.name,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        exercisesCount: day._count.workoutExercises,
      })),
    };
  }
}
