<template>
  <section class="sidebar-card taxonomy-card">
    <h2 class="sidebar-card__title">
      <Folder :size="16" />
      {{ t("sidebar.categories") }}
      <ArrowRight class="taxonomy-card__arrow" :size="15" />
    </h2>
    <div class="taxonomy-card__categories">
      <RouterLink
        v-for="category in flatCategories"
        :key="category.id"
        class="taxonomy-card__category"
        :style="{ '--depth': String(category.depth ?? 0) }"
        :to="`/categories/${category.slug}`"
      >
        <span>{{ category.name }}</span>
        <strong>{{ category.count ?? 0 }}</strong>
      </RouterLink>
    </div>
  </section>

  <section class="sidebar-card taxonomy-card">
    <h2 class="sidebar-card__title">
      <PriceTag :size="16" />
      {{ t("sidebar.tags") }}
    </h2>
    <div class="taxonomy-card__tags">
      <RouterLink v-for="(tag, index) in tags" :key="tag.id" class="taxonomy-card__tag" :style="tagStyle(tag, index)" :to="`/tags/${tag.slug}`">
        {{ tag.name }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getCategories, getTags } from "@/api/blog";
import type { TaxonomyItem } from "@/types/blog";
import { flattenTaxonomy } from "@/utils/taxonomy";
import { ArrowRight, Folder, PriceTag } from "@element-plus/icons-vue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const categories = ref<TaxonomyItem[]>([]);
const tags = ref<TaxonomyItem[]>([]);
const flatCategories = computed(() => flattenTaxonomy(categories.value));
const tagColors = ["#41b76a", "#2563eb", "#7c3aed", "#be123c", "#0891b2", "#4b5563", "#16a34a", "#9333ea"];

const tagStyle = (tag: TaxonomyItem, index: number) => ({
  color: tagColors[index % tagColors.length],
  fontSize: `${Math.min(18, 13 + Math.max(0, tag.count ?? 0) * 1.3)}px`
});

onMounted(async () => {
  const [categoryResult, tagResult] = await Promise.all([getCategories(), getTags()]);
  categories.value = categoryResult;
  tags.value = tagResult;
});
</script>

<style scoped>
.taxonomy-card__arrow {
  flex: 0 0 15px;
  width: 15px;
  height: 15px;
  margin-left: auto;
  color: var(--text-secondary);
}

.taxonomy-card :deep(.sidebar-card__title) {
  gap: 8px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 650;
}

.taxonomy-card__categories {
  display: grid;
  gap: 8px;
}

.taxonomy-card__category {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 26px;
  padding-left: calc((var(--depth) * 16px));
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
  text-decoration: none;
  transition: var(--animation-fast);
}

.taxonomy-card__category:hover,
.taxonomy-card__category.router-link-active {
  color: var(--primary-color);
}

.taxonomy-card__category strong {
  color: var(--text-regular);
  font-size: 14px;
  font-weight: 600;
}

.taxonomy-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 9px;
  align-items: baseline;
}

.taxonomy-card__tag {
  color: var(--text-regular);
  line-height: 1.35;
  text-decoration: none;
  transition: var(--animation-fast);
}

.taxonomy-card__tag:hover,
.taxonomy-card__tag.router-link-active {
  color: var(--primary-color) !important;
}
</style>
