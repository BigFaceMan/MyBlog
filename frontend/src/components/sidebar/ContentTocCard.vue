<template>
  <section class="sidebar-card toc-card">
    <h2 class="sidebar-card__title">
      <List :size="16" />
      {{ t("sidebar.contents") }}
    </h2>

    <nav v-if="headings.length" class="toc-card__nav" aria-label="文章目录">
      <a
        v-for="(heading, index) in headings"
        :key="heading.id"
        :class="['toc-card__link', { active: activeId === heading.id }]"
        :href="`#${heading.id}`"
        :style="{ '--depth': String(Math.max(0, heading.level - 2)) }"
        @click="activeId = heading.id"
      >
        <span>{{ index + 1 }}. {{ heading.text }}</span>
      </a>
    </nav>
    <p v-else class="toc-card__empty">暂无目录</p>
  </section>
</template>

<script setup lang="ts">
import { extractMarkdownHeadings } from "@/utils/markdownHeadings";
import { List } from "@element-plus/icons-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  content: string;
}>();

const { t } = useI18n();
const activeId = ref("");
const headings = computed(() => extractMarkdownHeadings(props.content).filter((heading) => heading.level >= 2));

const updateActiveHeading = () => {
  const headingElements = headings.value
    .map((heading) => document.getElementById(heading.id))
    .filter((element): element is HTMLElement => Boolean(element));

  if (!headingElements.length) {
    activeId.value = "";
    return;
  }

  const currentHeading =
    [...headingElements]
      .reverse()
      .find((element) => element.getBoundingClientRect().top <= 120) ?? headingElements[0];

  activeId.value = currentHeading.id;
};

watch(
  () => props.content,
  async () => {
    await nextTick();
    updateActiveHeading();
  },
  {
    immediate: true
  }
);

onMounted(() => {
  window.addEventListener("scroll", updateActiveHeading, {
    passive: true
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveHeading);
});
</script>

<style scoped>
.toc-card :deep(.sidebar-card__title) {
  gap: 8px;
  margin-bottom: 14px;
  font-size: 18px;
}

.toc-card__nav {
  display: grid;
  gap: 4px;
}

.toc-card__link {
  display: block;
  padding: 7px 10px 7px calc(10px + var(--depth) * 14px);
  overflow: hidden;
  color: var(--text-regular);
  font-size: 14px;
  line-height: 1.45;
  text-decoration: none;
  border-radius: 6px;
  transition: var(--animation-fast);
}

.toc-card__link span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.toc-card__link:hover,
.toc-card__link.active {
  color: white;
  background: color-mix(in srgb, var(--primary-color) 78%, #8b5cf6);
}

.toc-card__empty {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
