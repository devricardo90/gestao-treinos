import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";

// Infere o tipo da sessão diretamente do better-auth — sem divergência manual
type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

// Augmentação do FastifyRequest para tipagem da sessão nos handlers
declare module "fastify" {
  interface FastifyRequest {
    session: AuthSession;
  }
}

/**
 * Plugin de autenticação com escopo.
 * Registre dentro de um app.register() isolado para proteger apenas as rotas privadas.
 * Injeta `request.session` tipado e retorna 401 se não autenticado.
 *
 * Uso:
 *   await app.register(async (privateApp) => {
 *     privateApp.register(authenticate);
 *     privateApp.register(minhaRota);
 *   });
 */
export const authenticate = async (fastify: import("fastify").FastifyInstance) => {
  // decorateRequest com getter/setter — padrão exigido pelo Fastify para tipos não-primitivos
  fastify.decorateRequest("session", {
    getter() {
      return null as unknown as AuthSession;
    },
  });

  fastify.addHook("preHandler", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({
        error: "Não autorizado",
        code: "UNAUTHORIZED",
      });
    }

    request.session = session;
  });
};
