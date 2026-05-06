import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toSiteProfileResponse, updateSiteProfile } from "../../data/repository.js";
import { ok } from "../../utils/response.js";

const siteProfilePayloadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  subtitle: z.string().trim().max(160),
  avatar: z.string().trim().min(1, "Avatar is required").max(600),
  announcement: z.string().trim().max(500),
  socials: z
    .array(
      z.object({
        type: z.enum(["github", "mail", "rss", "twitter"]),
        label: z.string().trim().min(1, "Social label is required").max(60),
        url: z.string().trim().min(1, "Social URL is required").max(600)
      })
    )
    .max(4)
    .default([])
});

export async function registerSiteRoutes(app: FastifyInstance) {
  app.get("/api/site/profile", async () => {
    return ok(toSiteProfileResponse());
  });

  app.get("/api/admin/site/profile", async () => {
    return ok(toSiteProfileResponse());
  });

  app.put("/api/admin/site/profile", async (request) => {
    const payload = siteProfilePayloadSchema.parse(request.body);
    const profile = updateSiteProfile(payload);

    return ok(profile, "updated");
  });
}
