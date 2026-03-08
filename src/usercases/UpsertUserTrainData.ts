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
    const userTrainData = await prisma.userTrainData.upsert({
      where: { userId: dto.userId },
      update: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
      create: {
        userId: dto.userId,
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
    });

    return {
      userId: userTrainData.userId,
      weightInGrams: userTrainData.weightInGrams,
      heightInCentimeters: userTrainData.heightInCentimeters,
      age: userTrainData.age,
      bodyFatPercentage: userTrainData.bodyFatPercentage,
    };
  }
}
