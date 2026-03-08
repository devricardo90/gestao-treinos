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
  weekday: z.enum(Weekday),
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
  weekday: z.enum(Weekday),
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
      weekDay: z.string(),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.string().url().optional().nullable(),
      exercisesCount: z.number(),
    })
    .nullable(),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});
