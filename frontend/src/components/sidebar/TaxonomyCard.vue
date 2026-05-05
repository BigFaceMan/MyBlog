<template>
  <section class="sidebar-card">
    <h2 class="sidebar-card__title">
      <CollectionTag :size="20" />
      {{ t("sidebar.taxonomy") }}
    </h2>
    <div class="taxonomy-card__section">
      <RouterLink v-for="category in categories" :key="category.id" class="taxonomy-card__link" :to="`/categories/${category.slug}`">
        {{ category.name }}
        <span>{{ category.count }}</span>
      </RouterLink>
    </div>
    <div class="taxonomy-card__tags">
      <RouterLink v-for="tag in tags" :key="tag.id" class="taxonomy-card__tag" :to="`/tags/${tag.slug}`">
        {{ tag.name }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getCategories, getTags } from "@/api/blog";
import type { TaxonomyItem } from "@/types/blog";
import { CollectionTag } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const categories = ref<TaxonomyItem[]>([]);
const tags = ref<TaxonomyItem[]>([]);

onMounted(async () => {
  const [categoryResult, tagResult] = await Promise.all([getCategories(), getTags()]);
  categories.value = categoryResult;
  tags.value = tagResult;
});
</script>

<style scoped>
.taxonomy-card__section {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.taxonomy-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px;
  color: var(--text-primary);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: var(--animation-fast);
}

.taxonomy-card__link:hover {
  color: var(--primary-color);
  background: var(--primary-soft);
  border-color: var(--primary-border);
}

.taxonomy-card__link span {
  color: var(--text-secondary);
}

.taxonomy-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.taxonomy-card__tag {
  padding: 6px 9px;
  color: var(--text-regular);
  font-size: 13px;
  text-decoration: none;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  transition: var(--animation-fast);
}

.taxonomy-card__tag:hover {
  color: var(--primary-color);
  border-color: var(--primary-border);
}
</style>
