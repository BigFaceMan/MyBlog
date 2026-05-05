<template>
  <PageShell>
    <section class="list-page">
      <header class="section-header">
        <p>{{ t("page.tagsTitle") }}</p>
        <h1>{{ activeTag?.name ?? t("page.allArticles") }}</h1>
      </header>

      <div class="tag-cloud">
        <RouterLink v-for="tag in tags" :key="tag.id" class="tag-cloud__item" :class="{ active: tag.slug === activeSlug }" :to="`/tags/${tag.slug}`">
          {{ tag.name }}
          <span>{{ tag.count ?? 0 }}</span>
        </RouterLink>
      </div>

      <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
      <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticles" />
      <StateBlock v-else-if="!articles.length" :title="t('state.articleEmpty')" />
      <ArticleList v-else :articles="articles" />
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import { getArticles, getTagArticles, getTags } from "@/api/blog";
import ArticleList from "@/components/blog/ArticleList.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { ArticleSummary, TaxonomyItem } from "@/types/blog";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const tags = ref<TaxonomyItem[]>([]);
const articles = ref<ArticleSummary[]>([]);
const loading = ref(false);
const error = ref("");
const activeSlug = computed(() => String(route.params.slug ?? ""));
const activeTag = computed(() => tags.value.find((tag) => tag.slug === activeSlug.value));

const loadTaxonomy = async () => {
  tags.value = await getTags();
};

const loadArticles = async () => {
  loading.value = true;
  error.value = "";

  try {
    const result = activeSlug.value ? await getTagArticles(activeSlug.value) : await getArticles();
    articles.value = result.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

onMounted(loadTaxonomy);
watch(activeSlug, loadArticles, {
  immediate: true
});
</script>

<style scoped>
.list-page {
  display: grid;
  gap: 22px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-cloud__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  color: var(--text-regular);
  text-decoration: none;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  box-shadow: var(--shadow-soft);
  transition: var(--animation-fast);
}

.tag-cloud__item:hover,
.tag-cloud__item.active {
  color: var(--primary-color);
  border-color: var(--primary-border);
}

.tag-cloud__item span {
  color: var(--text-secondary);
}
</style>
