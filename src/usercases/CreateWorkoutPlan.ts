import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

export interface CreateWorkoutPlanInputDto {
  name: string;
  userId: string;
  workoutDays: Array<{
    name: string;
    weekday: Weekday;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      order: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export interface CreateWorkoutPlanOutputDto {
  id: string;
  name: string;
  workoutDays: Array<{
    id: string;
    name: string;
    weekday: Weekday;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    workoutExercises: Array<{
      id: string;
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(
    dto: CreateWorkoutPlanInputDto,
  ): Promise<CreateWorkoutPlanOutputDto> {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
    });

    // Transaction
    // Atomicidade
    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }

      const createdWorkoutPlan = await tx.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              name: workoutDay.name,
              weekday: workoutDay.weekday,
              isRest: workoutDay.isRest,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              workoutExercises: {
                create: workoutDay.exercises.map((exercise) => ({
                  name: exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  order: exercise.order,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });

      const result = await tx.workoutPlan.findUnique({
        where: { id: createdWorkoutPlan.id },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true,
            },
          },
        },
      });

      if (!result) {
        throw new Error("workout plan not found");
      }

      return {
        id: result.id,
        name: result.name,
        workoutDays: result.workoutDays.map((day) => ({
          id: day.id,
          name: day.name,
          weekday: Object.values(Weekday).find(
            (w) => w === day.weekday,
          ) as Weekday,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          workoutExercises: day.workoutExercises.map((exercise) => ({
            id: exercise.id,
            order: exercise.order,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restTimeInSeconds: exercise.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}
