<template>
  <section v-if="article" class="article-hero" :style="{ '--hero-cover': `url(${article.cover})` }">
    <div class="article-hero__inner">
      <h1>{{ article.title }}</h1>
      <div class="article-hero__meta">
        <span>
          <Calendar :size="14" />
          {{ t("common.created") }} {{ formatDate(article.createdAt) }}
        </span>
        <RouterLink :to="`/categories/${article.category.slug}`">
          <Folder :size="14" />
          {{ article.category.name }}
        </RouterLink>
        <RouterLink v-for="tag in article.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
          <PriceTag :size="13" />
          {{ tag.name }}
        </RouterLink>
      </div>
      <div class="article-hero__stats">
        <span>
          <Document :size="14" />
          {{ t("common.wordCount", { count: formattedWordCount }) }}
        </span>
        <span>
          <Timer :size="14" />
          {{ t("common.readingTime", { count: article.readingMinutes }) }}
        </span>
        <span>
          <View :size="14" />
          {{ t("common.postViews", { count: article.views }) }}
        </span>
      </div>
    </div>
  </section>

  <PageShell>
    <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
    <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticle" />
    <article v-else-if="article" class="article-detail">
      <div class="article-detail__body">
        <MarkdownRenderer :content="articleContent" />
      </div>
    </article>

    <template #sidebar>
      <div class="article-sidebar">
        <AuthorCard />
        <AnnouncementCard />
        <ContentTocCard v-if="article" :content="articleContent" />
      </div>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { getArticle } from "@/api/blog";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import AnnouncementCard from "@/components/sidebar/AnnouncementCard.vue";
import AuthorCard from "@/components/sidebar/AuthorCard.vue";
import ContentTocCard from "@/components/sidebar/ContentTocCard.vue";
import type { Article } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { normalizeHeadingText } from "@/utils/markdownHeadings";
import { Calendar, Document, Folder, PriceTag, Timer, View } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const article = ref<Article | null>(null);
const loading = ref(false);
const error = ref("");

const stripDuplicateTitle = (content: string, title: string) => {
  const lines = content.split(/\r?\n/);
  const firstContentIndex = lines.findIndex((line) => line.trim());

  if (firstContentIndex === -1) {
    return content;
  }

  const firstLine = lines[firstContentIndex]?.trim() ?? "";
  const titleMatch = firstLine.match(/^#\s+(.+?)(?:\s+#+)?$/);

  if (!titleMatch || normalizeHeadingText(titleMatch[1] ?? "") !== normalizeHeadingText(title)) {
    return content;
  }

  return lines
    .slice(firstContentIndex + 1)
    .join("\n")
    .replace(/^\s+/, "");
};

const stripMarkdownForCount = (content: string) =>
  content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const articleContent = computed(() => (article.value ? stripDuplicateTitle(article.value.content, article.value.title) : ""));
const wordCount = computed(() => {
  const text = stripMarkdownForCount(articleContent.value);
  const latinWords = text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const cjkCharacters = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;

  return latinWords + cjkCharacters;
});
const formattedWordCount = computed(() => {
  if (wordCount.value < 1000) {
    return String(wordCount.value);
  }

  return `${(wordCount.value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
});

const loadArticle = async () => {
  const slug = String(route.params.slug ?? "");

  if (!slug) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    article.value = await getArticle(slug);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.slug, loadArticle, {
  immediate: true
});
</script>

<style scoped>
.article-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: clamp(300px, 34vw, 460px);
  color: white;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.68), rgba(15, 23, 42, 0.36) 48%, rgba(15, 23, 42, 0.16)),
    var(--hero-cover) center / cover;
}

.article-hero__inner {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(48px, 8vw, 92px) 0 clamp(38px, 6vw, 70px);
}

.article-hero h1 {
  max-width: 900px;
  margin: 0 0 14px;
  font-size: clamp(34px, 4.8vw, 52px);
  line-height: 1.16;
  text-shadow: 0 2px 18px rgba(15, 23, 42, 0.3);
}

.article-hero__meta,
.article-hero__stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.article-hero__stats {
  margin-top: 8px;
}

.article-hero__meta span,
.article-hero__meta a,
.article-hero__stats span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.article-hero__meta a {
  color: inherit;
  text-decoration: none;
}

.article-hero__meta a:hover {
  color: white;
}

.article-hero :deep(svg) {
  display: block;
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
}

.article-hero__stats :deep(svg) {
  flex-basis: 14px;
  width: 14px;
  height: 14px;
}

.article-detail {
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.article-detail__body {
  padding: clamp(24px, 5vw, 54px);
}

.article-sidebar {
  display: grid;
  gap: 18px;
}

@media (max-width: 640px) {
  .article-hero__inner {
    width: min(100% - 24px, 1240px);
  }

  .article-hero__meta,
  .article-hero__stats {
    font-size: 13px;
  }
}
</style>
