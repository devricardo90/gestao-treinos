import { prisma } from "../lib/db.js";
import { Weekday } from "../generated/prisma/enums.js";

export interface ListWorkoutPlansInputDto {
  userId: string;
  isActive?: boolean;
}

export interface ListWorkoutPlansOutputDto {
  id: string;
  name: string;
  isActive: boolean;
  workoutDays: Array<{
    id: string;
    name: string;
    weekDay: Weekday;
    isRest: boolean;
    coverImageUrl: string | null;
    estimatedDurationInSeconds: number;
    workoutExercises: Array<{
      id: string;
      name: string;
      order: number;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class ListWorkoutPlans {
  async execute(dto: ListWorkoutPlansInputDto): Promise<ListWorkoutPlansOutputDto[]> {
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: {
        userId: dto.userId,
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { weekday: "asc" }, // Opcional: ordenar por dia da semana
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workoutPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      isActive: plan.isActive,
      workoutDays: plan.workoutDays.map((day) => ({
        id: day.id,
        name: day.name,
        weekDay: day.weekday,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        workoutExercises: day.workoutExercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          restTimeInSeconds: exercise.restTimeInSeconds,
        })),
      })),
    }));
  }
}
