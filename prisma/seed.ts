import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB Seed...");

  // Get the first user in the database (assuming you already logged in with your Google Account)
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error("No users found in the database. Please log in with the frontend first to create a user account.");
    return;
  }

  console.log(`Found user: ${user.name} (${user.email}). Creating full workout plan...`);

  // Clear existing workout plans for this user to avoid duplicates if run multiple times
  await prisma.workoutPlan.deleteMany({
    where: { userId: user.id }
  });

  // Create highly detailed Workout Plan
  const plan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      name: "Hipertrofia Total AI",
      isActive: true,
      workoutDays: {
        create: [
          // Day 1: Segunda - Peito e Tríceps
          {
            name: "Peito e Tríceps",
            weekday: "MONDAY",
            isRest: false,
            estimatedDurationInSeconds: 3600, // 60 mins
            coverImageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
            workoutExercises: {
              create: [
                { name: "Supino Reto com Barra", order: 1, sets: 4, reps: 10, restTimeInSeconds: 90 },
                { name: "Supino Inclinado com Halteres", order: 2, sets: 3, reps: 12, restTimeInSeconds: 60 },
                { name: "Crucifixo Máquina", order: 3, sets: 3, reps: 15, restTimeInSeconds: 45 },
                { name: "Tríceps Testa", order: 4, sets: 4, reps: 12, restTimeInSeconds: 60 },
                { name: "Tríceps Corda Polia", order: 5, sets: 3, reps: 15, restTimeInSeconds: 45 },
              ]
            }
          },
          // Day 2: Terça - Costas e Bíceps
          {
            name: "Costas e Bíceps",
            weekday: "TUESDAY",
            isRest: false,
            estimatedDurationInSeconds: 4200, // 70 mins
            coverImageUrl: "https://images.unsplash.com/photo-16052968673044-666ea0120120?q=80&w=1000&auto=format&fit=crop",
            workoutExercises: {
              create: [
                { name: "Puxada Frontal", order: 1, sets: 4, reps: 10, restTimeInSeconds: 90 },
                { name: "Remada Curvada", order: 2, sets: 4, reps: 10, restTimeInSeconds: 90 },
                { name: "Remada Baixa", order: 3, sets: 3, reps: 12, restTimeInSeconds: 60 },
                { name: "Rosca Direta com Barra", order: 4, sets: 4, reps: 10, restTimeInSeconds: 60 },
                { name: "Rosca Martelo", order: 5, sets: 3, reps: 12, restTimeInSeconds: 45 },
              ]
            }
          },
          // Day 3: Quarta - Descanso ATIVO / Cardio
          {
            name: "Cardio e Mobilidade",
            weekday: "WEDNESDAY",
            isRest: true,
            estimatedDurationInSeconds: 1800, // 30 mins
          },
          // Day 4: Quinta - Pernas Completas
          {
            name: "Pernas (Quadríceps e Posterior)",
            weekday: "THURSDAY",
            isRest: false,
            estimatedDurationInSeconds: 4800, // 80 mins
            coverImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop",
            workoutExercises: {
              create: [
                { name: "Agachamento Livre", order: 1, sets: 4, reps: 10, restTimeInSeconds: 120 },
                { name: "Leg Press", order: 2, sets: 3, reps: 12, restTimeInSeconds: 90 },
                { name: "Cadeira Extensora", order: 3, sets: 4, reps: 15, restTimeInSeconds: 60 },
                { name: "Mesa Flexora", order: 4, sets: 4, reps: 12, restTimeInSeconds: 60 },
                { name: "Panturrilhas no Smith", order: 5, sets: 5, reps: 20, restTimeInSeconds: 45 },
              ]
            }
          },
          // Day 5: Sexta - Ombros, Abdômen e Superiores (O do seu layout FIT.AI)
          {
            name: "Superiores", // MATCH THE LAYER FROM THE STITCH IMAGE
            weekday: "FRIDAY",
            isRest: false,
            estimatedDurationInSeconds: 2700, // 45 mins (MATCH THE IMAGE)
            coverImageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop",
            workoutExercises: {
              create: [
                { name: "Desenvolvimento Halteres", order: 1, sets: 4, reps: 10, restTimeInSeconds: 90 },
                { name: "Elevação Lateral", order: 2, sets: 4, reps: 15, restTimeInSeconds: 60 },
                { name: "Abdominal Crunch", order: 3, sets: 3, reps: 20, restTimeInSeconds: 45 },
                { name: "Prancha Isométrica", order: 4, sets: 3, reps: 60, restTimeInSeconds: 45 }, // Note rep=60 seconds here as a trick!
              ] // MATCHES THE 4 EXERCISES FROM STITCH!
            }
          },
          // Day 6: Sábado - Sábado Especial (Treino Bônus)
          {
            name: "Corpo Todo em Circuito",
            weekday: "SATURDAY",
            isRest: false,
            estimatedDurationInSeconds: 3000, // 50 mins
            coverImageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop",
            workoutExercises: {
              create: [
                { name: "Burpees", order: 1, sets: 3, reps: 15, restTimeInSeconds: 30 },
                { name: "Flexões", order: 2, sets: 3, reps: 15, restTimeInSeconds: 30 },
                { name: "Agachamento com Salto", order: 3, sets: 3, reps: 15, restTimeInSeconds: 60 },
              ]
            }
          },
          // Day 7: Domingo - Rest
          {
            name: "Descanso Total",
            weekday: "SUNDAY",
            isRest: true,
            estimatedDurationInSeconds: 0,
          }
        ]
      }
    },
    include: {
      workoutDays: {
        include: {
          workoutExercises: true
        }
      }
    }
  });

  console.log(`✅ Seed gerada com sucesso! Treino "${plan.name}" salvo com ${plan.workoutDays.length} dias variados.`);

  // Opcional: Criar uma SESSÃO finalizada na Terça-Feira para o "Consistência" marcar como azul (100%) no front-end
  const tuesdayDay = plan.workoutDays.find(d => d.weekday === "TUESDAY");
  if (tuesdayDay) {
    // Session 2 dias atrás
    const d = new Date();
    d.setDate(d.getDate() - 3); // Emulando passado
    
    await prisma.workoutSession.create({
      data: {
        userId: user.id,
        workoutDayId: tuesdayDay.id,
        startedAt: new Date(d.setHours(10, 0, 0, 0)),
        completedAt: new Date(d.setHours(11, 10, 0, 0))
      }
    });
    console.log(`✅ Sessão retroativa concluída salva para simular histórico.`);
  }

  // Opcional: Criar uma SESSÃO iniciada (mas incompleta) na Quarta-Feira para a "Consistência" marcar como pontinho azul no front-end
  const thursdayDay = plan.workoutDays.find(d => d.weekday === "THURSDAY");
  if (thursdayDay) {
    const d2 = new Date();
    d2.setDate(d2.getDate() - 1); 
    
    await prisma.workoutSession.create({
      data: {
        userId: user.id,
        workoutDayId: thursdayDay.id,
        startedAt: new Date(d2.setHours(18, 0, 0, 0)),
        // Not completed!
      }
    });

     console.log(`✅ Sessão parcial salva para simular histórico.`);
  }

  console.log("Feito!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
