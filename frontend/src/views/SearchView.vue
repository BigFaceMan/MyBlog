<template>
  <PageShell>
    <section class="search-page">
      <header class="section-header">
        <p>{{ t("nav.articles") }}</p>
        <h1>{{ t("page.searchTitle") }}</h1>
      </header>

      <form class="search-form" @submit.prevent="submitSearch">
        <el-input v-model="draftKeyword" size="large" clearable :placeholder="t('page.searchPlaceholder')">
          <template #prefix>
            <Search :size="18" />
          </template>
        </el-input>
        <el-button type="primary" size="large" native-type="submit" :disabled="loading">{{ t("page.searchButton") }}</el-button>
      </form>

      <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
      <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadSearch" />
      <StateBlock v-else-if="keyword && !articles.length" :title="t('state.searchEmpty')" />
      <StateBlock v-else-if="!keyword" :title="t('page.searchPlaceholder')" />
      <ArticleList v-else :articles="articles" />
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import { searchArticles } from "@/api/blog";
import ArticleList from "@/components/blog/ArticleList.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { ArticleSummary } from "@/types/blog";
import { Search } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const keyword = computed(() => String(route.query.q ?? "").trim());
const draftKeyword = ref(keyword.value);
const articles = ref<ArticleSummary[]>([]);
const loading = ref(false);
const error = ref("");

const submitSearch = () => {
  void router.push({
    path: "/search",
    query: draftKeyword.value.trim() ? { q: draftKeyword.value.trim() } : {}
  });
};

const loadSearch = async () => {
  draftKeyword.value = keyword.value;

  if (!keyword.value) {
    articles.value = [];
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const result = await searchArticles(keyword.value);
    articles.value = result.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

watch(keyword, loadSearch, {
  immediate: true
});
</script>

<style scoped>
.search-page {
  display: grid;
  gap: 22px;
}

.search-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

@media (max-width: 560px) {
  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
