import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AuthHttpError,
  buildClearSessionCookie,
  buildSessionCookie,
  createAdminUser,
  createUserSession,
  deleteExpiredUserSessions,
  deleteAdminUser,
  deleteUserSessionByToken,
  getUserSessionFromRequest,
  getUserSessionTokenFromRequest,
  listAdminUsers,
  registerUser,
  updateAdminUser,
  updateAdminUserPassword,
  verifyUserCredentials
} from "./auth.service.js";
import { fail, ok } from "../../utils/response.js";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscore");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be at most 128 characters");

const authPayloadSchema = z.object({
  username: usernameSchema,
  password: passwordSchema
});

const adminUserPayloadSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(["root", "user"]).default("user"),
  status: z.enum(["active", "disabled"]).default("active")
});

const adminUserUpdateSchema = z.object({
  role: z.enum(["root", "user"]).optional(),
  status: z.enum(["active", "disabled"]).optional()
});

const passwordPayloadSchema = z.object({
  password: passwordSchema
});

function sendAuthError(error: unknown, reply: FastifyReply) {
  if (error instanceof AuthHttpError) {
    reply.code(error.statusCode);
    return fail(error.message, error.statusCode);
  }

  throw error;
}

export async function registerAuthRoutes(app: FastifyInstance) {
  const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = authPayloadSchema.parse(request.body);
    const user = await verifyUserCredentials(payload.username, payload.password);

    if (!user) {
      reply.code(401);
      return fail("Invalid username or password", 401);
    }

    deleteExpiredUserSessions();
    const token = createUserSession(user.username);
    reply.header("Set-Cookie", buildSessionCookie(token));

    return ok({
      username: user.username,
      role: user.role,
      isRoot: user.role === "root"
    });
  };

  const registerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = authPayloadSchema.parse(request.body);

    try {
      const user = await registerUser(payload.username, payload.password);
      deleteExpiredUserSessions();
      const token = createUserSession(user.username);
      reply.header("Set-Cookie", buildSessionCookie(token));

      return ok(user);
    } catch (error) {
      return sendAuthError(error, reply);
    }
  };

  const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    deleteUserSessionByToken(getUserSessionTokenFromRequest(request));
    reply.header("Set-Cookie", buildClearSessionCookie());

    return ok({
      success: true
    });
  };

  const meHandler = async (request: FastifyRequest) => {
    const user = getUserSessionFromRequest(request);

    return ok({
      authenticated: Boolean(user),
      user
    });
  };

  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/register", registerHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/auth/me", meHandler);

  app.post("/api/admin/auth/login", loginHandler);
  app.post("/api/admin/auth/logout", logoutHandler);
  app.get("/api/admin/auth/me", meHandler);

  app.get("/api/admin/users", async () => {
    return ok(listAdminUsers());
  });

  app.post("/api/admin/users", async (request, reply) => {
    const payload = adminUserPayloadSchema.parse(request.body);

    try {
      const user = await createAdminUser(payload);
      reply.code(201);
      return ok(user, "created");
    } catch (error) {
      return sendAuthError(error, reply);
    }
  });

  app.patch("/api/admin/users/:id", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = adminUserUpdateSchema.parse(request.body);
    const currentUser = getUserSessionFromRequest(request);

    try {
      const user = updateAdminUser(params.id, payload, currentUser?.username ?? "");
      return ok(user, "updated");
    } catch (error) {
      return sendAuthError(error, reply);
    }
  });

  app.patch("/api/admin/users/:id/password", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = passwordPayloadSchema.parse(request.body);

    try {
      const user = await updateAdminUserPassword(params.id, payload.password);
      return ok(user, "updated");
    } catch (error) {
      return sendAuthError(error, reply);
    }
  });

  app.delete("/api/admin/users/:id", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const currentUser = getUserSessionFromRequest(request);

    try {
      const result = deleteAdminUser(params.id, currentUser?.username ?? "");
      return ok(result, "deleted");
    } catch (error) {
      return sendAuthError(error, reply);
    }
  });
}
