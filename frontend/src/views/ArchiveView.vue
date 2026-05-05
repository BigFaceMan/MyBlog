<template>
  <PageShell>
    <section class="archive-page">
      <header class="section-header">
        <p>{{ t("nav.articles") }}</p>
        <h1>{{ t("page.archiveTitle") }}</h1>
      </header>

      <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
      <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArchive" />
      <StateBlock v-else-if="!archive.length" :title="t('state.articleEmpty')" />
      <div v-else class="archive-timeline">
        <section v-for="year in archive" :key="year.year" class="archive-year">
          <h2>{{ year.year }}</h2>
          <div v-for="month in year.months" :key="`${year.year}-${month.month}`" class="archive-month">
            <h3>{{ month.month }}</h3>
            <RouterLink v-for="article in month.articles" :key="article.id" class="archive-item" :to="`/articles/${article.slug}`">
              <span>{{ formatDate(article.createdAt) }}</span>
              <strong>{{ article.title }}</strong>
            </RouterLink>
          </div>
        </section>
      </div>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import { getArchive } from "@/api/blog";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { ArchiveYear } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const archive = ref<ArchiveYear[]>([]);
const loading = ref(false);
const error = ref("");

const loadArchive = async () => {
  loading.value = true;
  error.value = "";

  try {
    archive.value = await getArchive();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

onMounted(loadArchive);
</script>

<style scoped>
.archive-page {
  display: grid;
  gap: 22px;
}

.archive-timeline {
  display: grid;
  gap: 18px;
}

.archive-year {
  padding: clamp(22px, 4vw, 34px);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.archive-year h2 {
  margin: 0 0 18px;
  color: var(--primary-color);
  font-size: 30px;
}

.archive-month {
  display: grid;
  gap: 10px;
  padding-left: 18px;
  border-left: 2px solid var(--primary-border);
}

.archive-month + .archive-month {
  margin-top: 22px;
}

.archive-month h3 {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-size: 18px;
}

.archive-item {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 12px;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 6px;
  transition: var(--animation-fast);
}

.archive-item:hover {
  color: var(--primary-color);
  background: var(--primary-soft);
}

.archive-item span {
  color: var(--text-secondary);
}

.archive-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .archive-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
