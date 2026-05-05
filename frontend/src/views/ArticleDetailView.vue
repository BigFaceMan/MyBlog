<template>
  <PageShell>
    <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
    <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticle" />
    <article v-else-if="article" class="article-detail">
      <img class="article-detail__cover" :src="article.cover" :alt="article.title" />
      <div class="article-detail__body">
        <h1>{{ article.title }}</h1>
        <ArticleMeta :article="article" />
        <div class="article-detail__extra">
          <span>{{ t("common.minRead", { count: article.readingMinutes }) }}</span>
          <span>{{ t("common.views", { count: article.views }) }}</span>
        </div>
        <MarkdownRenderer :content="article.content" />
      </div>
    </article>
  </PageShell>
</template>

<script setup lang="ts">
import { getArticle } from "@/api/blog";
import ArticleMeta from "@/components/blog/ArticleMeta.vue";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { Article } from "@/types/blog";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const article = ref<Article | null>(null);
const loading = ref(false);
const error = ref("");

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
.article-detail {
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.article-detail__cover {
  width: 100%;
  height: clamp(240px, 38vw, 430px);
  object-fit: cover;
  vertical-align: middle;
}

.article-detail__body {
  padding: clamp(24px, 5vw, 54px);
}

.article-detail h1 {
  margin: 0 0 16px;
  color: var(--text-primary);
  font-size: clamp(30px, 4.4vw, 48px);
  line-height: 1.2;
}

.article-detail__extra {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0 30px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
