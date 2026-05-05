import { randomUUID } from "node:crypto";
import type { Article, ArticleSummary, PaginatedResult, SiteProfile, TaxonomyItem } from "../types.js";
import { getDatabase } from "../lib/database.js";

type ArticleStatus = Article["status"];
type SocialType = SiteProfile["socials"][number]["type"];

export interface ArticleMutationInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  categoryId: string;
  tagIds: string[];
  status: ArticleStatus;
}

export interface TagMutationInput {
  name: string;
  slug?: string;
  description?: string;
}

export class RepositoryHttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface TagRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ArticleRow {
  article_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  created_at: string;
  updated_at: string;
  reading_minutes: number;
  status: ArticleStatus;
  views: number;
  category_id: string;
  category_name: string;
  category_slug: string;
  category_description: string | null;
}

interface SiteConfigRow {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  announcement: string;
}

interface SocialLinkRow {
  id: string;
  type: SocialType;
  label: string;
  url: string;
  site_config_id: string;
}

const database = getDatabase();

function toTaxonomyItem(item: { id: string; name: string; slug: string; description: string | null }): TaxonomyItem {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    ...(item.description ? { description: item.description } : {})
  };
}

function toSummary({ content: _content, ...article }: Article): ArticleSummary {
  return article;
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages
  };
}

function matchesKeyword(article: Article, keyword?: string) {
  if (!keyword) {
    return true;
  }

  const normalizedKeyword = keyword.toLowerCase();
  const haystack = [
    article.title,
    article.excerpt,
    article.content,
    article.category.name,
    ...article.tags.map((tag) => tag.name)
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedKeyword);
}

function loadTagsByArticleIds(articleIds: string[]) {
  if (articleIds.length === 0) {
    return new Map<string, TaxonomyItem[]>();
  }

  const placeholders = articleIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
        SELECT
          at.article_id,
          t.id,
          t.name,
          t.slug,
          t.description
        FROM article_tags at
        INNER JOIN tags t ON t.id = at.tag_id
        WHERE at.article_id IN (${placeholders})
        ORDER BY t.name ASC
      `
    )
    .all(...articleIds) as unknown as Array<TagRow & { article_id: string }>;

  const tagMap = new Map<string, TaxonomyItem[]>();

  for (const row of rows) {
    const currentTags = tagMap.get(row.article_id) ?? [];
    currentTags.push(toTaxonomyItem(row));
    tagMap.set(row.article_id, currentTags);
  }

  return tagMap;
}

function mapArticles(rows: ArticleRow[]) {
  const tagMap = loadTagsByArticleIds(rows.map((row) => row.article_id));

  return rows.map((row) => ({
    id: row.article_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover: row.cover,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: toTaxonomyItem({
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      description: row.category_description
    }),
    tags: tagMap.get(row.article_id) ?? [],
    readingMinutes: row.reading_minutes,
    status: row.status,
    views: row.views
  })) satisfies Article[];
}

function queryArticleRows(whereClause: string, params: string[] = []) {
  return database
    .prepare(
      `
        SELECT
          a.id AS article_id,
          a.title,
          a.slug,
          a.excerpt,
          a.content,
          a.cover,
          a.created_at,
          a.updated_at,
          a.reading_minutes,
          a.status,
          a.views,
          c.id AS category_id,
          c.name AS category_name,
          c.slug AS category_slug,
          c.description AS category_description
        FROM articles a
        INNER JOIN categories c ON c.id = a.category_id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC
      `
    )
    .all(...params) as unknown as ArticleRow[];
}

function queryPublishedArticleRows() {
  return queryArticleRows("a.status = 'published'");
}

function estimateReadingMinutes(content: string) {
  const latinWords = content.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const cjkCharacters = content.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const readingUnits = latinWords + cjkCharacters / 2;

  return Math.max(1, Math.ceil(readingUnits / 220));
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getTagById(tagId: string) {
  const row = database
    .prepare(
      `
        SELECT id, name, slug, description
        FROM tags
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(tagId) as TagRow | undefined;

  return row ? toTaxonomyItem(row) : null;
}

function getTagByName(name: string) {
  const row = database
    .prepare(
      `
        SELECT id, name, slug, description
        FROM tags
        WHERE lower(name) = lower(?)
        LIMIT 1
      `
    )
    .get(name) as TagRow | undefined;

  return row ? toTaxonomyItem(row) : null;
}

function getTagRowBySlug(slug: string) {
  return database
    .prepare(
      `
        SELECT id, name, slug, description
        FROM tags
        WHERE slug = ?
        LIMIT 1
      `
    )
    .get(slug) as TagRow | undefined;
}

