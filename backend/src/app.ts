import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { seedDatabaseIfNeeded } from "./data/bootstrap.js";
import { RepositoryHttpError } from "./data/repository.js";
import { closeDatabase, getDatabasePath } from "./lib/database.js";
import { registerBlogRoutes } from "./modules/blog/blog.routes.js";
import { registerSiteRoutes } from "./modules/site/site.routes.js";
import { fail } from "./utils/response.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "SYS:standard"
        }
      }
    }
  });

  await app.register(cors, {
    origin: true
  });

  seedDatabaseIfNeeded();
  app.log.info(`SQLite database ready at ${getDatabasePath()}`);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send(fail(error.issues[0]?.message ?? "Invalid request", 400));
      return;
    }

    if (error instanceof RepositoryHttpError) {
      reply.code(error.statusCode).send(fail(error.message, error.statusCode));
      return;
    }

    app.log.error(error);
    reply.code(500).send(fail("Internal server error", 500));
  });

  app.get("/api/health", async () => {
    return {
      code: 0,
      message: "ok",
      data: {
        status: "healthy"
      }
    };
  });

  await registerSiteRoutes(app);
  await registerBlogRoutes(app);

  app.addHook("onClose", async () => {
    closeDatabase();
  });

  return app;
}
