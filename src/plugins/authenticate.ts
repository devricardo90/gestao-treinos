import { fromNodeHeaders } from "better-auth/node";
import fp from "fastify-plugin";

import { auth } from "../lib/auth.js";

// Infere o tipo da sessão diretamente do better-auth — sem divergência manual
type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

// Augmentação do FastifyRequest para tipagem da sessão nos handlers
declare module "fastify" {
  interface FastifyRequest {
    session: AuthSession;
    _session: AuthSession | null;
  }
}

/**
 * Plugin de autenticação.
 * Usamos fastify-plugin para que as decorações (request.session) sejam visíveis fora do escopo deste arquivo.
 */
export const authenticate = fp(async (fastify: import("fastify").FastifyInstance) => {
  // Propriedade interna para armazenar o valor da sessão
  fastify.decorateRequest("_session", null);

  // Getter/setter para a sessão — agora busca e salva na propriedade interna
  fastify.decorateRequest("session", {
    getter() {
      return this._session as AuthSession;
    },
    setter(value) {
      this._session = value;
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
});
