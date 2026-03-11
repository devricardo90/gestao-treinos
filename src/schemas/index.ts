import { z } from "zod";

import { Weekday } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const SignUpEmailBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const SignUpEmailResponseSchema = z.any();

export const RootResponseSchema = z.object({
  message: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const UsersResponseSchema = z.array(UserSchema);

export const WorkoutExerciseInputSchema = z.object({
  order: z.number().min(0),
  name: z.string().trim().min(1),
  sets: z.number().min(1),
  reps: z.number().min(1),
  restTimeInSeconds: z.number().min(1),
});

export const WorkoutDayInputSchema = z.object({
  name: z.string().trim().min(1),
  coverImageUrl: z.string().url().optional(),
  isRest: z.boolean().default(false),
  weekday: z.nativeEnum(Weekday),
  estimatedDurationInSeconds: z.number().min(1),
  exercises: z.array(WorkoutExerciseInputSchema),
});

export const CreateWorkoutPlanBodySchema = z.object({
  name: z.string().trim().min(1),
  workoutDays: z.array(WorkoutDayInputSchema),
});

export const WorkoutExerciseResponseSchema = z.object({
  id: z.string(),
  order: z.number().min(0),
  name: z.string().trim().min(1),
  sets: z.number().min(1),
  reps: z.number().min(1),
  restTimeInSeconds: z.number().min(1),
});

export const WorkoutDayResponseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  coverImageUrl: z.string().url().nullable().optional(),
  weekday: z.nativeEnum(Weekday),
  isRest: z.boolean(),
  estimatedDurationInSeconds: z.number().int().min(1),
  workoutExercises: z.array(WorkoutExerciseResponseSchema),
});

export const CreateWorkoutPlanResponseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  workoutDays: z.array(WorkoutDayResponseSchema),
});

export const StartWorkoutSessionParamsSchema = z.object({
  workoutPlanId: z.string().uuid(),
  workoutDayId: z.string().uuid(),
});

export const StartWorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.string().uuid(),
});

export const UpdateWorkoutSessionParamsSchema = z.object({
  workoutPlanId: z.string().uuid(),
  workoutDayId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.string().datetime(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

export const GetHomeParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

export const GetHomeResponseSchema = z.object({
  activeWorkoutPlanId: z.string().uuid().nullable(),
  todayWorkoutDay: z
    .object({
      workoutPlanId: z.string().uuid(),
      id: z.string().uuid(),
      name: z.string(),
      isRest: z.boolean(),
      weekDay: z.nativeEnum(Weekday),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.string().url().optional().nullable(),
      exercisesCount: z.number(),
    })
    .nullable(),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const GetWorkoutPlanParamsSchema = z.object({
  id: z.string().uuid(),
});

export const GetWorkoutPlanResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.string().uuid(),
      weekDay: z.nativeEnum(Weekday),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().url().optional().nullable(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});
export const GetWorkoutDayParamsSchema = z.object({
  id: z.string().uuid(),
  dayId: z.string().uuid(),
});

export const GetWorkoutDayResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().url().optional().nullable(),
  estimatedDurationInSeconds: z.number(),
  weekDay: z.nativeEnum(Weekday),
  exercises: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      order: z.number(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string().uuid(),
      workoutDayId: z.string().uuid(),
      startedAt: z.string().datetime().nullable().optional(),
      completedAt: z.string().datetime().nullable().optional(),
    }),
  ),
});

export const GetStatsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

export const GetStatsResponseSchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});

export const UpsertUserTrainDataBodySchema = z.object({
  weightInGrams: z.number().int().positive(),
  heightInCentimeters: z.number().int().positive(),
  age: z.number().int().positive(),
  bodyFatPercentage: z.number().min(0).max(1),
});

export const UserTrainDataResponseSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number(),
});

export const ListWorkoutPlansQuerySchema = z.object({
  active: z
    .preprocess((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean())
    .optional(),
});

export const ListWorkoutPlansResponseSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    isActive: z.boolean(),
    workoutDays: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        weekDay: z.nativeEnum(Weekday),
        isRest: z.boolean(),
        coverImageUrl: z.string().url().optional().nullable(),
        estimatedDurationInSeconds: z.number(),
        workoutExercises: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            order: z.number(),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
          }),
        ),
      }),
    ),
  }),
);
