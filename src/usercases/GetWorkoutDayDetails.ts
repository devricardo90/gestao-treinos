import { NotFoundError, UnauthorizedError } from "../errors/index.js";
import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

export interface GetWorkoutDayDetailsInputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

export interface GetWorkoutDayDetailsOutputDto {
  id: string;
  name: string;
  isRest: boolean;
  coverImageUrl?: string | null;
  estimatedDurationInSeconds: number;
  weekDay: Weekday;
  exercises: Array<{
    id: string;
    name: string;
    order: number;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
  }>;
  sessions: Array<{
    id: string;
    workoutDayId: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
}

export class GetWorkoutDayDetails {
  async execute(
    dto: GetWorkoutDayDetailsInputDto,
  ): Promise<GetWorkoutDayDetailsOutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Plano de treino não encontrado");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        "Apenas o dono do plano pode visualizar os detalhes deste dia",
      );
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
      include: {
        workoutExercises: {
          orderBy: { order: "asc" },
        },
        workoutSessions: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new NotFoundError("Dia de treino não encontrado");
    }

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      weekDay: workoutDay.weekday,
      exercises: workoutDay.workoutExercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        sets: exercise.sets,
        reps: exercise.reps,
        restTimeInSeconds: exercise.restTimeInSeconds,
      })),
      sessions: workoutDay.workoutSessions.map((session) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: session.startedAt?.toISOString() ?? null,
        completedAt: session.completedAt?.toISOString() ?? null,
      })),
    };
  }
}
