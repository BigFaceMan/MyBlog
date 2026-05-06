<template>
  <Teleport to="body">
    <Transition name="search-modal">
      <div v-if="modelValue" class="search-modal" @mousedown.self="close">
        <section class="search-modal__panel" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
          <header class="search-modal__header">
            <h2 id="search-modal-title">{{ t("nav.search") }}</h2>
            <button class="search-modal__close" type="button" :aria-label="t('common.close')" @click="close">
              <Close />
            </button>
          </header>

          <label class="search-modal__field">
            <Search class="search-modal__field-icon" />
            <input ref="inputRef" v-model="keyword" autocomplete="off" :placeholder="t('nav.search')" @keydown.enter.prevent="openFirstResult" />
          </label>

          <div class="search-modal__divider" aria-hidden="true" />

          <div class="search-modal__results">
            <p v-if="loading" class="search-modal__state">{{ t("common.loading") }}</p>
            <p v-else-if="error" class="search-modal__state">{{ error }}</p>
            <p v-else-if="keyword && !articles.length" class="search-modal__state">{{ t("state.searchEmpty") }}</p>
            <RouterLink v-for="article in articles" v-else :key="article.id" class="search-modal__result" :to="`/articles/${article.slug}`" @click="close">
              <span class="search-modal__result-title">{{ article.title }}</span>
              <span class="search-modal__result-meta">{{ formatDate(article.createdAt) }} / {{ article.category.name }}</span>
              <span class="search-modal__result-excerpt">{{ article.excerpt }}</span>
            </RouterLink>
          </div>

          <footer class="search-modal__footer">
            <span>Search by</span>
            <a class="search-modal__algolia" href="https://www.algolia.com/?utm_source=algoliasearch.js&utm_medium=website&utm_content=localhost&utm_campaign=poweredby" target="_blank" rel="noreferrer">
              <span class="search-modal__algolia-mark">a</span>
              algolia
            </a>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { searchArticles } from "@/api/blog";
import type { ArticleSummary } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { Close, Search } from "@element-plus/icons-vue";
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const keyword = ref("");
const articles = ref<ArticleSummary[]>([]);
const loading = ref(false);
const error = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
let searchTimer: ReturnType<typeof window.setTimeout> | undefined;
let requestId = 0;

const close = () => {
  emit("update:modelValue", false);
};

const clearSearchTimer = () => {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
    searchTimer = undefined;
  }
};

const runSearch = async () => {
  const query = keyword.value.trim();
  const currentRequestId = ++requestId;

  if (!query) {
    loading.value = false;
    error.value = "";
    articles.value = [];
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const result = await searchArticles(query, {
      page: 1,
      pageSize: 5
    });

    if (currentRequestId === requestId) {
      articles.value = result.items;
    }
  } catch (err) {
    if (currentRequestId === requestId) {
      error.value = err instanceof Error ? err.message : t("state.loadFailed");
      articles.value = [];
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
};

const openFirstResult = async () => {
  const firstArticle = articles.value[0];

  if (!firstArticle) {
    await runSearch();
    return;
  }

  close();
  await router.push(`/articles/${firstArticle.slug}`);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.modelValue) {
    close();
  }
};

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      document.addEventListener("keydown", handleKeydown);
      await nextTick();
      inputRef.value?.focus();
      return;
    }

    document.removeEventListener("keydown", handleKeydown);
  }
);

watch(keyword, () => {
  clearSearchTimer();
  searchTimer = window.setTimeout(runSearch, 220);
});

onBeforeUnmount(() => {
  clearSearchTimer();
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.search-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: start center;
  padding: clamp(84px, 14vh, 132px) 18px 32px;
  background: rgba(19, 28, 42, 0.64);
  backdrop-filter: blur(2px);
}

.search-modal__panel {
  width: min(680px, 100%);
  padding: 22px 24px 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
}

.search-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.search-modal__header h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 22px;
  font-weight: 700;
}

.search-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--text-secondary);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--animation-fast);
}

.search-modal__close:hover {
  color: var(--text-primary);
  background: var(--surface-muted);
}

.search-modal__close :deep(svg) {
  display: block;
  width: 20px;
  height: 20px;
}

.search-modal__field {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border: 2px solid var(--primary-color);
  border-radius: 999px;
}

.search-modal__field-icon {
  display: block;
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.search-modal__field-icon :deep(svg),
.search-modal__field > :deep(svg) {
  display: block;
  width: 16px;
  height: 16px;
}

.search-modal__field input {
  min-width: 0;
  color: var(--text-primary);
  background: transparent;
  border: 0;
  outline: 0;
}

.search-modal__divider {
  height: 14px;
  margin: 12px 0 10px;
  border-top: 4px dotted rgba(244, 143, 177, 0.42);
}

.search-modal__results {
  display: grid;
  gap: 8px;
  max-height: min(360px, 45vh);
  overflow: auto;
}

.search-modal__state {
  margin: 0;
  padding: 8px 2px;
  color: var(--text-secondary);
  font-size: 14px;
}

.search-modal__result {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 6px;
  transition: var(--animation-fast);
}

.search-modal__result:hover {
  background: var(--primary-soft);
}

.search-modal__result-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-modal__result-meta {
  color: var(--text-secondary);
  font-size: 12px;
}

.search-modal__result-excerpt {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-regular);
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.search-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  color: #1f2a44;
  font-size: 14px;
}

.search-modal__algolia {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #003dff;
  font-weight: 700;
  text-decoration: none;
}

.search-modal__algolia-mark {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  color: white;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  background: #003dff;
  border-radius: 50%;
}

.search-modal-enter-active,
.search-modal-leave-active {
  transition: opacity 160ms ease;
}

.search-modal-enter-active .search-modal__panel,
.search-modal-leave-active .search-modal__panel {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}

.search-modal-enter-from .search-modal__panel,
.search-modal-leave-to .search-modal__panel {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 560px) {
  .search-modal {
    padding-top: 76px;
  }

  .search-modal__panel {
    padding: 18px;
  }
}
</style>
