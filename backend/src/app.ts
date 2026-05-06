import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { seedDatabaseIfNeeded } from "./data/bootstrap.js";
import { RepositoryHttpError } from "./data/repository.js";
import { closeDatabase, getDatabasePath } from "./lib/database.js";
import { ensureRootUser, getUserSessionFromRequest } from "./modules/auth/auth.service.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
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
    origin: true,
    credentials: true
  });

  seedDatabaseIfNeeded();
  const rootReady = await ensureRootUser();
  app.log.info(`SQLite database ready at ${getDatabasePath()}`);

  if (!rootReady) {
    app.log.warn("Root user is not initialized. Set ROOT_PASSWORD or ROOT_PASSWORD_HASH to enable backend access.");
  }

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

  app.addHook("preHandler", async (request, reply) => {
    const pathname = request.url.split("?")[0] ?? "";

    if (!pathname.startsWith("/api/admin/") || pathname.startsWith("/api/admin/auth/")) {
      return;
    }

    const user = getUserSessionFromRequest(request);

    if (!user) {
      return reply.code(401).send(fail("Unauthorized", 401));
    }

    if (!user.isRoot) {
      return reply.code(403).send(fail("Forbidden", 403));
    }
  });

  await registerAuthRoutes(app);
  await registerSiteRoutes(app);
  await registerBlogRoutes(app);

  app.addHook("onClose", async () => {
    closeDatabase();
  });

  return app;
}
