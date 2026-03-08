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
          system:
            "Você é um assistente pessoal de treinos. Ajude o usuário com dúvidas sobre exercícios, nutrição e organização de treinos. Você pode criar planos de treino completos se o usuário pedir usando a ferramenta 'createWorkoutPlan'.",
          tools: {
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
                      .optional()
                      .describe(
                        "URL da imagem de capa do dia de treino. Usar as URLs de superior ou inferior se tiver.",
                      ),
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

        reply.status(response.status);

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
