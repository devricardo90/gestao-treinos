import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { Weekday } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

export interface GetHomeDataInputDto {
  userId: string;
  date: string;
}

export interface GetHomeDataOutputDto {
  activeWorkoutPlanId: string | null;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: Weekday;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string | null;
    exercisesCount: number;
  } | null;
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
}

export class GetHomeData {
  async execute(dto: GetHomeDataInputDto): Promise<GetHomeDataOutputDto> {
    const targetDate = dayjs.utc(dto.date).startOf("day");
    const startOfWeek = targetDate.startOf("week"); // Sunday
    const endOfWeek = targetDate.endOf("week"); // Saturday

    // 1. Get active workout plan
    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
    });

    // 2. Identify today's workout day
    let todayWorkoutDay = null;
    if (activeWorkoutPlan) {
      const dayOfWeek = targetDate.format("dddd").toUpperCase(); // Prisma enum is uppercase
      const dayMatch = activeWorkoutPlan.workoutDays.find(
        (day) => day.weekday === dayOfWeek,
      );

      if (dayMatch) {
        todayWorkoutDay = {
          workoutPlanId: activeWorkoutPlan.id,
          id: dayMatch.id,
          name: dayMatch.name,
          isRest: dayMatch.isRest,
          weekDay: dayMatch.weekday,
          estimatedDurationInSeconds: dayMatch.estimatedDurationInSeconds,
          coverImageUrl: dayMatch.coverImageUrl, // Cover image is on WorkoutDay
          exercisesCount: dayMatch.workoutExercises.length,
        };
      }
    }

    // 3. Consistency by Day
    const sessionsInWeek = await prisma.workoutSession.findMany({
      where: {
        userId: dto.userId,
        startedAt: {
          gte: startOfWeek.toDate(),
          lte: endOfWeek.toDate(),
        },
      },
      orderBy: { startedAt: "asc" },
    });

    const consistencyByDay: {
      [key: string]: { workoutDayCompleted: boolean; workoutDayStarted: boolean };
    } = {};

    for (let i = 0; i < 7; i++) {
      const currentDay = startOfWeek.add(i, "day").format("YYYY-MM-DD");
      consistencyByDay[currentDay] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    sessionsInWeek.forEach((session) => {
      const dateKey = dayjs.utc(session.startedAt).format("YYYY-MM-DD");
      if (consistencyByDay[dateKey]) {
        consistencyByDay[dateKey].workoutDayStarted = true;
        if (session.completedAt) {
          consistencyByDay[dateKey].workoutDayCompleted = true;
        }
      }
    });

    // 4. Workout Streak (Simplified)
    // We look at all completed sessions for this user, ordered by date
    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        userId: dto.userId,
        completedAt: { not: null },
      },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    let streak = 0;
    if (completedSessions.length > 0) {
      const currentStreakDate = dayjs.utc(completedSessions[0].startedAt).startOf("day");
      
      // If the last completed session was today or yesterday, start counting
      const today = dayjs.utc().startOf("day");
      if (currentStreakDate.isSame(today) || currentStreakDate.isSame(today.subtract(1, "day"))) {
        streak = 1;
        const uniqueDates = Array.from(new Set(completedSessions.map(s => dayjs.utc(s.startedAt).startOf("day").valueOf())));
        
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const prevDate = dayjs.utc(uniqueDates[i+1]);
          const currDate = dayjs.utc(uniqueDates[i]);
          
          if (currDate.subtract(1, "day").isSame(prevDate)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      activeWorkoutPlanId: activeWorkoutPlan?.id ?? null,
      todayWorkoutDay,
      workoutStreak: streak,
      consistencyByDay,
    };
  }
}
