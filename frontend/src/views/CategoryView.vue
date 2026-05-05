<template>
  <PageShell>
    <section class="list-page">
      <header class="section-header">
        <p>{{ t("page.categoriesTitle") }}</p>
        <h1>{{ activeCategory?.name ?? t("page.allArticles") }}</h1>
      </header>

      <div class="taxonomy-grid">
        <RouterLink v-for="category in categories" :key="category.id" class="taxonomy-tile" :class="{ active: category.slug === activeSlug }" :to="`/categories/${category.slug}`">
          <span>{{ category.name }}</span>
          <strong>{{ category.count ?? 0 }}</strong>
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
import { getArticles, getCategories, getCategoryArticles } from "@/api/blog";
import ArticleList from "@/components/blog/ArticleList.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { ArticleSummary, TaxonomyItem } from "@/types/blog";
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
const activeCategory = computed(() => categories.value.find((category) => category.slug === activeSlug.value));

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
</style>
