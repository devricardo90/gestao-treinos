import { prisma } from "../lib/db.js";

export interface GetUserTrainDataInputDto {
  userId: string;
}

export interface GetUserTrainDataOutputDto {
  userId: string;
  userName: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class GetUserTrainData {
  async execute(
    dto: GetUserTrainDataInputDto,
  ): Promise<GetUserTrainDataOutputDto | null> {
    const user = await prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      return null;
    }

    // Se o usuário não tem dados preenchidos, retornamos null ou um objeto com valores padrão?
    // Mantendo a lógica de retornar null se os dados principais não existirem (conforme o original)
    if (
      user.weightInGrams === null ||
      user.heightInCentimeters === null ||
      user.age === null ||
      user.bodyFatPercentage === null
    ) {
      return null;
    }

    return {
      userId: user.id,
      userName: user.name,
      weightInGrams: (user as any).weightInGrams,
      heightInCentimeters: (user as any).heightInCentimeters,
      age: (user as any).age,
      bodyFatPercentage: (user as any).bodyFatPercentage,
    };
  }
}
