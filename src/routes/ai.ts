import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "../lib/auth.js";
import { ErrorSchema } from "../shemas/index.js";

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
          system: "Você é um assistente pessoal de treinos. Ajude o usuário com dúvidas sobre exercícios, nutrição e organização de treinos.",
          tools: {},
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
