export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export type ArticleStatus = "published" | "draft";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  createdAt: string;
  updatedAt: string;
  category: TaxonomyItem;
  tags: TaxonomyItem[];
  readingMinutes: number;
  status: ArticleStatus;
  views: number;
}

export type ArticleSummary = Omit<Article, "content">;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SiteProfile {
  name: string;
  subtitle: string;
  avatar: string;
  announcement: string;
  stats: {
    articles: number;
    tags: number;
    categories: number;
  };
  socials: Array<{
    type: "github" | "mail" | "rss" | "twitter";
    label: string;
    url: string;
  }>;
}