function buildAvailableTagSlug(name: string, preferredSlug?: string) {
  const baseSlug = slugify(preferredSlug ?? name) || `tag-${randomUUID().slice(0, 8)}`;
  let candidate = baseSlug;
  let suffix = 2;

  while (getTagRowBySlug(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function ensureCategoryExists(categoryId: string) {
  const category = database.prepare("SELECT id FROM categories WHERE id = ? LIMIT 1").get(categoryId);

  if (!category) {
    throw new RepositoryHttpError("Category not found", 400);
  }
}

function ensureTagsExist(tagIds: string[]) {
  const uniqueTagIds = uniqueValues(tagIds);

  if (uniqueTagIds.length === 0) {
    return uniqueTagIds;
  }

  const placeholders = uniqueTagIds.map(() => "?").join(", ");
  const rows = database
    .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
    .all(...uniqueTagIds) as Array<{ id: string }>;
  const existingIds = new Set(rows.map((row) => row.id));
  const missingTagId = uniqueTagIds.find((tagId) => !existingIds.has(tagId));

  if (missingTagId) {
    throw new RepositoryHttpError("Tag not found", 400);
  }

  return uniqueTagIds;
}

function ensureSlugAvailable(slug: string, currentArticleId?: string) {
  const row = database.prepare("SELECT id FROM articles WHERE slug = ? LIMIT 1").get(slug) as
    | { id: string }
    | undefined;

  if (row && row.id !== currentArticleId) {
    throw new RepositoryHttpError("Slug already exists", 409);
  }
}

function ensureArticleExists(articleId: string) {
  const row = database.prepare("SELECT id FROM articles WHERE id = ? LIMIT 1").get(articleId);

  if (!row) {
    throw new RepositoryHttpError("Article not found", 404);
  }
}

function replaceArticleTags(articleId: string, tagIds: string[]) {
  const insertArticleTag = database.prepare(`
    INSERT INTO article_tags (article_id, tag_id)
    VALUES (?, ?)
  `);

  database.prepare("DELETE FROM article_tags WHERE article_id = ?").run(articleId);

  for (const tagId of tagIds) {
    insertArticleTag.run(articleId, tagId);
  }
}

export function listArticles(params: {
  page: number;
  pageSize: number;
  category?: string;
  tag?: string;
  keyword?: string;
}) {
  const publishedArticles = mapArticles(queryPublishedArticleRows());
  const filtered = publishedArticles.filter((article) => {
    const categoryMatched = params.category ? article.category.slug === params.category : true;
    const tagMatched = params.tag ? article.tags.some((tag) => tag.slug === params.tag) : true;

    return categoryMatched && tagMatched && matchesKeyword(article, params.keyword);
  });

  return paginate(filtered.map(toSummary), params.page, params.pageSize);
}

export function getArticleBySlug(slug: string) {
  const articleIdRow = database
    .prepare(
      `
        SELECT id
        FROM articles
        WHERE slug = ? AND status = 'published'
        LIMIT 1
      `
    )
    .get(slug) as { id: string } | undefined;

  if (!articleIdRow) {
    return null;
  }

  database.prepare("UPDATE articles SET views = views + 1 WHERE id = ?").run(articleIdRow.id);

  const rows = queryArticleRows("a.id = ?", [articleIdRow.id]);

  return mapArticles(rows)[0] ?? null;
}

export function listAdminArticles(params: {
  page: number;
  pageSize: number;
  status?: ArticleStatus;
  keyword?: string;
}) {
  const articles = mapArticles(
    params.status ? queryArticleRows("a.status = ?", [params.status]) : queryArticleRows("1 = 1")
  );
  const filtered = articles.filter((article) => matchesKeyword(article, params.keyword));

  return paginate(filtered.map(toSummary), params.page, params.pageSize);
}

export function getAdminArticleById(articleId: string) {
  const rows = queryArticleRows("a.id = ?", [articleId]);

  return mapArticles(rows)[0] ?? null;
}

export function createArticle(input: ArticleMutationInput) {
  ensureSlugAvailable(input.slug);
  ensureCategoryExists(input.categoryId);
  const tagIds = ensureTagsExist(input.tagIds);

  const now = new Date().toISOString();
  const id = `article-${randomUUID()}`;

  database
    .prepare(
      `
        INSERT INTO articles (
          id, title, slug, excerpt, content, cover, created_at, updated_at,
          reading_minutes, status, views, category_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `
    )
    .run(
      id,
      input.title,
      input.slug,
      input.excerpt,
      input.content,
      input.cover,
      now,
      now,
      estimateReadingMinutes(input.content),
      input.status,
      input.categoryId
    );
  replaceArticleTags(id, tagIds);

  return getAdminArticleById(id);
}

export function updateArticle(articleId: string, input: ArticleMutationInput) {
  ensureArticleExists(articleId);
  ensureSlugAvailable(input.slug, articleId);
  ensureCategoryExists(input.categoryId);
  const tagIds = ensureTagsExist(input.tagIds);
  const now = new Date().toISOString();

  database
    .prepare(
      `
        UPDATE articles
        SET
          title = ?,
          slug = ?,
          excerpt = ?,
          content = ?,
          cover = ?,
          updated_at = ?,
          reading_minutes = ?,
          status = ?,
          category_id = ?
        WHERE id = ?
      `
    )
    .run(
      input.title,
      input.slug,
      input.excerpt,
      input.content,
      input.cover,
      now,
      estimateReadingMinutes(input.content),
      input.status,
      input.categoryId,
      articleId
    );
  replaceArticleTags(articleId, tagIds);

  return getAdminArticleById(articleId);
}

export function updateArticleStatus(articleId: string, status: ArticleStatus) {
  ensureArticleExists(articleId);

  database
    .prepare(
      `
        UPDATE articles
        SET status = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(status, new Date().toISOString(), articleId);

  return getAdminArticleById(articleId);
}

export function deleteArticle(articleId: string) {
  ensureArticleExists(articleId);
  database.prepare("DELETE FROM articles WHERE id = ?").run(articleId);

  return {
    id: articleId
  };
}

export function createTag(input: TagMutationInput) {
  const name = input.name.trim();

  if (!name) {
    throw new RepositoryHttpError("Tag name is required", 400);
  }

  const existingTag = getTagByName(name);

  if (existingTag) {
    return existingTag;
  }

  const requestedSlug = input.slug?.trim();
  const requestedSlugRow = requestedSlug ? getTagRowBySlug(requestedSlug) : undefined;

  if (requestedSlugRow) {
    throw new RepositoryHttpError("Tag slug already exists", 409);
  }

  const id = `tag-${randomUUID()}`;
  const slug = buildAvailableTagSlug(name, requestedSlug);
  const description = input.description?.trim() || null;

  database
    .prepare(
      `
        INSERT INTO tags (id, name, slug, description)
        VALUES (?, ?, ?, ?)
      `
    )
    .run(id, name, slug, description);

  const tag = getTagById(id);

  if (!tag) {
    throw new RepositoryHttpError("Tag creation failed", 500);
  }

  return tag;
}

export function listCategories() {
  const categoryRows = database
    .prepare(
      `
        SELECT id, name, slug, description
        FROM categories
        ORDER BY name ASC
      `
    )
    .all() as unknown as CategoryRow[];
  const counts = database
    .prepare(
      `
        SELECT category_id, COUNT(*) AS count
        FROM articles
        WHERE status = 'published'
        GROUP BY category_id
      `
    )
    .all() as Array<{ category_id: string; count: number }>;
  const countMap = new Map(counts.map((row) => [row.category_id, Number(row.count)]));

  return categoryRows.map((category) => ({
    ...toTaxonomyItem(category),
    count: countMap.get(category.id) ?? 0
  }));
}

export function listTags() {
  const tagRows = database
    .prepare(
      `
        SELECT id, name, slug, description
        FROM tags
        ORDER BY name ASC
      `
    )
    .all() as unknown as TagRow[];
  const counts = database
    .prepare(
      `
        SELECT at.tag_id, COUNT(*) AS count
        FROM article_tags at
        INNER JOIN articles a ON a.id = at.article_id
        WHERE a.status = 'published'
        GROUP BY at.tag_id
      `
    )
    .all() as Array<{ tag_id: string; count: number }>;
  const countMap = new Map(counts.map((row) => [row.tag_id, Number(row.count)]));

  return tagRows.map((tag) => ({
    ...toTaxonomyItem(tag),
    count: countMap.get(tag.id) ?? 0
  }));
}

export function listArchive() {
  const publishedArticles = mapArticles(queryPublishedArticleRows());
  const groups = publishedArticles.reduce<Record<string, Record<string, ArticleSummary[]>>>((acc, article) => {
    const date = new Date(article.createdAt);
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");

    acc[year] ??= {};
    acc[year][month] ??= [];
    acc[year][month].push(toSummary(article));

    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([leftYear], [rightYear]) => Number(rightYear) - Number(leftYear))
    .map(([year, months]) => ({
      year,
      months: Object.entries(months)
        .sort(([leftMonth], [rightMonth]) => Number(rightMonth) - Number(leftMonth))
        .map(([month, monthArticles]) => ({
          month,
          articles: monthArticles
        }))
    }));
}

export function searchArticles(keyword: string, page: number, pageSize: number) {
  const publishedArticles = mapArticles(queryPublishedArticleRows());
  const filtered = publishedArticles.filter((article) => matchesKeyword(article, keyword));

  return paginate(filtered.map(toSummary), page, pageSize);
}

export function getPublishedCounts() {
  const articlesRow = database
    .prepare("SELECT COUNT(*) AS count FROM articles WHERE status = 'published'")
    .get() as { count: number };
  const tagsRow = database.prepare("SELECT COUNT(*) AS count FROM tags").get() as { count: number };
  const categoriesRow = database.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };

  return {
    articles: Number(articlesRow.count),
    tags: Number(tagsRow.count),
    categories: Number(categoriesRow.count)
  };
}

export function getSiteProfile() {
  const profile = database
    .prepare(
      `
        SELECT id, name, subtitle, avatar, announcement
        FROM site_configs
        LIMIT 1
      `
    )
    .get() as SiteConfigRow | undefined;

  const socialLinks = database
    .prepare(
      `
        SELECT id, type, label, url, site_config_id
        FROM social_links
        WHERE site_config_id = ?
        ORDER BY id ASC
      `
    )
    .all(profile?.id ?? "") as unknown as SocialLinkRow[];

  return {
    profile,
    socialLinks
  };
}
