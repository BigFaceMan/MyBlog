<template>
  <template v-if="activeSlug">
    <section class="category-hero">
      <h1>{{ activeCategory?.name ?? t("page.categoriesTitle") }}</h1>
    </section>
  </template>

  <PageShell>
    <section v-if="!activeSlug" class="list-page">
      <header class="section-header">
        <p>{{ t("page.categoriesTitle") }}</p>
        <h1>{{ t("page.allArticles") }}</h1>
      </header>

      <div class="taxonomy-grid">
        <RouterLink
          v-for="category in flatCategories"
          :key="category.id"
          class="taxonomy-tile"
          :class="{ active: category.slug === activeSlug }"
          :style="{ '--depth': String(category.depth ?? 0) }"
          :to="`/categories/${category.slug}`"
        >
          <span>{{ taxonomyOptionLabel(category) }}</span>
          <strong>{{ category.count ?? 0 }}</strong>
        </RouterLink>
      </div>

      <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
      <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticles" />
      <StateBlock v-else-if="!articles.length" :title="t('state.articleEmpty')" />
      <ArticleList v-else :articles="articles" />
    </section>

    <section v-else class="category-timeline-card">
      <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
      <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticles" />
      <StateBlock v-else-if="!articles.length" :title="t('state.articleEmpty')" />
      <div v-else class="category-timeline">
        <header class="timeline-title">
          <span></span>
          <h2>Category - {{ activeCategory?.name ?? activeSlug }}</h2>
        </header>
        <section v-for="group in timelineGroups" :key="group.year" class="timeline-year">
          <h3>{{ group.year }}</h3>
          <RouterLink v-for="article in group.articles" :key="article.id" class="timeline-item" :to="`/articles/${article.slug}`">
            <img :src="article.cover" :alt="article.title" loading="lazy" />
            <span>{{ formatDate(article.createdAt) }}</span>
            <strong>{{ article.title }}</strong>
          </RouterLink>
        </section>
      </div>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import { getArticles, getCategories, getCategoryArticles } from "@/api/blog";
import ArticleList from "@/components/blog/ArticleList.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { ArticleSummary, TaxonomyItem } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { flattenTaxonomy, taxonomyOptionLabel } from "@/utils/taxonomy";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const categories = ref<TaxonomyItem[]>([]);
const articles = ref<ArticleSummary[]>([]);
const loading = ref(false);
const error = ref("");
const activeSlug = computed(() => String(route.params.slug ?? ""));
const flatCategories = computed(() => flattenTaxonomy(categories.value));
const activeCategory = computed(() => flatCategories.value.find((category) => category.slug === activeSlug.value));
const timelineGroups = computed(() => {
  const groups = new Map<string, ArticleSummary[]>();

  for (const article of articles.value) {
    const year = String(new Date(article.createdAt).getFullYear());
    groups.set(year, [...(groups.get(year) ?? []), article]);
  }

  return [...groups.entries()]
    .sort(([leftYear], [rightYear]) => Number(rightYear) - Number(leftYear))
    .map(([year, yearArticles]) => ({
      year,
      articles: yearArticles
    }));
});

const loadTaxonomy = async () => {
  categories.value = await getCategories();
};

const loadArticles = async () => {
  loading.value = true;
  error.value = "";

  try {
    const result = activeSlug.value ? await getCategoryArticles(activeSlug.value) : await getArticles();
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

.taxonomy-tile {
  padding-left: calc(18px + (var(--depth) * 18px));
}

.category-hero {
  display: grid;
  min-height: 260px;
  place-items: center;
  margin-top: calc(var(--header-height) * -1);
  padding: calc(var(--header-height) + 40px) 24px 58px;
  color: white;
  background:
    linear-gradient(rgba(20, 24, 32, 0.42), rgba(20, 24, 32, 0.52)),
    url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80") center / cover;
}

.category-hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.1;
  text-align: center;
}

.category-timeline-card {
  padding: clamp(26px, 5vw, 46px);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.category-timeline {
  position: relative;
  display: grid;
  gap: 30px;
  padding-left: 58px;
}

.category-timeline::before {
  position: absolute;
  top: 10px;
  bottom: 12px;
  left: 16px;
  width: 2px;
  content: "";
  background: color-mix(in srgb, var(--primary-color) 42%, transparent);
}

.timeline-title,
.timeline-year {
  position: relative;
}

.timeline-title {
  display: flex;
  align-items: center;
  min-height: 34px;
}

.timeline-title span,
.timeline-year::before,
.timeline-item::before {
  position: absolute;
  left: -50px;
  content: "";
  background: var(--card-bg);
  border: 4px solid var(--primary-color);
  border-radius: 999px;
}

.timeline-title span {
  width: 22px;
  height: 22px;
}

.timeline-title h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 26px;
}

.timeline-year {
  display: grid;
  gap: 18px;
}

.timeline-year::before {
  top: 7px;
  width: 14px;
  height: 14px;
  border-color: #21b8d8;
}

.timeline-year h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 25px;
  font-weight: 600;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 116px 124px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  min-height: 74px;
  color: var(--text-primary);
  text-decoration: none;
}

.timeline-item::before {
  top: 50%;
  width: 14px;
  height: 14px;
  border-color: var(--primary-color);
  transform: translateY(-50%);
}

.timeline-item img {
  width: 116px;
  height: 74px;
  object-fit: cover;
  border-radius: 6px;
}

.timeline-item span {
  color: var(--text-secondary);
  font-size: 14px;
}

.timeline-item strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--animation-fast);
}

.timeline-item:hover strong {
  color: var(--primary-color);
}

@media (max-width: 760px) {
  .category-timeline-card {
    padding: 24px 18px;
  }

  .category-timeline {
    padding-left: 36px;
  }

  .category-timeline::before {
    left: 8px;
  }

  .timeline-title span,
  .timeline-year::before,
  .timeline-item::before {
    left: -34px;
  }

  .timeline-item {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 10px 14px;
  }

  .timeline-item img {
    grid-row: span 2;
    width: 92px;
    height: 64px;
  }

  .timeline-item span,
  .timeline-item strong {
    min-width: 0;
  }
}
</style>
