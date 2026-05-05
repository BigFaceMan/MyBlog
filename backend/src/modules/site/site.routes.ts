import type { FastifyInstance } from "fastify";
import { getPublishedCounts, getSiteProfile } from "../../data/repository.js";
import { ok } from "../../utils/response.js";

export async function registerSiteRoutes(app: FastifyInstance) {
  app.get("/api/site/profile", async () => {
    const { profile, socialLinks } = getSiteProfile();
    const stats = getPublishedCounts();

    return ok({
      name: profile?.name ?? "SSP Blog",
      subtitle: profile?.subtitle ?? "",
      avatar: profile?.avatar ?? "",
      announcement: profile?.announcement ?? "",
      socials: socialLinks.map((social) => ({
        type: social.type,
        label: social.label,
        url: social.url
      })),
      stats
    });
  });
}
