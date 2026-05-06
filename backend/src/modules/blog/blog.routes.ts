import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createArticle,
  createCategory,
  createTag,
  deleteArticle,
  deleteCategory,
  deleteTag,
  getAdminArticleById,
  getArticleBySlug,
  listArchive,
  listAdminArticles,
  listAdminCategories,
  listAdminTags,
  listArticles,
  listCategories,
  listTags,
  searchArticles,
  updateArticle,
  updateArticleStatus,
  updateCategory,
  updateTag
} from "../../data/repository.js";
import { fail, ok } from "../../utils/response.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(6),
  category: z.string().optional(),
  tag: z.string().optional(),
  keyword: z.string().trim().optional()
});

const searchQuerySchema = z.object({
  q: z.string().trim().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(6)
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["published", "draft"]).optional(),
  keyword: z.string().trim().optional()
});

const articlePayloadSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(320),
  content: z.string().trim().min(1, "Content is required"),
  cover: z.string().trim().min(1, "Cover is required").max(600),
  categoryId: z.string().trim().min(1, "Category is required"),
  tagIds: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(["published", "draft"])
});

const statusPayloadSchema = z.object({
  status: z.enum(["published", "draft"])
});

const tagPayloadSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(60),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Tag slug can only contain lowercase letters, numbers and hyphens")
    .optional(),
  description: z.string().trim().max(200).optional()
});

const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Category slug can only contain lowercase letters, numbers and hyphens")
    .optional(),
  description: z.string().trim().max(200).optional(),
  parentId: z.string().trim().nullable().optional()
});

export async function registerBlogRoutes(app: FastifyInstance) {
  app.get("/api/admin/articles", async (request) => {
    const query = adminListQuerySchema.parse(request.query);
    const result = listAdminArticles(query);

    return ok(result);
  });

  app.get("/api/admin/articles/:id", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const article = getAdminArticleById(params.id);

    if (!article) {
      reply.code(404);
      return fail("Article not found", 404);
    }

    return ok(article);
  });

  app.post("/api/admin/articles", async (request, reply) => {
    const payload = articlePayloadSchema.parse(request.body);
    const article = createArticle(payload);

    reply.code(201);
    return ok(article, "created");
  });

  app.put("/api/admin/articles/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = articlePayloadSchema.parse(request.body);
    const article = updateArticle(params.id, payload);

    return ok(article, "updated");
  });

  app.patch("/api/admin/articles/:id/status", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = statusPayloadSchema.parse(request.body);
    const article = updateArticleStatus(params.id, payload.status);

    return ok(article, "updated");
  });

  app.delete("/api/admin/articles/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = deleteArticle(params.id);

    return ok(result, "deleted");
  });

  app.post("/api/admin/tags", async (request, reply) => {
    const payload = tagPayloadSchema.parse(request.body);
    const tag = createTag(payload);

    reply.code(201);
    return ok(tag, "created");
  });

  app.get("/api/admin/tags", async () => {
    const result = listAdminTags();

    return ok(result);
  });

  app.put("/api/admin/tags/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = tagPayloadSchema.parse(request.body);
    const tag = updateTag(params.id, payload);

    return ok(tag, "updated");
  });

  app.delete("/api/admin/tags/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = deleteTag(params.id);

    return ok(result, "deleted");
  });

  app.get("/api/admin/categories", async () => {
    const result = listAdminCategories();

    return ok(result);
  });

  app.post("/api/admin/categories", async (request, reply) => {
    const payload = categoryPayloadSchema.parse(request.body);
    const category = createCategory(payload);

    reply.code(201);
    return ok(category, "created");
  });

  app.put("/api/admin/categories/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = categoryPayloadSchema.parse(request.body);
    const category = updateCategory(params.id, payload);

    return ok(category, "updated");
  });

  app.delete("/api/admin/categories/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const result = deleteCategory(params.id);

    return ok(result, "deleted");
  });

  app.get("/api/articles", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const result = listArticles(query);

    return ok(result);
  });

  app.get("/api/articles/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const article = getArticleBySlug(params.slug);

    if (!article) {
      reply.code(404);
      return fail("Article not found", 404);
    }

    return ok(article);
  });

  app.get("/api/categories", async () => {
    const result = listCategories();

    return ok(result);
  });

  app.get("/api/categories/:slug/articles", async (request) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const query = listQuerySchema.parse(request.query);
    const result = listArticles({
      ...query,
      category: params.slug
    });

    return ok(result);
  });

  app.get("/api/tags", async () => {
    const result = listTags();

    return ok(result);
  });

  app.get("/api/tags/:slug/articles", async (request) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const query = listQuerySchema.parse(request.query);
    const result = listArticles({
      ...query,
      tag: params.slug
    });

    return ok(result);
  });

  app.get("/api/archive", async () => {
    const result = listArchive();

    return ok(result);
  });

  app.get("/api/search", async (request) => {
    const query = searchQuerySchema.parse(request.query);
    const result = searchArticles(query.q, query.page, query.pageSize);

    return ok(result);
  });
}
