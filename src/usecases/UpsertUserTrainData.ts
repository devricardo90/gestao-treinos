import { prisma } from "../lib/db.js";

export interface UpsertUserTrainDataInputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export interface UpsertUserTrainDataOutputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class UpsertUserTrainData {
  async execute(
    dto: UpsertUserTrainDataInputDto,
  ): Promise<UpsertUserTrainDataOutputDto> {
    const user = await (prisma.user.update as any)({
      where: { id: dto.userId },
      data: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
    });

    return {
      userId: user.id,
      weightInGrams: (user as any).weightInGrams as number,
      heightInCentimeters: (user as any).heightInCentimeters as number,
      age: (user as any).age as number,
      bodyFatPercentage: (user as any).bodyFatPercentage as number,
    };
  }
}
