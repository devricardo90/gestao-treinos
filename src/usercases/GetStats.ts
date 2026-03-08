import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { prisma } from "../lib/db.js";

dayjs.extend(utc);

export interface GetStatsInputDto {
  userId: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface GetStatsOutputDto {
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  async execute(dto: GetStatsInputDto): Promise<GetStatsOutputDto> {
    const fromDate = dayjs.utc(dto.from).startOf("day");
    const toDate = dayjs.utc(dto.to).endOf("day");

    // 1. Fetch all user sessions in the range
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: dto.userId,
        startedAt: {
          gte: fromDate.toDate(),
          lte: toDate.toDate(),
        },
      },
      orderBy: { startedAt: "asc" },
    });

    const consistencyByDay: {
      [key: string]: {
        workoutDayCompleted: boolean;
        workoutDayStarted: boolean;
      };
    } = {};

    let completedWorkoutsCount = 0;
    let totalTimeInSeconds = 0;

    sessions.forEach((session) => {
      const dateKey = dayjs.utc(session.startedAt).format("YYYY-MM-DD");

      if (!consistencyByDay[dateKey]) {
        consistencyByDay[dateKey] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      consistencyByDay[dateKey].workoutDayStarted = true;

      if (session.completedAt) {
        consistencyByDay[dateKey].workoutDayCompleted = true;
        completedWorkoutsCount++;

        const duration = dayjs(session.completedAt).diff(
          dayjs(session.startedAt),
          "second",
        );
        totalTimeInSeconds += duration;
      }
    });

    const totalSessions = sessions.length;
    const conclusionRate =
      totalSessions > 0 ? completedWorkoutsCount / totalSessions : 0;

    // 2. Workout Streak (Sequential days with at least one completed session)
    // We look at all completed sessions for this user up to 'to' date, ordered by date desc
    const allCompletedSessions = await prisma.workoutSession.findMany({
      where: {
        userId: dto.userId,
        completedAt: { not: null },
        startedAt: { lte: toDate.toDate() },
      },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    let workoutStreak = 0;
    if (allCompletedSessions.length > 0) {
      // Get unique dates of completed sessions
      const uniqueDates = Array.from(
        new Set(
          allCompletedSessions.map((s) =>
            dayjs.utc(s.startedAt).startOf("day").valueOf(),
          ),
        ),
      ).map((v) => dayjs.utc(v));

      // Start counting from the most recent completed session date
      // If the most recent is 'to' or 'to - 1', we count. Otherwise streak is 0.
      const lastCompletedDate = uniqueDates[0];
      const referenceDate = toDate.startOf("day");

      if (
        lastCompletedDate.isSame(referenceDate) ||
        lastCompletedDate.isSame(referenceDate.subtract(1, "day"))
      ) {
        workoutStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const curr = uniqueDates[i];
          const prev = uniqueDates[i + 1];

          if (curr.subtract(1, "day").isSame(prev)) {
            workoutStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }
}
