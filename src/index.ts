// Require the framework and instantiate it

// ESM
import "dotenv/config";

import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

// Declare a route
fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

// Run the ser
// try ver!
try {
  await fastify.listen({ port: process.env.PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
// Server is now listening on ${address}
