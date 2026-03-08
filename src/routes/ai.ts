import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { Weekday } from "../generated/prisma/enums.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema } from "../shemas/index.js";
import { CreateWorkoutPlan } from "../usercases/CreateWorkoutPlan.js";
import { GetUserTrainData } from "../usercases/GetUserTrainData.js";
import { ListWorkoutPlans } from "../usercases/ListWorkoutPlans.js";
import { UpsertUserTrainData } from "../usercases/UpsertUserTrainData.js";

export const aiRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/ai",
    schema: {
      summary: "Interagir com a IA (Streaming)",
      tags: ["IA"],
      body: z.object({
        messages: z.array(z.any()),
      }),
      response: {
        200: z.any(),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Não autorizado",
          code: "UNAUTHORIZED",
        });
      }

      try {
        const { messages } = request.body as { messages: UIMessage[] };

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: `Você é um personal trainer virtual especialista em montagem de planos de treino.
Seu tom é amigável, motivador e você usa linguagem simples, sem jargões técnicos.

REGRAS OBRIGATÓRIAS:
1. SEMPRE chame a tool 'getUserTrainData' antes de qualquer outra interação para conhecer o usuário.
2. Se o usuário NÃO tiver dados cadastrados (retorno null): pergunte nome, peso (kg), altura (cm), idade e % de gordura corporal em uma única mensagem curta.
3. Ao receber os dados, use a tool 'updateUserTrainData'. IMPORTANTE: Converta o peso de kg para gramas (multiplique por 1000). O % de gordura deve ser enviado como inteiro (ex: 15 para 15%).
4. Se o usuário já tiver dados: cumprimente-o pelo nome.
5. Para criar um treino: pergunte o objetivo, dias por semana e restrições físicos.
6. O plano DEVE ter exatamente 7 dias (MONDAY a SUNDAY). Dias sem treino: isRest: true, exercises: [], estimatedDuration: 0.
7. DIVISÕES DE TREINO (Splits):
   - 2-3 dias: Full Body ou ABC.
   - 4 dias: Upper/Lower ou ABCD.
   - 5 dias: PPLUL (Push/Pull/Legs + Upper/Lower).
   - 6 dias: PPL 2x.
8. PRINCÍPIOS: Músculos sinérgicos juntos, compostos primeiro, 4-8 exercícios por dia, 3-4 séries, 8-12 reps (hipertrofia).
9. IMAGENS DE CAPA (coverImageUrl):
   - Superiores (peito, costas, etc): https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v OU https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOW3fJmqZe4yoUcwvRPQa8kmFprzNiC30hqftL
   - Inferiores (pernas, etc): https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOgCHaUgNGronCvXmSzAMs1N3KgLdE5yHT6Ykj OU https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO85RVu3morROwZk5NPhs1jzH7X8TyEvLUCGxY
   - Descanso usa imagem de superiores.
   - Alterne entre as opções de cada categoria.

Respostas curtas e objetivas sempre.`,
          tools: {
            getUserTrainData: tool({
              description:
                "Recupera os dados físicos do usuário (peso, altura, idade, bf%).",
              inputSchema: z.object({}),
              execute: async () => {
                const getUserTrainData = new GetUserTrainData();
                return await getUserTrainData.execute({
                  userId: session.user.id,
                });
              },
            }),
            updateUserTrainData: tool({
              description: "Atualiza ou cria os dados físicos do usuário.",
              inputSchema: z.object({
                weightInGrams: z.number().describe("Peso em gramas"),
                heightInCentimeters: z
                  .number()
                  .describe("Altura em centímetros"),
                age: z.number().describe("Idade em anos"),
                bodyFatPercentage: z
                  .number()
                  .int()
                  .describe("Percentual de gordura corporal (inteiro, ex: 15)"),
              }),
              execute: async (args) => {
                const upsertUserTrainData = new UpsertUserTrainData();
                return await upsertUserTrainData.execute({
                  userId: session.user.id,
                  ...args,
                });
              },
            }),
            getWorkoutPlans: tool({
              description: "Lista os planos de treino do usuário.",
              inputSchema: z.object({}),
              execute: async () => {
                const listWorkoutPlans = new ListWorkoutPlans();
                return await listWorkoutPlans.execute({
                  userId: session.user.id,
                });
              },
            }),
            createWorkoutPlan: tool({
              description:
                "Cria um novo plano de treino completo para o usuário.",
              inputSchema: z.object({
                name: z.string().describe("Nome do plano de treino"),
                workoutDays: z.array(
                  z.object({
                    name: z
                      .string()
                      .describe("Nome do dia (ex: Peito e Tríceps, Descanso)"),
                    weekday: z.nativeEnum(Weekday).describe("Dia da semana"),
                    isRest: z
                      .boolean()
                      .describe("Se é dia de descanso (true) ou treino (false)"),
                    estimatedDurationInSeconds: z
                      .number()
                      .describe(
                        "Duração estimada em segundos (0 para dias de descanso)",
                      ),
                    coverImageUrl: z
                      .string()
                      .url()
                      .describe("URL da imagem de capa do dia de treino."),
                    exercises: z
                      .array(
                        z.object({
                          order: z
                            .number()
                            .describe("Ordem do exercício no dia"),
                          name: z.string().describe("Nome do exercício"),
                          sets: z.number().describe("Número de séries"),
                          reps: z.number().describe("Número de repetições"),
                          restTimeInSeconds: z
                            .number()
                            .describe(
                              "Tempo de descanso entre séries em segundos",
                            ),
                        }),
                      )
                      .describe(
                        "Lista de exercícios (vazia para dias de descanso)",
                      ),
                  }),
                ),
              }),
              execute: async (args: any) => {
                const createWorkoutPlan = new CreateWorkoutPlan();
                return await createWorkoutPlan.execute({
                  userId: session.user.id,
                  name: args.name,
                  workoutDays: args.workoutDays,
                });
              },
            }),
          },
          stopWhen: stepCountIs(5),
          messages: await convertToModelMessages(messages),
        });

        const response = result.toUIMessageStreamResponse();

        reply.status(response.status as 200 | 401 | 500);

        response.headers.forEach((value, key) => reply.header(key, value));

        return reply.send(response.body);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
