import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AuthHttpError,
  buildClearSessionCookie,
  buildSessionCookie,
  createUserSession,
  deleteExpiredUserSessions,
  deleteUserSessionByToken,
  getUserSessionFromRequest,
  getUserSessionTokenFromRequest,
  registerUser,
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
}
