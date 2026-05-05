import { getDatabase } from "../lib/database.js";
import { articles, categories, siteProfile, tags } from "./seed.js";

const siteConfigId = "default-site";
type CountableTable = "categories" | "tags" | "articles" | "site_configs";

function getCount(tableName: CountableTable) {
  const result = getDatabase().prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as
    | { count?: number }
    | undefined;

  return Number(result?.count ?? 0);
}

export function seedDatabaseIfNeeded() {
  const database = getDatabase();
  const categoryCount = getCount("categories");
  const tagCount = getCount("tags");
  const articleCount = getCount("articles");
  const siteCount = getCount("site_configs");

  if (categoryCount === 0) {
    const insertCategory = database.prepare(`
      INSERT INTO categories (id, name, slug, description)
      VALUES (?, ?, ?, ?)
    `);

    for (const category of categories) {
      insertCategory.run(category.id, category.name, category.slug, category.description ?? null);
    }
  }

  if (tagCount === 0) {
    const insertTag = database.prepare(`
      INSERT INTO tags (id, name, slug, description)
      VALUES (?, ?, ?, ?)
    `);

    for (const tag of tags) {
      insertTag.run(tag.id, tag.name, tag.slug, tag.description ?? null);
    }
  }

  if (siteCount === 0) {
    database.prepare(`
      INSERT INTO site_configs (id, name, subtitle, avatar, announcement)
      VALUES (?, ?, ?, ?, ?)
    `).run(siteConfigId, siteProfile.name, siteProfile.subtitle, siteProfile.avatar, siteProfile.announcement);

    const insertSocialLink = database.prepare(`
      INSERT INTO social_links (id, type, label, url, site_config_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const social of siteProfile.socials) {
      insertSocialLink.run(`social-${social.type}`, social.type, social.label, social.url, siteConfigId);
    }
  }

  if (articleCount === 0) {
    const insertArticle = database.prepare(`
      INSERT INTO articles (
        id, title, slug, excerpt, content, cover, created_at, updated_at,
        reading_minutes, status, views, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertArticleTag = database.prepare(`
      INSERT INTO article_tags (article_id, tag_id)
      VALUES (?, ?)
    `);

    for (const article of articles) {
      insertArticle.run(
        article.id,
        article.title,
        article.slug,
        article.excerpt,
        article.content,
        article.cover,
        article.createdAt,
        article.updatedAt,
        article.readingMinutes,
        article.status,
        article.views,
        article.category.id
      );

      for (const tag of article.tags) {
        insertArticleTag.run(article.id, tag.id);
      }
    }
  }
}
