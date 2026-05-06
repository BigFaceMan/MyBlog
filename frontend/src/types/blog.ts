export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  count?: number;
  depth?: number;
  children?: TaxonomyItem[];
}

export type ArticleStatus = "published" | "draft";

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  createdAt: string;
  updatedAt: string;
  category: TaxonomyItem;
  tags: TaxonomyItem[];
  readingMinutes: number;
  status: ArticleStatus;
  views: number;
}

export interface Article extends ArticleSummary {
  content: string;
}

export interface ArticlePayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  categoryId: string;
  tagIds: string[];
  status: ArticleStatus;
}

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

export interface ArchiveMonth {
  month: string;
  articles: ArticleSummary[];
}

export interface ArchiveYear {
  year: string;
  months: ArchiveMonth[];
}
