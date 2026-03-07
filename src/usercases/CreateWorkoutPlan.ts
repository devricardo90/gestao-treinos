import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface Dto {
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

export class CreateWorkoutPlan {
  async execute(dto: Dto) {
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

      return result;
    });
  }
}
